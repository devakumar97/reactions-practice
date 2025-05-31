import { TFunction } from 'i18next'

/**
 * Generates i18n key dynamically based on basePath, type, and value.
 * Example: basePath='courseEditor.form', type='languages', value='en'
 * Resulting key = 'courseEditor.form.languages.en'
 */

export const getTranslatedLabel = (
  basePath: string,
  type: string,
  value: string,
  t: TFunction
) => {
  const key = `${basePath}.${type}.${value.toLowerCase()}`
  return t(key, { defaultValue: value }) // fallback to raw value if key not found
}