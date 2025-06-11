import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, NavLink, Outlet, useLoaderData, useLocation, useNavigate } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { drizzle } from '#app/utils/db.server.ts'
import { cn, getUserImgSrc } from '#app/utils/misc.tsx'
import { useOptionalUser } from '#app/utils/user.ts'
import { getLanguage } from '#app/utils/language-server.ts'
import { useTranslation } from 'react-i18next'
import { Modal } from '#app/components/ui/modal.tsx'
import { GenericTable } from '#app/components/ui/table.tsx'
import { getTranslatedLabel } from '#app/utils/translateLabel.ts'
import { Button } from '#app/components/ui/button.tsx'
import { eq } from 'drizzle-orm'
import { CourseTranslation, User } from '../../../../drizzle/schema'

export async function loader({ request, params }: LoaderFunctionArgs) {
	const lang = await getLanguage(request)

	if (!params.username) {
		throw new Response('Username is required', { status: 400 })
	}

	const owner = await drizzle.query.User.findFirst({
		columns: {
			id: true,
			name: true,
			username: true,
		},
			where: eq(User.username, params.username),
  	with: {
    image: {
      columns: {
        id: true,
      },
    },
    courses: {
      where: (course, { exists, and }) =>
        exists(
          drizzle.select().from(CourseTranslation).where(
            and(
              eq(CourseTranslation.courseId, course.id),
              eq(CourseTranslation.languageId, lang)
            )
          )
        ),
      columns: {
        id: true,
      },
      with: {
        translations: {
          where: eq(CourseTranslation.languageId, lang),
          columns: {
            title: true,
            description: true,
            level: true,
          },
        },
      },
    },
  },

})

	invariantResponse(owner, 'Owner not found', { status: 404 })

	// If the course translations are not found for the selected language, fall back to a default value or handle the case
	const formattedCourses = owner.courses.map((c) => ({
		id: c.id,
		title: c.translations?.[0]?.title ?? 'Untitled',
		description: c.translations?.[0]?.description ?? 'Unknown',
		level: c.translations?.[0]?.level ?? 'N/A',
	}))

	return json({ owner: { ...owner, courses: formattedCourses } })
}

export default function CoursesRoute() {
	const data = useLoaderData<typeof loader>()
	const user = useOptionalUser()
	const isOwner = user?.id === data.owner.id
	const ownerDisplayName = data.owner.name ?? data.owner.username
	const navLinkDefaultClassName =
		'line-clamp-2 block rounded-l-full py-2 pl-8 pr-6 text-base lg:text-xl'
	const { t } = useTranslation()

	const navigate = useNavigate()
	const location = useLocation()
	const ModalBasePath = `/users/${data.owner.username}/courses`
	const showModal = location.pathname !== ModalBasePath
	const closeModal = () => navigate(ModalBasePath)
	const basePath = 'courseEditor.form'

	const openModal = (id: string) => {
		navigate(`${id}`)
	}
	const addCourse = () => {
		navigate(`new`)
	}
	const editCourse = (id: string) => {
		navigate(`${id}/edit`)
	}

	return (
		<main className="container mx-auto flex h-full min-h-[400px] flex-col px-4 pb-12 pt-6 md:px-8">
			{showModal && (
				<Modal onClose={closeModal}>
					<Outlet />
				</Modal>
			)}
			<section className="w-full rounded-2xl bg-white p-6 shadow-md dark:bg-gray-900">
				<div className="flex items-center justify-between mb-4">
					<Link
							to={`/users/${data.owner.username}`}
							className="flex flex-col items-center justify-center gap-2 pb-4 pl-8 pr-4  lg:flex-row lg:justify-start lg:gap-4"
						>
					<img
								src={getUserImgSrc(data.owner.image?.id)}
								alt={ownerDisplayName}
								className="h-16 w-16 rounded-full object-cover lg:h-24 lg:w-24"
								width={256}
								height={256}
							/>
					<h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
						{t('coursesPage.ownersCourses', { owner: ownerDisplayName })}
					</h2>
					</Link>
					{isOwner && (
						<Button
						onClick={(e) => {

							e.stopPropagation();
							addCourse();
						}}
						className="flex items-center justify-between gap-2 px-4 py- rounded-md "
						>
							<Icon name="plus" className="w-4 h-4" />
							Add Course
							</Button>
					)}
				</div>

					<GenericTable
					data={data.owner.courses}
					searchPlaceholder={t('table.search')}
					onRowClick={(row) => openModal(row.id)}
					columns={[
						{ key: 'title', label: t('coursePage.label.title', 'Title') },
						{ key: 'description', label: t('coursePage.label.decription', 'Decription') },
						// { key: 'language', label: t('coursePage.label.language', 'Language'), align: 'center' },
						{ key: 'level', 
							label: t('coursePage.label.level', 'Level'),
							render: (row) => getTranslatedLabel(basePath, 'levels', row.level, t),
						}
					]}
					actions={(row) =>
						isOwner && (
							<Button
								onClick={(e) => {
									e.stopPropagation()
									editCourse(row.id)
								}}
							>
								<Icon name="pencil-1" className='size-4'/>
							</Button>
						)
					}
				/>
			</section>
		</main>
	)
}

export function ErrorBoundary() {
		const { t } = useTranslation()
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>{t('user.notFound', { username: params.username })}</p>
				),
			}}
		/>
	)
}