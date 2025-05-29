import {
	FormProvider,
	getFieldsetProps,
	getFormProps,
	getInputProps,
	getTextareaProps,
	useForm,
	type FieldMetadata,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Img } from 'openimg/react'
import { useState } from 'react'
import { Form } from 'react-router'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { floatingToolbarClassName } from '#app/components/floating-toolbar.tsx'
import { ErrorList, Field, TextareaField, DropdownField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Label } from '#app/components/ui/label.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { Textarea } from '#app/components/ui/textarea.tsx'
import { cn, getProjectImgSrc, useIsPending } from '#app/utils/misc.tsx'
import { type Info } from './+types/projects.$projectId_.edit.ts'

const titleMinLength = 1
const titleMaxLength = 100
const descriptionMinLength = 1
const descriptionMaxLength = 5000
export const MAX_UPLOAD_SIZE = 1024 * 1024 * 3; // 3MB

const ImageFieldsetSchema = z.object({
	id: z.string().optional(),
	file: z
		.instanceof(File)
		.optional()
		.refine((file) => {
			return !file || file.size <= MAX_UPLOAD_SIZE
		}, 'File size must be less than 3MB'),
	altText: z.string().optional(),
})

export type ImageFieldset = z.infer<typeof ImageFieldsetSchema>

export const ProjectEditorSchema = z.object({
	id: z.string().optional(),
	title: z.string().min(titleMinLength).max(titleMaxLength),
	description: z.string().min(descriptionMinLength).max(descriptionMaxLength),
	status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']),
	deadline: z.preprocess(
    (val) => {
      if (typeof val === "string" || typeof val === "number") {
        const date = new Date(val);
        return isNaN(date.getTime()) ? undefined : date;
      }
      return val instanceof Date ? val : undefined;
    },
    z.date()),
	images: z.array(ImageFieldsetSchema).max(5).optional(),
})

export function ProjectEditor({
	project,
	actionData,
}: {
	project?: Info['loaderData']['project']
	actionData?: Info['actionData']
}) {
	const isPending = useIsPending()

	const [form, fields] = useForm({
		id: 'project-editor',
		constraint: getZodConstraint(ProjectEditorSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ProjectEditorSchema })
		},
		defaultValue: {
			id: project?.id ?? '',
			title: project?.title ?? '' ,
			description: project?.description ?? '',
			status: project?.status ?? 'PENDING',
			deadline: project?.deadline
			  ? new Date(project.deadline).toISOString().split('T')[0]
			  : '',
			images: project?.images?.map((img) => ({
			  ...img,
			  file: undefined,
			})) ?? [],
		  },
		  
		shouldRevalidate: 'onBlur',
	})
	const imageList = fields.images.getFieldList()
	
	return (
		<div className="absolute inset-0">
			<FormProvider context={form.context}>
				<Form
					method="POST"
					className="flex h-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-10 pb-28 pt-12"
					{...getFormProps(form)}
					encType="multipart/form-data"
				   >
					<button type="submit" className="hidden" />
					{project ? <input type="hidden" name="id" value={project.id} /> : null}
					<div className="flex flex-col gap-1">
						<Field
							labelProps={{ children: 'Title' }}
							inputProps={{ autoFocus: true, ...getInputProps(fields.title, { type: 'text' }) }}
							errors={fields.title.errors}
						/>
						<TextareaField
							labelProps={{ children: 'Description' }}
							textareaProps={{ ...getTextareaProps(fields.description) }}
							errors={fields.description.errors}
						/>
						<Field
							labelProps={{ children: 'Deadline' }}
							inputProps={{
							defaultValue: project?.deadline
							? new Date(project.deadline).toISOString().split('T')[0]
							: '',
							...getInputProps(fields.deadline, { type: 'date' }), 
							}}
							errors={fields.deadline.errors}
							/>
						<DropdownField 
							labelProps={{ children: 'Status' }}
							selectProps={{
							name: 'status',
							defaultValue: project?.status ?? 'PENDING', 
							children: (
							<>
								<option value="PENDING">Pending</option>
								<option value="IN_PROGRESS">In Progress</option>
								<option value="COMPLETED">Completed</option>
								<option value="ARCHIVED">Archived</option>
							</>
					),
				}}
			/>
					<div>
							<Label>Images</Label>
							<ul className="flex flex-col gap-4">
								{imageList.map((imageMeta, index) => {
									const image = project?.images[index]
									return (
										<li key={imageMeta.key} 
										className="relative border-b-2 border-muted-foreground"
										>
											<button
												className="absolute right-0 top-0 text-foreground-destructive"
												{...form.remove.getButtonProps({
													name: fields.images.name,
													index,
												})}
											>
												<span aria-hidden>
													<Icon name="cross-1" />
												</span>{' '}
												<span className="sr-only">Remove image {index + 1}</span>
											</button>
											<ImageChooser meta={imageMeta} objectKey={image?.objectKey} />
										</li>
									)
								})}
							</ul>
						</div>
						<Button className="mt-3" {...form.insert.getButtonProps({ name: fields.images.name })}>
							<span aria-hidden>
								<Icon name="plus">Image</Icon>
							</span>{' '}
							<span className="sr-only">Add image</span>
						</Button>
					</div>
					<ErrorList id={form.errorId} errors={form.errors} />
				</Form>
				<div className={floatingToolbarClassName}>
				<Button
  					variant="destructive"
  				{...form.reset.getButtonProps()}
				>
				Reset
				</Button>
					<StatusButton form={form.id} type="submit" disabled={isPending} status={isPending ? 'pending' : 'idle'}>
						Submit
					</StatusButton>
				</div>
			</FormProvider>
		</div>
	)
}

