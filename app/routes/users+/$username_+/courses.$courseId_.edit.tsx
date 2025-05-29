import { invariantResponse } from '@epic-web/invariant'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/projects.$projectId_.edit.ts'
import { ProjectEditor } from './__course-editor.tsx'

export { action } from './__course-editor.server.tsx'

export async function loader({ params, request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)
	const project = await prisma.project.findFirst({
		select: {
			id: true,
			title: true,
			description: true,
			status: true,
			deadline: true,
			images: {
				select: {
					id: true,
					altText: true,
					objectKey: true,
				},
			},
		},
		where: {
			id: params.projectId,
			ownerId: userId,
		},
	})
	invariantResponse(project, 'Project not found', { status: 404 })
	return { project }
}

export default function ProjectEdit({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	return <ProjectEditor project={loaderData.project} actionData={actionData} />
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No project with the id "{params.projectId}" exists</p>
				),
			}}
		/>
	)
}
