import path from 'path';
import dotenv from 'dotenv';
import { FeatureWeightsConfig } from '../types/index.js';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  host: process.env.HOST || '0.0.0.0',
  jwtSecret: process.env.JWT_SECRET || 'resistai-super-secure-medical-token-secret-2026',
  jwtExpiresIn: '7d',
  modelVersion: 'risk-model-0.1.0',
  calculationVersion: 'calc-1.0.0',
  featureConfigVersion: 'feat-1.0.0',
  uploadDir: path.resolve(process.cwd(), 'uploads'),
  dataDir: path.resolve(process.cwd(), 'data'),
  maxUploadSizeBytes: 25 * 1024 * 1024, // 25 MB
  allowedMimeTypes: [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp'
  ],
  thresholds: {
    lowMax: 30.0,
    moderateMax: 60.0,
    highMax: 100.0
  },
  defaultWeights: {
    documented_resistance: 10,
    susceptibility_resistance: 10,
    resistance_gene: 10,
    organism_signal: 7,
    repeated_antibiotic_exposure: 7,
    persistent_infection: 6,
    recurrent_infection: 6,
    incomplete_treatment: 5,
    prolonged_treatment: 4,
    laboratory_signal: 4,
    symptom_duration: 3,
    symptom_severity: 3,
    culture_signal: 5
  } as FeatureWeightsConfig
};
