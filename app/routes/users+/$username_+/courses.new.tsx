import { requireUserId } from '#app/utils/auth.server.ts'
import { type Route } from './+types/projects.new.ts'
import { ProjectEditor } from './__course-editor.tsx'

export { action } from './__course-editor.server.tsx' // Handle project creation

export async function loader({ request }: Route.LoaderArgs) {
	await requireUserId(request)
	return {}
}

export default ProjectEditor
