import { requireUserId } from '#app/utils/auth.server.ts'
import { json,LoaderFunctionArgs } from '@remix-run/node'
import { CourseEditor } from './__course-editor.tsx'

export { action } from './__course-editor.server.tsx' // Handle course creation

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserId(request)
	return json({})
}

export default CourseEditor
