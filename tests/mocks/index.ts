import closeWithGrace from 'close-with-grace'
import { setupServer } from 'msw/node'
import { handlers as githubHandlers } from './github.ts'
import { handlers as resendHandlers } from './resend.ts'

export const server = setupServer(...resendHandlers, ...githubHandlers)

server.listen({
	onUnhandledRequest(request, print) {
		// Do not print warnings on unhandled requests to https://<:userId>.ingest.us.sentry.io/api/
		// Note: a request handler with passthrough is not suited with this type of url
		//       until there is a more permissible url catching system
		//       like requested at https://github.com/mswjs/msw/issues/1804
		const url = request.url

    // ✅ Ignore translation JSON file requests (i18next, etc.)
    if (url.includes('/locales/')) {
      return // Don't print any MSW warnings
    }

    // ✅ Ignore Sentry requests
    if (url.includes('.sentry.io')) {
      return
    }

    // Otherwise warn about unhandled requests
    print.warning()
  },
})

if (process.env.NODE_ENV !== 'test') {
	console.info('🔶 Mock server installed')

	closeWithGrace(() => {
		server.close()
	})
}
