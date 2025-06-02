// utils/language.server.ts
import { i18next } from './i18next.server.ts'

export async function getLanguage(request: Request): Promise<string> {
  return i18next.getLocale(request) ?? 'en'
}