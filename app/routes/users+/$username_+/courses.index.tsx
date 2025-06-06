import { type MetaFunction } from '@remix-run/react'
import { type loader as coursesLoader } from './courses.tsx'
import { useTranslation } from 'react-i18next'

export default function CoursesIndexRoute() {
		const { t } = useTranslation()

	return (
		<div className="container pt-12">
			<p className="text-body-md">{t('coursesIndex.selectCourse')}</p>
		</div>
	)
}

export const meta: MetaFunction<
	null,
	{ 'routes/users+/$username_+/courses': typeof coursesLoader }
> = ({ params, matches }) => {
	const coursesMatch = matches.find(
		(m) => m?.id === 'routes/users+/$username_+/courses',
	)

	const displayName = coursesMatch?.data?.owner.name ?? params.username
	const courseCount = coursesMatch?.data?.owner.courses.length ?? 0
	const coursesText = courseCount === 1 ? 'course' : 'courses'

	return [
		{ title: `${displayName}'s Courses | Courses` },
		{
			name: 'description',
			content: `Check out ${displayName}'s ${courseCount} ${coursesText} on my courses`,
		},
	]
}
