import { getFormProps, useForm } from '@conform-to/react' 
import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import {
	json,
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
} from '@remix-run/node'
import {
	Form,
	Link,
	useActionData,
	useLoaderData,
	type MetaFunction,
} from '@remix-run/react'
import { formatDistanceToNow } from 'date-fns'
import { z } from 'zod'
import { floatingToolbarClassName } from '#app/components/floating-toolbar.tsx'
import { ErrorList } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { getCourseImgSrc, useIsPending } from '#app/utils/misc.tsx'
import { requireUserWithPermission } from '#app/utils/permissions.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { userHasPermission, useOptionalUser } from '#app/utils/user.ts'
import { type loader as courseLoader } from './courses'
import { requireUserId } from '#app/utils/auth.server.ts'
import { useEffect, useRef } from 'react'
import { DeleteNote } from './notes.$noteId'

export async function loader({ params }: LoaderFunctionArgs) {
	const course = await prisma.course.findUnique({
		where: { id: params.courseId },
		select: {
			id: true,
			title: true,
			description: true,
			level: true,
			duration: true,
			userId: true,
			updatedAt: true,
			images: {
				select: {
					altText: true,
					objectKey: true,
				},
			},
		},
	})

	invariantResponse(course, 'Course not found', { status: 404 })

	const date = new Date(course.updatedAt)
	const timeAgo = formatDistanceToNow(date)

	return { course, timeAgo }
}

const DeleteFormSchema = z.object({
	intent: z.literal('delete-course'),
	courseId: z.string(),
})

// Processing the Deletion Request
export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema: DeleteFormSchema })

	if (submission.status !== 'success') {
		return json(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { courseId } = submission.value

	const course = await prisma.course.findFirst({
		select: { id: true, userId: true, user: { select: { username: true } } },
		where: { id: courseId },
	})
	invariantResponse(course, 'Course not found', { status: 404 })

	const isOwner = course.userId === userId
	await requireUserWithPermission(
		request,
		isOwner ? `delete:note:own` : `delete:note:any`,
	)

	await prisma.course.delete({ where: { id: course.id } })

	await prisma.course.delete({ where: { id: course.id } })
	// Redirecting After Deletion
	return redirectWithToast(`/users/${course.user?.username ?? "unknown"}/courses`, {
		type: 'success',
		title: 'Success',
		description: 'Your course has been deleted.',
	})
}

export default function CourseRoute() {
	const data = useLoaderData<typeof loader>()
	const user = useOptionalUser()
	const isOwner = user?.id === data.course.userId
	const canDelete = userHasPermission(
			user,
			isOwner ? `delete:note:own` : `delete:note:any`,
		)
	const displayBar = canDelete || isOwner

	const sectionRef = useRef<HTMLElement>(null)

	useEffect(() => {
		if (sectionRef.current) {
			sectionRef.current.focus()
		}
	}, [data.course.id])
	console.log(data.course.images);

	return (
		<section
			ref={sectionRef}
			className="absolute inset-0 flex flex-col px-10"
			aria-labelledby="course-title"
			tabIndex={-1}
		>
			<h2 id="course-title" className="mb-2 pt-12 text-h2 lg:mb-6">
				{data.course.title}
			</h2>
			<div className="flex gap-6">

			<p className="text-sm text-gray-500">level: {data.course.level}</p>
			{data.course.duration && (
				<p className="text-sm text-gray-500">
					duration: {data.course.duration}
				</p>
			)}
			</div>
			<div className={`${displayBar ? 'pb-24' : 'pb-12'} overflow-y-auto `}>
			<ul className="flex flex-wrap gap-5 py-5">
 			 {data.course.images.map((image) => (
   				 <li key={image.objectKey}>
     			 <a href={getCourseImgSrc(image.objectKey)} target="_blank" rel="noopener noreferrer">
      		  <img
				src={getCourseImgSrc(image.objectKey)}
				alt={image.altText ?? ''}
				className="h-32 w-32 rounded-lg object-cover"
				width={512}
				height={512}
				/>
      			</a>
    		</li>
  			))}
		</ul>
			<p className="whitespace-break-spaces text-sm md:text-lg">
				{data.course.description}
				</p>
			</div>
			
			{displayBar && (
				<div className={floatingToolbarClassName}>
					<span className="text-sm text-foreground/90 max-[524px]:hidden">
						<Icon name="clock" className="scale-125">
							{data.timeAgo} ago
						</Icon>
					</span>
					<div className="grid flex-1 grid-cols-2 justify-end gap-2 min-[525px]:flex md:gap-4">
						{canDelete ? <DeleteNote id={data.course.id} /> : null}
						<Button asChild>
							<Link to="edit">
								<Icon name="pencil-1" className="scale-125 max-md:scale-150">
									<span className="max-md:hidden">Edit</span>
								</Icon>
							</Link>
						</Button>
					</div>
				</div>
			)}
		</section>
	)
}

export function DeleteCourse({
	id,
}: {
	id: string
}) {
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()
	const [form] = useForm({ id: 'delete-course', lastResult: actionData?.result })
	// Rendering the Delete Button
	return (
		<Form method="POST" {...getFormProps(form)}>
			<input type="hidden" name="courseId" value={id} />
			<StatusButton
				type="submit"
				name="intent"
				value="delete-course"
				variant="destructive"
				status={isPending ? 'pending' : (form.status ?? 'idle')}
				disabled={isPending}
			>
				<Icon name="trash" className="scale-125 max-md:scale-150">
					<span className="max-md:hidden">Delete</span>
				</Icon>
			</StatusButton>
			<ErrorList errors={form.errors} id={form.errorId} />
		</Form>
	)
}

export const meta: MetaFunction<typeof loader,
	{ 'routes/users+/$username_+/course': typeof courseLoader }
> = ({ data, params, matches }) => {
	const coursesMatch = matches.find(
		(m) => m.id === 'routes/users+/$username_+/course',
	)

	const displayName = coursesMatch?.data?.owner?.name ?? params.username
	const courseTitle = data?.course?.title ?? 'Course'

	return [
		{ title: `${courseTitle} | ${displayName}'s Courses | Course` },
		{ name: 'description', content: data?.course?.description ?? 'No description available' },
	]
}
