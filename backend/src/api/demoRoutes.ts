import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/store.js';
import { config } from '../core/config.js';
import { riskCalculator } from '../risk/calculator.js';
import {
  AnalysisRecord,
  DocumentRecord,
  EntityRecord,
  SusceptibilityRecord,
  PatientInputRecord,
  ExtractedTextRecord
} from '../types/index.js';

export const demoRouter = Router();

export const DEMO_CASES = [
  {
    id: 'case-1-uncomplicated-uti',
    title: 'Case 1: Uncomplicated UTI (Predominantly Susceptible)',
    description: 'First episode of cystitis. Isolated E. coli with broad susceptibility to first-line agents. Patient completed single prescribed course without recurrence.',
    expectedCategory: 'Low',
    sampleText: 'CLINICAL MICROBIOLOGY REPORT\nSpecimen: Clean catch mid-stream urine\nMicroscopy: WBC 25-50 / hpf, RBC 0-2 / hpf\nCulture: Escherichia coli > 10^5 CFU/mL\nAntimicrobial Susceptibility Testing (Disk Diffusion & MIC):\nNitrofurantoin: Susceptible (MIC <= 16 ug/mL)\nTrimethoprim-Sulfamethoxazole: Susceptible (MIC <= 2/38 ug/mL)\nCiprofloxacin: Susceptible (MIC <= 0.25 ug/mL)\nAmoxicillin-Clavulanate: Susceptible (MIC <= 4 ug/mL)\nCeftriaxone: Susceptible (MIC <= 1 ug/mL)\nComment: Pure growth of standard uropathogen. No ESBL activity detected.',
    patientInput: {
      symptoms: 'Mild dysuria and urinary frequency for 2 days.',
      symptomDuration: 'less_than_3_days',
      severity: 'mild',
      infectionType: 'urinary',
      previousAntibioticExposure: 'one_previous_course',
      treatmentDuration: 5,
      courseCompletion: 'completed',
      persistentInfection: 'no',
      additionalNotes: 'Patient feels improved after initial therapy.'
    }
  },
  {
    id: 'case-2-mdr-klebsiella',
    title: 'Case 2: Multidrug-Resistant K. pneumoniae (ESBL & Carbapenemase)',
    description: 'Recurrent hospital-acquired complicated infection with repeated prior beta-lactam courses and stopped treatment. Highly resistant isolate.',
    expectedCategory: 'High',
    sampleText: 'CLINICAL MICROBIOLOGY & RESISTANCE SURVEILLANCE REPORT\nSpecimen: Urine & Catheter Tip\nCulture: Klebsiella pneumoniae > 10^5 CFU/mL\nPhenotypic Markers: MDR (Multi-Drug Resistant), ESBL Producer positive\nMolecular Resistance Genes: blaCTX-M-15 positive, blaNDM-1 positive (Carbapenemase)\nSusceptibility Testing:\nAmpicillin: Resistant\nCeftriaxone: Resistant (MIC >= 64 ug/mL)\nCeftazidime: Resistant (MIC >= 32 ug/mL)\nCiprofloxacin: Resistant (MIC >= 4 ug/mL)\nLevofloxacin: Resistant (MIC >= 8 ug/mL)\nPiperacillin-Tazobactam: Resistant (MIC >= 128 ug/mL)\nMeropenem: Resistant (MIC >= 16 ug/mL)\nErtapenem: Resistant (MIC >= 8 ug/mL)\nAmikacin: Intermediate (MIC = 16 ug/mL)\nColistin: Susceptible (MIC <= 0.5 ug/mL)\nComment: High-level carbapenem resistance detected. Strict contact isolation advised.',
    patientInput: {
      symptoms: 'Fever, flank discomfort, cloudy urine, fatigue continuing for 16 days.',
      symptomDuration: 'more_than_14_days',
      severity: 'severe',
      infectionType: 'urinary',
      previousAntibioticExposure: 'frequent_repeated',
      treatmentDuration: 21,
      courseCompletion: 'stopped_early',
      persistentInfection: 'recurrent',
      additionalNotes: 'Multiple courses of oral ciprofloxacin and augmentin failed over past 3 months.'
    }
  },
  {
    id: 'case-3-mrsa-wound',
    title: 'Case 3: MRSA Surgical Wound Infection',
    description: 'Post-operative deep wound dehiscence with methicillin-resistant S. aureus carrying mecA gene.',
    expectedCategory: 'High',
    sampleText: 'SURGICAL PATHOLOGY & MICROBIOLOGY\nSpecimen: Deep wound swab, post-op laparotomy\nGram Stain: Gram positive cocci in clusters, abundant neutrophils\nCulture Result: Staphylococcus aureus (abundant growth)\nResistance Markers: MRSA (Methicillin-Resistant S. aureus)\nMolecular PCR: mecA gene detected\nSusceptibility Profile:\nOxacillin: Resistant (MIC >= 4 ug/mL)\nCefoxitin: Resistant (Screen positive)\nErythromycin: Resistant\nClindamycin: Resistant (D-test positive inducible)\nCiprofloxacin: Resistant (MIC >= 4 ug/mL)\nTrimethoprim-Sulfamethoxazole: Susceptible (MIC <= 2 ug/mL)\nVancomycin: Susceptible (MIC = 1.0 ug/mL)\nLinezolid: Susceptible (MIC = 1.5 ug/mL)\nDaptomycin: Susceptible (MIC = 0.5 ug/mL)',
    patientInput: {
      symptoms: 'Erythema, purulent discharge from incision site, localized warmth for 10 days.',
      symptomDuration: '8_to_14_days',
      severity: 'moderate',
      infectionType: 'wound',
      previousAntibioticExposure: 'multiple_previous_courses',
      treatmentDuration: 10,
      courseCompletion: 'partially_completed',
      persistentInfection: 'persistent',
      additionalNotes: 'Previous prophylaxis given prior to operation.'
    }
  },
  {
    id: 'case-4-limited-evidence',
    title: 'Case 4: Limited Evidence (Symptom-Only Assessment)',
    description: 'Patient enters acute symptoms without lab report. Demonstrates evidence coverage calculation and prototype limitation warnings.',
    expectedCategory: 'Moderate',
    sampleText: 'CLINICAL ENCOUNTER NOTES (Non-laboratory)\nPatient attended outpatient clinic with acute respiratory complaints.\nNo sputum culture or laboratory sensitivity panels performed yet.',
    patientInput: {
      symptoms: 'Dry cough, low-grade fever, sore throat for 5 days.',
      symptomDuration: '3_to_7_days',
      severity: 'moderate',
      infectionType: 'respiratory',
      previousAntibioticExposure: 'one_previous_course',
      treatmentDuration: 7,
      courseCompletion: 'completed',
      persistentInfection: 'no',
      additionalNotes: 'Empiric therapy requested, culture pending.'
    }
  },
  {
    id: 'case-5-susceptibility-gap',
    title: 'Case 5: Susceptibility Testing Pending / Missing',
    description: 'Document demonstrates bacterial growth (Pseudomonas aeruginosa) with susceptibility panel in progress. Verifies that missing data is NOT treated as susceptible.',
    expectedCategory: 'Moderate',
    sampleText: 'INTERIM MICROBIOLOGY REPORT\nSpecimen: Bronchoalveolar lavage (BAL)\nCulture: Pseudomonas aeruginosa isolated, heavy pure growth (> 10^5 CFU/mL)\nAntimicrobial Susceptibility: PENDING (Automated AST in progress, final report in 24-48h)\nGram stain: Gram-negative rods observed.',
    patientInput: {
      symptoms: 'Productive cough with green sputum, shortness of breath for 9 days.',
      symptomDuration: '8_to_14_days',
      severity: 'severe',
      infectionType: 'respiratory',
      previousAntibioticExposure: 'multiple_previous_courses',
      treatmentDuration: 12,
      courseCompletion: 'partially_completed',
      persistentInfection: 'persistent',
      additionalNotes: 'Previously received oral azithromycin with minimal resolution.'
    }
  }
];

