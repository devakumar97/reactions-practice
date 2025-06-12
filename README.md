🧱 D Course

A full-stack CRUD web application built using the
[Epic Stack](https://github.com/epicweb-dev/epic-stack), enhanced with custom
features like course management, multilingual support, custom Themes, Socket
integration, Drizzle ORM migration, and more.

---

## 🚀 Features Overview

- ✅ Full CRUD for Course entity (with translations and media)
- 🧾 Generic Table + Modal Drawer UX
- 🌐 Multi-language support with translations & dynamic language dropdown
- 🎨 Custom Tailwind theme applied throughout
- 🔄 Prisma → Drizzle ORM migration (complete)
- 🔌 Socket integration for real-time interactivity

---

## 🛠️ Main Tech Stack

- **Frontend**: Remix, React, TailwindCSS
- **Backend**: Remix Loader & Actions, Socket.io
- **Database**: PostgreSQL with Drizzle ORM

---

## 🧑‍💻 Getting Started

> ⚠️ Prerequisites: Node.js ≥ 18, PostgreSQL installed locally.

### 1. **Clone the Repository**

```bash
git clone https://github.com/devakumar97/reactions-practice.git
cd reactions-practice
```

### 2. **Install Dependencies**

```bash
npm install
npm run build
```

### 3. **Set Environment Variables**

Create a `.env` file based on `.env.example` and fill in the required values:

```bash
cp .env.example .env
```

Key variables:

```
DATABASE_URL="postgres://<user>:<password>@localhost:5432/DBname"
```

### 4. **Set Up the Database**

```bash
# Create the database
createdb DBname
# or manually createdb locally in pgAdmin

# Generate Migrations
npx drizzle-kit generate

# Generate and run Drizzle migrations
npx drizzle-kit push

# Seed initial data
npm run seed
```

> You can inspect schema under `/drizzle/schema.ts` and seed logic under
> `/drizzle/seed.ts`.

### 5. **Start the Dev Server**

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to get started.

## 🔄 Prisma to Drizzle Migration Notes

- All models have been ported to Drizzle (`pgTable`, `customType`, etc.)
- Uses `drizzle-kit` for migrations.
- Prisma client and schema have been fully removed.
- Seed script was rewritten using native Drizzle insert/update queries.
- refer `mod/drizzle` branch

---

## 🧪 Running Tests

Coming soon (or replace with actual testing setup if you've added it):

```bash
npm test
```

---

## 💡 Dev Tips

- 🧪 Modify or add languages in `languages` table and see them reflected in the
  UI. refer `feat/internationalization` branch
- 🖼️ Add view, edit and delete course and course images via the modal drawer
  UI(). refer `feat/CRUD` branch
- 🧰 Use the generic table as a base for other entities like Projects, Users,
  etc. refer `feat/CRUD` branch
- 🎨 Modify or add custom Theme with custom color palette and see them reflected
  in the UI. refer `feat/custom-themes` branch

---