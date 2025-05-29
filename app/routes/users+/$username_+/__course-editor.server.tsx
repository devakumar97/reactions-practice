import { parseWithZod } from '@conform-to/zod'
import { parseFormData } from '@mjackson/form-data-parser'
import { createId as cuid } from '@paralleldrive/cuid2'
import { data, redirect, type ActionFunctionArgs } from 'react-router'
import { z } from 'zod'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { uploadProjectImage } from '#app/utils/storage.server.ts'
import {
	MAX_UPLOAD_SIZE,
	ProjectEditorSchema,
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
	const formData = await parseFormData(request, {
		maxFileSize: MAX_UPLOAD_SIZE,
	});
	// Validating the Form Data with Zod
	const submission = await parseWithZod(formData, {
		schema: ProjectEditorSchema.superRefine(async (data, ctx) => {
		  if (!data.id) return;
	  
		  const project = await prisma.project.findUnique({
			select: { id: true },
			where: { id: data.id, ownerId: userId },
		  });
	  
		  if (!project) {
			ctx.addIssue({
			  code: z.ZodIssueCode.custom,
			  message: 'Project not found',
			});
		  }
		}).transform(async ({ images = [], ...data }) => {
					const projectId = data.id ?? cuid()
					return {
						...data,
						id: projectId,
						imageUpdates: await Promise.all(
							images.filter(imageHasId).map(async (i) => {
								if (imageHasFile(i)) {
									return {
										id: i.id,
										altText: i.altText,
										objectKey: await uploadProjectImage(userId, projectId, i.file),
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
										objectKey: await uploadProjectImage(userId, projectId, image.file),
									}
								}),
						),
					}
				}),
				async: true,
			})
	  
	// Handling Validation Errors
	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 }
		);
	}
//storing data in db
	const {
		id: projectId,
		title,
		description,
		status, 
		deadline,
		imageUpdates = [],
		newImages = [],
	} = submission.value;
	
	// Upserting the Project (Create or Update)
	const updatedProject = await prisma.project.upsert({
		select: { id: true, owner: { select: { username: true } } },
		where: { id: projectId },
		create: {
			id: projectId,
			ownerId: userId,
			title,
			description,
			status, 
			deadline,
			images: { create: newImages },
		},
		update: {
			title,
			description,
			status, // ✅ Fix: Ensure `status` is updated properly
			deadline,
			images: {
				deleteMany: {
					id: { notIn: imageUpdates.map((i) => i.id) },
				},								
				updateMany: imageUpdates.map((updates) => ({
					where: { id: updates.id },
					data: {
						altText: updates.altText,
						objectKey: updates.objectKey,
					},
				})),
				
				create: newImages,
			},
		},
	});

	return redirect(`/users/${updatedProject.owner!.username}/projects/${updatedProject.id}`);
}

