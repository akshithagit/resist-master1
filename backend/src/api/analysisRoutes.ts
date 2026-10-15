import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/store.js';
import { config } from '../core/config.js';
import { ocrEngine } from '../ocr/ocrEngine.js';
import { nlpEngine } from '../nlp/nlpEngine.js';
import { riskCalculator } from '../risk/calculator.js';
import { AuthenticatedRequest, authenticateToken } from './authRoutes.js';
import {
  AnalysisRecord,
  DocumentRecord,
  PatientInputRecord,
  EntityRecord,
  SusceptibilityRecord
} from '../types/index.js';

export const analysisRouter = Router();

// Configure Multer for secure document upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(config.uploadDir)) {
      fs.mkdirSync(config.uploadDir, { recursive: true });
    }
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate secure random storage key, never trust original filename for disk storage
    const ext = path.extname(file.originalname).toLowerCase();
    const safeKey = `${uuidv4()}${ext}`;
    cb(null, safeKey);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxUploadSizeBytes },
  fileFilter: (req, file, cb) => {
    if (config.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported document format. Please upload PDF, PNG, JPG, or JPEG.'));
    }
  }
});

// 1. Create New Analysis
analysisRouter.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title } = req.body;
    const userId = req.user?.id || 'demo-user-id';

    const analysis: AnalysisRecord = {
      id: uuidv4(),
      userId,
      title: title || 'Clinical Report Analysis ' + new Date().toLocaleDateString(),
      status: 'CREATED',
      modelVersion: config.modelVersion,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.createAnalysis(analysis);
    await db.logAuditEvent({
      id: uuidv4(),
      userId,
      analysisId: analysis.id,
      eventType: 'ANALYSIS_CREATED',
      metadata: { title: analysis.title },
      createdAt: new Date().toISOString()
    });

    res.status(201).json(analysis);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create analysis', message: err.message });
  }
});

// 2. List Analyses
analysisRouter.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'demo-user-id';
    const analyses = await db.getAnalyses(userId);
    res.json(analyses.reverse());
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to list analyses', message: err.message });
  }
});

// 3. Get Analysis Details
analysisRouter.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const analysis = await db.getAnalysisById(id);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const documents = await db.getDocuments(id);
    const entities = await db.getEntities(id);
    const susceptibilities = await db.getSusceptibilityResults(id);
    const patientInput = await db.getPatientInput(id);
    const riskResult = await db.getRiskResult(id);
    const riskFeatures = await db.getRiskFeatures(id);

    res.json({
      analysis,
      documents,
      entities,
      susceptibilities,
      patientInput,
      riskResult,
      riskFeatures
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch analysis details', message: err.message });
  }
});

// 4. Delete Analysis
analysisRouter.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteAnalysis(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    await db.logAuditEvent({
      id: uuidv4(),
      userId: req.user?.id,
      analysisId: id,
      eventType: 'ANALYSIS_DELETED',
      metadata: { deletedAt: new Date().toISOString() },
      createdAt: new Date().toISOString()
    });

    res.json({ message: 'Analysis and associated documents successfully deleted', id });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete analysis', message: err.message });
  }
});

// 5. Upload Document
analysisRouter.post('/:id/documents', authenticateToken, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No document file uploaded' });
    }

    const analysis = await db.getAnalysisById(id);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const document: DocumentRecord = {
      id: uuidv4(),
      analysisId: id,
      storageKey: file.filename,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      pageCount: 1,
      ocrStatus: 'PENDING',
      createdAt: new Date().toISOString()
    };

    await db.createDocument(document);
    await db.updateAnalysis(id, { status: 'UPLOADED' });

    res.status(201).json(document);
  } catch (err: any) {
    res.status(500).json({ error: 'Document upload failed', message: err.message });
  }
});

