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
import { type Course, type CourseImage } from '../../../../drizzle/schema'
import { type SerializeFrom } from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { useState } from 'react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { floatingToolbarClassName } from '#app/components/floating-toolbar.tsx'
import { DropdownField, ErrorList, Field, TextareaField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Label } from '#app/components/ui/label.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { Textarea } from '#app/components/ui/textarea.tsx'
import { cn, getCourseImgSrc, useIsPending } from '#app/utils/misc.tsx'
import { type action } from './__course-editor.server'
import { useTranslation } from 'react-i18next'
import { getTranslatedLabel } from '#app/utils/translateLabel.ts'
import { type InferSelectModel } from 'drizzle-orm'

const titleMinLength = 1
const titleMaxLength = 100
const descriptionMinLength = 1
const descriptionMaxLength = 500
const contentMinLength = 1
const contentMaxLength = 20000

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

export const CourseEditorSchema = z.object({
	id: z.string().optional(),
	languageId: z.string().min(2).max(5), // e.g., "en", "fr"
	title: z.string().min(titleMinLength).max(titleMaxLength),
	description: z.string().min(descriptionMinLength).max(descriptionMaxLength),
	content: z.string().min(contentMinLength).max(contentMaxLength),
	level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
	duration: z.number().int(),
	images: z.array(ImageFieldsetSchema).max(5).optional(),
})

export function CourseEditor({
	course,
}: {
	course?: SerializeFrom<
	Pick<InferSelectModel<typeof Course>, 'id' | 'duration'> & {
		images: Array<Pick<InferSelectModel<typeof CourseImage>, 'id' | 'altText'>>
		translation: {
			languageId: string
			title: string
			description: string
			content: string
			level:string
		} | null
	}
>
}) {
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()

	const [form, fields] = useForm({
		id: 'course-editor',
		constraint: getZodConstraint(CourseEditorSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: CourseEditorSchema })
		},
		defaultValue: {
			id: course?.id,
			duration: course?.duration,
			languageId: course?.translation?.languageId ?? 'en',
			title: course?.translation?.title ?? '',
			description: course?.translation?.description ?? '',
			content: course?.translation?.content ?? '',
			level: course?.translation?.level ?? '',
			images: course?.images ?? [{}],
		  },
		  
		shouldRevalidate: 'onBlur',
	})
	const imageList = fields.images.getFieldList()
	const { t } = useTranslation()

	return (
				<div className="flex flex-col w-full space-y-6 px-4 py-6 text-foreground bg-background max-h-[80vh] overflow-y-auto rounded-lg">
			<FormProvider context={form.context}>
				<Form
					method="POST"
					className="flex h-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-10 pb-28 pt-12"
					{...getFormProps(form)}
					encType="multipart/form-data"
				   >
					<Button type="submit" className="hidden" />
					{course ? <input type="hidden" name="id" value={course.id} /> : null}
					<div className="flex flex-col gap-1">
						<Field
							labelProps={{ children: t('courseEditor.form.title') }}
							inputProps={{ autoFocus: true, ...getInputProps(fields.title, { type: 'text' }) }}
							errors={fields.title.errors}
						/>
						<Field
							labelProps={{ children: t('courseEditor.form.description') }}
							inputProps={{ ...getInputProps(fields.description, { type: 'text' }) }}
							errors={fields.description.errors}
						/>
						<TextareaField
							labelProps={{ children: t('courseEditor.form.content') }}
							textareaProps={{ ...getTextareaProps(fields.content) }}
							errors={fields.content.errors}
						/>
						<Field
							labelProps={{ children: t('courseEditor.form.duration') }}
							inputProps={{
							defaultValue: course?.duration,
							...getInputProps(fields.duration,{ type: 'number' }),
							}}
							errors={fields.duration.errors}
							/>
						<DropdownField 
							labelProps={{ children: t('courseEditor.form.language') }}
							selectProps={{
							name: 'languageId',
							defaultValue: course?.translation?.languageId ?? "",
							required: true,
							children: (
							<>
							<option value="" disabled hidden>
								{t('courseEditor.form.selectLanguage')}
								</option>
								<option value="en">{getTranslatedLabel('courseEditor.form', 'languages', 'en', t)}</option>
								<option value="fr">{getTranslatedLabel('courseEditor.form', 'languages', 'fr', t)}</option>
								<option value="es">{getTranslatedLabel('courseEditor.form', 'languages', 'es', t)}</option>
							</>
					),
				}}
			/>
						<DropdownField 
							labelProps={{ children: t('courseEditor.form.level') }}
							selectProps={{
							name: 'level',
							defaultValue: course?.translation?.level ?? "", 
							children: (
							<>
								<option value="" disabled hidden>
								{t('courseEditor.form.selectLevel')}
								</option>
								<option value="BEGINNER">{getTranslatedLabel('courseEditor.form', 'levels', 'beginner', t)}</option>
								<option value="INTERMEDIATE">{getTranslatedLabel('courseEditor.form', 'levels', 'intermediate', t)}</option>
								<option value="ADVANCED">{getTranslatedLabel('courseEditor.form', 'levels', 'advanced', t)}</option>
							</>
					),
				}}
			/>
					<div>
							<Label>{t('courseEditor.form.images')}</Label>
							<ul className="flex flex-col gap-4">
								{imageList.map((imageMeta, index) => {
									const image = course?.images[index]
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
												<span className="sr-only">{t('courseEditor.form.removeImage', { index: index + 1 })}</span>
											</button>
											<ImageChooser meta={imageMeta}  />
										</li>
									)
								})}
							</ul>
						</div>
						<Button className="mt-3" {...form.insert.getButtonProps({ name: fields.images.name })}>
							<span aria-hidden>
								<Icon name="plus">{t('courseEditor.form.images')}</Icon>
							</span>{' '}
							<span className="sr-only">{t('courseEditor.form.addImage')}</span>
						</Button>
					</div>
					<ErrorList id={form.errorId} errors={form.errors} />
				</Form>
				<div className={floatingToolbarClassName}>
				<Button
  					variant="destructive"
  				{...form.reset.getButtonProps()}
				>
				{t('courseEditor.reset')}
				</Button>
					<StatusButton form={form.id} type="submit" disabled={isPending} status={isPending ? 'pending' : 'idle'}>
						{t('courseEditor.submit')}
					</StatusButton>
				</div>
			</FormProvider>
		</div>
	)
}

function ImageChooser({
	meta,
}: {
	meta: FieldMetadata<ImageFieldset>
}) {
	const fields = meta.getFieldset()
	const existingImage = Boolean(fields.id.initialValue)
	const [previewImage, setPreviewImage] = useState<string | null>(
		fields.id.initialValue ? getCourseImgSrc(fields.id.initialValue) : null,
	)
	const [altText, setAltText] = useState(fields.altText.initialValue ?? '')
	const { t } = useTranslation()

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
										<img
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
											{t('courseEditor.form.newImage')}
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
					<Label htmlFor={fields.altText.id}>{t('courseEditor.form.altText')}</Label>
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
		const { t } = useTranslation()
	return <GeneralErrorBoundary statusHandlers={{ 404: ({ params }) => <p>{t('courseEditor.notFound', { courseId: params.courseId })}</p> }} />
}
