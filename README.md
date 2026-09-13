# GB Gym Platform

Multi-tenant gym management SaaS with separate Platform Owner, Gym Owner/Admin, Trainer and Member access.

## Project structure

- `frontend/` — React + Vite client
- `backend/` — Express + MongoDB API

## Local setup

### 1. Backend

Copy `backend/.env.example` to `backend/.env` and fill in your own values.

```bash
cd backend
npm install
npm run dev
```

### 2. Frontend

Copy `frontend/.env.example` to `frontend/.env` and set the API URL, normally:

```text
VITE_API_URL=http://localhost:5000/api
```

Then:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Authentication flows

- Platform Owner: `/login` → `/platform`
- Gym Owner/Admin: `/login` → `/admin`
- Trainer: `/trainer-login` → one-time email code → `/trainer`
- Member: gym link `/gym/<gym-code>` → `/login` or `/register` → `/dashboard`

Gym code is optional when an email belongs to only one tenant, but is required when the same email exists at multiple gyms.

## Important

Do not commit `.env` files, Paystack keys, SMTP passwords, JWT secrets or other credentials. Use the provided `.env.example` files as templates.
