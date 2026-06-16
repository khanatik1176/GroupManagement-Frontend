# Group Management Frontend

Next.js frontend for the Group Management application.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- TanStack Query
- Framer Motion
- React Context API (Auth)

## Features

- **Role-based access**: Admin, Permanent Member, Temporary Member
- **User management** (admin only): add, edit, delete, enable/disable users
- **Profile page**: update personal details and birthday
- **Group chat**: text-only messaging with live refresh
- **Food management**: posts and polls for food outings
- **Expense management**: shared costs with automatic per-person splits, grouped by date
- **Treat management**: treat records + birthday banners in the treat panel

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

App runs at `http://localhost:3000`.

## Demo Logins

| Role     | Username | Password   |
| -------- | -------- | ---------- |
| Admin    | admin    | admin123   |
| Member   | alice    | member123  |

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/     # Protected app pages
│   └── login/           # Auth page
├── components/          # UI + layout components
├── context/             # Auth context
├── lib/                 # API client + utilities
└── types/               # Shared TypeScript types
```
