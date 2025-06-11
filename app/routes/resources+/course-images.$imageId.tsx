import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs } from '@remix-run/node'
import { drizzle } from '#app/utils/db.server.ts'
import { eq } from 'drizzle-orm'
import { CourseImage } from '../../../drizzle/schema'

export async function loader({ params }: LoaderFunctionArgs) {
	invariantResponse(params.imageId, 'Image ID is required', { status: 400 })
	const [image] = await drizzle
		.select({ contentType: CourseImage.contentType, blob: CourseImage.blob })
		.from(CourseImage)
		.where(eq(CourseImage.id, params.imageId))

	invariantResponse(image, 'Not found', { status: 404 })

	return new Response(image.blob, {
		headers: {
			'Content-Type': image.contentType,
			'Content-Length': Buffer.byteLength(image.blob).toString(),
			'Content-Disposition': `inline; filename="${params.imageId}"`,
			'Cache-Control': 'public, max-age=31536000, immutable',
		},
	})
}
