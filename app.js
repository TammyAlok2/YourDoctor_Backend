import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import errorMiddleware from './middlewares/error.middleware.js';
import patientRoutes from './routes/patient.routes.js';
import doctorRoutes from './routes/doctor.routes.js';

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://your-custom-domain.com', // Replace with your actual custom domain
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'https://yourlab.in',
  'www.yourlab.in',
 ];

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Cookie settings middleware
app.use((req, res, next) => {
  res.cookie = function(name, value, options) {
    options = options || {};
    options.sameSite = 'none';
    options.secure = true; // Ensure this is true for production
    return express.response.cookie.call(this, name, value, options);
  };
  next();
});

// Server Status Check Route
app.get('/ping', (_req, res) => {
  res.send('Pong');
});
app.get('/',(req,res)=>{
  console.log('home route')
  res.send('Home page')
})

// Routes
app.use('/api/v1/user', patientRoutes);
app.use('/api/v1/doctor', doctorRoutes);

// Default catch all route - 404
app.all('*', (_req, res) => {
  res.status(404).send('OOPS!!! 404 Page Not Found');
});

// Custom error handling middleware
app.use(errorMiddleware);

export default app;