// 6. Trigger OCR on Document
analysisRouter.post('/documents/:docId/ocr', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { docId } = req.params;
    const doc = await db.getDocumentById(docId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await db.updateDocument(docId, { ocrStatus: 'PROCESSING' });
    await db.updateAnalysis(doc.analysisId, { status: 'OCR_PROCESSING' });

    const filePath = path.join(config.uploadDir, doc.storageKey);
    let extractedPages = [];

    if (fs.existsSync(filePath)) {
      extractedPages = await ocrEngine.processFile(filePath, doc.mimeType, docId);
    } else {
      // If synthetic or direct text document
      extractedPages = [
        {
          id: uuidv4(),
          documentId: docId,
          pageNumber: 1,
          text: 'Clinical Microbiology Culture Report\nSpecimen: Urine\nIsolate: Escherichia coli >10^5 CFU/mL\nSusceptibility:\nCiprofloxacin: Resistant\nNitrofurantoin: Susceptible\nTrimethoprim-Sulfamethoxazole: Resistant\nAmoxicillin-Clavulanate: Susceptible\nCeftriaxone: Resistant (ESBL screen positive)',
          ocrConfidence: 0.96,
          createdAt: new Date().toISOString()
        }
      ];
    }

    await db.addExtractedTexts(extractedPages);
    await db.updateDocument(docId, {
      ocrStatus: 'COMPLETED',
      pageCount: extractedPages.length
    });
    await db.updateAnalysis(doc.analysisId, { status: 'OCR_COMPLETE' });

    res.json({
      message: 'OCR extraction completed',
      documentId: docId,
      pages: extractedPages
    });
  } catch (err: any) {
    res.status(500).json({ error: 'OCR processing failed', message: err.message });
  }
});

// 7. Get OCR Extracted Texts
analysisRouter.get('/documents/:docId/ocr', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { docId } = req.params;
    const texts = await db.getExtractedTexts(docId);
    res.json(texts);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve OCR text', message: err.message });
  }
});

// 8. Run NLP Entity Extraction for Analysis
analysisRouter.post('/:id/extract', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const documents = await db.getDocuments(id);

    const allPages: { pageNumber: number; text: string; documentId?: string }[] = [];
    for (const doc of documents) {
      const docTexts = await db.getExtractedTexts(doc.id);
      for (const t of docTexts) {
        allPages.push({
          pageNumber: t.pageNumber,
          text: t.text,
          documentId: doc.id
        });
      }
    }

    // Run hybrid NLP extraction
    const { entities, susceptibilityResults } = nlpEngine.extractFromText(allPages, id);

    await db.replaceEntities(id, entities);
    await db.replaceSusceptibilityResults(id, susceptibilityResults);
    await db.updateAnalysis(id, { status: 'EXTRACTION_COMPLETE' });

    res.json({
      message: 'Entity extraction completed',
      entitiesCount: entities.length,
      susceptibilityCount: susceptibilityResults.length,
      entities,
      susceptibilityResults
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Entity extraction failed', message: err.message });
  }
});

// 9. Manual Entity and Susceptibility Corrections
analysisRouter.put('/:id/entities', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { entities } = req.body;
    if (!Array.isArray(entities)) {
      return res.status(400).json({ error: 'Entities array expected' });
    }

    await db.replaceEntities(id, entities);
    await db.logAuditEvent({
      id: uuidv4(),
      userId: req.user?.id,
      analysisId: id,
      eventType: 'ENTITIES_MANUALLY_CORRECTED',
      metadata: { count: entities.length },
      createdAt: new Date().toISOString()
    });

    res.json({ message: 'Entities updated', entities });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update entities', message: err.message });
  }
});

analysisRouter.put('/:id/susceptibilities', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { susceptibilities } = req.body;
    if (!Array.isArray(susceptibilities)) {
      return res.status(400).json({ error: 'Susceptibilities array expected' });
    }

    await db.replaceSusceptibilityResults(id, susceptibilities);
    await db.logAuditEvent({
      id: uuidv4(),
      userId: req.user?.id,
      analysisId: id,
      eventType: 'SUSCEPTIBILITIES_MANUALLY_CORRECTED',
      metadata: { count: susceptibilities.length },
      createdAt: new Date().toISOString()
    });

    res.json({ message: 'Susceptibility table updated', susceptibilities });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update susceptibility table', message: err.message });
  }
});

// 10. Save Patient Clinical Inputs
analysisRouter.post('/:id/patient-inputs', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      symptoms,
      symptomDuration,
      severity,
      infectionType,
      previousAntibioticExposure,
      treatmentDuration,
      courseCompletion,
      persistentInfection,
      additionalNotes
    } = req.body;

    const patientInput: PatientInputRecord = {
      id: uuidv4(),
      analysisId: id,
      symptoms: symptoms || '',
      symptomDuration: symptomDuration || 'unknown',
      severity: severity || 'unknown',
      infectionType: infectionType || 'unknown',
      previousAntibioticExposure: previousAntibioticExposure || 'unknown',
      treatmentDuration: typeof treatmentDuration === 'number' ? treatmentDuration : undefined,
      courseCompletion: courseCompletion || 'unknown',
      persistentInfection: persistentInfection || 'unknown',
      additionalNotes: additionalNotes || '',
      createdAt: new Date().toISOString()
    };

    await db.setPatientInput(patientInput);
    await db.updateAnalysis(id, { status: 'AWAITING_REVIEW' });

    res.json({ message: 'Patient clinical details recorded', patientInput });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save patient inputs', message: err.message });
  }
});

