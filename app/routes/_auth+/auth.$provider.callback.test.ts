import { invariant } from '@epic-web/invariant'
import { faker } from '@faker-js/faker'
import { http } from 'msw'
import { afterEach, expect, test } from 'vitest'
import { twoFAVerificationType } from '#app/routes/settings+/profile.two-factor.tsx'
import { getSessionExpirationDate, sessionKey } from '#app/utils/auth.server.ts'
import { connectionSessionStorage } from '#app/utils/connections.server.ts'
import { GITHUB_PROVIDER_NAME } from '#app/utils/connections.tsx'
import { drizzle } from '#app/utils/db.server.ts'
import { authSessionStorage } from '#app/utils/session.server.ts'
import { generateTOTP } from '#app/utils/totp.server.ts'
import { createUser } from '#tests/db-utils.ts'
import { insertGitHubUser, deleteGitHubUsers } from '#tests/mocks/github.ts'
import { server } from '#tests/mocks/index.ts'
import { consoleError } from '#tests/setup/setup-test-env.ts'
import { BASE_URL, convertSetCookieToCookie } from '#tests/utils.ts'
import { loader } from './auth.$provider.callback.ts'
import { Connection, Session, User, Verification } from '../../../drizzle/schema.ts'
import { and, eq } from 'drizzle-orm'

const ROUTE_PATH = '/auth/github/callback'
const PARAMS = { provider: 'github' }

afterEach(async () => {
	await deleteGitHubUsers()
})

test('a new user goes to onboarding', async () => {
	const request = await setupRequest()
	const response = await loader({ request, params: PARAMS, context: {} }).catch(
		(e) => e,
	)
	expect(response).toHaveRedirect('/onboarding/github')
})

test('when auth fails, send the user to login with a toast', async () => {
	consoleError.mockImplementation(() => {})
	server.use(
		http.post('https://github.com/login/oauth/access_token', async () => {
			return new Response('error', { status: 400 })
		}),
	)
	const request = await setupRequest()
	const response = await loader({ request, params: PARAMS, context: {} }).catch(
		(e) => e,
	)
	invariant(response instanceof Response, 'response should be a Response')
	expect(response).toHaveRedirect('/login')
	await expect(response).toSendToast(
		expect.objectContaining({
			title: 'Auth Failed',
			type: 'error',
		}),
	)
	expect(consoleError).toHaveBeenCalledTimes(1)
})

test('when a user is logged in, it creates the connection', async () => {
	const githubUser = await insertGitHubUser()
	const session = await setupUser()
	const request = await setupRequest({
		sessionId: session.id,
		code: githubUser.code,
	})
	const response = await loader({ request, params: PARAMS, context: {} })
	expect(response).toHaveRedirect('/settings/profile/connections')
	await expect(response).toSendToast(
		expect.objectContaining({
			title: 'Connected',
			type: 'success',
			description: expect.stringContaining(githubUser.profile.login),
		}),
	)
	const connection = await drizzle.query.Connection.findFirst({
		columns: { id: true },
		where: and(
			eq(Connection.userId, session.userId),
			eq(Connection.providerId, githubUser.profile.id.toString()),
		),
	})
	expect(
		connection,
		'the connection was not created in the database',
	).toBeTruthy()
})

test(`when a user is logged in and has already connected, it doesn't do anything and just redirects the user back to the connections page`, async () => {
	const session = await setupUser()
	const githubUser = await insertGitHubUser()
	await drizzle.insert(Connection).values({
		providerName: GITHUB_PROVIDER_NAME,
		userId: session.userId,
		providerId: githubUser.profile.id.toString(),
	})
	const request = await setupRequest({
		sessionId: session.id,
		code: githubUser.code,
	})
	const response = await loader({ request, params: PARAMS, context: {} })
	expect(response).toHaveRedirect('/settings/profile/connections')
	await expect(response).toSendToast(
		expect.objectContaining({
			title: 'Already Connected',
			description: expect.stringContaining(githubUser.profile.login),
		}),
	)
})

