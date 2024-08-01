import cookieParser from 'cookie-parser';
import express from 'express';
import { config } from 'dotenv';

import morgan from 'morgan';
import errorMiddleware from './middlewares/error.middleware.js';
import dotenv from 'dotenv'
import 'dotenv/config'




config();
const app = express();

// Middlewares
// Built-In
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan('dev'));
app.use(cookieParser());

// Server Status Check Route
app.get('/ping', (_req, res) => {
  res.send('Pong');
});

// Import all routes
import patientRoutes from './routes/patient.routes.js';
import doctorRoutes from './routes/doctor.routes.js';

app.use('/api/v1/user', patientRoutes);
app.use('/api/v1/doctor',doctorRoutes);

// Default catch all route - 404
app.all('*', (_req, res) => {
  res.status(404).send('OOPS!!! 404 Page Not Found');
});

// Custom error handling middleware
app.use(errorMiddleware);



export default app;
