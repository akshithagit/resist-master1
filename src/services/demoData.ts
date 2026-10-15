/**
 * ResistAI - Synthetic Demonstration Datasets
 * PRD Sections 55, 65, 66
 * 
 * Strict Requirement: Non-identifying, synthetic medical demonstration data.
 * All records are explicitly labeled "SYNTHETIC DEMONSTRATION DATA".
 */

import { AMRAnalysis } from '../types/amr';

export interface DemoCase {
  id: string;
  title: string;
  description: string;
  expectedCategory: 'Low' | 'Moderate' | 'High' | 'Insufficient';
  sampleDocumentName: string;
  sampleDocumentText: string;
  analysis: AMRAnalysis;
}

export const SYNTHETIC_DEMO_CASES: DemoCase[] = [
  {
    id: 'demo_case_1',
    title: 'Case 1: Low AMR Risk (Uncomplicated UTI)',
    description: 'Isolated E. coli fully susceptible to first-line agents; single completed prior course, acute mild symptoms.',
    expectedCategory: 'Low',
    sampleDocumentName: 'synthetic_urine_culture_low_risk.pdf',
    sampleDocumentText: `--- Page 1 ---
SYNTHETIC DEMONSTRATION MEDICAL REPORT - NOT A REAL PATIENT
CLINICAL LABORATORY & MICROBIOLOGY SERVICE
Patient ID: SYNTH-001 (Synthetic Demo) | Age: 28 | Sex: Female
Date: 02-Oct-2026

Specimen: Initialstream Urine
Microscopy: WBC 15-20 / HPF, RBC 2-4 / HPF, Epithelial Cells 1-2 / HPF
Culture Result: Pure growth of Escherichia coli > 100,000 CFU/mL

ANTIMICROBIAL SUSCEPTIBILITY TESTING (AST):
Nitrofurantoin: Susceptible (MIC <= 16 µg/mL)
Ciprofloxacin: Susceptible (MIC <= 0.25 µg/mL)
Ceftriaxone: Susceptible (MIC <= 1 µg/mL)
Amoxicillin-Clavulanate: Susceptible (MIC <= 8 µg/mL)
Trimethoprim-Sulfamethoxazole: Susceptible (MIC <= 2/38 µg/mL)

Interpretation: Standard pan-susceptible urinary isolate. No ESBL or carbapenemase detected.`,
    analysis: {
      id: 'demo_case_1',
      title: 'Demo: Uncomplicated Urinary Tract Infection',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'CALCULATED',
      isDemo: true,
      documents: [
        {
          id: 'doc_demo_1',
          filename: 'synthetic_urine_culture_low_risk.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: 24500,
          uri: 'demo://synthetic_urine_culture_low_risk.pdf',
          uploadedAt: new Date().toISOString(),
          pageCount: 1,
          ocrStatus: 'completed',
          extractedTextByPage: [
            {
              page: 1,
              confidence: 96,
              text: `Specimen: Initialstream Urine\nCulture: Pure growth of Escherichia coli > 100,000 CFU/mL\nSusceptibility:\nNitrofurantoin: Susceptible\nCiprofloxacin: Susceptible\nCeftriaxone: Susceptible\nAmoxicillin-Clavulanate: Susceptible\nTrimethoprim-Sulfamethoxazole: Susceptible`,
            },
          ],
        },
      ],
      extractedEntities: [
        {
          id: 'demo1_e1',
          entityType: 'organism',
          rawValue: 'Escherichia coli',
          normalizedValue: 'Escherichia coli',
          sourceText: 'Pure growth of Escherichia coli',
          pageNumber: 1,
          confidence: 0.98,
          extractionMethod: 'nlp_medical_dictionary',
        },
      ],
      susceptibilityResults: [
        { id: 'demo1_s1', antibiotic: 'Nitrofurantoin', interpretation: 'Susceptible', micValue: '<= 16 µg/mL', pageNumber: 1, confidence: 0.96 },
        { id: 'demo1_s2', antibiotic: 'Ciprofloxacin', interpretation: 'Susceptible', micValue: '<= 0.25 µg/mL', pageNumber: 1, confidence: 0.96 },
        { id: 'demo1_s3', antibiotic: 'Ceftriaxone', interpretation: 'Susceptible', micValue: '<= 1 µg/mL', pageNumber: 1, confidence: 0.96 },
        { id: 'demo1_s4', antibiotic: 'Amoxicillin-Clavulanate', interpretation: 'Susceptible', micValue: '<= 8 µg/mL', pageNumber: 1, confidence: 0.96 },
        { id: 'demo1_s5', antibiotic: 'Trimethoprim-Sulfamethoxazole', interpretation: 'Susceptible', micValue: '<= 2/38 µg/mL', pageNumber: 1, confidence: 0.96 },
      ],
      cultureFindings: {
        specimen: 'Initialstream',
        organism: 'Escherichia coli',
        colonyCount: '> 100,000 CFU/mL',
        isPositive: true,
        mixedGrowth: false,
        contaminationSuspected: false,
      },
      patientInput: {
        symptoms: 'Dysuria, urinary urgency, mild suprapubic discomfort',
        symptomDuration: '3–7 days',
        severity: 'Mild',
        infectionType: 'Urinary',
        previousAntibioticExposure: 'One previous course',
        treatmentDurationDays: 5,
        courseCompletion: 'Completed as prescribed',
        persistentInfection: 'No',
        additionalNotes: 'Completed full course of nitrofurantoin 6 months ago without complication.',
      },
    },
  },

  {
    id: 'demo_case_2',
    title: 'Case 2: High AMR Risk (Complicated MDR Klebsiella)',
    description: 'Klebsiella pneumoniae ESBL positive, blaCTX-M documented, resistant to cephalosporins & fluoroquinolones, recurrent symptoms, repeated exposure.',
    expectedCategory: 'High',
    sampleDocumentName: 'synthetic_recurrent_uti_mdr.pdf',
    sampleDocumentText: `--- Page 1 ---
SYNTHETIC DEMONSTRATION MEDICAL REPORT - NOT A REAL PATIENT
DEPARTMENT OF MEDICAL MICROBIOLOGY & INFECTIOUS DISEASES
Patient ID: SYNTH-002 (Synthetic Demo) | Age: 67 | Sex: Male
Clinical Indication: Recurrent complicated pyelonephritis / indwelling catheter

Specimen: Catheterized Urine
Culture: Heavy growth of Klebsiella pneumoniae > 100,000 CFU/mL
Resistance Screen: ESBL Positive
Molecular PCR: blaCTX-M gene detected

ANTIMICROBIAL SUSCEPTIBILITY:
Ceftriaxone: Resistant (MIC >= 64 µg/mL)
Ciprofloxacin: Resistant (MIC >= 8 µg/mL)
Levofloxacin: Resistant (MIC >= 8 µg/mL)
Piperacillin-Tazobactam: Resistant (MIC >= 128 µg/mL)
Cefepime: Resistant (MIC >= 32 µg/mL)
Ertapenem: Intermediate (MIC 1 µg/mL)
Meropenem: Susceptible (MIC <= 0.5 µg/mL)
Amikacin: Susceptible (MIC <= 4 µg/mL)
Colistin: Susceptible (MIC <= 0.5 µg/mL)

Remark: Multi-Drug Resistant (MDR) organism. Extended-spectrum beta-lactamase producer.`,
    analysis: {
      id: 'demo_case_2',
      title: 'Demo: Complicated MDR Klebsiella Infection',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'CALCULATED',
      isDemo: true,
      documents: [
        {
          id: 'doc_demo_2',
          filename: 'synthetic_recurrent_uti_mdr.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: 31200,
          uri: 'demo://synthetic_recurrent_uti_mdr.pdf',
          uploadedAt: new Date().toISOString(),
          pageCount: 1,
          ocrStatus: 'completed',
          extractedTextByPage: [
            {
              page: 1,
              confidence: 97,
              text: `Specimen: Catheterized Urine\nCulture: Klebsiella pneumoniae > 100,000 CFU/mL\nResistance: ESBL Positive, blaCTX-M gene detected, MDR\nSusceptibility:\nCeftriaxone: Resistant\nCiprofloxacin: Resistant\nLevofloxacin: Resistant\nPiperacillin-Tazobactam: Resistant\nCefepime: Resistant\nErtapenem: Intermediate\nMeropenem: Susceptible\nAmikacin: Susceptible`,
            },
          ],
        },
      ],
      extractedEntities: [
        {
          id: 'demo2_e1',
          entityType: 'organism',
          rawValue: 'Klebsiella pneumoniae',
          normalizedValue: 'Klebsiella pneumoniae',
          sourceText: 'Heavy growth of Klebsiella pneumoniae',
          pageNumber: 1,
          confidence: 0.98,
          extractionMethod: 'nlp_medical_dictionary',
        },
        {
          id: 'demo2_e2',
          entityType: 'resistance_marker',
          rawValue: 'ESBL',
          normalizedValue: 'ESBL',
          sourceText: 'ESBL Positive',
          pageNumber: 1,
          confidence: 0.97,
          extractionMethod: 'nlp_medical_dictionary',
        },
        {
          id: 'demo2_e3',
          entityType: 'resistance_gene',
          rawValue: 'blaCTX-M',
          normalizedValue: 'blaCTX-M',
          sourceText: 'blaCTX-M gene detected',
          pageNumber: 1,
          confidence: 0.99,
          extractionMethod: 'regex_pattern',
        },
        {
          id: 'demo2_e4',
          entityType: 'resistance_marker',
          rawValue: 'MDR',
          normalizedValue: 'MDR',
          sourceText: 'Multi-Drug Resistant (MDR)',
          pageNumber: 1,
          confidence: 0.95,
          extractionMethod: 'nlp_medical_dictionary',
        },
      ],
      susceptibilityResults: [
        { id: 'demo2_s1', antibiotic: 'Ceftriaxone', interpretation: 'Resistant', micValue: '>= 64 µg/mL', pageNumber: 1, confidence: 0.98 },
        { id: 'demo2_s2', antibiotic: 'Ciprofloxacin', interpretation: 'Resistant', micValue: '>= 8 µg/mL', pageNumber: 1, confidence: 0.98 },
        { id: 'demo2_s3', antibiotic: 'Levofloxacin', interpretation: 'Resistant', micValue: '>= 8 µg/mL', pageNumber: 1, confidence: 0.98 },
        { id: 'demo2_s4', antibiotic: 'Piperacillin-Tazobactam', interpretation: 'Resistant', micValue: '>= 128 µg/mL', pageNumber: 1, confidence: 0.98 },
        { id: 'demo2_s5', antibiotic: 'Cefepime', interpretation: 'Resistant', micValue: '>= 32 µg/mL', pageNumber: 1, confidence: 0.98 },
        { id: 'demo2_s6', antibiotic: 'Ertapenem', interpretation: 'Intermediate', micValue: '1 µg/mL', pageNumber: 1, confidence: 0.95 },
        { id: 'demo2_s7', antibiotic: 'Meropenem', interpretation: 'Susceptible', micValue: '<= 0.5 µg/mL', pageNumber: 1, confidence: 0.98 },
        { id: 'demo2_s8', antibiotic: 'Amikacin', interpretation: 'Susceptible', micValue: '<= 4 µg/mL', pageNumber: 1, confidence: 0.98 },
      ],
      cultureFindings: {
        specimen: 'Catheterized Urine',
        organism: 'Klebsiella pneumoniae',
        colonyCount: '> 100,000 CFU/mL',
        isPositive: true,
        mixedGrowth: false,
        contaminationSuspected: false,
      },
      patientInput: {
        symptoms: 'High fever, flank pain, persistent cloudy urine, chills',
        symptomDuration: 'More than 14 days',
        severity: 'Severe',
        infectionType: 'Urinary',
        previousAntibioticExposure: 'Frequent/repeated exposure',
        treatmentDurationDays: 14,
        courseCompletion: 'Stopped early',
        persistentInfection: 'Recurrent',
        additionalNotes: 'Received 3 prior courses of ciprofloxacin and ceftriaxone over past 5 months. Stopped last course early due to severe nausea.',
      },
    },
  },

  {
    id: 'demo_case_3',
    title: 'Case 3: Limited Evidence (Empiric Prescription Only)',
    description: 'Patient prescribed empiric oral antibiotics without culture or susceptibility testing; stopped early.',
    expectedCategory: 'Moderate',
    sampleDocumentName: 'synthetic_empiric_prescription.pdf',
    sampleDocumentText: `--- Page 1 ---
SYNTHETIC DEMONSTRATION MEDICAL REPORT - NOT A REAL PATIENT
OUTPATIENT CLINIC PRESCRIPTION RECORD
Patient ID: SYNTH-003 (Synthetic Demo) | Age: 42
Diagnosis: Presumed bronchitis / persistent productive cough
Rx:
1. Azithromycin 500mg PO daily x 3 days
2. Follow-up if fever persists.
(No sputum culture or microbiology performed)`,
    analysis: {
      id: 'demo_case_3',
      title: 'Demo: Empiric Respiratory Therapy (Limited Data)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'CALCULATED',
      isDemo: true,
      documents: [
        {
          id: 'doc_demo_3',
          filename: 'synthetic_empiric_prescription.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: 18900,
          uri: 'demo://synthetic_empiric_prescription.pdf',
          uploadedAt: new Date().toISOString(),
          pageCount: 1,
          ocrStatus: 'completed',
          extractedTextByPage: [
            {
              page: 1,
              confidence: 95,
              text: `Prescription: Azithromycin 500mg PO daily x 3 days\nNo microbiology culture ordered.`,
            },
          ],
        },
      ],
      extractedEntities: [
        {
          id: 'demo3_e1',
          entityType: 'antibiotic',
          rawValue: 'Azithromycin 500mg',
          normalizedValue: 'Azithromycin (Prescribed)',
          sourceText: 'Azithromycin 500mg PO daily',
          pageNumber: 1,
          confidence: 0.95,
          extractionMethod: 'ocr_rule_hybrid',
        },
      ],
      susceptibilityResults: [],
      patientInput: {
        symptoms: 'Persistent cough, low grade fever, malaise',
        symptomDuration: '8–14 days',
        severity: 'Moderate',
        infectionType: 'Respiratory',
        previousAntibioticExposure: 'Multiple previous courses',
        treatmentDurationDays: 3,
        courseCompletion: 'Partially completed',
        persistentInfection: 'Persistent',
        additionalNotes: 'No lab culture available. Only clinic prescription.',
      },
    },
  },

  {
    id: 'demo_case_4',
    title: 'Case 4: Insufficient Evidence',
    description: 'Patient with mild symptoms, no medical document, and no antibiotic exposure history.',
    expectedCategory: 'Insufficient',
    sampleDocumentName: 'no_document.pdf',
    sampleDocumentText: '',
    analysis: {
      id: 'demo_case_4',
      title: 'Demo: Insufficient Evidence Case',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'DRAFT',
      isDemo: true,
      documents: [],
      extractedEntities: [],
      susceptibilityResults: [],
      patientInput: {
        symptoms: 'Mild scratchy throat',
        symptomDuration: 'Less than 3 days',
        severity: 'Mild',
        infectionType: 'Ear/nose/throat',
        previousAntibioticExposure: 'Unknown',
        courseCompletion: 'Unknown',
        persistentInfection: 'Unknown',
      },
    },
  },

  {
    id: 'demo_case_5',
    title: 'Case 5: Non-Medical Store Receipt (Validation Guard Test)',
    description: 'Commercial store receipt / grocery invoice to test OCR report validation.',
    expectedCategory: 'Insufficient',
    sampleDocumentName: 'grocery_store_receipt.pdf',
    sampleDocumentText: `STORE RECEIPT #88492\nSupermarket Mart Store #102\nDate: 02-Oct-2026\n\n1x Organic Whole Milk - $4.99\n2x Whole Wheat Bread - $6.50\n1x Fresh Apples (2lb) - $3.99\n\nSubtotal: $15.48\nTax (8%): $1.24\nTotal Amount: $16.72\nCashier: #14\nThank you for shopping with us!`,
    analysis: {
      id: 'demo_case_5',
      title: 'Demo: Invalid Store Receipt',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'DRAFT',
      isDemo: true,
      documents: [],
      extractedEntities: [],
      susceptibilityResults: [],
      patientInput: {
        symptoms: '',
        symptomDuration: 'Unknown',
        severity: 'Unknown',
        infectionType: 'Unknown',
        previousAntibioticExposure: 'Unknown',
        courseCompletion: 'Unknown',
        persistentInfection: 'Unknown',
      },
    },
  },
];
