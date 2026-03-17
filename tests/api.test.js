'use strict';

const request = require('supertest');
const path    = require('path');
const fs      = require('fs');

// Use a temporary database for tests
const tmpDb = path.join(__dirname, '../tmp/test.db');
process.env.DB_PATH = tmpDb;

const { closeDb } = require('../src/db/database');
const createApp   = require('../src/app');

let app;

beforeAll(() => {
  const dir = path.dirname(tmpDb);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  app = createApp();
});

afterAll(() => {
  closeDb();
  if (fs.existsSync(tmpDb)) fs.unlinkSync(tmpDb);
});

// ───────────────────────────────────────────────────
// Health check
// ───────────────────────────────────────────────────
describe('GET /api/health', () => {
  test('returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// ───────────────────────────────────────────────────
// Dashboard
// ───────────────────────────────────────────────────
describe('GET /api/dashboard', () => {
  test('returns stats and recent lists', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('stats');
    expect(res.body.stats).toHaveProperty('students');
    expect(res.body.stats).toHaveProperty('courses');
    expect(res.body.stats).toHaveProperty('enrollments');
    expect(Array.isArray(res.body.recentStudents)).toBe(true);
    expect(Array.isArray(res.body.recentCourses)).toBe(true);
  });
});

// ───────────────────────────────────────────────────
// Students
// ───────────────────────────────────────────────────
describe('Students API', () => {
  let studentId;

  test('GET /api/students returns empty array initially', async () => {
    const res = await request(app).get('/api/students');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/students creates a student', async () => {
    const res = await request(app)
      .post('/api/students')
      .send({ name: 'Alice', email: 'alice@example.com', phone: '1234567890' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Alice');
    expect(res.body.email).toBe('alice@example.com');
    studentId = res.body.id;
  });
  test('POST /api/students rejects missing name', async () => {
    const res = await request(app)
      .post('/api/students')
      .send({ email: 'noname@example.com' });
    expect(res.status).toBe(400);
  });

  test('POST /api/students rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/students')
      .send({ name: 'Alice2', email: 'alice@example.com' });
    expect(res.status).toBe(409);
  });

  test('GET /api/students/:id returns the student', async () => {
    const res = await request(app).get(`/api/students/${studentId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(studentId);
  });

  test('GET /api/students list includes enrollment_count', async () => {
    const res = await request(app).get('/api/students');
    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty('enrollment_count');
  });

  test('GET /api/students/:id returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/students/99999');
    expect(res.status).toBe(404);
  });

  test('PUT /api/students/:id updates the student', async () => {
    const res = await request(app)
      .put(`/api/students/${studentId}`)
      .send({ name: 'Alice Updated' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Alice Updated');
  });

  test('DELETE /api/students/:id deletes the student', async () => {
    const res = await request(app).delete(`/api/students/${studentId}`);
    expect(res.status).toBe(204);
    const check = await request(app).get(`/api/students/${studentId}`);
    expect(check.status).toBe(404);
  });
});

// ───────────────────────────────────────────────────
// Courses
// ───────────────────────────────────────────────────
describe('Courses API', () => {
  let courseId;

  test('GET /api/courses returns empty array initially', async () => {
    const res = await request(app).get('/api/courses');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/courses creates a course', async () => {
    const res = await request(app)
      .post('/api/courses')
      .send({ title: 'Node.js Fundamentals', instructor: 'Bob', duration: '4 weeks' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Node.js Fundamentals');
    courseId = res.body.id;
  });

  test('POST /api/courses rejects missing title', async () => {
    const res = await request(app)
      .post('/api/courses')
      .send({ instructor: 'Bob' });
    expect(res.status).toBe(400);
  });

  test('GET /api/courses/:id returns the course', async () => {
    const res = await request(app).get(`/api/courses/${courseId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(courseId);
  });

  test('GET /api/courses list includes student_count', async () => {
    const res = await request(app).get('/api/courses');
    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty('student_count');
  });

  test('PUT /api/courses/:id updates the course', async () => {
    const res = await request(app)
      .put(`/api/courses/${courseId}`)
      .send({ title: 'Node.js Advanced' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Node.js Advanced');
  });

  test('DELETE /api/courses/:id deletes the course', async () => {
    const res = await request(app).delete(`/api/courses/${courseId}`);
    expect(res.status).toBe(204);
    const check = await request(app).get(`/api/courses/${courseId}`);
    expect(check.status).toBe(404);
  });
});

// ───────────────────────────────────────────────────
// Enrollments
// ───────────────────────────────────────────────────
describe('Enrollments API', () => {
  let studentId, courseId;

  beforeAll(async () => {
    let s = await request(app)
      .post('/api/students')
      .send({ name: 'Carol', email: 'carol@example.com' });
    studentId = s.body.id;
    let c = await request(app)
      .post('/api/courses')
      .send({ title: 'React Basics', instructor: 'Dave' });
    courseId = c.body.id;
  });

  test('POST /api/enrollments enrolls a student', async () => {
    const res = await request(app)
      .post('/api/enrollments')
      .send({ student_id: studentId, course_id: courseId });
    expect(res.status).toBe(201);
    expect(res.body.student_id).toBe(studentId);
    expect(res.body.course_id).toBe(courseId);
  });

  test('POST /api/enrollments rejects duplicate enrollment', async () => {
    const res = await request(app)
      .post('/api/enrollments')
      .send({ student_id: studentId, course_id: courseId });
    expect(res.status).toBe(409);
  });

  test('GET /api/students/:id/enrollments returns courses', async () => {
    const res = await request(app).get(`/api/students/${studentId}/enrollments`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('React Basics');
  });

  test('GET /api/courses/:id/students returns students', async () => {
    const res = await request(app).get(`/api/courses/${courseId}/students`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Carol');
  });

  test('DELETE /api/enrollments removes the enrollment', async () => {
    const res = await request(app)
      .delete('/api/enrollments')
      .send({ student_id: studentId, course_id: courseId });
    expect(res.status).toBe(204);
    const check = await request(app).get(`/api/students/${studentId}/enrollments`);
    expect(check.body.length).toBe(0);
  });

  test('DELETE /api/enrollments 404 for non-existent', async () => {
    const res = await request(app)
      .delete('/api/enrollments')
      .send({ student_id: studentId, course_id: courseId });
    expect(res.status).toBe(404);
  });
});
