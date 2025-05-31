import { invariantResponse } from '@epic-web/invariant'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, NavLink, Outlet, useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { cn, getUserImgSrc } from '#app/utils/misc.tsx'
import { useOptionalUser } from '#app/utils/user.ts'
import { getLanguage } from '#app/utils/language-server.ts'

export async function loader({ request,params }: LoaderFunctionArgs) {
	const lang = await getLanguage(request)
	
	const owner = await prisma.user.findFirst({
		select: {
			id: true,
			name: true,
			username: true,
			image: { select: { id: true } },
			courses: {
				where: {
					translation: {
						some: {
							language: { id: lang },
						},
					},
				},
				select: {
					id: true,
					translation: {
						where: { language: { id: lang } },
						select: { title: true },
					},
				},
			},
		},
		where: { username: params.username },
	})

	invariantResponse(owner, 'Owner not found', { status: 404 })

	// If the course translations are not found for the selected language, fall back to a default value or handle the case
	const formattedCourses = owner.courses.map((c) => ({
		id: c.id,
		title: c.translation?.[0]?.title ?? 'Untitled', // Fallback to "Untitled" if no translation exists
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

	return (
		<main className="container flex h-full min-h-[400px] px-0 pb-12 md:px-8">
			<div className="grid w-full grid-cols-4 bg-muted pl-2 md:container md:rounded-3xl md:pr-0">
				<div className="relative col-span-1">
					<div className="flex flex-col h-full">
						<Link
							to={`/users/${data.owner.username}`}
							className="flex flex-col items-center justify-center gap-2 bg-muted pb-4 pl-8 pr-4 pt-12 lg:flex-row lg:justify-start lg:gap-4"
						>
							<img
								src={getUserImgSrc(data.owner.image?.id)}
								alt={ownerDisplayName}
								className="h-16 w-16 rounded-full object-cover lg:h-24 lg:w-24"
								width={256}
								height={256}
							/>
							<h1 className="text-center text-base font-bold md:text-lg lg:text-left lg:text-2xl">
								{ownerDisplayName}'s Courses
							</h1>
						</Link>
						<ul className="overflow-y-auto overflow-x-hidden pb-12">
							{isOwner ? (
								<li className="p-1 pr-0">
									<NavLink
										to="new"
										className={({ isActive }) =>
											cn(navLinkDefaultClassName, isActive && 'bg-accent')
										}
									>
										<Icon name="plus">Add Course</Icon>
									</NavLink>
								</li>
							) : null}
							{data.owner.courses.map((course) => (
								<li key={course.id} className="p-1 pr-0">
									<NavLink
										to={course.id}
										preventScrollReset
										prefetch="intent"
										className={({ isActive }) =>
											cn(navLinkDefaultClassName, isActive && 'bg-accent')
										}
									>
										{course.title} 
									</NavLink>
								</li>
							))}
						</ul>
					</div>
				</div>
				<div className="relative col-span-3 bg-accent md:rounded-r-3xl">
					<Outlet />
				</div>
			</div>
		</main>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No user with the username "{params.username}" exists</p>
				),
			}}
		/>
	)
}