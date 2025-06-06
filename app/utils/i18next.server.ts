import { resolve } from 'node:path'
import { createCookie } from '@remix-run/node'
import Backend from 'i18next-http-backend'
import { RemixI18Next } from 'remix-i18next'
import {i18n} from '#app/utils/i18n' 

export const i18nCookie = createCookie('en_lang', {
	sameSite: 'lax',
	path: '/',
})

export const i18next = new RemixI18Next({
	detection: {
		supportedLanguages: i18n.supportedLngs,
		fallbackLanguage: i18n.fallbackLng,
		cookie: i18nCookie,
	},
	// This is the configuration for i18next used
	// when translating messages server-side only
	i18next: {
		...i18n,
		backend: {
			loadPath: resolve('./public/locales/{{lng}}/{{ns}}.json'),
		},
	},
	// The i18next plugins you want RemixI18next to use for `i18n.getFixedT` inside loaders and actions.
	// E.g. The Backend plugin for loading translations from the file system
	// Tip: You could pass `resources` to the `i18next` configuration and avoid a backend here
	plugins: [Backend],
})