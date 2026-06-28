# Cross-Platform Task Management System

A full-stack, offline-first task management application built with **React Native (Expo)**, **Express.js**, and **Supabase**.

The project demonstrates a production-oriented architecture featuring secure authentication, profile onboarding, task management, local offline persistence, automatic synchronization, and conflict resolution.

## Features

* Secure authentication using Supabase Auth
* User profile onboarding and management
* Create, update, delete, and restore tasks
* Offline-first architecture using SQLite
* Automatic background synchronization
* Queue-based offline operations
* Conflict resolution during synchronization
* Soft delete support
* Modular frontend and backend architecture

## Tech Stack

### Frontend

* React Native (Expo SDK 56)
* Expo Router
* SQLite
* Supabase Auth
* Axios
* Expo Secure Store
* React Native NetInfo

### Backend

* Node.js 24.13.0
* Express.js
* Supabase Postgres
* JOSE (JWT Verification)

### Tooling

* PNPM
* Biome

---

## Project Structure

```text
backend/
    Express REST API
    Controllers
    Services
    Middleware

frontend/
    React Native App
    Offline Layer
    Services
    Components
    Screens

Supabase/
    Authentication
    PostgreSQL Database
    Storage
```

---

## Architecture Highlights

* Local-first data layer powered by SQLite
* Queue-based offline synchronization
* Automatic sync when connectivity is restored
* JWT-based authentication with backend verification
* Separation of presentation, business logic, persistence, and synchronization layers
* Conflict resolution using timestamp-based reconciliation with delete priority

---

## Documentation

* **SETUP.md** — Local development setup and installation
* **ARCHITECTURE.md** — Complete system architecture and design decisions
* **API.md** — Backend API documentation

---

## Running the Project

Refer to **SETUP.md** for complete installation and configuration instructions.

---

## Author

**Amanjeet**

Email: **[amanjeet.k@gmail.com](mailto:amanjeet.k@gmail.com)**
