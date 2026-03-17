'use strict';

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = errorHandler;
