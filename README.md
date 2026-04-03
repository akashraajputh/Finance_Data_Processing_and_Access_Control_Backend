# Finance Data Processing and Access Control Backend

A Node.js/Express backend assignment implementation for finance records, RBAC, and dashboard summary APIs with secure authentication.

## Features
- User/role management (viewer/analyst/admin) with secure password hashing
- JWT-based authentication (`/auth/register`, `/auth/login`)
- Financial record CRUD (`/records`) with soft delete
- Dashboard summary and trend endpoints (`/dashboard/summary`, `/dashboard/trend`)
- Role-based access control via middleware
- Input validation and robust error handling
- SQLite persistence (file `src/data/finance.db`)
- Automated tests with Jest + Supertest

## Setup
1. `npm install`
2. `npm start` (or `npm run dev`)
3. Default seeded admin user: `admin` / `admin123`

## Endpoints

### Auth
- `POST /auth/register` { username, password, role? }
- `POST /auth/login` { username, password }

### User management (admin only for updates)
- `GET /users`
- `PATCH /users/:id/role` { role }
- `PATCH /users/:id/status` { status }

### Records
- `POST /records` (admin) { amount, type, category, date, note? }
- `GET /records` (all roles) query: type, category, startDate, endDate, limit, offset
- `GET /records/:id`
- `PUT /records/:id` (admin)
- `DELETE /records/:id` (admin)

### Dashboard
- `GET /dashboard/summary` (all roles)
- `GET /dashboard/trend` (all roles)

### API Documentation
- `GET /api-docs` - Interactive Swagger UI documentation

### Auth header
`Authorization: Bearer <JWT_TOKEN>`

## Access Control
- viewer: can read records and dashboard data
- analyst: can read records and dashboard data
- admin: full CRUD + user management

## Security
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with 1-hour expiration
- Stateless authentication (no server-side token storage)

## Validation & error codes
- `400` for validation errors
- `401` for unauthorized (invalid/missing token)
- `403` for forbidden (insufficient role)
- `404` for missing resource
- `500` for server errors

## Testing
- `npm test` runs automated API tests
- Tests cover auth, RBAC, CRUD, and error cases
- Uses separate test database

## Docker support

- `Dockerfile` and `docker-compose.yml` are included for containerized deployment.
- Default application port: `4000`.

Usage:
1. `docker build -t finance-api .`
2. `docker run -p 4000:4000 -e JWT_SECRET=supersecure finance-api`

Or with docker-compose:
1. `docker-compose up --build`

### Verify
- `http://localhost:4000/auth/login`
- `http://localhost:4000/api-docs`

## Deployment

### Render (Free Plan)
This project is configured to deploy on Render's free plan with ephemeral SQLite storage.

1. Push code to GitHub
2. On Render Dashboard:
   - New Web Service → connect repo
   - Branch: `main`
   - Build command: `npm install && npm rebuild sqlite3 --build-from-source`
   - Start command: `node src/index.js`
   - Instance: Free
3. Environment variables:
   - `JWT_SECRET=<your_secret_key>`
   - `DB_PATH=/tmp/db.sqlite` (optional; defaults to /tmp)
4. Deploy → get URL
5. Test: `https://<your-app>.onrender.com/health`

**Note**: Free plan uses ephemeral storage; data resets on app restart. For persistent storage, upgrade to Starter plan or use Render Postgres.

### Railway
Alternatively, deploy on Railway:
1. New Project → Deploy from GitHub
2. Railway auto-detects Node.js
3. Add env: `JWT_SECRET=...`
4. Deploy → runs on free tier

For persistent database on free tier, add Railway Postgres plugin.

## Notes
- Production: set `JWT_SECRET` env var and use proper DB
- Tokens expire in 1 hour; implement refresh if needed
- Soft delete preserves data integrity
