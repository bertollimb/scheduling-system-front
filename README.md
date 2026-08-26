# Scheduling System — Frontend

The web interface for [scheduling-system](https://github.com/bertollimb/scheduling-system), a backend API for managing appointments at a single-professional hair salon. Built as the client the salon owner actually uses day to day — login, agenda, clients, services, and creating/completing appointments — consuming the real API, not a mock.

**Live app:** https://scheduling-system-front.vercel.app

## Table of contents

- [About](#about)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Key design decisions](#key-design-decisions)
- [Getting started](#getting-started)
- [Deployment](#deployment)
- [Known limitations](#known-limitations)

---

## About

This is a single-page app for one user (the salon owner) to run her daily scheduling: log in, see the day's agenda, manage clients and services, create new appointments, and complete evaluations for services that require one before a procedure can be booked. It talks directly to the [scheduling-system](https://github.com/bertollimb/scheduling-system) API over HTTP — no mock data, no local database.

---

## Tech stack

- **React 19** / **Vite**
- **React Router** — client-side routing, protected routes
- **Axios** — HTTP client, with a request interceptor for auth and a response interceptor for 401 handling
- **Tailwind CSS v4**
- **react-day-picker** + **date-fns** — custom date picker (see [Key design decisions](#key-design-decisions) for why)
- **ESLint**

---

## Architecture

```
src/
├── api/
│   ├── client.js         # shared axios instance, auth token interceptor, 401 handling
│   ├── auth.js            # login (form-urlencoded), refresh token
│   ├── clients.js         # client CRUD
│   ├── services.js        # service CRUD
│   └── schedulings.js     # create, list, complete-evaluation, cancel
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx         # navigation + logout
│   │   ├── Layout.jsx          # Sidebar + <Outlet /> for authenticated pages
│   │   └── ProtectedRoute.jsx  # redirects to /login when not authenticated
│   └── ui/
│       └── DatePicker.jsx      # custom date picker (see below)
├── context/
│   └── AuthContext.jsx    # isAuthenticated, login(), logout(), token persistence
├── pages/
│   ├── LoginPage.jsx
│   ├── SchedulePage.jsx        # daily agenda, date filter, cancel, complete evaluation
│   ├── ClientsPage.jsx         # client CRUD
│   ├── ServicesPage.jsx        # service CRUD
│   └── NewSchedulingPage.jsx   # create evaluation/procedure, link evaluations
├── App.jsx                # routes
└── main.jsx                # entry point, wraps App in AuthProvider
```

---

## Key design decisions

- **Custom date/time picker instead of native `<input type="date">` / `datetime-local`**: the display format of native date inputs (MM/DD/YYYY vs DD/MM/YYYY, 12h vs 24h) is dictated entirely by the user's browser/OS locale settings — there's no HTML attribute that overrides it (confirmed against the W3C spec discussion; the `lang` attribute does not affect it, despite documentation elsewhere suggesting otherwise). Since the salon owner needed a consistent DD/MM/YYYY, 24-hour format regardless of her browser configuration, `DatePicker.jsx` was built with `react-day-picker` + `date-fns` instead, giving full control over formatting and enabling highlighted "busy" days on the calendar.
- **Token-based auth via `localStorage`**, read once on `AuthProvider` mount (lazy initial state) so a page refresh doesn't force a re-login. Axios attaches the token to every request via an interceptor; a 401 response clears the tokens and redirects to `/login`.
- **Single `ProtectedRoute` wrapping a shared `Layout`** (nested React Router routes), rather than wrapping each page individually — the Sidebar and auth check live in one place.
- **Client/service names resolved client-side**: `GET /schedulings` only returns `client_id`/`service_id`, not names, so `SchedulePage` and `NewSchedulingPage` fetch the full client/service lists once and build `{id: object}` lookup maps, avoiding a fetch per row.
- **Evaluation-to-procedure flow mirrors the backend's business rules** in the UI: the evaluation/procedure type selector only appears for services that require one; the list of completed evaluations available to link is fetched and filtered client-side (no dedicated backend endpoint for this), but the backend remains the actual source of truth and re-validates everything on submit.
- **Editable procedure duration**: added after demoing the system — a fixed default duration per service (e.g. "corte" = 30 min) didn't reflect that the same service can take anywhere from 10 minutes to an hour depending on the client. The duration field is pre-filled with the service's default and only shown for procedures on services that don't require an evaluation (evaluation-required services always get their duration from the completed evaluation instead).
- **Request bodies use snake_case** (`first_name`, `estimated_duration_minutes`, etc.), matching the backend's Pydantic schemas exactly, rather than converting to/from camelCase.
- **SPA fallback rewrite (`vercel.json`)**: Vercel resolves each URL as a filesystem path by default, which breaks direct access or a refresh on any client-side route (e.g. `/schedulings/new`) with a platform-level 404 before the app ever loads. A catch-all rewrite to `index.html` lets React Router handle routing client-side regardless of how the route was reached.

---

## Getting started

### Prerequisites
- Node.js 18+
- The [scheduling-system](https://github.com/bertollimb/scheduling-system) API running, either locally or deployed

### Local setup

```bash
git clone https://github.com/bertollimb/scheduling-system-front.git
cd scheduling-system-front
npm install
```

Copy `.env.example` to `.env` and set the API URL:

```
VITE_API_URL=http://localhost:8000
```

Run the dev server:

```bash
npm run dev
```

Available at `http://localhost:5173`.

There's no public sign-up page, since only one account is expected to exist. The account is created once directly against the backend's database — see the [backend README](https://github.com/bertollimb/scheduling-system#authentication) for details.

---

## Deployment

Deployed on [Vercel](https://vercel.com): **https://scheduling-system-front.vercel.app**

`VITE_API_URL` is set as a Vercel environment variable, pointing at the backend deployed on Render. The backend's `ALLOWED_ORIGINS` includes this Vercel URL, since the API's CORS middleware would otherwise reject requests from it.

---

## Known limitations

- **Interface is in English**, while the salon owner speaks Portuguese only. This was a deliberate decision for now: all data she enters (client names, service names) is language-agnostic, and every fixed choice she interacts with (categories, appointment type) is presented as a labeled option, not typed text — so the English UI doesn't block her from using the system, even though translating the static labels remains a possible future improvement.
- **No pagination** on client/service/scheduling lists, matching the backend's current lack of pagination — fine at this project's scale.
- **Highlighted "busy" days and the available-evaluations list both fetch the entire scheduling history** client-side and filter in the browser, since the backend has no date-range or evaluation-lookup endpoint. Acceptable at a single salon's data volume; would need a dedicated backend endpoint if the dataset grew significantly.