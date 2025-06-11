import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { type SEOHandle } from '@nasa-gcn/remix-seo'
import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type MetaFunction,
} from '@remix-run/node'
import { Form, Link, useActionData, useSearchParams } from '@remix-run/react'
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { CheckboxField, ErrorList, Field } from '#app/components/forms.tsx'
import { Spacer } from '#app/components/spacer.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { login, requireAnonymous } from '#app/utils/auth.server.ts'
import {
	ProviderConnectionForm,
	providerNames,
} from '#app/utils/connections.tsx'
import { checkHoneypot } from '#app/utils/honeypot.server.ts'
import { useIsPending } from '#app/utils/misc.tsx'
import { PasswordSchema, UsernameSchema } from '#app/utils/user-validation.ts'
import { handleNewSession } from './login.server.ts'
import { i18next } from '#app/utils/i18next.server.ts'
import { useTranslation } from "react-i18next"; 


export const handle: SEOHandle = {
	getSitemapEntries: () => null,
}

const LoginFormSchema = z.object({
	username: UsernameSchema,
	password: PasswordSchema,
	redirectTo: z.string().optional(),
	remember: z.boolean().optional(),
})

export async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	return json({})
}

export async function action({ request }: ActionFunctionArgs) {
	await requireAnonymous(request)
	const t = await i18next.getFixedT(request)
	const formData = await request.formData()
	checkHoneypot(formData)
	const submission = await parseWithZod(formData, {
		schema: (intent) =>
			LoginFormSchema.transform(async (data, ctx) => {
				if (intent !== null) return { ...data, session: null }

				const session = await login(data)
				if (!session) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: t('auth.invalidUsernameOrPassword'),
					})
					return z.NEVER
				}

				return { ...data, session }
			}),
		async: true,
	})

	if (submission.status !== 'success' || !submission.value.session) {
		return json(
			{ result: submission.reply({ hideFields: ['password'] }) },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { session, remember, redirectTo } = submission.value

	return handleNewSession({
		request,
		session,
		remember: remember ?? false,
		redirectTo,
	})
}

export default function LoginPage() {
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()
	const [searchParams] = useSearchParams()
	const redirectTo = searchParams.get('redirectTo')

	const [form, fields] = useForm({
		id: 'login-form',
		constraint: getZodConstraint(LoginFormSchema),
		defaultValue: { redirectTo },
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: LoginFormSchema })
		},
		shouldRevalidate: 'onBlur',
	})
		const { t } = useTranslation();

	return (
		<div className="flex min-h-full flex-col justify-center pb-32 pt-20">
			<div className="mx-auto w-full max-w-md">
				<div className="flex flex-col gap-3 text-center">
					<h1 className="text-h1">{t('login.welcome')}</h1>
					<p className="text-body-md text-muted-foreground">
						{t('login.enterDetails')}
					</p>
				</div>
				<Spacer size="xs" />

				<div>
					<div className="mx-auto w-full max-w-md px-8">
						<Form method="POST" {...getFormProps(form)}>
							<HoneypotInputs />
							<Field
								labelProps={{ children: t('login.username') }}
								inputProps={{
									...getInputProps(fields.username, { type: 'text' }),
									autoFocus: true,
									className: 'lowercase',
									autoComplete: 'username',
								}}
								errors={fields.username.errors}
							/>

							<Field
								labelProps={{ children: t('login.password') }}
								inputProps={{
									...getInputProps(fields.password, {
										type: 'password',
									}),
									autoComplete: 'current-password',
								}}
								errors={fields.password.errors}
							/>

							<div className="flex justify-between">
								<CheckboxField
									labelProps={{
										htmlFor: fields.remember.id,
										children: t('login.rememberMe'),
									}}
									buttonProps={getInputProps(fields.remember, {
										type: 'checkbox',
									})}
									errors={fields.remember.errors}
								/>
								<div>
									<Link
										to="/forgot-password"
										className="text-body-xs font-semibold"
									>
										{t('login.forgotPassword')}
									</Link>
								</div>
							</div>

							<input
								{...getInputProps(fields.redirectTo, { type: 'hidden' })}
							/>
							<ErrorList errors={form.errors} id={form.errorId} />

							<div className="flex items-center justify-between gap-6 pt-3">
								<StatusButton
									className="w-full"
									status={isPending ? 'pending' : (form.status ?? 'idle')}
									type="submit"
									disabled={isPending}
								>
									{t('login.loginButton')}
								</StatusButton>
							</div>
						</Form>
						<ul className="mt-5 flex flex-col gap-5 border-b-2 border-t-2 border-border py-3">
							{providerNames.map((providerName) => (
								<li key={providerName}>
									<ProviderConnectionForm
										type={t('root.login')}
										providerName={providerName}
										redirectTo={redirectTo}
									/>
								</li>
							))}
						</ul>
						<div className="flex items-center justify-center gap-2 pt-6">
							<span className="text-muted-foreground">{t('login.newHere')}</span>
							<Link
								to={
									redirectTo
										? `/signup?${encodeURIComponent(redirectTo)}`
										: '/signup'
								}
							>
								{t('login.createAccount')}
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export const meta: MetaFunction = () => {
	return [{ title: 'Login to D courses' }]
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
