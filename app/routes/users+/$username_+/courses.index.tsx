import { type Route } from './+types/projects.index.ts'
import { type Info as projectsInfo } from './+types/projects.ts'

export default function ProjectsIndexRoute() {
	return (
		<div className="container pt-12">
			<p className="text-body-md">Select a project</p>
		</div>
	)
}

export const meta: Route.MetaFunction = ({ params, matches }) => {
	const projectsMatch = matches.find(
		(m) => m?.id === 'routes/users+/$username_+/projects',
	) as { data: projectsInfo['loaderData'] }

	const displayName = projectsMatch?.data?.owner.name ?? params.username
	const projectCount = projectsMatch?.data?.owner.projects.length ?? 0
	const projectsText = projectCount === 1 ? 'project' : 'projects'

	return [
		{ title: `${displayName}'s Projects | Epic Projects` },
		{
			name: 'description',
			content: `Check out ${displayName}'s ${projectCount} ${projectsText} on Epic Projects`,
		},
	]
}
