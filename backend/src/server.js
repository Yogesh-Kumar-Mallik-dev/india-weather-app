import express from 'express';
import cors from 'cors';
import { PORT } from './config.js';
import weatherRoutes from './routes/weatherRoutes.js';

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Allow Next.js frontend or any client
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'India Weather & AQI Backend',
    mode: 'Secretless Open-Meteo & RainViewer'
  });
});

// Weather API routes
app.use('/api', weatherRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🇮🇳 India Weather API Backend Running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Weather test: http://localhost:${PORT}/api/weather?city=Delhi`);
  console.log(`===============================================`);
});
