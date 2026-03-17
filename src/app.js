'use strict';

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const studentsRouter    = require('./routes/students');
const coursesRouter     = require('./routes/courses');
const enrollmentsRouter = require('./routes/enrollments');
const dashboardRouter   = require('./routes/dashboard');
const errorHandler      = require('./middleware/errorHandler');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});

const staticLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false
});

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));

  app.use('/api', apiLimiter);
  app.use('/api/students',    studentsRouter);
  app.use('/api/courses',     coursesRouter);
  app.use('/api/enrollments', enrollmentsRouter);
  app.use('/api/dashboard',   dashboardRouter);

  // Health check
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  // Serve SPA for all other GET requests
  app.get('/{*path}', staticLimiter, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });

  app.use(errorHandler);

  return app;
}

module.exports = createApp;
