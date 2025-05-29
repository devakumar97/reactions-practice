
import { parseWithZod } from '@conform-to/zod'
import { createId as cuid } from '@paralleldrive/cuid2'
import {
	unstable_createMemoryUploadHandler as createMemoryUploadHandler,
	json,
	unstable_parseMultipartFormData as parseMultipartFormData,
	redirect,
	type ActionFunctionArgs,
} from '@remix-run/node'
import { z } from 'zod'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import {
	MAX_UPLOAD_SIZE,
	CourseEditorSchema,
	type ImageFieldset,
} from './__course-editor'

//Helper Functions
// 1.Checking if Image Has a File
function imageHasFile(
	image: ImageFieldset,
): image is ImageFieldset & { file: NonNullable<ImageFieldset['file']> } {
	return Boolean(image.file?.size && image.file?.size > 0)
}
// 2.Checking if Image Has an ID
function imageHasId(
	image: ImageFieldset,
): image is ImageFieldset & { id: string } {
	return Boolean(image.id)
}

// Main action Function
export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request);
	// Parsing the Form Data
	const formData = await parseMultipartFormData(request, 
		createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE }),
	);
	// Validating the Form Data with Zod
	const submission = await parseWithZod(formData, {
		schema: CourseEditorSchema.superRefine(async (data, ctx) => {
		  if (!data.id) return;
	  
		  const course = await prisma.course.findUnique({
			select: { id: true },
			where: { id: data.id, userId: userId },
		  });
	  
		  if (!course) {
			ctx.addIssue({
			  code: z.ZodIssueCode.custom,
			  message: 'Course not found',
			});
		  }
		}).transform(async ({ images = [], ...data }) => {
					return {
						...data,
						imageUpdates: await Promise.all(
							images.filter(imageHasId).map(async (i) => {
								if (imageHasFile(i)) {
									return {
										id: i.id,
										altText: i.altText,
										contentType: i.file.type,
								blob: Buffer.from(await i.file.arrayBuffer()),
									}
								} else {
									return {
										id: i.id,
										altText: i.altText,
									}
								}
							}),
						),
						newImages: await Promise.all(
							images
								.filter(imageHasFile)
								.filter((i) => !i.id)
								.map(async (image) => {
									return {
										altText: image.altText,
										contentType: image.file.type,
								blob: Buffer.from(await image.file.arrayBuffer()),
									}
								}),
						),
					}
				}),
				async: true,
			})
	  
	// Handling Validation Errors
	if (submission.status !== 'success') {
		return json(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 }
		);
	}
//storing data in db
	const {
		id: courseId,
		title,
		description,
		level, 
		duration,
		imageUpdates = [],
		newImages = [],
	} = submission.value;
	
	// Upserting the Course (Create or Update)
	const updatedCourse = await prisma.course.upsert({
		select: { id: true, user: { select: { username: true } } },
		where: { id: courseId ?? '__new_course__' },
		create: {
			id: courseId,
			ownerId: userId,
			title,
			description,
			level, 
			duration,
			images: { create: newImages },
		},
		update: {
			title,
			description,
			level, 
			duration,
			images: {
				deleteMany: {
					id: { notIn: imageUpdates.map((i) => i.id) },
				},								
				updateMany: imageUpdates.map((updates) => ({
					where: { id: updates.id },
					data: { ...updates, id: updates.blob ? cuid() : updates.id },
				})),
				create: newImages,
			},
		},
	});

	return redirect(`/users/${updatedCourse.owner!.username}/courses/${updatedCourse.id}`,

	);
}