// List available demo cases
demoRouter.get('/cases', (req: Request, res: Response) => {
  res.json(DEMO_CASES);
});

// Load a complete synthetic case into the system for instant testing
demoRouter.post('/load-case/:caseId', async (req: Request, res: Response) => {
  try {
    const { caseId } = req.params;
    const demoCase = DEMO_CASES.find(c => c.id === caseId) || DEMO_CASES[0];

    const analysisId = uuidv4();
    const userId = 'demo-user-id';

    // 1. Create Analysis
    const analysis: AnalysisRecord = {
      id: analysisId,
      userId,
      title: demoCase.title + ' [SYNTHETIC DEMO]',
      status: 'CALCULATING',
      modelVersion: config.modelVersion,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await db.createAnalysis(analysis);

    // 2. Create Synthetic Document & OCR Text
    const docId = uuidv4();
    const doc: DocumentRecord = {
      id: docId,
      analysisId,
      storageKey: `'synthetic_' + caseId + '.pdf'`,
      originalFilename: `demoCase.id.replace(/[-]/g, '_') + '_synthetic_report.pdf'`,
      mimeType: 'application/pdf',
      fileSize: 48200,
      pageCount: 1,
      ocrStatus: 'COMPLETED',
      createdAt: new Date().toISOString()
    };
    await db.createDocument(doc);

    const extractedText: ExtractedTextRecord = {
      id: uuidv4(),
      documentId: docId,
      pageNumber: 1,
      text: demoCase.sampleText,
      ocrConfidence: 0.97,
      createdAt: new Date().toISOString()
    };
    await db.addExtractedTexts([extractedText]);

    // 3. Extract Entities & Susceptibilities using NLP Engine
    const { nlpEngine } = await import('../nlp/nlpEngine.js');
    const { entities, susceptibilityResults } = nlpEngine.extractFromText(
      [{ pageNumber: 1, text: demoCase.sampleText, documentId: docId }],
      analysisId
    );
    await db.replaceEntities(analysisId, entities);
    await db.replaceSusceptibilityResults(analysisId, susceptibilityResults);

    // 4. Save Patient Inputs
    const patientInput: PatientInputRecord = {
      id: uuidv4(),
      analysisId,
      symptoms: demoCase.patientInput.symptoms,
      symptomDuration: demoCase.patientInput.symptomDuration as any,
      severity: demoCase.patientInput.severity as any,
      infectionType: demoCase.patientInput.infectionType as any,
      previousAntibioticExposure: demoCase.patientInput.previousAntibioticExposure as any,
      treatmentDuration: demoCase.patientInput.treatmentDuration,
      courseCompletion: demoCase.patientInput.courseCompletion as any,
      persistentInfection: demoCase.patientInput.persistentInfection as any,
      additionalNotes: demoCase.patientInput.additionalNotes,
      createdAt: new Date().toISOString()
    };
    await db.setPatientInput(patientInput);

    // 5. Calculate AMR Risk Index
    const weights = db.getWeights();
    const calculation = riskCalculator.calculate(
      analysisId,
      entities,
      susceptibilityResults,
      patientInput,
      weights
    );

    await db.replaceRiskFeatures(analysisId, calculation.features);

    if (calculation.riskPercentage !== null && calculation.riskCategory !== null) {
      const riskResult = {
        id: uuidv4(),
        analysisId,
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
      await db.updateAnalysis(analysisId, {
        status: 'COMPLETE',
        riskPercentage: calculation.riskPercentage,
        riskCategory: calculation.riskCategory,
        evidenceCoverage: calculation.evidenceCoverage
      });

      res.status(201).json({
        message: 'Synthetic demo case loaded successfully',
        analysisId,
        case: demoCase,
        risk: {
          percentage: calculation.riskPercentage,
          category: calculation.riskCategory,
          evidenceCoverage: calculation.evidenceCoverage,
          coveragePercentage: calculation.coveragePercentage
        },
        majorFactors: calculation.majorFactors,
        entitiesCount: entities.length,
        susceptibilityCount: susceptibilityResults.length
      });
    } else {
      await db.updateAnalysis(analysisId, { status: 'AWAITING_REVIEW' });
      res.status(201).json({
        message: 'Synthetic demo case loaded (Insufficient data)',
        analysisId,
        case: demoCase,
        risk: null
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load synthetic demo case', message: err.message });
  }
});
