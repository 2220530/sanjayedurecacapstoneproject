'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// GET /api/students
router.get('/', (req, res) => {
  const db = getDb();
  const students = db.prepare(`
    SELECT s.*, COUNT(e.id) AS enrollment_count
    FROM students s
    LEFT JOIN enrollments e ON e.student_id = s.id
    GROUP BY s.id
    ORDER BY s.name
  `).all();
  res.json(students);
});

// GET /api/students/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  res.json(student);
});

// POST /api/students
router.post('/', (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }
  const db = getDb();
  try {
    const result = db.prepare(
      'INSERT INTO students (name, email, phone) VALUES (?, ?, ?)'
    ).run(name, email, phone || null);
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(student);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    throw err;
  }
});

// PUT /api/students/:id
router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Student not found' });
  }
  const name = req.body.name !== undefined ? req.body.name : existing.name;
  const email = req.body.email !== undefined ? req.body.email : existing.email;
  const phone = req.body.phone !== undefined ? req.body.phone : existing.phone;
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }
  try {
    db.prepare('UPDATE students SET name = ?, email = ?, phone = ? WHERE id = ?')
      .run(name, email, phone, req.params.id);
    const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    throw err;
  }
});

// DELETE /api/students/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Student not found' });
  }
  db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

// GET /api/students/:id/enrollments
router.get('/:id/enrollments', (req, res) => {
  const db = getDb();
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  const enrollments = db.prepare(`
    SELECT c.*, e.enrolled_at
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    WHERE e.student_id = ?
    ORDER BY c.title
  `).all(req.params.id);
  res.json(enrollments);
});

module.exports = router;
