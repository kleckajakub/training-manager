# Training Manager

Web application for managing football training plans. Single-user (coach only), no multi-user functionality.

## Stack

- **Frontend:** React + Vite + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **Backend/DB:** Supabase (Postgres + Storage for images)
- **Hosting:** Vercel (free tier)

## Features

1. Create training (name, description, exercises)
2. Edit training
3. Duplicate training
4. Delete training
5. Each training can have:
   - a photo (uploaded to Supabase Storage)
   - a YouTube video link (with in-app playback)
6. Training list showing name and description

## Project Structure

```
src/
  components/       # Reusable UI components
  pages/            # Application pages
  lib/
    supabase.ts     # Supabase client
  types/            # TypeScript types
```

## Database Schema (Supabase)

```sql
trainings (
  id uuid primary key,
  name text not null,
  description text,
  image_url text,         -- URL from Supabase Storage
  youtube_url text,       -- YouTube video link
  created_at timestamptz,
  updated_at timestamptz
)
```

## Commands

```bash
npm run dev       # local development
npm run build     # production build
npm run preview   # preview build
```

## Conventions

- Components named PascalCase (e.g. `TrainingCard.tsx`)
- All Supabase calls go through `src/lib/supabase.ts`
- All types defined in `src/types/`
- Prefer shadcn/ui components over custom ones
- Mobile-first design
