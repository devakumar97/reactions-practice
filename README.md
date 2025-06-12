## 🌍 Feature: Internationalization (i18n) Support (`feat/internationalization`)

### ✅ Summary

Integrated full internationalization using `i18next`, allowing the app’s static
content to be dynamically translated into multiple languages. This sets the
foundation for global user accessibility.

---

### 🌐 Languages Supported

- **English (en)**
- **Spanish (es)**
- **French (fr)** _(Easily extendable to more languages by adding new JSON files
  under `public/locales/`)_

---

### 🔧 Changes Made

- **Language Switcher UI:**

  - File: `/app/components/search-bar.tsx` (or in the navbar component)
  - Dropdown with list of languages (e.g., English(en), Spanish(es), French(fr))
  - Updates current language using URL-based routing (e.g.,
    `/settings/change-language.$lang.tsx`)

- **Translation Utilities:**

  - `/app/utils/i18n.ts`: Client-side i18next configuration
  - `/app/utils/i18next.server.ts`: Server-side support for i18n (for SSR)

- **Route for Changing Language:**

  - `/app/routes/settings+/change-language.$lang.tsx`: Updates the language
    cookie and redirects

- **Translation Files:**

  - `public/locales/en/common.json`
  - `public/locales/es/common.json`
  - `public/locales/fr/common.json`

  Each file contains static key-value pairs for translatable text.

---

### 🧠 Why This Matters

- Makes the application **accessible to non-English speakers**
- Allows for **regional customization** in the future (date formats, messages)
- Enhances **user experience and engagement**

---

### 🧪 How to Test

1. Visit the navbar and open the language dropdown.
2. Select a language (e.g., Español).
3. Confirm that static UI content (like login labels, headers) switches to the
   selected language.
4. Refresh or revisit the page – language preference should persist.
5. Check URL/route and confirm cookie or session is updated accordingly.

---

### ⚠️ Notes

- Dynamic content (e.g., fetched from DB) needs additional translation logic if
  multilingual support is required.
- Make sure language files have consistent keys across translations.

---
### Reference

https://github.com/rperon/epic-stack-with-i18n/