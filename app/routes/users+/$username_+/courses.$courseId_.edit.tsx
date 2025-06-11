import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { drizzle } from '#app/utils/db.server.ts'
import { CourseEditor } from './__course-editor.tsx'
import { useTranslation } from 'react-i18next'
import { eq, and } from 'drizzle-orm'
import { Course, CourseTranslation } from '../../../../drizzle/schema.ts'

export { action } from './__course-editor.server.tsx'

export async function loader({ params, request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)

	if (!params.courseId) {
		throw new Response('CourseId is required', { status: 400 })
	}

	const languageId = params.languageId ?? 'en' 
	const course = await drizzle.query.Course.findFirst({
	where: and(
		eq(Course.id, params.courseId),
		eq(Course.ownerId, userId),
	),
	with: {
		images: {
			columns: {
				id: true,
				altText: true,
				contentType: true,
			},
		},
		translations: {
			where: eq(CourseTranslation.languageId, languageId),
			limit: 1,
			columns: {
				languageId: true,
				title: true,
				description: true,
				content: true,
				level: true,
			},
		},
	},
	columns: {
		id: true,
		duration: true,
	},
});

invariantResponse(course, 'Course not found', { status: 404 })

const courseWithTranslation = {
		...course,
		translation: course.translations?.[0] ?? null,
	}

	return json({ course: courseWithTranslation })
}

export default function CourseEdit() {
	const data = useLoaderData<typeof loader>()
	return <CourseEditor course={data.course} />
}

export function ErrorBoundary() {
  	const { t } = useTranslation()

	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
				<p>{t('courseEdit.notFound', { courseId: params.courseId })}</p>
				),
			}}
		/>
	)
}
