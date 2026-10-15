/**
 * ResistAI - Configuration & Clinical Constants
 * Based on PRD Sections 19, 21, 25, 26, 70
 */

import { FeatureWeightsConfig } from '../types/amr';

export const RISK_MODEL_METADATA = {
  MODEL_VERSION: 'risk-model-0.1.0',
  FEATURE_CONFIG_VERSION: '1.0.0',
  CALCULATION_VERSION: '1.0.0',
  ENGINE_NAME: 'ResistAI Weighted Evidence Model',
};

/**
 * Prototype Feature Weights
 * Defined in PRD Section 19.
 * Stored in configurable records; researchers can adjust without modifying code.
 */
export const DEFAULT_FEATURE_WEIGHTS: FeatureWeightsConfig = {
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
  culture_signal: 5,
};

export const RISK_THRESHOLDS = {
  LOW_MAX: 30.0,
  MODERATE_MAX: 60.0,
  HIGH_MAX: 100.0,
};

export const EVIDENCE_COVERAGE_THRESHOLDS = {
  LIMITED_MAX: 35.0,
  MODERATE_MAX: 70.0,
};

export const CLINICAL_SAFETY_MESSAGES = {
  PRIMARY_DISCLAIMER: 
    'ResistAI provides a prototype AMR risk estimate for research, awareness, surveillance, and decision-support purposes. It is not a clinically validated probability, diagnosis, or confirmation of antimicrobial resistance. Laboratory culture and antimicrobial susceptibility testing interpreted by a qualified healthcare professional remain necessary for confirmation and treatment decisions.',
  NO_PRESCRIBING_WARNING: 
    'Do not start, stop, extend, or change antibiotics based solely on this result.',
  EMERGENCY_WARNING:
    'If you are experiencing severe symptoms such as high fever, confusion, difficulty breathing, or rapid worsening, seek emergency medical care immediately.',
  NON_DIAGNOSTIC_LABEL: 'Prototype AMR Risk Estimate — Non-Diagnostic Decision Support',
  SYNTHETIC_DEMO_LABEL: 'Synthetic Demonstration Data — For Research & Evaluation Only',
};

/**
 * Known Medical Entities & Pathogens for NLP extraction
 */
export const KNOWN_ORGANISMS = [
  { name: 'Escherichia coli', genus: 'Escherichia', riskSignal: 0.35, aliases: ['e. coli', 'e.coli', 'escherichia coli'] },
  { name: 'Klebsiella pneumoniae', genus: 'Klebsiella', riskSignal: 0.65, aliases: ['k. pneumoniae', 'k.pneumoniae', 'klebsiella pneumoniae', 'klebsiella spp'] },
  { name: 'Pseudomonas aeruginosa', genus: 'Pseudomonas', riskSignal: 0.80, aliases: ['p. aeruginosa', 'p.aeruginosa', 'pseudomonas aeruginosa', 'pseudomonas'] },
  { name: 'Staphylococcus aureus', genus: 'Staphylococcus', riskSignal: 0.50, aliases: ['s. aureus', 's.aureus', 'staphylococcus aureus', 'staph aureus'] },
  { name: 'Acinetobacter baumannii', genus: 'Acinetobacter', riskSignal: 0.85, aliases: ['a. baumannii', 'a.baumannii', 'acinetobacter baumannii', 'acinetobacter'] },
  { name: 'Enterococcus faecium', genus: 'Enterococcus', riskSignal: 0.70, aliases: ['e. faecium', 'enterococcus faecium'] },
  { name: 'Enterococcus faecalis', genus: 'Enterococcus', riskSignal: 0.40, aliases: ['e. faecalis', 'enterococcus faecalis'] },
  { name: 'Proteus mirabilis', genus: 'Proteus', riskSignal: 0.30, aliases: ['p. mirabilis', 'proteus mirabilis'] },
  { name: 'Enterobacter cloacae', genus: 'Enterobacter', riskSignal: 0.65, aliases: ['e. cloacae', 'enterobacter cloacae'] },
  { name: 'Streptococcus pneumoniae', genus: 'Streptococcus', riskSignal: 0.45, aliases: ['s. pneumoniae', 'streptococcus pneumoniae', 'pneumococcus'] },
];

