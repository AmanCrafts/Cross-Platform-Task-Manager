# SETUP.md

# Project Setup Guide

This document explains how to run the project locally from scratch.

---

# Tech Stack

## Frontend

* Expo SDK 56
* React Native 0.85
* Expo Router
* SQLite (Offline Storage)
* Supabase Auth
* Axios
* Expo Secure Store
* Expo Crypto
* React Native NetInfo

## Backend

* Node.js 24.13.0
* Express.js
* Supabase
* JOSE (JWT Verification)
* Biome
* PNPM

---

# Requirements

Install the following before running the project.

* Node.js **24.13.0**
* PNPM **10.x**
* Expo Go (latest version)
* Git

Verify installation:

```bash
node -v
```

Expected:

```text
v24.13.0
```

Verify pnpm:

```bash
pnpm -v
```

---

# Clone Repository

```bash
git clone https://github.com/AmanCrafts/Cross-Platform-Task-Manager.git

cd Cross-Platform-Task-Manager
```

---

# Install Dependencies

The frontend and backend are separate projects.

## Backend

```bash
cd backend

pnpm install
```

## Frontend

```bash
cd ../frontend

pnpm install
```

---

# Environment Variables

## Backend

Create a `.env` file inside the `backend` directory.

```env
SUPABASE_URL=

SUPABASE_PUBLISHABLE_KEY=

SUPABASE_SECRET_KEY=

SUPABASE_JWKS_URL=
```

### Description

| Variable                   | Description                             |
| -------------------------- | --------------------------------------- |
| `SUPABASE_URL`             | Supabase Project URL                    |
| `SUPABASE_PUBLISHABLE_KEY` | Public anonymous key                    |
| `SUPABASE_SECRET_KEY`      | Service Role Key                        |
| `SUPABASE_JWKS_URL`        | JWKS endpoint used for JWT verification |

Example JWKS URL:

```text
https://<project-id>.supabase.co/auth/v1/.well-known/jwks.json
```

---

## Frontend

Create a `.env` file inside the `frontend` directory.

```env
EXPO_PUBLIC_SUPABASE_URL=

EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

EXPO_PUBLIC_API_URL=
```

### Description

| Variable                               | Description          |
| -------------------------------------- | -------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`             | Supabase Project URL |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public anonymous key |
| `EXPO_PUBLIC_API_URL`                  | Backend API URL      |

Examples:

Local Android Emulator

```text
http://10.0.2.2:3000
```

Local iOS Simulator

```text
http://localhost:3000
```

Physical Device

```text
http://<your-local-ip>:3000
```

Example:

```text
http://192.168.1.20:3000
```

---

# Supabase Setup

Create a new Supabase project.

Enable:

* Email Authentication

Disable:

* Email confirmations (for development purposes)

Create the required database schema.

Run the SQL scripts provided in this order:

1. Profiles Table
2. Profile Trigger
3. Storage Bucket
4. Tasks Table
5. Task Sync Logs Table
6. RLS Policies
7. Indexes

I have provided the SQL scripts in the 'DATABASE_SETUP.md' file.

*OPTIONAL: This feature is not required yet not implemetened in this assignment. It can be a good future enhancement.
After creating the database:

* Create the profile avatar storage bucket.
* Enable public read access if desired.
* Configure Row Level Security according to the SQL scripts.

---

# Backend Setup

Navigate to:

```bash
cd backend
```

Start the development server:

```bash
pnpm dev
```

Expected:

```text
Server running on port 3000
```

Health endpoint:

```
GET /health
```

---

# Frontend Setup

Navigate to:

```bash
cd frontend
```

Start Expo:

```bash
pnpm start
```

or

```bash
pnpm android
```

or

```bash
pnpm ios
```

---

# Running the Project

The backend must be running before starting the frontend.

Terminal 1

```bash
cd backend

pnpm dev
```

Terminal 2

```bash
cd frontend

pnpm start
```

Scan the QR code using Expo Go or launch an emulator.

---

# Available Scripts

## Backend

Run development server

```bash
pnpm dev
```

Format code

```bash
pnpm format
```

Automatically format

```bash
pnpm format:fix
```

Lint

```bash
pnpm lint
```

Automatically fix lint issues

```bash
pnpm lint:fix
```

Run complete Biome checks

```bash
pnpm check
```

Automatically fix all Biome issues

```bash
pnpm check:fix
```

---

## Frontend

Start Expo

```bash
pnpm start
```

Android

```bash
pnpm android
```

iOS

```bash
pnpm ios
```

Web

```bash
pnpm web
```

Format

```bash
pnpm format
```

Auto Format

```bash
pnpm format:fix
```

Lint

```bash
pnpm lint
```

Auto Fix Lint

```bash
pnpm lint:fix
```

Run Complete Checks

```bash
pnpm check
```

Auto Fix Checks

```bash
pnpm check:fix
```

---

# Offline Database

The application uses SQLite for offline persistence.

The local database is created automatically on the first application launch.

It stores:

* Tasks
* Pending Operations
* Sync Metadata

No manual setup is required.

---

# Authentication Flow

Authentication is handled entirely by Supabase Auth.

The backend never stores passwords.

The flow is:

```text
User
   │
   ▼
Supabase Auth
   │
   ▼
JWT
   │
   ▼
React Native
   │
   ▼
Express Backend
   │
   ▼
Supabase Database
```

---

# Sync Flow

The application is offline-first.

Every mutation follows this lifecycle:

```text
User Action

↓

SQLite

↓

Queue Operation

↓

Internet Available?

      │

      ├── No
      │      Wait
      │
      └── Yes
              │
              ▼
       Push to Backend

              ▼

      Pull Remote Changes

              ▼

      Merge into SQLite
```

---

# Project Structure

```
backend/
    Express API

frontend/
    Expo React Native App

Supabase/
    Auth
    Postgres
    Storage
```

---

# Troubleshooting

## Backend cannot connect to Supabase

Verify:

* `SUPABASE_URL`
* `SUPABASE_SECRET_KEY`

---

## JWT Verification Fails

Verify:

```
SUPABASE_JWKS_URL
```

matches your Supabase project.

---

## Frontend cannot reach backend

Verify:

```
EXPO_PUBLIC_API_URL
```

If using a physical device, **do not use localhost**.

Use your machine's local IP instead.

---

## Expo cannot connect

* Ensure the backend is running.
* Ensure both devices are on the same network.
* Restart Expo if environment variables change.

---

## SQLite Issues

The local database is created automatically.

If you need a clean state during development:

* Clear the application storage.
* Reinstall the app.
* Or use the provided SQLite cleanup utility.

---

# Notes

* Node.js **24.13.0** is required.
* PNPM is the package manager.
* Biome is used for formatting and linting.
* Expo SDK **56** is required.
* Expo Go should be updated to the latest version.
* The backend must be running before launching the frontend.
* Both frontend and backend should point to the same Supabase project.

---

# Development Workflow

1. Start the backend.
2. Start the frontend.
3. Authenticate with Supabase.
4. Complete profile onboarding.
5. Create and manage tasks.
6. Test offline mode by disabling the network.
7. Re-enable the network and observe automatic synchronization.
