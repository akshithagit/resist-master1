import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { config } from './core/config.js';
import { authRouter } from './api/authRoutes.js';
import { analysisRouter } from './api/analysisRoutes.js';
import { demoRouter } from './api/demoRoutes.js';
import { adminRouter } from './api/adminRoutes.js';

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Privacy-conscious structured logging (Never log patient PHI, symptoms, or OCR medical text)
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  const startTime = Date.now();
  req.headers['x-request-id'] = requestId;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    // Section 57 compliance: Only log non-identifying operational metrics
    console.log(
      JSON.stringify({
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: duration,
        timestamp: new Date().toISOString()
      })
    );
  });
  next();
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    service: 'ResistAI - Antimicrobial Resistance Risk Assessment Engine',
    version: config.modelVersion,
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/analyses', analysisRouter);
app.use('/api/demo', demoRouter);
app.use('/api/admin', adminRouter);

// Global Error Handler (Section 44: Never expose stack traces or raw errors)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]', err.message || err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'An unexpected error occurred while processing the clinical analysis.',
    requestId: req.headers['x-request-id']
  });
});

// Start Server
const server = app.listen(config.port, config.host, () => {
  console.log(`====================================================`);
  console.log(` ResistAI Backend Running on http://${config.host}:${config.port}`);
  console.log(` Model Version: ${config.modelVersion}`);
  console.log(` Health check:  http://localhost:${config.port}/api/health`);
  console.log(` Demo Cases:    http://localhost:${config.port}/api/demo/cases`);
  console.log(`====================================================`);
});

export default app;
