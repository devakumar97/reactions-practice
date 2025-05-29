import { getFormProps, useForm } from '@conform-to/react' 
import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { formatDistanceToNow } from 'date-fns'
import { Img } from 'openimg/react'
import { useRef, useEffect } from 'react'
import { data, Form, Link } from 'react-router'
import { z } from 'zod'
import { floatingToolbarClassName } from '#app/components/floating-toolbar.tsx'
import { ErrorList } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { getProjectImgSrc, useIsPending } from '#app/utils/misc.tsx'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { useOptionalUser } from '#app/utils/user.ts'
import { type Route, type Info } from './+types/projects.$projectId.ts'
import { type Info as projectsInfo } from './+types/projects.ts'

// loader Function (Fetching Project Data)
export async function loader({ params }: Route.LoaderArgs) {
	const project = await prisma.project.findUnique({
		where: { id: params.projectId },
		select: {
			id: true,
			title: true,
			description: true,
			status: true,
			deadline: true,
			ownerId: true,
			updatedAt: true,
			images: {
				select: {
					altText: true,
					objectKey: true,
				},
			},
		},
	})

	invariantResponse(project, 'Project not found', { status: 404 })

	const timeAgo = formatDistanceToNow(new Date(project.updatedAt))

	return { project, timeAgo }
}

// action Function (Deleting a Project)
const DeleteFormSchema = z.object({
	intent: z.literal('delete-project'),
	projectId: z.string(),
})

// Processing the Deletion Request
export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema: DeleteFormSchema })

	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { projectId } = submission.value

	// Checking Permissions & Deleting the Project
	const project = await prisma.project.findFirst({
		select: { id: true, ownerId: true, owner: { select: { username: true } } },
		where: { id: projectId },
	})
	invariantResponse(project, 'Project not found', { status: 404 })

	await prisma.project.delete({ where: { id: project.id } })
	// Redirecting After Deletion
	return redirectWithToast(`/users/${project.owner?.username ?? "unknown"}/projects`, {
		type: 'success',
		title: 'Success',
		description: 'Your project has been deleted.',
	})
}

// ProjectRoute Component (Project Details Page)
export default function ProjectRoute({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const user = useOptionalUser()
	const isOwner = user?.id === loaderData.project.ownerId
	const displayBar = isOwner

	const sectionRef = useRef<HTMLElement>(null)

	useEffect(() => {
		if (sectionRef.current) {
			sectionRef.current.focus()
		}
	}, [loaderData.project.id])
	console.log(loaderData.project.images);

	// Rendering the Project Information
	return (
		<section
			ref={sectionRef}
			className="absolute inset-0 flex flex-col px-10"
			aria-labelledby="project-title"
			tabIndex={-1}
		>
			<h2 id="project-title" className="mb-2 pt-12 text-h2 lg:mb-6">
				{loaderData.project.title}
			</h2>
			<div className="flex gap-6">

			<p className="text-sm text-gray-500">Status: {loaderData.project.status ?? 'PENDING'}</p>
			{loaderData.project.deadline && (
				<p className="text-sm text-gray-500">
					Deadline: {new Date(loaderData.project.deadline).toLocaleDateString()}
				</p>
			)}
			</div>
			<div className={`${displayBar ? 'pb-24' : 'pb-12'} overflow-y-auto `}>
			<ul className="flex flex-wrap gap-5 py-5">
 			 {loaderData.project.images.map((image) => (
   				 <li key={image.objectKey}>
     			 <a href={getProjectImgSrc(image.objectKey)} target="_blank" rel="noopener noreferrer">
      		  <Img
				src={getProjectImgSrc(image.objectKey)}
				alt={image.altText ?? ''}
				className="h-32 w-32 rounded-lg object-cover"
				width={512}
				height={512}
				/>
      			</a>
    		</li>
  			))}
		</ul>
			<p className="whitespace-break-spaces text-sm md:text-lg">
				{loaderData.project.description}
				</p>
			</div>
			
			{displayBar && (
				<div className={floatingToolbarClassName}>
					<span className="text-sm text-foreground/90 max-[524px]:hidden">
						<Icon name="clock" className="scale-125">
							{loaderData.timeAgo} ago
						</Icon>
					</span>
					<div className="grid flex-1 grid-cols-2 justify-end gap-2 min-[525px]:flex md:gap-4">
						{<DeleteProject id={loaderData.project.id} actionData={actionData} />}
						<Button asChild>
							<Link to="edit">
								<Icon name="pencil-1" className="scale-125 max-md:scale-150">
									<span className="max-md:hidden">Edit</span>
								</Icon>
							</Link>
						</Button>
					</div>
				</div>
			)}
		</section>
	)
}

// DeleteProject Component (Project Deletion Form)
export function DeleteProject({
	id,
	actionData,
}: {
	id: string
	actionData: Info['actionData'] | undefined
}) {
	const isPending = useIsPending()
	const [form] = useForm({ id: 'delete-project', lastResult: actionData?.result })
	// Rendering the Delete Button
	return (
		<Form method="POST" {...getFormProps(form)}>
			<input type="hidden" name="projectId" value={id} />
			<StatusButton
				type="submit"
				name="intent"
				value="delete-project"
				variant="destructive"
				status={isPending ? 'pending' : (form.status ?? 'idle')}
				disabled={isPending}
			>
				<Icon name="trash" className="scale-125 max-md:scale-150">
					<span className="max-md:hidden">Delete</span>
				</Icon>
			</StatusButton>
			<ErrorList errors={form.errors} id={form.errorId} />
		</Form>
	)
}

export const meta: Route.MetaFunction = ({ data, params, matches }) => {
	const projectsMatch = matches.find((m) => m?.id === 'routes/users+/$username_+/projects') as
		| { data: projectsInfo['loaderData'] }
		| undefined

	const displayName = projectsMatch?.data?.owner?.name ?? params.username
	const projectTitle = data?.project?.title ?? 'Project'

	return [
		{ title: `${projectTitle} | ${displayName}'s Projects | Epic Projects` },
		{ name: 'description', content: data?.project?.description ?? 'No description available' },
	]
}
