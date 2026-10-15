/**
 * ResistAI - Type Definitions
 * AI-Powered Medical Report Analysis & Antimicrobial Resistance (AMR) Risk Prediction System
 */

export type RiskCategory = 'Low' | 'Moderate' | 'High';

export type EvidenceCoverage = 'Limited' | 'Moderate' | 'Broad';

export type ExtractionMethod = 'ocr_rule_hybrid' | 'nlp_medical_dictionary' | 'regex_pattern' | 'user_entered';

export interface ExtractedEntity {
  id: string;
  entityType: 'organism' | 'antibiotic' | 'culture' | 'susceptibility' | 'resistance_marker' | 'resistance_gene' | 'lab_value';
  rawValue: string;
  normalizedValue: string;
  sourceText: string;
  pageNumber: number;
  confidence: number; // 0.0 - 1.0
  extractionMethod: ExtractionMethod;
  isUserModified?: boolean;
}

export interface SusceptibilityResult {
  id: string;
  antibiotic: string;
  interpretation: 'Susceptible' | 'Intermediate' | 'Resistant' | 'Unknown';
  micValue?: string;
  micUnit?: string;
  sourceDocument?: string;
  pageNumber: number;
  confidence: number;
  isUserModified?: boolean;
}

export interface CultureFinding {
  specimen: string;
  organism: string;
  colonyCount?: string;
  isPositive: boolean;
  mixedGrowth: boolean;
  contaminationSuspected: boolean;
  notes?: string;
}

export type SymptomDuration = 'Less than 3 days' | '3–7 days' | '8–14 days' | 'More than 14 days' | 'Unknown';
export type SymptomSeverity = 'Mild' | 'Moderate' | 'Severe' | 'Unknown';
export type InfectionType = 
  | 'Urinary'
  | 'Respiratory'
  | 'Skin/soft tissue'
  | 'Gastrointestinal'
  | 'Bloodstream'
  | 'Wound'
  | 'Reproductive/gynecological'
  | 'Ear/nose/throat'
  | 'Other'
  | 'Unknown';

export type PreviousExposure = 'None known' | 'One previous course' | 'Multiple previous courses' | 'Frequent/repeated exposure' | 'Unknown';
export type CourseCompletion = 'Completed as prescribed' | 'Partially completed' | 'Stopped early' | 'Unknown';
export type PersistenceStatus = 'No' | 'Persistent' | 'Recurrent' | 'Unknown';

export interface PatientClinicalInput {
  symptoms: string;
  symptomDuration: SymptomDuration;
  severity: SymptomSeverity;
  infectionType: InfectionType;
  previousAntibioticExposure: PreviousExposure;
  treatmentDurationDays?: number | 'Unknown';
  courseCompletion: CourseCompletion;
  persistentInfection: PersistenceStatus;
  additionalNotes?: string;
}

export interface AMRFeature {
  name: string;
  displayName: string;
  rawValue: string | number | boolean | null;
  normalizedContribution: number; // 0.0 to 1.0
  weight: number;
  available: boolean;
  evidence: string;
  confidence: number;
  sourceDocument?: string;
  pageNumber?: number;
}

export interface ContributingFactor {
  name: string;
  displayName: string;
  impact: 'low' | 'moderate' | 'high';
  normalizedContribution: number;
  weightedContribution: number;
  weight: number;
  reason: string;
  sourceDocument?: string;
  pageNumber?: number;
  evidenceSnippet?: string;
  confidence: number;
}

export interface FeatureWeightsConfig {
  documented_resistance: number;
  susceptibility_resistance: number;
  resistance_gene: number;
  organism_signal: number;
  repeated_antibiotic_exposure: number;
  persistent_infection: number;
  recurrent_infection: number;
  incomplete_treatment: number;
  prolonged_treatment: number;
  laboratory_signal: number;
  symptom_duration: number;
  symptom_severity: number;
  culture_signal: number;
}

export interface RiskCalculationResult {
  riskPercentage: number | null; // null if insufficient evidence
  riskCategory: RiskCategory;
  modelVersion: string;
  calculationVersion: string;
  featureConfigVersion: string;
  evidenceCoverage: EvidenceCoverage;
  evidenceCoverageScore: number; // 0 - 100%
  totalAvailableWeight: number;
  totalConfiguredWeight: number;
  availableFeatureCount: number;
  contributingFactors: ContributingFactor[];
  features: AMRFeature[];
  clinicalSafetyAlerts: string[];
  calculatedAt: string;
  isSufficientEvidence: boolean;
  insufficientReason?: string;
}

export interface MedicalDocument {
  id: string;
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
  uri: string;
  uploadedAt: string;
  pageCount: number;
  ocrStatus: 'pending' | 'processing' | 'completed' | 'failed';
  extractedTextByPage: { page: number; text: string; confidence: number }[];
}

export interface AMRAnalysis {
  id: string;
  userId?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  status: 'DRAFT' | 'OCR_COMPLETED' | 'EXTRACTION_COMPLETED' | 'REVIEWED' | 'CALCULATED';
  documents: MedicalDocument[];
  extractedEntities: ExtractedEntity[];
  susceptibilityResults: SusceptibilityResult[];
  cultureFindings?: CultureFinding;
  patientInput: PatientClinicalInput;
  riskResult?: RiskCalculationResult;
  isDemo?: boolean;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  analysisId?: string;
  eventType: 'ANALYSIS_CREATED' | 'DOCUMENT_UPLOADED' | 'OCR_PROCESSED' | 'EXTRACTION_PERFORMED' | 'MANUAL_CORRECTION' | 'RISK_CALCULATED' | 'REPORT_EXPORTED' | 'ANALYSIS_DELETED';
  description: string;
  metadata?: Record<string, string | number | boolean>;
}
