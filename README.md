# Student Course Management System

A full-stack **Student Course Management System** built as an Edureka Full-Stack Web Development Capstone Project.

## Features

- **Student Management** — Add, view, edit, and delete students
- **Course Management** — Add, view, edit, and delete courses
- **Enrollment Management** — Enroll students in courses and remove enrollments
- **Dashboard** — Summary stats (total students, courses, enrollments) with recent records
- **REST API** — Clean JSON API for all operations
- **Persistent Storage** — SQLite database via `better-sqlite3`

## Tech Stack

| Layer    | Technology                     |
|----------|--------------------------------|
| Backend  | Node.js + Express 5            |
| Database | SQLite (`better-sqlite3`)      |
| Frontend | Vanilla HTML / CSS / JavaScript|
| Testing  | Jest + Supertest               |

## Project Structure

```
.
├── server.js               # Entry point
├── src/
│   ├── app.js              # Express app factory
│   ├── db/
│   │   └── database.js     # SQLite setup & schema
│   ├── middleware/
│   │   └── errorHandler.js # Global error handler
│   └── routes/
│       ├── students.js     # /api/students
│       ├── courses.js      # /api/courses
│       └── enrollments.js  # /api/enrollments
├── public/
│   ├── index.html          # SPA shell
│   ├── css/styles.css      # Styles
│   └── js/app.js           # Frontend logic
└── tests/
    └── api.test.js         # API integration tests
```

## Getting Started

### Prerequisites

- Node.js ≥ 18

### Install & Run

```bash
npm install
npm start
```

Open your browser at <http://localhost:3000>.

### Run Tests

```bash
npm test
```

## API Reference

### Students

| Method | Path                          | Description                  |
|--------|-------------------------------|------------------------------|
| GET    | `/api/students`               | List all students            |
| POST   | `/api/students`               | Create a student             |
| GET    | `/api/students/:id`           | Get a student                |
| PUT    | `/api/students/:id`           | Update a student             |
| DELETE | `/api/students/:id`           | Delete a student             |
| GET    | `/api/students/:id/enrollments` | Get student's enrollments  |

### Courses

| Method | Path                         | Description                  |
|--------|------------------------------|------------------------------|
| GET    | `/api/courses`               | List all courses             |
| POST   | `/api/courses`               | Create a course              |
| GET    | `/api/courses/:id`           | Get a course                 |
| PUT    | `/api/courses/:id`           | Update a course              |
| DELETE | `/api/courses/:id`           | Delete a course              |
| GET    | `/api/courses/:id/students`  | Get students enrolled        |

### Enrollments

| Method | Path                | Body                             | Description          |
|--------|---------------------|----------------------------------|----------------------|
| POST   | `/api/enrollments`  | `{ student_id, course_id }`      | Enroll a student     |
| DELETE | `/api/enrollments`  | `{ student_id, course_id }`      | Remove enrollment    |

### Health Check

```
GET /api/health  →  { "status": "ok" }
```

### Dashboard

```
GET /api/dashboard  →  { stats: { students, courses, enrollments }, recentStudents, recentCourses }
```
