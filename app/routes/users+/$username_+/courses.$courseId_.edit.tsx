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
  if (!params.languageId) {
		throw new Response('languageId is required', { status: 400 })
	}
  
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
			where: eq(CourseTranslation.languageId, params.languageId),
			limit: 1,
			columns: {
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

const courseWithTranslation = course
  ? {
      ...course,
    translation: course.translations[0] ?? null,
	  title: '',
    description: '',
    content: '',
    level: 'BEGINNER', // or default level
    }
  : null;
	invariantResponse(course, 'Course not found', { status: 404 })
	return json({courseWithTranslation })
}

export default function CourseEdit() {
	const data = useLoaderData<typeof loader>()
	return <CourseEditor course={data.courseWithTranslation} />
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
