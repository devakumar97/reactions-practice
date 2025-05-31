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
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { getCourseImgSrc, useIsPending } from '#app/utils/misc.tsx'
import { requireUserWithPermission } from '#app/utils/permissions.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { userHasPermission, useOptionalUser } from '#app/utils/user.ts'
import { type loader as courseLoader } from './courses'
import { getLanguage } from '#app/utils/language-server.ts'
import { useTranslation } from 'react-i18next'
import { getTranslatedLabel } from '#app/utils/translateLabel.ts'

export async function loader({ request, params }: LoaderFunctionArgs) {
	const lang = await getLanguage(request)

	const course = await prisma.course.findUnique({
		where: { id: params.courseId },
		select: {
			id: true,
			duration: true,
			ownerId: true,
			updatedAt: true,
			images: {
				select: {
					id: true,
					altText: true,
				},
			},
			translation: {
				where: {
					languageId: lang,
				  },
				select: {
					title: true,
					description: true,
					content: true,
					level: true,
					language: {
						select: { id: true },
					},
				},
			},
		},
	})

	invariantResponse(course, 'Course not found', { status: 404 })

	const date = new Date(course.updatedAt)
	const timeAgo = formatDistanceToNow(date)

	const translation = course.translation[0]

	return json({
		course: {
			...course,
			title: translation?.title || "No title available",
			description: translation?.description || "No description available",
			content: translation?.content || "No content available",
			level: translation?.level || "No level available",
			language: translation?.language?.id || "Unknown",
		},
		timeAgo,
	})
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
		select: { id: true, ownerId: true, owner: { select: { username: true } } },
		where: { id: courseId },
	})
	invariantResponse(course, 'Course not found', { status: 404 })

	const isOwner = course.ownerId === userId
	await requireUserWithPermission(
		request,
		isOwner ? `delete:course:own` : `delete:course:any`,
	)

	await prisma.course.delete({ where: { id: course.id } })

	// Redirecting After Deletion
	return redirectWithToast(`/users/${course.owner.username}/courses`, {
		type: 'success',
		title: 'Success',
		description: 'Your course has been deleted.',
	})
}

export default function CourseRoute() {
	const data = useLoaderData<typeof loader>()
	const user = useOptionalUser()
	console.log('user:', user)

	const isOwner = user?.id === data.course.ownerId
console.log('data.course.ownerId', data.course.ownerId)
	const {t} = useTranslation()

	const canDelete = userHasPermission(
			user,
			isOwner ? `delete:course:own` : `delete:course:any`, 
		)

	const displayBar = canDelete || isOwner
	const basePath = 'courseEditor.form'


	// const sectionRef = useRef<HTMLElement>(null)

	// useEffect(() => {
	// 	if (sectionRef.current) {
	// 		sectionRef.current.focus()
	// 	}
	// }, [data.course.id])
	// console.log(data.course.images);
	return (
		// <section
		// 	ref={sectionRef}
		// 	className="absolute inset-0 flex flex-col px-10"
		// 	aria-labelledby="course-title"
		// 	tabIndex={-1}
		// >
			<div className="absolute inset-0 flex flex-col px-10">
			<h2 id="course-title" className="mb-2 pt-12 text-h2 lg:mb-6">
				{data.course.title}
			</h2>
			<div className="flex gap-6">

			<p className="text-sm text-gray-500">{t(`${basePath}.language`)}: {getTranslatedLabel(basePath, 'languages', data.course.language, t)}</p>
			<p className="text-sm text-gray-500">{t(`${basePath}.language`)}: {getTranslatedLabel(basePath, 'levels', data.course.level, t)}</p>
			{data.course.duration && (
				<p className="text-sm text-gray-500">
					{t('coursePage.duration')}: {data.course.duration} {t('coursePage.minutes')}
				</p>
			)}
			</div>
			<div className={`${displayBar ? 'pb-24' : 'pb-12'} overflow-y-auto `}>
			<ul className="flex flex-wrap gap-5 py-5">
 			 {data.course.images.map((image) => (
   				 <li key={image.id}>
     			 <a href={getCourseImgSrc(image.id)} target="_blank" rel="noopener noreferrer">
      		  <img
				src={getCourseImgSrc(image.id)}
				alt={image.altText ?? ''}
				className="h-32 w-32 rounded-lg object-cover"
				width={512}
				height={512}
				/>
      			</a>
    		</li>
  			))}
		</ul>
		<div className="space-y-4">
			<div className="">
				<label className="block text-sm font-semibold text-muted-foreground mb-1">
      			{t('coursePage.description')}:
				</label>
			<p className="whitespace-break-spaces text-sm md:text-lg text-foreground">
				{data.course.description}
				</p>
				</div>
			</div>
		<div className="space-y-4">
			<div className="">
				<label className="block text-sm font-semibold text-muted-foreground mb-1">
      			{t('coursePage.content')}:
				</label>
			<p className="whitespace-break-spaces text-sm md:text-lg text-foreground">
				{data.course.content}
				</p>
				</div>
			</div>
			</div>
			
			{displayBar && (
				<div className={floatingToolbarClassName}>
					<span className="text-sm text-foreground/90 max-[524px]:hidden">
						<Icon name="clock" className="scale-125">
							{data.timeAgo} {t('ago')}
						</Icon>
					</span>
					<div className="grid flex-1 grid-cols-2 justify-end gap-2 min-[525px]:flex md:gap-4">
				
						{(canDelete) && <DeleteCourse id={data.course.id} />}
						<Button asChild>
							<Link to="edit">
								<Icon name="pencil-1" className="scale-125 max-md:scale-150">
									<span className="max-md:hidden">{t('coursePage.edit')}</span>
								</Icon>
							</Link>
						</Button>
					</div>
				</div>
			)}
			</div>
		// </section>
	)
}

export function DeleteCourse({ id }: { id: string }) {
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()
	const [form] = useForm({
		id: 'delete-course',
		lastResult: actionData?.result,
	})
	const {t} = useTranslation()

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
				className="w-full max-md:aspect-square max-md:px-0"
			>
				<Icon name="trash" className="scale-125 max-md:scale-150">
					<span className="max-md:hidden">{t('coursePage.delete')}</span>
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
