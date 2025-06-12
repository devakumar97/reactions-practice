## ✨ Feature: Custom Themes Support (`feat/custom-themes`)

### Summary

Added support for **three new custom themes** (in addition to system, light, and
dark modes), allowing users to personalize the UI experience. This feature
enhances accessibility and visual identity for diverse user preferences.

---

### 🔧 Changes Made

- **Added new themes**:

  - `ghost`, `waves`, and `palette`

- **File additions:**

  - `/app/routes/resources+/theme-switch.tsx`: UI for switching themes via a
    dropdown or toggle.
  - `/app/utils/theme.server.ts`: Handles theme persistence on the server using
    cookies or session.
  - `/app/styles/tailwind.css`: Includes custom theme Tailwind classes.
  - `/other/svg-icons/*.svg`: Theme-specific icons used for visual previews in
    the UI.

- **Theme Persistence**: Stored user preference (e.g., `en_theme=ghost`) in a
  cookie or session using `theme.server.ts`.

---

### 🧠 Why This Matters

- Improves **user experience** by giving them visual control.
- Supports **branding or seasonal themes** in future.
- Keeps the system scalable for more themes by organizing assets and logic
  cleanly.

---

### 🧪 How to Test

1. Navigate to the app where the theme switcher is rendered.
2. Click the theme toggle (or dropdown).
3. Switch between themes (`light`, `dark`, `system`, `ghost`, `waves`,
   `palette`).
4. Confirm that:

   - Theme applies immediately.
   - It persists on reload (cookie/session is working).
   - Icons change according to the theme.

---

### ⚠️ Known Issues / Notes

- If using SSR, ensure cookies are passed correctly for the initial load.
- Tailwind config might need to be extended if using complex theme rules.

---
