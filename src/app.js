const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config/config');
const workerRoutes = require('./routes/worker.routes');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/profile', workerRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'worker-profile-service' });
});

// Error handling
app.use(errorMiddleware);

module.exports = app;
