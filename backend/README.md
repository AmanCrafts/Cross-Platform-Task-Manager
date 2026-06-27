# Task System Assignment Progress

## What I decided to build

I chose **Phase 1 (Mobile + Backend)** and **Phase 2 (Offline Support)** for the assignment. I intentionally skipped Phase 3 because I want to go deeper on the parts that matter most: a solid task system, proper backend structure, offline reliability, and clean sync behavior.

I also decided to build the project as an **overkill but practical production-style app**, so the final result feels more like a real product than a simple demo.

## My architecture decision

I chose this flow:

```text
React Native App  ->  Supabase Auth  ->  JWT Access Token  ->  Express Backend  ->  Supabase Database
```

That means:

* I use **Supabase Auth** for login and signup.
* I use **Express** for all task-related business logic.
* I use **Supabase Postgres** as the database.
* The frontend does **not** talk directly to the database for CRUD.

This gives me clean separation of responsibilities and makes the backend meaningful in the project.

## What I decided about authentication

I decided to use **Supabase Auth** instead of creating my own auth system.

This makes sense because:

* it supports email/password login,
* it can also support Google OAuth later,
* it gives me JWT access tokens,
* and it works well with a backend that verifies the token on every request.

I also decided that the backend should **not** trust any `user_id` sent from the frontend. Instead, the backend should read the authenticated user from the verified JWT and use that user id internally.

## Database structure I planned

I decided to keep two main user-related tables:

### 1. `auth.users`

This is managed by Supabase and stores authentication identity.

### 2. `public.profiles`

I created a `profiles` table for app-specific user data.

My `profiles` table is designed like this:

```sql
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text unique,
    full_name text,
    avatar_url text,
    bio text,
    timezone text,
    locale text default 'en',
    theme text default 'system',
    onboarding_completed boolean not null default false,
    is_active boolean not null default true,
    last_seen_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

I chose this structure because I wanted the user profile to feel like a real product profile, not just a basic name-and-avatar table.

## Automatic profile creation

I added a trigger so that whenever a new user is created in Supabase Auth, a matching profile row is created automatically in `public.profiles`.

That means the flow is:

```text
auth.users  ->  trigger  ->  profiles
```

This keeps the database consistent and avoids manual profile creation in the app.

## My tasks table design

I decided to make the tasks table much richer than a basic CRUD table so it can support offline sync, future scheduling, and a more polished task experience.

My tasks table includes:

* `id`
* `user_id`
* `title`
* `description`
* `status`
* `priority`
* `due_at`
* `reminder_at`
* `completed_at`
* `sort_order`
* `is_pinned`
* `is_recurring`
* `recurrence_rule`
* `metadata`
* `sync_version`
* `last_synced_at`
* `last_modified_by`
* `deleted_at`
* `archived_at`
* `created_at`
* `updated_at`

I used enums for `status` and `priority` so the data stays consistent.

My main goals for this table were:

* support user-specific tasks,
* support offline sync,
* support soft delete,
* support future reminders and recurring tasks,
* and make the schema look professional.

## Row-level security

I enabled **RLS** on both `profiles` and `tasks`.

I added policies so that each user can only access their own data.

For tasks, I set the rules so that users can:

* read only their own tasks,
* insert only their own tasks,
* update only their own tasks,
* and delete only their own tasks.

This makes the database secure even if something goes wrong in the backend.

## My backend setup

I decided to build the backend using:

* Node.js
* Express
* Supabase SDK
* dotenv
* cors
* helmet
* morgan

I also decided to keep the backend in plain JavaScript instead of TypeScript.

My backend structure is planned like this:

```text
backend/
  src/
    config/
    middlewares/
    routes/
    services/
    controllers/
    utils/
    app.js
    server.js
```

I chose this structure because it is simple, clean, and easy to explain in an interview.

## My Supabase client setup

I separated the Supabase clients by purpose.

### Database client

I use the secret key only on the backend for database operations.

### Auth client

I use the publishable key for authentication-related validation.

I also understood that:

* `persistSession: false` and `autoRefreshToken: false` make sense on the backend,
* because the backend is stateless and does not store user sessions.

## How frontend login works

I decided that the React Native app should log in directly with Supabase Auth.

That means the frontend does:

* sign up with Supabase Auth,
* sign in with Supabase Auth,
* receive a JWT access token,
* store the session securely,
* and send the token in the `Authorization: Bearer <JWT>` header on every backend request.

## How the backend verifies the user

I decided that every protected backend route should verify the JWT first.

The middleware flow is:

1. read the `Authorization` header,
2. extract the token,
3. verify the token,
4. attach the user to `req.user`,
5. continue to the controller.

After that, every controller uses `req.user.id` instead of trusting request body values.

## Google OAuth compatibility

I also confirmed that this setup will still work if I add **Google OAuth** later.

That is because the backend only cares about the JWT issued by Supabase Auth, not the login method itself.

So whether the user signs in with:

* email and password, or
* Google OAuth,

the rest of the architecture stays the same.

## My offline support direction

For Phase 2, I decided to build offline support using a local-first approach.

My plan is:

* store tasks locally,
* queue local mutations when offline,
* replay the queue when internet returns,
* and resolve conflicts using a simple last-write-wins strategy.

I also planned to keep enough sync-related columns in the tasks table, like:

* `updated_at`,
* `deleted_at`,
* `sync_version`,
* and `last_synced_at`,

so offline sync can be implemented cleanly later without redesigning the database.

## Why I kept the design this way

I wanted the app to feel like a real cross-platform product, not just a demo task list.

So I intentionally chose:

* Supabase Auth instead of custom auth,
* a rich profile model instead of a minimal one,
* a task table with sync and scheduling support,
* backend-only CRUD access,
* and an architecture that can grow into a production system.

## Current direction

At this point, I have:

* chosen the phases,
* chosen the architecture,
* designed the auth flow,
* designed the profile model,
* designed the tasks model,
* and set the backend direction.

Next, I will start implementing the backend endpoints, then connect the mobile app, and then add offline sync on top of that.