function ImageChooser({
	meta,
	objectKey,
}: {
	meta: FieldMetadata<ImageFieldset>
	objectKey: string | undefined
}) {
	const fields = meta.getFieldset()
	const existingImage = Boolean(fields.id.initialValue)
	const [previewImage, setPreviewImage] = useState<string | null>(
		objectKey ? getProjectImgSrc(objectKey) : null, // ✅ Updated for projects
	)
	const [altText, setAltText] = useState(fields.altText.initialValue ?? '')

	return (
		<fieldset {...getFieldsetProps(meta)}>
			<div className="flex gap-3">
				<div className="w-32">
					<div className="relative h-32 w-32">
						<label
							htmlFor={fields.file.id}
							className={cn('group absolute h-32 w-32 rounded-lg', {
								'bg-accent opacity-40 focus-within:opacity-100 hover:opacity-100':
									!previewImage,
								'cursor-pointer focus-within:ring-2': !existingImage,
							})}
						>
							{previewImage ? (
								<div className="relative">
									{existingImage ? (
										<Img
											src={previewImage}
											alt={altText ?? ''}
											className="h-32 w-32 rounded-lg object-cover"
											width={512}
											height={512}
										/>
									) : (
										<img
											src={previewImage}
											alt={altText ?? ''}
											className="h-32 w-32 rounded-lg object-cover"
										/>
									)}
									{existingImage ? null : (
										<div className="pointer-events-none absolute -right-0.5 -top-0.5 rotate-12 rounded-sm bg-secondary px-2 py-1 text-xs text-secondary-foreground shadow-md">
											new
										</div>
									)}
								</div>
							) : (
								<div className="flex h-32 w-32 items-center justify-center rounded-lg border border-muted-foreground text-4xl text-muted-foreground">
									<Icon name="plus" />
								</div>
							)}
							{existingImage ? (
								<input {...getInputProps(fields.id, { type: 'hidden' })} />
							) : null}
							<input
								aria-label="Image"
								className="absolute left-0 top-0 z-0 h-32 w-32 cursor-pointer opacity-0"
								onChange={(event) => {
									const file = event.target.files?.[0]

									if (file) {
										const reader = new FileReader()
										reader.onloadend = () => {
											setPreviewImage(reader.result as string)
										}
										reader.readAsDataURL(file)
									} else {
										setPreviewImage(null)
									}
								}}
								accept="image/*"
								{...getInputProps(fields.file, { type: 'file' })}
							/>
						</label>
					</div>
					<div className="min-h-[32px] px-4 pb-3 pt-1">
						<ErrorList id={fields.file.errorId} errors={fields.file.errors} />
					</div>
				</div>
				<div className="flex-1">
					<Label htmlFor={fields.altText.id}>Alt Text</Label>
					<Textarea
						onChange={(e) => setAltText(e.currentTarget.value)}
						{...getTextareaProps(fields.altText)}
					/>
					<div className="min-h-[32px] px-4 pb-3 pt-1">
						<ErrorList
							id={fields.altText.errorId}
							errors={fields.altText.errors}
						/>
					</div>
				</div>
			</div>
			<div className="min-h-[32px] px-4 pb-3 pt-1">
				<ErrorList id={meta.errorId} errors={meta.errors} />
			</div>
		</fieldset>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary statusHandlers={{ 404: ({ params }) => <p>No project with the id "{params.projectId}" exists</p> }} />
}
