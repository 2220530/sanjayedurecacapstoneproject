'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// GET /api/dashboard  — returns stats in a single query
router.get('/', (req, res) => {
  const db = getDb();
  const studentCount    = db.prepare('SELECT COUNT(*) AS count FROM students').get().count;
  const courseCount     = db.prepare('SELECT COUNT(*) AS count FROM courses').get().count;
  const enrollmentCount = db.prepare('SELECT COUNT(*) AS count FROM enrollments').get().count;

  const recentStudents = db.prepare(
    'SELECT id, name, email, phone FROM students ORDER BY id DESC LIMIT 5'
  ).all();

  const recentCourses = db.prepare(
    'SELECT id, title, instructor, duration FROM courses ORDER BY id DESC LIMIT 5'
  ).all();

  res.json({
    stats: {
      students:    studentCount,
      courses:     courseCount,
      enrollments: enrollmentCount
    },
    recentStudents,
    recentCourses
  });
});

module.exports = router;
