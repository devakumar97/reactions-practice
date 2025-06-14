//course-editor.server.tsx
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
import { drizzle } from '#app/utils/db.server.ts'
import {
	MAX_UPLOAD_SIZE,
	CourseEditorSchema,
	type ImageFieldset,
} from './__course-editor'
import { invariant } from '@epic-web/invariant'
import { and, eq, notInArray } from 'drizzle-orm'
import { Course, CourseImage, CourseTranslation } from '../../../../drizzle/schema'

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
	  console.log('Action triggered')

	const userId = await requireUserId(request);
	// Parsing the Form Data
	const formData = await parseMultipartFormData(request, 
		createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE }),
	);
	// Validating the Form Data with Zod
	const submission = await parseWithZod(formData, {
		schema: CourseEditorSchema.superRefine(async (data, ctx) => {
		  if (!data.id) return;
	  
		  const course = await drizzle.query.Course.findFirst({
  			where: and(
    		eq(Course.id, data.id),
    		eq(Course.ownerId, userId),
  			),
  		columns: {
   	 id: true,
  	},
  with: {
    translations: {
      where: eq(CourseTranslation.languageId, data.languageId),
      columns: {
        title: true,
        description: true,
        content: true,
        level: true,
      },
    },
  },
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
										altText: image.altText ?? null,
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
		content,
		languageId,
		level, 
		duration,
		imageUpdates = [],
		newImages = [],
	} = submission.value;
	
	// Upserting the Course (Create or Update)
	const updatedCourse = await drizzle.transaction(async (tx) => {
	// 1. Upsert Course using .onConflictDoUpdate
	const [course] = await tx
		.insert(Course)
		.values({
			id: courseId,
			ownerId: userId,
			duration,
			})
		.onConflictDoUpdate({
			target: Course.id,
			set: { duration },
		})
		.returning({ id: Course.id, ownerId: Course.ownerId });

	invariant(course, 'Failed to insert/update course');

	// 2. Delete old images not in update list
	await tx.delete(CourseImage).where(
		and(
			eq(CourseImage.courseId, course.id),
			notInArray(CourseImage.id, imageUpdates.map((img) => img.id)),
		),
	);

	// 3. Update existing images
	for (const update of imageUpdates) {
	await tx.update(CourseImage)
		.set({
			id: update.blob ? cuid() : update.id,
			courseId: course.id,
			altText: update.altText,
			...(update.blob
				? {
						contentType: update.contentType,
						blob: update.blob,  // Convert Buffer to base64 string here
				  }
				: {}),
		})
		.where(eq(CourseImage.id, update.id))
}


	// 4. Insert new images
	if (newImages.length > 0) {
	await tx.insert(CourseImage).values(
		newImages.map((img) => ({
			id: cuid(),
			courseId: course.id,
			altText: img.altText ?? null,
			contentType: img.contentType ?? '',
			blob: img.blob,
		}))
	)
}
// 5. Upsert CourseTranslation manually
// 5. Upsert CourseTranslation manuallyAdd commentMore actions
	const existingTranslation = await tx.query.CourseTranslation.findFirst({
		where: and(
			eq(CourseTranslation.courseId, course.id),
			eq(CourseTranslation.languageId, languageId),
		),

});
	if (!existingTranslation) {
		await tx.insert(CourseTranslation).values({
			courseId: course.id,
			languageId,
			title,
			description,
			content,
			level,
		});
	} else {
		await tx
			.update(CourseTranslation)
			.set({
				title,
				description,
				content,
				level,
			})
			.where(
				and(
					eq(CourseTranslation.courseId, course.id),
					eq(CourseTranslation.languageId, languageId),
				),
			);
	}

	// 6. Fetch course + owner for redirect
	const courseWithOwner = await tx.query.Course.findFirst({
		where: eq(Course.id, Course.id),
		columns: { id: true },
		with: {
			owner: {
				columns: { username: true },
			},
		}
	});

	invariant(courseWithOwner, 'Failed to fetch course after upsert');


	return courseWithOwner;
});

// 7. Redirect to final URL
return redirect(
	`/users/${updatedCourse.owner.username}/courses/${updatedCourse.id}`,
);
}