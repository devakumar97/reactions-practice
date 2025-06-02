import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { CourseEditor } from './__course-editor.tsx'
import { useTranslation } from 'react-i18next'

export { action } from './__course-editor.server.tsx'

export async function loader({ params, request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const course = await prisma.course.findFirst({
  select: {
    id: true,
    duration: true,
    images: {
      select: {
        id: true,
        altText: true,
        contentType: true,
      },
    },
    translation: {
      where: {
        languageId: params.languageId, // or your current language id from params or session
      },
      select: {
        title: true,
        description: true,
        content: true,
        level: true,
      },
      take: 1,
    },
  },
  where: {
    id: params.courseId,
    ownerId: userId,
  },
});

const courseWithTranslation = course
  ? {
      ...course,
      translation: course.translation[0] ?? null,
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
