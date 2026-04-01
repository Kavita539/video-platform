const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/', (req, res) => {
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];

  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbState[mongoose.connection.readyState] || 'unknown',
    uptime: Math.floor(process.uptime()),
  });
});

module.exports = router;
