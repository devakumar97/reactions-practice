import { LoaderFunctionArgs, type MetaFunction, json } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '#app/components/ui/tooltip.tsx'
import { cn } from '#app/utils/misc.tsx'
import { getLanguage } from '#app/utils/language-server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { invariantResponse } from '@epic-web/invariant'

export const meta: MetaFunction = () => [{ title: 'Courses | Home' }]

export async function loader({ request, params }: LoaderFunctionArgs) {
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
						select: {
							title: true,
							},
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
		title: c.translation?.[0]?.title ?? 'Untitled',
	}))

	return json({ owner: { ...owner, courses: formattedCourses } })
}

const benefits = [
	{
		title: 'Create Courses',
		description: 'Easily create, manage, and update your own courses.',
		icon: '/icons/create.svg',
	},
	{
		title: 'Track Progress',
		description: 'Monitor what you’ve built and what’s next to learn.',
		icon: '/icons/track.svg',
	},
	{
		title: 'Learn Fast',
		description: 'Built with learners in mind – fast, focused, simple.',
		icon: '/icons/learn.svg',
	},
	{
		title: 'Share Knowledge',
		description: 'Let others benefit from your expertise by sharing your courses.',
		icon: '/icons/share.svg',
	},
]

export default function Index() {
	const data = useLoaderData<typeof loader>()
	return (
		<main className="font-poppins grid h-full place-items-center bg-background">
			<div className="grid place-items-center px-4 py-16 xl:grid-cols-2 xl:gap-24">
				{/* Hero Text */}
				<div className="flex max-w-md flex-col items-center text-center xl:order-2 xl:items-start xl:text-left">
					<h1 className="mt-8 text-4xl font-bold text-foreground md:text-5xl xl:mt-4 xl:text-6xl">
						Your Learning Hub
					</h1>
					<p className="mt-6 text-xl text-muted-foreground xl:mt-8 xl:leading-10">
						Welcome to your personal course platform. Build, manage, and learn faster than ever before.
					</p>
					{/* <div className="mt-8 flex flex-wrap gap-4">
						<Link
							to={`/users/${data.owner.username}.courses`}
							className="rounded-full bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
						>
							View Courses
						</Link>
						<Link
							to={`/users/${data.owner.username}.courses`}
							className="rounded-full border border-blue-600 px-6 py-3 text-blue-600 hover:bg-blue-50"
						>
							Add New Course
						</Link>
					</div> */}
				</div>

				{/* Benefits Grid */}
				<ul className="mt-16 flex max-w-3xl flex-wrap justify-center gap-4 xl:mt-0 xl:grid xl:grid-cols-2 xl:grid-rows-2">
					<TooltipProvider>
						{benefits.map((benefit, i) => (
							<li
								key={benefit.title}
								className={cn(
									'flex flex-col items-center justify-center rounded-2xl bg-violet-600/10 p-6 text-center dark:bg-violet-200 dark:text-black',
									'animate-fade-in-up [animation-fill-mode:backwards]',
								)}
								style={{ animationDelay: `${i * 0.1}s` }}
							>
								{/* <Tooltip>
									<TooltipTrigger asChild>
										<div className="mb-3 size-16 sm:size-20">
											<img src={benefit.icon} alt={benefit.title} className="mx-auto" />
										</div>
									</TooltipTrigger>
									<TooltipContent>{benefit.description}</TooltipContent>
								</Tooltip> */}
								<h3 className="mt-2 text-lg font-semibold">{benefit.title}</h3>
								<p className="mt-1 text-sm text-muted-foreground">{benefit.description}</p>
							</li>
						))}
					</TooltipProvider>
				</ul>
			</div>
		</main>
	)
}
