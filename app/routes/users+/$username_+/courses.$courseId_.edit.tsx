import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { CourseEditor } from './__course-editor.tsx'

export { action } from './__course-editor.server.tsx'

export async function loader({ params, request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const course = await prisma.course.findFirst({
		select: {
			id: true,
			title: true,
			description: true,
			content: true,
			language:true,
			level: true,
			duration: true,
			images: {
				select: {
					id: true,
					altText: true,
					contentType: true,
				},
			},
		},
		where: {
			id: params.courseId,
			ownerId: userId,
		},
	})
	invariantResponse(course, 'Course not found', { status: 404 })
	return json({ course: course })
}

export default function CourseEdit() {
	const data = useLoaderData<typeof loader>()
	return <CourseEditor course={data.course} />
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No course with the id "{params.courseId}" exists</p>
				),
			}}
		/>
	)
}
