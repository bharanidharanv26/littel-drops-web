# Little Drops Old Age Home Management System

Internal management application for Little Drops Old Age Home — managing elder records across multiple branches with complete historical journey tracking.

## Architecture

```
Frontend (React + TypeScript + Vite)
    ↓ REST API
Backend (Node.js + Express)
    ↓ Mongoose
MongoDB Atlas
```

## Project Structure

```
littel-drops-web/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/    # UI and shared components
│   │   ├── context/       # Auth context
│   │   ├── pages/         # All page components
│   │   ├── routes/        # Route protection
│   │   ├── services/      # API client
│   │   ├── types/         # TypeScript interfaces
│   │   └── lib/           # Utilities
│   ├── package.json
│   └── .env
├── backend/           # Express API server
│   ├── src/
│   │   ├── config/        # Database connection
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/     # Auth middleware
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── utils/         # Utilities
│   │   ├── seed.js        # Database seeder
│   │   └── server.js      # Express server
│   ├── package.json
│   └── .env
├── README.md
└── .gitignore
```

## Requirements

- Node.js 18+
- MongoDB Atlas account

## Installation

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## Environment Setup

### Backend (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
JWT_SECRET=<your-strong-secret-key>
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

## Database Setup

### Seed initial data

```bash
cd backend
npm run seed
```

This creates:
- 8 branches (Paraniputhur, Gerugambakkam, Somangalam, Sriperumbudur, Bengaluru, Morappur, Arcot, Batlagundu)
- 1 Founder account

### Initial Login Credentials

```
Username: founder
Password: little
```

⚠️ **Change the password after first login!**

## Running the Application

### Backend

```bash
cd backend
npm run dev
```

Server starts on `http://localhost:5000`

### Frontend

```bash
cd frontend
npm run dev
```

Frontend starts on `http://localhost:5173`

## User Roles

| Role | Access |
|------|--------|
| **Founder** | Full access — all branches, all users, all data, direct edits, Excel import |
| **Trustee** | Assigned branch(es) — approve/reject requests, direct edits, reset Staff passwords |
| **Staff** | Permanent branch — submit requests (admission, edit, transfer, death, return home) |

## Workflows

### Admission
1. Staff submits admission form → Request (Pending)
2. Trustee reviews → Approve/Reject
3. On approval: Elder becomes Active in current branch

### Transfer
1. Staff requests transfer → Request (Pending)
2. Trustee reviews → Approve/Reject
3. On approval: Elder moves from source to destination branch
4. Historical movement is preserved

### Death / Return Home / Other Outcome
1. Staff submits → Request (Pending)
2. Trustee approves → Elder removed from current residents
3. Status updated, outcome recorded, history preserved

## API Endpoints

### Authentication
- `POST /api/auth/login` — Login with username/password
- `GET /api/auth/me` — Get current user
- `POST /api/auth/change-password` — Change own password
- `POST /api/auth/logout` — Logout

### Users (Founder only)
- `GET /api/users` — List all users
- `POST /api/users` — Create user
- `GET /api/users/:id` — Get user
- `PUT /api/users/:id` — Update user
- `PATCH /api/users/:id/status` — Enable/disable user
- `POST /api/users/:id/reset-password` — Reset password

### Branches
- `GET /api/branches` — List branches
- `POST /api/branches` — Create branch (Founder)
- `GET /api/branches/:id` — Get branch
- `PUT /api/branches/:id` — Update branch (Founder)
- `PATCH /api/branches/:id/status` — Toggle status (Founder)

### Elders
- `GET /api/elders` — List elders (filtered by role)
- `GET /api/elders/:id` — Get elder with full history
- `POST /api/elders/admission/submit` — Submit admission
- `POST /api/elders/admission/:id/approve` — Approve admission
- `POST /api/elders/admission/:id/reject` — Reject admission
- `PUT /api/elders/:id/edit` — Edit elder
- `POST /api/elders/edit/:id/approve` — Approve edit
- `POST /api/elders/transfer/submit` — Submit transfer
- `POST /api/elders/transfer/:id/approve` — Approve transfer
- `POST /api/elders/death/submit` — Submit death
- `POST /api/elders/death/:id/approve` — Approve death
- `POST /api/elders/return-home/submit` — Submit return home
- `POST /api/elders/other/submit` — Submit other outcome
- `POST /api/elders/request/:id/cancel` — Cancel request

### Requests
- `GET /api/requests` — List requests
- `PUT /api/requests/:id/review` — Review request

### Notifications
- `GET /api/notifications` — Get notifications
- `GET /api/notifications/unread-count` — Unread count
- `PATCH /api/notifications/:id/read` — Mark as read
- `PATCH /api/notifications/read-all` — Mark all as read

### Reports
- `GET /api/reports/stats` — Dashboard statistics
- `GET /api/reports/reports?report_type=...` — Generate reports

### Audit Logs
- `GET /api/audit-logs` — View audit logs

### Import
- `POST /api/import/preview` — Preview Excel data
- `POST /api/import/confirm` — Confirm import
- `GET /api/import/jobs` — View import history

### Health
- `GET /api/health` — Health check

## MongoDB Models

1. **User** — name, username, password (hashed), role, isActive
2. **Branch** — name, address, phone, isActive
3. **Elder** — admissionNumber, name, age, gender, currentBranch, currentStatus, etc.
4. **ElderMovement** — elder, fromBranch, toBranch, movementType, movementDate
5. **ElderOutcome** — elder, outcomeType, branchId, outcomeDate
6. **UserBranchAssignment** — user, branch, assignmentType, startDate/endDate
7. **Request** — requestType, elder, requestedBy, status, proposedChanges
8. **Notification** — recipient, type, title, message, isRead
9. **AuditLog** — actor, action, entityType, beforeValue/afterValue
10. **ImportJob** — initiatedBy, fileName, status, counts

## Security

- JWT authentication with bcrypt password hashing
- Role-based access control on backend
- Environment variables for secrets
- CORS configured for frontend origin
- Rate limiting on API endpoints
- Helmet security headers
- No database credentials exposed to frontend

## Key Business Rules

- An elder appears only in their **current** branch
- Historical movement is **never** deleted
- Only **one** Trustee approval is required (multiple Trustees receive notifications)
- Staff changes require Trustee approval
- Trustee changes are committed directly
- Founder has full override authority
- Audit logs are immutable
