# LeaveEase

A role-based employee leave management system built on the MERN stack. LeaveEase handles the usual headache of managing leave requests, balances, approvals, holidays, and reporting across an organization — with separate workflows for employees, HR managers, and admins.

> The backend is fully built out. Working on the React frontend next.

## What it does

### For employees

- Log in securely (JWT stored in HTTP-only cookies, so no messing around with localStorage)
- Check your leave balance at a glance
- Apply for paid or unpaid leave
- Working days are calculated automatically — weekends and holidays are excluded, so you don't have to do the math
- Cancel a pending request if plans change
- Look back at your leave history
- See your department's leave calendar
- Get notified when a request is approved, rejected, or cancelled
- Change your password (including forced changes for temporary passwords)

### For HR managers

- Review and act on leave requests from your department
- Approve or reject requests
- View balances for your team
- Adjust balances when needed (scoped to your own department only)
- Check department calendars
- Pull department-level leave reports
- Get notified when requests come in or get cancelled

### For admins

- Create and manage user accounts
- Activate/deactivate accounts as people join or leave
- Manage departments and assign department managers
- Configure leave types and policies
- Manage the company holiday list
- View and adjust anyone's leave balance
- See leave requests across the whole org
- Dashboards and analytics
- Searchable audit logs for when things need investigating

## Backend — the interesting bits

- Role-based access control (Employee / HR Manager / Admin)
- JWT auth via HTTP-only cookies
- Temporary passwords are enforced until changed
- Every authenticated request re-checks that the account is still active
- Paid leave balance gets reserved the moment a request is submitted (as "pending"), not just on approval
- Balance updates are atomic — no partial states if something fails mid-request
- Rollback logic to compensate if an operation fails partway through
- Leave policies are configurable, not hardcoded
- Working-day calculation is holiday-aware
- Department capacity calendar
- In-app notifications
- Immutable audit logs
- Dashboard stats, monthly trends, and leave reports
- Rate limiting — both global and specifically on login
- Helmet for security headers
- Env validation on startup (so a bad `.env` fails loud, not silent)
- Request size limits
- Error responses are sanitized for production
- Graceful shutdown
- Health/readiness endpoints

## Stack

**Backend**

- Node.js + Express
- MongoDB + Mongoose
- JWT, bcrypt
- cookie-parser, Helmet, express-rate-limit

**Frontend (planned)**

- React + React Router
- TanStack Query
- Tailwind CSS

## Project layout

```text
leave-ease/
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── auditLogs/
│   │   │   ├── auth/
│   │   │   ├── calendar/
│   │   │   ├── dashboard/
│   │   │   ├── departments/
│   │   │   ├── holidays/
│   │   │   ├── leaveBalances/
│   │   │   ├── leaveRequests/
│   │   │   ├── leaveTypes/
│   │   │   ├── notifications/
│   │   │   └── users/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
├── .gitignore
└── README.md
```

## Getting it running locally

You'll need Node.js, npm, and MongoDB installed.

```bash
git clone git@github.com:amitbhandari6284/leave-ease.git
cd leave-ease/server
npm install
```

Copy the example env file and fill in your own values:

```bash
cp .env.example .env
```

```env
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb://127.0.0.1:27017/leave-ease

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
JWT_COOKIE_EXPIRES_IN_DAYS=7

CLIENT_URL=http://localhost:5173
APP_TIME_ZONE=Asia/Kolkata

TRUST_PROXY_HOPS=0

RATE_LIMIT_DISABLED=false
API_RATE_LIMIT=300
LOGIN_RATE_LIMIT=10

COOKIE_SAME_SITE=lax
COOKIE_SECURE=false
```


Sanity-check your config before starting anything:

```bash
npm run check:env
```

Should print:

```text
Environment configuration is valid
```

Then just run:

```bash
npm run dev
```

API comes up at `http://localhost:5000`.

## API routes

| Module         | Base route               |
| -------------- | ------------------------ |
| Auth           | `/api/v1/auth`           |
| Users          | `/api/v1/users`          |
| Departments    | `/api/v1/departments`    |
| Leave types    | `/api/v1/leave-types`    |
| Leave balances | `/api/v1/leave-balances` |
| Leave requests | `/api/v1/leave-requests` |
| Holidays       | `/api/v1/holidays`       |
| Calendar       | `/api/v1/calendar`       |
| Notifications  | `/api/v1/notifications`  |
| Dashboard      | `/api/v1/dashboard`      |
| Reports        | `/api/v1/reports`        |
| Audit logs     | `/api/v1/audit-logs`     |

## Health checks

**Liveness** — `GET /api/v1/health/live` → confirms the process is up.

**Readiness** — `GET /api/v1/health/ready` → confirms it's actually connected to MongoDB and ready for traffic.

## How a leave request flows through the system

```text
Employee submits a request
        ↓
Working days get calculated (weekends/holidays excluded)
        ↓
Paid balance is reserved as "pending"
        ↓
HR Manager reviews it
        ↓
Approved  → pending balance moves to "used"
Rejected  → pending balance is restored
Cancelled → pending balance is restored
        ↓
Notifications go out, audit log gets written
```

## Security notes

- Passwords hashed with bcrypt
- Auth via HTTP-only cookies, not headers/localStorage
- Cookie security gets validated properly in production
- JWTs expire, and get invalidated on password change
- Account status is checked on every protected request, not just at login
- Role-based authorization throughout
- Rate limiting on login and globally
- Helmet for standard security headers
- CORS locked down
- Request body size capped
- Env vars validated at startup
- Sensitive fields excluded from responses
- Errors are sanitized before hitting the client in production
- Audit logs never include passwords or tokens

## Where things stand

**Done:**
Backend architecture, auth/authorization, user & department management, leave types, leave balances, the full leave request lifecycle, holidays, department calendar, notifications, dashboard, reports, audit logging, security hardening, graceful shutdown, health checks.

**Up next:**
React frontend — auth UI, employee dashboard, HR review dashboard, admin config screens, charts/reporting UI, and eventually getting it deployed.

## Author

**Amit Bhandari**
[github.com/amitbhandari6284](https://github.com/amitbhandari6284)
