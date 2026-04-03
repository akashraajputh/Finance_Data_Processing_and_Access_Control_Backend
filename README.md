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

## Notes
- Production: set `JWT_SECRET` env var and use proper DB
- Tokens expire in 1 hour; implement refresh if needed
- Soft delete preserves data integrity