export const KNOWN_ANTIBIOTICS = [
  'Amikacin', 'Amoxicillin', 'Amoxicillin-Clavulanate', 'Ampicillin', 'Ampicillin-Sulbactam',
  'Azithromycin', 'Aztreonam', 'Cefazolin', 'Cefepime', 'Cefixime', 'Cefotaxime',
  'Cefoxitin', 'Ceftazidime', 'Ceftriaxone', 'Cefuroxime', 'Ciprofloxacin',
  'Clarithromycin', 'Clindamycin', 'Colistin', 'Daptomycin', 'Doxycycline',
  'Ertapenem', 'Gentamicin', 'Imipenem', 'Levofloxacin', 'Linezolid',
  'Meropenem', 'Moxifloxacin', 'Nitrofurantoin', 'Oxacillin', 'Piperacillin-Tazobactam',
  'Polymyxin B', 'Rifampin', 'Tigecycline', 'Tobramycin', 'Trimethoprim-Sulfamethoxazole',
  'Vancomycin'
];

export const KNOWN_RESISTANCE_MARKERS = [
  { term: 'ESBL', fullName: 'Extended-Spectrum Beta-Lactamase', riskContribution: 0.85 },
  { term: 'MRSA', fullName: 'Methicillin-Resistant Staphylococcus aureus', riskContribution: 0.80 },
  { term: 'VRE', fullName: 'Vancomycin-Resistant Enterococcus', riskContribution: 0.85 },
  { term: 'CRE', fullName: 'Carbapenem-Resistant Enterobacterales', riskContribution: 0.95 },
  { term: 'CPE', fullName: 'Carbapenemase-Producing Enterobacterales', riskContribution: 0.95 },
  { term: 'MDR', fullName: 'Multi-Drug Resistant', riskContribution: 0.85 },
  { term: 'XDR', fullName: 'Extensively Drug-Resistant', riskContribution: 0.95 },
  { term: 'PDR', fullName: 'Pan-Drug Resistant', riskContribution: 1.00 },
  { term: 'Carbapenem Resistant', fullName: 'Carbapenem Resistance Documented', riskContribution: 0.90 },
  { term: 'Fluoroquinolone Resistant', fullName: 'Fluoroquinolone Resistance Documented', riskContribution: 0.70 },
];

export const KNOWN_RESISTANCE_GENES = [
  { gene: 'mecA', description: 'Methicillin resistance in Staphylococci', riskContribution: 0.90 },
  { gene: 'mecC', description: 'Novel methicillin resistance determinant', riskContribution: 0.90 },
  { gene: 'blaCTX-M', description: 'Extended-spectrum beta-lactamase (CTX-M family)', riskContribution: 0.90 },
  { gene: 'blaKPC', description: 'Klebsiella pneumoniae carbapenemase', riskContribution: 0.95 },
  { gene: 'blaNDM', description: 'New Delhi metallo-beta-lactamase', riskContribution: 1.00 },
  { gene: 'blaOXA-48', description: 'OXA-48-like carbapenemase', riskContribution: 0.95 },
  { gene: 'blaVIM', description: 'Verona integron-encoded metallo-beta-lactamase', riskContribution: 0.95 },
  { gene: 'blaIMP', description: 'IMP-type metallo-beta-lactamase', riskContribution: 0.95 },
  { gene: 'vanA', description: 'Vancomycin resistance gene cluster A', riskContribution: 0.90 },
  { gene: 'vanB', description: 'Vancomycin resistance gene cluster B', riskContribution: 0.85 },
];
