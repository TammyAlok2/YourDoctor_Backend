import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import errorMiddleware from './middlewares/error.middleware.js';
import patientRoutes from './routes/patient.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import adminRoutes from './routes/admin.routes.js';

dotenv.config();

const app = express();

// Allowed Origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://yourlab.in',
  'https://www.yourlab.in',
  'https://admin-panel-beta-sepia.vercel.app', // Admin Panel Domain
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
];

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());

// CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // To allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Cookie Settings Middleware
app.use((req, res, next) => {
  res.cookie = function (name, value, options = {}) {
    const isProduction = process.env.NODE_ENV === 'production';

    // Apply common settings
    options.httpOnly = true; // Prevent client-side JS from accessing cookies

    if (isProduction) {
      // If in production, apply secure settings for cross-domain cookies
      options.sameSite = 'none'; // Needed for cross-origin cookies
      options.secure = true; // Cookies only work on HTTPS

      // Check the origin of the request to set the appropriate domain
      const origin = req.headers.origin;
      if (origin.includes('yourlab.in')) {
        options.domain = 'yourlab.in'; // For the main domain
      } else if (origin.includes('admin-panel-beta-sepia.vercel.app')) {
        options.domain = 'admin-panel-beta-sepia.vercel.app'; // For the admin panel domain
      }
    } else {
      // For local development, use non-secure settings
      options.sameSite = 'lax'; // Less restrictive for local dev
      options.secure = false; // No HTTPS in local dev
      delete options.domain; // No domain for localhost
    }

    // Call the original cookie method
    return express.response.cookie.call(this, name, value, options);
  };

  next();
});

// Routes
app.use('/api/v1/user', patientRoutes);
app.use('/api/v1/doctor', doctorRoutes);
app.use('/api/v1/admin', adminRoutes);

// Server Status Check Route
app.get('/ping', (_req, res) => {
  res.send('Pong');
});

app.get('/', (req, res) => {
  res.send('Home page');
});

// Default 404 Catch All Route
app.all('*', (_req, res) => {
  res.status(404).send('OOPS!!! 404 Page Not Found');
});

// Custom Error Handling Middleware
app.use(errorMiddleware);

export default app;
