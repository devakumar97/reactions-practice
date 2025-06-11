import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUserId } from '#app/utils/auth.server.ts'
import { invariant } from '@epic-web/invariant'
import { getDomainUrl } from '#app/utils/misc.tsx'
import { eq } from 'drizzle-orm'
import { drizzle } from '#app/utils/db.server.ts'
import { User } from '../../../drizzle/schema'


export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const user = await drizzle.query.User.findFirst({
		where: eq(User.id, userId),
		// this is one of the *few* instances where you can use "include" because
		// the goal is to literally get *everything*. Normally you should be
		// explicit with "select". We're using select for images because we don't
		// want to send back the entire blob of the image. We'll send a URL they can
		// use to download it instead.
		with: {
			image: {
				columns: {
					id: true,
					createdAt: true,
					updatedAt: true,
					contentType: true,
				},
			},
			courses: {
				with: {
					images: {
						columns: {
							id: true,
							createdAt: true,
							updatedAt: true,
							contentType: true,
						},
					},
				},
			},
			sessions: true,
			roles: true,
		},
	})
	invariant(user, 'User not found')


	const domain = getDomainUrl(request)

	return json({
		user: {
			...user,
			image: user.image
				? {
						...user.image,
						url: `${domain}/resources/user-images/${user.image.id}`,
					}
				: null,
			courses: User.courses.map((course) => ({
				...course,
				images: course.images.map((image) => ({
					...image,
					url: `${domain}/resources/course-images/${image.id}`,
				})),
			})),
		},
	})
}
