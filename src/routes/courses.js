'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// GET /api/courses
router.get('/', (req, res) => {
  const db = getDb();
  const courses = db.prepare(`
    SELECT c.*, COUNT(e.id) AS student_count
    FROM courses c
    LEFT JOIN enrollments e ON e.course_id = c.id
    GROUP BY c.id
    ORDER BY c.title
  `).all();
  res.json(courses);
});

// GET /api/courses/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }
  res.json(course);
});

// POST /api/courses
router.post('/', (req, res) => {
  const { title, description, instructor, duration } = req.body;
  if (!title || !instructor) {
    return res.status(400).json({ error: 'title and instructor are required' });
  }
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO courses (title, description, instructor, duration) VALUES (?, ?, ?, ?)'
  ).run(title, description || null, instructor, duration || null);
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(course);
});

// PUT /api/courses/:id
router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Course not found' });
  }
  const title       = req.body.title       !== undefined ? req.body.title       : existing.title;
  const description = req.body.description !== undefined ? req.body.description : existing.description;
  const instructor  = req.body.instructor  !== undefined ? req.body.instructor  : existing.instructor;
  const duration    = req.body.duration    !== undefined ? req.body.duration    : existing.duration;
  if (!title || !instructor) {
    return res.status(400).json({ error: 'title and instructor are required' });
  }
  db.prepare('UPDATE courses SET title = ?, description = ?, instructor = ?, duration = ? WHERE id = ?')
    .run(title, description, instructor, duration, req.params.id);
  const updated = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/courses/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Course not found' });
  }
  db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

// GET /api/courses/:id/students
router.get('/:id/students', (req, res) => {
  const db = getDb();
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }
  const students = db.prepare(`
    SELECT s.*, e.enrolled_at
    FROM enrollments e
    JOIN students s ON s.id = e.student_id
    WHERE e.course_id = ?
    ORDER BY s.name
  `).all(req.params.id);
  res.json(students);
});

module.exports = router;