test('when a user exists with the same email, create connection and make session', async () => {
	const githubUser = await insertGitHubUser()
	const email = githubUser.primaryEmail.toLowerCase()
	const { userId } = await setupUser({ ...createUser(), email })
	const request = await setupRequest({ code: githubUser.code })
	const response = await loader({ request, params: PARAMS, context: {} })

	expect(response).toHaveRedirect('/')

	await expect(response).toSendToast(
		expect.objectContaining({
			type: 'message',
			description: expect.stringContaining(githubUser.profile.login),
		}),
	)

	const connection = await drizzle.query.Connection.findFirst({
		columns: { id: true },
		where: and(
			eq(Connection.userId, userId),
			eq(Connection.providerId, githubUser.profile.id.toString()),
		),
	})
	expect(
		connection,
		'the connection was not created in the database',
	).toBeTruthy()

	await expect(response).toHaveSessionForUser(userId)
})

test('gives an error if the account is already connected to another user', async () => {
	const githubUser = await insertGitHubUser()
	const [user] = await drizzle.insert(User).values(createUser()).returning()
	invariant(user, 'failed to insert user')
	await drizzle.insert(Connection).values({
		providerName: GITHUB_PROVIDER_NAME,
		userId: user.id,
		providerId: githubUser.profile.id.toString(),
	})
	const session = await setupUser()
	const request = await setupRequest({
		sessionId: session.id,
		code: githubUser.code,
	})
	const response = await loader({ request, params: PARAMS, context: {} })
	expect(response).toHaveRedirect('/settings/profile/connections')
	await expect(response).toSendToast(
		expect.objectContaining({
			title: 'Already Connected',
			description: expect.stringContaining(
				'already connected to another account',
			),
		}),
	)
})

test('if a user is not logged in, but the connection exists, make a session', async () => {
	const githubUser = await insertGitHubUser()
	const { userId } = await setupUser()
	await drizzle.insert(Connection).values({
		providerName: GITHUB_PROVIDER_NAME,
		providerId: githubUser.profile.id.toString(),
		userId,
	})
	const request = await setupRequest({ code: githubUser.code })
	const response = await loader({ request, params: PARAMS, context: {} })
	expect(response).toHaveRedirect('/')
	await expect(response).toHaveSessionForUser(userId)
})

test('if a user is not logged in, but the connection exists and they have enabled 2FA, send them to verify their 2FA and do not make a session', async () => {
	const githubUser = await insertGitHubUser()
	const { userId } = await setupUser()
	await drizzle.insert(Connection).values({
		providerName: GITHUB_PROVIDER_NAME,
		providerId: githubUser.profile.id.toString(),
		userId,
	})
	const { otp: _otp, ...config } = await generateTOTP()
	await drizzle.insert(Verification).values({
		type: twoFAVerificationType,
		target: userId,
		...config,
	})
	const request = await setupRequest({ code: githubUser.code })
	const response = await loader({ request, params: PARAMS, context: {} })
	const searchParams = new URLSearchParams({
		type: twoFAVerificationType,
		target: userId,
		redirectTo: '/',
	})
	expect(response).toHaveRedirect(`/verify?${searchParams}`)
})

async function setupRequest({
	sessionId,
	code = faker.string.uuid(),
}: { sessionId?: string; code?: string } = {}) {
	const url = new URL(ROUTE_PATH, BASE_URL)
	const state = faker.string.uuid()
	url.searchParams.set('state', state)
	url.searchParams.set('code', code)
	const connectionSession = await connectionSessionStorage.getSession()
	connectionSession.set('oauth2:state', state)
	const authSession = await authSessionStorage.getSession()
	if (sessionId) authSession.set(sessionKey, sessionId)
	const setSessionCookieHeader =
		await authSessionStorage.commitSession(authSession)
	const setConnectionSessionCookieHeader =
		await connectionSessionStorage.commitSession(connectionSession)
	const request = new Request(url.toString(), {
		method: 'GET',
		headers: {
			cookie: [
				convertSetCookieToCookie(setConnectionSessionCookieHeader),
				convertSetCookieToCookie(setSessionCookieHeader),
			].join('; '),
		},
	})
	return request
}

async function setupUser(userData = createUser()) {
	const [user] = await drizzle.insert(User).values(userData).returning()
	invariant(user, 'failed to insert user')
	const [session] = await drizzle
		.insert(Session)
		.values({
			expirationDate: getSessionExpirationDate(),
			userId: user.id,
		})
		.returning({
			id: Session.id,
			userId: Session.userId,
		})
	invariant(session, 'failed to insert session')

	return session
}
