export type Role = 'USER' | 'CLINICIAN' | 'RESEARCHER' | 'ADMIN';

export type AnalysisStatus = 
  | 'CREATED'
  | 'UPLOADING'
  | 'UPLOADED'
  | 'OCR_PROCESSING'
  | 'OCR_COMPLETE'
  | 'NLP_PROCESSING'
  | 'EXTRACTION_COMPLETE'
  | 'AWAITING_REVIEW'
  | 'CALCULATING'
  | 'COMPLETE'
  | 'FAILED'
  | 'DELETED';

export type RiskCategory = 'Low' | 'Moderate' | 'High';
export type EvidenceCoverageLevel = 'Limited' | 'Moderate' | 'Broad';
export type SusceptibilityInterpretation = 'Susceptible' | 'Intermediate' | 'Resistant';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface DocumentRecord {
  id: string;
  analysisId: string;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  pageCount: number;
  ocrStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export interface ExtractedTextRecord {
  id: string;
  documentId: string;
  pageNumber: number;
  text: string;
  ocrConfidence: number;
  createdAt: string;
}

export interface EntityRecord {
  id: string;
  analysisId: string;
  entityType: 'organism' | 'antibiotic' | 'culture' | 'susceptibility' | 'resistance_marker' | 'resistance_gene';
  rawValue: string;
  normalizedValue: string;
  sourceText: string;
  pageNumber: number;
  confidence: number;
  extractionMethod: 'rule_nlp_hybrid' | 'ocr_regex' | 'user_manual';
  createdAt: string;
}

export interface SusceptibilityRecord {
  id: string;
  analysisId: string;
  organism: string;
  antibiotic: string;
  interpretation: SusceptibilityInterpretation;
  micValue?: string;
  micUnit?: string;
  sourceDocumentId?: string;
  pageNumber?: number;
  confidence: number;
  isUserModified?: boolean;
}

export interface PatientInputRecord {
  id: string;
  analysisId: string;
  symptoms: string;
  symptomDuration: 'less_than_3_days' | '3_to_7_days' | '8_to_14_days' | 'more_than_14_days' | 'unknown';
  severity: 'mild' | 'moderate' | 'severe' | 'unknown';
  infectionType: 'urinary' | 'respiratory' | 'skin_soft_tissue' | 'gastrointestinal' | 'bloodstream' | 'wound' | 'reproductive' | 'ent' | 'other' | 'unknown';
  previousAntibioticExposure: 'none_known' | 'one_previous_course' | 'multiple_previous_courses' | 'frequent_repeated' | 'unknown';
  treatmentDuration?: number | 'unknown';
  courseCompletion: 'completed' | 'partially_completed' | 'stopped_early' | 'unknown';
  persistentInfection: 'no' | 'persistent' | 'recurrent' | 'unknown';
  additionalNotes?: string;
  createdAt: string;
}

export interface RiskFeatureRecord {
  id: string;
  analysisId: string;
  featureName: string;
  rawValue: string;
  normalizedContribution: number;
  weight: number;
  available: boolean;
  evidence: string;
  confidence: number;
  reason?: string;
  createdAt: string;
}

export interface ContributingFactor {
  name: string;
  featureKey: string;
  contribution: number;
  weight: number;
  weightedContribution: number;
  impact: 'high' | 'moderate' | 'low';
  reason: string;
  evidence?: {
    document?: string;
    page?: number;
    snippet?: string;
    confidence?: number;
  };
}

export interface RiskResultRecord {
  id: string;
  analysisId: string;
  riskPercentage: number;
  riskCategory: RiskCategory;
  modelVersion: string;
  evidenceCoverage: EvidenceCoverageLevel;
  coveragePercentage: number;
  calculatedAt: string;
  majorFactors: ContributingFactor[];
  limitations: string[];
}

export interface AnalysisRecord {
  id: string;
  userId: string;
  title: string;
  status: AnalysisStatus;
  riskPercentage?: number;
  riskCategory?: RiskCategory;
  evidenceCoverage?: EvidenceCoverageLevel;
  modelVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEventRecord {
  id: string;
  userId?: string;
  analysisId?: string;
  eventType: string;
  metadata: Record<string, any>;
  createdAt: string;
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