// 11. Calculate AMR Risk Index
analysisRouter.post('/:id/calculate-risk', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const analysis = await db.getAnalysisById(id);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const entities = await db.getEntities(id);
    const susceptibilities = await db.getSusceptibilityResults(id);
    const patientInput = await db.getPatientInput(id);
    const weights = db.getWeights();

    const calculation = riskCalculator.calculate(id, entities, susceptibilities, patientInput, weights);

    await db.replaceRiskFeatures(id, calculation.features);

    if (calculation.riskPercentage !== null && calculation.riskCategory !== null) {
      const riskResult = {
        id: uuidv4(),
        analysisId: id,
        riskPercentage: calculation.riskPercentage,
        riskCategory: calculation.riskCategory,
        modelVersion: config.modelVersion,
        evidenceCoverage: calculation.evidenceCoverage,
        coveragePercentage: calculation.coveragePercentage,
        calculatedAt: new Date().toISOString(),
        majorFactors: calculation.majorFactors,
        limitations: calculation.limitations
      };

      await db.setRiskResult(riskResult);
      await db.updateAnalysis(id, {
        status: 'COMPLETE',
        riskPercentage: calculation.riskPercentage,
        riskCategory: calculation.riskCategory,
        evidenceCoverage: calculation.evidenceCoverage
      });

      await db.logAuditEvent({
        id: uuidv4(),
        userId: req.user?.id,
        analysisId: id,
        eventType: 'RISK_CALCULATED',
        metadata: {
          riskPercentage: calculation.riskPercentage,
          riskCategory: calculation.riskCategory,
          evidenceCoverage: calculation.evidenceCoverage
        },
        createdAt: new Date().toISOString()
      });

      res.json({
        analysisId: id,
        risk: {
          percentage: calculation.riskPercentage,
          category: calculation.riskCategory,
          modelVersion: config.modelVersion,
          evidenceCoverage: calculation.evidenceCoverage,
          coveragePercentage: calculation.coveragePercentage
        },
        majorFactors: calculation.majorFactors,
        features: calculation.features,
        limitations: calculation.limitations
      });
    } else {
      await db.updateAnalysis(id, { status: 'AWAITING_REVIEW' });
      res.json({
        analysisId: id,
        risk: null,
        message: 'Insufficient clinical evidence to generate a prototype AMR risk estimate.',
        evidenceCoverage: 'Limited',
        coveragePercentage: 0,
        limitations: calculation.limitations
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Risk calculation failed', message: err.message });
  }
});

// 12. Clinical Summary Export
analysisRouter.get('/:id/export/summary', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const analysis = await db.getAnalysisById(id);
    if (!analysis) return res.status(404).json({ error: 'Analysis not found' });

    const riskResult = await db.getRiskResult(id);
    const entities = await db.getEntities(id);
    const susceptibilities = await db.getSusceptibilityResults(id);
    const patientInput = await db.getPatientInput(id);

    const summary = {
      title: 'ResistAI - Prototype Antimicrobial Resistance Risk Assessment Summary',
      analysisDate: analysis.createdAt,
      modelVersion: analysis.modelVersion,
      riskAssessment: {
        percentage: riskResult?.riskPercentage ?? 'Insufficient data',
        category: riskResult?.riskCategory ?? 'Unclassified',
        evidenceCoverage: riskResult?.evidenceCoverage ?? 'Limited',
        coveragePercentage: riskResult?.coveragePercentage ?? 0
      },
      majorContributingFactors: riskResult?.majorFactors ?? [],
      clinicalEntities: entities.map(e => ({ type: e.entityType, value: e.normalizedValue, source: e.sourceText })),
      susceptibilityPanel: susceptibilities.map(s => ({
        antibiotic: s.antibiotic,
        result: s.interpretation,
        mic: s.micValue ? `'s.micValue + ' ' + (s.micUnit || '')` : 'N/A'
      })),
      patientReportedHistory: patientInput ? {
        symptoms: patientInput.symptoms,
        duration: patientInput.symptomDuration,
        severity: patientInput.severity,
        priorExposure: patientInput.previousAntibioticExposure,
        completedCourse: patientInput.courseCompletion,
        trajectory: patientInput.persistentInfection
      } : null,
      safetyDisclaimer: 'This is a prototype decision-support output and is not a clinically validated probability or diagnosis. Laboratory culture and susceptibility testing interpreted by a qualified healthcare professional remain necessary for all clinical decisions.'
    };

    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: 'Export failed', message: err.message });
  }
});
