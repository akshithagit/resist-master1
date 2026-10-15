import { Router, Request, Response } from 'express';
import { db } from '../database/store.js';
import { config } from '../core/config.js';
import { authenticateToken, AuthenticatedRequest } from './authRoutes.js';

export const adminRouter = Router();

// GET Admin config & active feature weights
adminRouter.get('/config', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const weights = db.getWeights();
    res.json({
      modelVersion: config.modelVersion,
      calculationVersion: config.calculationVersion,
      featureConfigVersion: config.featureConfigVersion,
      thresholds: config.thresholds,
      activeWeights: weights,
      defaultWeights: config.defaultWeights,
      disclaimer: 'Configuration weights are prototype modeling parameters and not clinically validated guidelines.'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch admin config', message: err.message });
  }
});

// Update feature weights
adminRouter.put('/weights', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { weights } = req.body;
    if (!weights || typeof weights !== 'object') {
      return res.status(400).json({ error: 'Valid weights object required' });
    }

    const updated = await db.updateWeights(weights);
    res.json({
      message: 'Feature weights updated successfully',
      activeWeights: updated
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update feature weights', message: err.message });
  }
});

// Reset feature weights to default
adminRouter.post('/reset-weights', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reset = await db.updateWeights(config.defaultWeights);
    res.json({
      message: 'Feature weights reset to default prototype values',
      activeWeights: reset
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset weights', message: err.message });
  }
});

// Get Audit Events (Sanitized, no patient PHI)
adminRouter.get('/audit', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const events = await db.getAuditEvents(50);
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch audit events', message: err.message });
  }
});

// System Stats
adminRouter.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const analyses = await db.getAnalyses();
    const low = analyses.filter(a => a.riskCategory === 'Low').length;
    const moderate = analyses.filter(a => a.riskCategory === 'Moderate').length;
    const high = analyses.filter(a => a.riskCategory === 'High').length;

    res.json({
      totalAnalyses: analyses.length,
      categoryDistribution: {
        low,
        moderate,
        high,
        unclassified: analyses.length - (low + moderate + high)
      },
      modelVersion: config.modelVersion,
      systemStatus: 'ONLINE'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch statistics', message: err.message });
  }
});
