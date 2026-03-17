'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// POST /api/enrollments  { student_id, course_id }
router.post('/', (req, res) => {
  const { student_id, course_id } = req.body;
  if (!student_id || !course_id) {
    return res.status(400).json({ error: 'student_id and course_id are required' });
  }
  const db = getDb();
  const student = db.prepare('SELECT id FROM students WHERE id = ?').get(student_id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(course_id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }
  try {
    const result = db.prepare(
      'INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)'
    ).run(student_id, course_id);
    const enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(enrollment);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Student is already enrolled in this course' });
    }
    throw err;
  }
});

// DELETE /api/enrollments  { student_id, course_id }
router.delete('/', (req, res) => {
  const { student_id, course_id } = req.body;
  if (!student_id || !course_id) {
    return res.status(400).json({ error: 'student_id and course_id are required' });
  }
  const db = getDb();
  const enrollment = db.prepare(
    'SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?'
  ).get(student_id, course_id);
  if (!enrollment) {
    return res.status(404).json({ error: 'Enrollment not found' });
  }
  db.prepare('DELETE FROM enrollments WHERE student_id = ? AND course_id = ?').run(student_id, course_id);
  res.status(204).send();
});

module.exports = router;
