/**
 * ResistAI - Risk Calculation and Explainability Engine
 * PRD Sections 15–24, 52–54
 * 
 * Independent, deterministic, zero-paid-API calculation engine.
 */

import {
  AMRFeature,
  ContributingFactor,
  ExtractedEntity,
  FeatureWeightsConfig,
  PatientClinicalInput,
  RiskCalculationResult,
  RiskCategory,
  EvidenceCoverage,
  SusceptibilityResult,
  CultureFinding,
} from '../types/amr';
import {
  DEFAULT_FEATURE_WEIGHTS,
  EVIDENCE_COVERAGE_THRESHOLDS,
  KNOWN_ORGANISMS,
  RISK_MODEL_METADATA,
  RISK_THRESHOLDS,
  CLINICAL_SAFETY_MESSAGES,
} from '../constants/amrConfig';

export class AMRCalculationEngine {
  private weights: FeatureWeightsConfig;

  constructor(customWeights?: Partial<FeatureWeightsConfig>) {
    this.weights = { ...DEFAULT_FEATURE_WEIGHTS, ...customWeights };
  }

  /**
   * Builds normalized feature vectors from medical reports and patient clinical input.
   * Missing features have `available: false` and are NOT converted to zero or negative evidence.
   */
  public extractFeatures(
    entities: ExtractedEntity[],
    susceptibility: SusceptibilityResult[],
    patientInput: PatientClinicalInput,
    culture?: CultureFinding
  ): AMRFeature[] {
    const features: AMRFeature[] = [];

    // 1. Documented Resistance (Explicit markers or resistant AST)
    const resistanceEntities = entities.filter(
      (e) => e.entityType === 'resistance_marker' || e.entityType === 'resistance_gene'
    );
    const resistantSusceptibilities = susceptibility.filter((s) => s.interpretation === 'Resistant');
    const allSusceptibilities = susceptibility.length;

    let documentedResistance: AMRFeature;
    if (resistanceEntities.length > 0 || resistantSusceptibilities.length > 0) {
      const topMarker = resistanceEntities[0];
      const highestResistantAST = resistantSusceptibilities[0];
      documentedResistance = {
        name: 'documented_resistance',
        displayName: 'Documented Resistance',
        rawValue: topMarker ? topMarker.normalizedValue : `${resistantSusceptibilities.length} resistant antibiotics`,
        normalizedContribution: 0.90,
        weight: this.weights.documented_resistance,
        available: true,
        evidence: topMarker 
          ? `Documented marker: ${topMarker.normalizedValue} (${topMarker.sourceText})`
          : `Resistant to: ${resistantSusceptibilities.map(s => s.antibiotic).join(', ')}`,
        confidence: topMarker?.confidence ?? 0.95,
        sourceDocument: 'Medical Laboratory Report',
        pageNumber: topMarker?.pageNumber ?? highestResistantAST?.pageNumber ?? 1,
      };
    } else if (allSusceptibilities > 0 && resistantSusceptibilities.length === 0) {
      // Tested susceptibility panel and all tested isolates were susceptible
      documentedResistance = {
        name: 'documented_resistance',
        displayName: 'Documented Resistance',
        rawValue: 'All tested agents susceptible',
        normalizedContribution: 0.05,
        weight: this.weights.documented_resistance,
        available: true,
        evidence: `Antimicrobial susceptibility panel tested (${allSusceptibilities} agents): No resistance observed.`,
        confidence: 0.90,
        sourceDocument: 'Medical Laboratory Report',
        pageNumber: 1,
      };
    } else {
      documentedResistance = {
        name: 'documented_resistance',
        displayName: 'Documented Resistance',
        rawValue: null,
        normalizedContribution: 0.0,
        weight: this.weights.documented_resistance,
        available: false,
        evidence: 'No explicit resistance documentation available in provided documents.',
        confidence: 0,
      };
    }
    features.push(documentedResistance);

    // 2. Susceptibility Resistance Pattern
    let susceptibilityFeature: AMRFeature;
    if (susceptibility.length > 0) {
      const resistantCount = susceptibility.filter((s) => s.interpretation === 'Resistant').length;
      const intermediateCount = susceptibility.filter((s) => s.interpretation === 'Intermediate').length;
      const totalCount = susceptibility.length;

      // Contribution calculation: (R + 0.5*I) / total
      const ratio = (resistantCount * 1.0 + intermediateCount * 0.5) / totalCount;
      const clampedRatio = Math.max(0.0, Math.min(1.0, ratio));

      susceptibilityFeature = {
        name: 'susceptibility_resistance',
        displayName: 'Susceptibility Resistance Pattern',
        rawValue: `${resistantCount} R, ${intermediateCount} I out of ${totalCount} tested`,
        normalizedContribution: clampedRatio,
        weight: this.weights.susceptibility_resistance,
        available: true,
        evidence: `Susceptibility panel: ${resistantCount} resistant, ${intermediateCount} intermediate, ${totalCount - resistantCount - intermediateCount} susceptible.`,
        confidence: 0.95,
        sourceDocument: 'Antibiogram Report',
        pageNumber: susceptibility[0]?.pageNumber ?? 1,
      };
    } else {
      susceptibilityFeature = {
        name: 'susceptibility_resistance',
        displayName: 'Susceptibility Resistance Pattern',
        rawValue: null,
        normalizedContribution: 0.0,
        weight: this.weights.susceptibility_resistance,
        available: false,
        evidence: 'No susceptibility testing results available in report.',
        confidence: 0,
      };
    }
    features.push(susceptibilityFeature);

    // 3. Resistance Gene / Mutation (Explicitly documented only!)
    const geneEntity = entities.find((e) => e.entityType === 'resistance_gene');
    let geneFeature: AMRFeature;
    if (geneEntity) {
      geneFeature = {
        name: 'resistance_gene',
        displayName: 'Resistance Gene / Mutation',
        rawValue: geneEntity.normalizedValue,
        normalizedContribution: 0.95,
        weight: this.weights.resistance_gene,
        available: true,
        evidence: `Explicitly documented resistance gene/mutation: ${geneEntity.normalizedValue}`,
        confidence: geneEntity.confidence,
        sourceDocument: 'Molecular / PCR Lab Report',
        pageNumber: geneEntity.pageNumber,
      };
    } else {
      geneFeature = {
        name: 'resistance_gene',
        displayName: 'Resistance Gene / Mutation',
        rawValue: null,
        normalizedContribution: 0.0,
        weight: this.weights.resistance_gene,
        available: false,
        evidence: 'No molecular resistance genes or mutations documented in report.',
        confidence: 0,
      };
    }
    features.push(geneFeature);

    // 4. Organism Risk Signal
    const organismEntity = entities.find((e) => e.entityType === 'organism') || (culture?.organism ? {
      normalizedValue: culture.organism,
      sourceText: culture.organism,
      pageNumber: 1,
      confidence: 0.9,
    } : undefined);

    let organismFeature: AMRFeature;
    if (organismEntity) {
      const match = KNOWN_ORGANISMS.find(
        (o) => o.name.toLowerCase() === organismEntity.normalizedValue.toLowerCase() ||
               o.aliases.some((a) => organismEntity.normalizedValue.toLowerCase().includes(a))
      );
      const riskSignal = match ? match.riskSignal : 0.45; // default moderate baseline for bacterial isolate

      organismFeature = {
        name: 'organism_signal',
        displayName: 'Organism Baseline Risk Signal',
        rawValue: organismEntity.normalizedValue,
        normalizedContribution: riskSignal,
        weight: this.weights.organism_signal,
        available: true,
        evidence: `Isolated pathogen: ${organismEntity.normalizedValue}. Known clinical resistance potential signal: ${(riskSignal * 100).toFixed(0)}%.`,
        confidence: organismEntity.confidence ?? 0.85,
        sourceDocument: 'Microbiology Culture Report',
        pageNumber: organismEntity.pageNumber ?? 1,
      };
    } else {
      organismFeature = {
        name: 'organism_signal',
        displayName: 'Organism Baseline Risk Signal',
        rawValue: null,
        normalizedContribution: 0.0,
        weight: this.weights.organism_signal,
        available: false,
        evidence: 'No specific microbial organism identified.',
        confidence: 0,
      };
    }
    features.push(organismFeature);

    // 5. Repeated Antibiotic Exposure
    let exposureFeature: AMRFeature;
    switch (patientInput.previousAntibioticExposure) {
      case 'None known':
        exposureFeature = {
          name: 'repeated_antibiotic_exposure',
          displayName: 'Previous Antibiotic Exposure',
          rawValue: patientInput.previousAntibioticExposure,
          normalizedContribution: 0.00,
          weight: this.weights.repeated_antibiotic_exposure,
          available: true,
          evidence: 'Patient reports no known prior antibiotic courses.',
          confidence: 0.90,
        };
        break;
      case 'One previous course':
        exposureFeature = {
          name: 'repeated_antibiotic_exposure',
          displayName: 'Previous Antibiotic Exposure',
          rawValue: patientInput.previousAntibioticExposure,
          normalizedContribution: 0.25,
          weight: this.weights.repeated_antibiotic_exposure,
          available: true,
          evidence: 'Patient reports one prior course of antibiotic treatment.',
          confidence: 0.90,
        };
        break;
      case 'Multiple previous courses':
        exposureFeature = {
          name: 'repeated_antibiotic_exposure',
          displayName: 'Previous Antibiotic Exposure',
          rawValue: patientInput.previousAntibioticExposure,
          normalizedContribution: 0.55,
          weight: this.weights.repeated_antibiotic_exposure,
          available: true,
          evidence: 'Patient reports multiple prior antibiotic courses in recent history.',
          confidence: 0.90,
        };
        break;
      case 'Frequent/repeated exposure':
        exposureFeature = {
          name: 'repeated_antibiotic_exposure',
          displayName: 'Previous Antibiotic Exposure',
          rawValue: patientInput.previousAntibioticExposure,
          normalizedContribution: 0.80,
          weight: this.weights.repeated_antibiotic_exposure,
          available: true,
          evidence: 'Patient reports frequent/repeated antimicrobial exposure, high selective pressure.',
          confidence: 0.90,
        };
        break;
      case 'Unknown':
      default:
        exposureFeature = {
          name: 'repeated_antibiotic_exposure',
          displayName: 'Previous Antibiotic Exposure',
          rawValue: null,
          normalizedContribution: 0.0,
          weight: this.weights.repeated_antibiotic_exposure,
          available: false,
          evidence: 'Previous antibiotic exposure history is unknown.',
          confidence: 0,
        };
        break;
    }
    features.push(exposureFeature);

    // 6. Persistent Infection
    let persistentFeature: AMRFeature;
    if (patientInput.persistentInfection === 'Persistent') {
      persistentFeature = {
        name: 'persistent_infection',
        displayName: 'Persistent Symptoms',
        rawValue: 'Persistent',
        normalizedContribution: 0.60,
        weight: this.weights.persistent_infection,
        available: true,
        evidence: 'Symptoms reported as persistent despite current treatment attempt.',
        confidence: 0.85,
      };
    } else if (patientInput.persistentInfection === 'No') {
      persistentFeature = {
        name: 'persistent_infection',
        displayName: 'Persistent Symptoms',
        rawValue: 'No',
        normalizedContribution: 0.00,
        weight: this.weights.persistent_infection,
        available: true,
        evidence: 'No persistent symptom pattern reported.',
        confidence: 0.85,
      };
    } else {
      persistentFeature = {
        name: 'persistent_infection',
        displayName: 'Persistent Symptoms',
        rawValue: null,
        normalizedContribution: 0.0,
        weight: this.weights.persistent_infection,
        available: false,
        evidence: 'Persistence status unknown or unrecorded.',
        confidence: 0,
      };
    }
    features.push(persistentFeature);

    // 7. Recurrent Infection
    let recurrentFeature: AMRFeature;
    if (patientInput.persistentInfection === 'Recurrent') {
      recurrentFeature = {
        name: 'recurrent_infection',
        displayName: 'Recurrent Infection',
        rawValue: 'Recurrent',
        normalizedContribution: 0.75,
        weight: this.weights.recurrent_infection,
        available: true,
        evidence: 'Patient reports recurrent infection episodes, associated with higher resistance colonization risk.',
        confidence: 0.85,
      };
    } else if (patientInput.persistentInfection === 'No') {
      recurrentFeature = {
        name: 'recurrent_infection',
        displayName: 'Recurrent Infection',
        rawValue: 'No',
        normalizedContribution: 0.00,
        weight: this.weights.recurrent_infection,
        available: true,
        evidence: 'No recurrence reported.',
        confidence: 0.85,
      };
    } else {
      recurrentFeature = {
        name: 'recurrent_infection',
        displayName: 'Recurrent Infection',
        rawValue: null,
        normalizedContribution: 0.0,
        weight: this.weights.recurrent_infection,
        available: false,
        evidence: 'Recurrence status unknown or unrecorded.',
        confidence: 0,
      };
    }
    features.push(recurrentFeature);

    // 8. Incomplete Treatment Course
    let incompleteTreatmentFeature: AMRFeature;
    switch (patientInput.courseCompletion) {
      case 'Completed as prescribed':
        incompleteTreatmentFeature = {
          name: 'incomplete_treatment',
          displayName: 'Course Completion Status',
          rawValue: patientInput.courseCompletion,
          normalizedContribution: 0.00,
          weight: this.weights.incomplete_treatment,
          available: true,
          evidence: 'Previous antibiotic course was fully completed as prescribed.',
          confidence: 0.90,
        };
        break;
      case 'Partially completed':
        incompleteTreatmentFeature = {
          name: 'incomplete_treatment',
          displayName: 'Course Completion Status',
          rawValue: patientInput.courseCompletion,
          normalizedContribution: 0.50,
          weight: this.weights.incomplete_treatment,
          available: true,
          evidence: 'Previous antibiotic course was partially completed (sub-therapeutic exposure risk).',
          confidence: 0.85,
        };
        break;
      case 'Stopped early':
        incompleteTreatmentFeature = {
          name: 'incomplete_treatment',
          displayName: 'Course Completion Status',
          rawValue: patientInput.courseCompletion,
          normalizedContribution: 0.70,
          weight: this.weights.incomplete_treatment,
          available: true,
          evidence: 'Previous antibiotic course was stopped early.',
          confidence: 0.85,
        };
        break;
      case 'Unknown':
      default:
        incompleteTreatmentFeature = {
          name: 'incomplete_treatment',
          displayName: 'Course Completion Status',
          rawValue: null,
          normalizedContribution: 0.0,
          weight: this.weights.incomplete_treatment,
          available: false,
          evidence: 'Antibiotic course completion status is unknown.',
          confidence: 0,
        };
        break;
    }
    features.push(incompleteTreatmentFeature);

    // 9. Prolonged Treatment Duration
    let prolongedFeature: AMRFeature;
    if (typeof patientInput.treatmentDurationDays === 'number') {
      const days = patientInput.treatmentDurationDays;
      let contribution = 0.10;
      if (days > 20) contribution = 0.85;
      else if (days > 10) contribution = 0.60;
      else if (days > 5) contribution = 0.35;

      prolongedFeature = {
        name: 'prolonged_treatment',
        displayName: 'Treatment Duration Signal',
        rawValue: `${days} days`,
        normalizedContribution: contribution,
        weight: this.weights.prolonged_treatment,
        available: true,
        evidence: `Treatment duration of ${days} days reported.`,
        confidence: 0.85,
      };
    } else {
      prolongedFeature = {
        name: 'prolonged_treatment',
        displayName: 'Treatment Duration Signal',
        rawValue: null,
        normalizedContribution: 0.0,
        weight: this.weights.prolonged_treatment,
        available: false,
        evidence: 'Duration of antibiotic treatment not documented.',
        confidence: 0,
      };
    }
    features.push(prolongedFeature);

    // 10. Laboratory Signal (e.g. high CFU, pyuria, elevated inflammatory values)
    const labEntity = entities.find((e) => e.entityType === 'lab_value');
    let labFeature: AMRFeature;
    if (culture?.colonyCount || labEntity) {
      const cfuText = culture?.colonyCount || labEntity?.normalizedValue || '';
      const isHighCount = cfuText.includes('> 100,000') || cfuText.includes('10^5') || cfuText.includes('significant');
      const contribution = isHighCount ? 0.60 : 0.30;

      labFeature = {
        name: 'laboratory_signal',
        displayName: 'Laboratory & Colony Signal',
        rawValue: cfuText || 'Present',
        normalizedContribution: contribution,
        weight: this.weights.laboratory_signal,
        available: true,
        evidence: `Lab finding: ${cfuText || 'Quantitative microbial growth documented.'}`,
        confidence: 0.85,
        sourceDocument: 'Laboratory Report',
        pageNumber: 1,
      };
    } else {
      labFeature = {
        name: 'laboratory_signal',
        displayName: 'Laboratory & Colony Signal',
        rawValue: null,
        normalizedContribution: 0.0,
        weight: this.weights.laboratory_signal,
        available: false,
        evidence: 'No quantitative laboratory colony count or inflammatory marker available.',
        confidence: 0,
      };
    }
    features.push(labFeature);

    // 11. Symptom Duration
    let symptomDurationFeature: AMRFeature;
    switch (patientInput.symptomDuration) {
      case 'Less than 3 days':
        symptomDurationFeature = {
          name: 'symptom_duration',
          displayName: 'Symptom Duration',
          rawValue: patientInput.symptomDuration,
          normalizedContribution: 0.10,
          weight: this.weights.symptom_duration,
          available: true,
          evidence: 'Acute symptoms for less than 3 days.',
          confidence: 0.90,
        };
        break;
      case '3–7 days':
        symptomDurationFeature = {
          name: 'symptom_duration',
          displayName: 'Symptom Duration',
          rawValue: patientInput.symptomDuration,
          normalizedContribution: 0.30,
          weight: this.weights.symptom_duration,
          available: true,
          evidence: 'Symptoms lasting 3 to 7 days.',
          confidence: 0.90,
        };
        break;
      case '8–14 days':
        symptomDurationFeature = {
          name: 'symptom_duration',
          displayName: 'Symptom Duration',
          rawValue: patientInput.symptomDuration,
          normalizedContribution: 0.60,
          weight: this.weights.symptom_duration,
          available: true,
          evidence: 'Subacute symptom duration of 8 to 14 days.',
          confidence: 0.90,
        };
        break;
      case 'More than 14 days':
        symptomDurationFeature = {
          name: 'symptom_duration',
          displayName: 'Symptom Duration',
          rawValue: patientInput.symptomDuration,
          normalizedContribution: 0.80,
          weight: this.weights.symptom_duration,
          available: true,
          evidence: 'Prolonged/chronic symptom duration exceeding 14 days.',
          confidence: 0.90,
        };
        break;
      case 'Unknown':
      default:
        symptomDurationFeature = {
          name: 'symptom_duration',
          displayName: 'Symptom Duration',
          rawValue: null,
          normalizedContribution: 0.0,
          weight: this.weights.symptom_duration,
          available: false,
          evidence: 'Symptom duration not reported.',
          confidence: 0,
        };
        break;
    }
    features.push(symptomDurationFeature);

    // 12. Symptom Severity
    let severityFeature: AMRFeature;
    switch (patientInput.severity) {
      case 'Mild':
        severityFeature = {
          name: 'symptom_severity',
          displayName: 'Symptom Severity',
          rawValue: patientInput.severity,
          normalizedContribution: 0.20,
          weight: this.weights.symptom_severity,
          available: true,
          evidence: 'Patient reported mild symptom severity.',
          confidence: 0.90,
        };
        break;
      case 'Moderate':
        severityFeature = {
          name: 'symptom_severity',
          displayName: 'Symptom Severity',
          rawValue: patientInput.severity,
          normalizedContribution: 0.50,
          weight: this.weights.symptom_severity,
          available: true,
          evidence: 'Patient reported moderate symptom severity.',
          confidence: 0.90,
        };
        break;
      case 'Severe':
        severityFeature = {
          name: 'symptom_severity',
          displayName: 'Symptom Severity',
          rawValue: patientInput.severity,
          normalizedContribution: 0.85,
          weight: this.weights.symptom_severity,
          available: true,
          evidence: 'Patient reported severe symptoms, clinical vigilance warranted.',
          confidence: 0.90,
        };
        break;
      case 'Unknown':
      default:
        severityFeature = {
          name: 'symptom_severity',
          displayName: 'Symptom Severity',
          rawValue: null,
          normalizedContribution: 0.0,
          weight: this.weights.symptom_severity,
          available: false,
          evidence: 'Symptom severity not reported.',
          confidence: 0,
        };
        break;
    }
    features.push(severityFeature);

    // 13. Culture Findings
    let cultureFeature: AMRFeature;
    if (culture) {
      const isPos = culture.isPositive;
      const isMixed = culture.mixedGrowth;
      const isContam = culture.contaminationSuspected;

      let contribution = 0.50;
      if (isPos && !isMixed && !isContam) contribution = 0.65;
      else if (isPos && isMixed) contribution = 0.40;
      else if (!isPos) contribution = 0.10;

      cultureFeature = {
        name: 'culture_signal',
        displayName: 'Culture & Growth Signal',
        rawValue: isPos ? (isMixed ? 'Mixed Growth' : 'Positive Pure Growth') : 'Negative Culture',
        normalizedContribution: contribution,
        weight: this.weights.culture_signal,
        available: true,
        evidence: `Microbiology culture: ${culture.specimen} specimen, ${isPos ? 'growth detected' : 'no growth observed'}.`,
        confidence: 0.95,
        sourceDocument: 'Culture Report',
        pageNumber: 1,
      };
    } else {
      cultureFeature = {
        name: 'culture_signal',
        displayName: 'Culture & Growth Signal',
        rawValue: null,
        normalizedContribution: 0.0,
        weight: this.weights.culture_signal,
        available: false,
        evidence: 'No microbiology culture data provided.',
        confidence: 0,
      };
    }
    features.push(cultureFeature);

    return features;
  }

  /**
   * Deterministic Risk Calculation Formula
   * PRD Section 18:
   * AMR Risk (%) = Σ(Feature Contribution × Feature Weight) / Σ(Feature Weights for Available Features) × 100
   */
  public calculateRisk(features: AMRFeature[], patientInput?: PatientClinicalInput): RiskCalculationResult {
    let weightedSum = 0;
    let availableWeight = 0;
    let availableCount = 0;

    const totalConfiguredWeight = Object.values(this.weights).reduce((a, b) => a + b, 0);

    for (const feature of features) {
      if (feature.available) {
        weightedSum += feature.normalizedContribution * feature.weight;
        availableWeight += feature.weight;
        availableCount += 1;
      }
    }

    // Safety Case 4 from PRD: No usable evidence or insufficient information
    if (availableWeight === 0 || availableCount === 0) {
      return {
        riskPercentage: null,
        riskCategory: 'Low',
        modelVersion: RISK_MODEL_METADATA.MODEL_VERSION,
        calculationVersion: RISK_MODEL_METADATA.CALCULATION_VERSION,
        featureConfigVersion: RISK_MODEL_METADATA.FEATURE_CONFIG_VERSION,
        evidenceCoverage: 'Limited',
        evidenceCoverageScore: 0,
        totalAvailableWeight: 0,
        totalConfiguredWeight,
        availableFeatureCount: 0,
        contributingFactors: [],
        features,
        clinicalSafetyAlerts: [
          'Insufficient evidence for a prototype estimate. No usable clinical features or reports available.',
          CLINICAL_SAFETY_MESSAGES.PRIMARY_DISCLAIMER,
        ],
        calculatedAt: new Date().toISOString(),
        isSufficientEvidence: false,
        insufficientReason: 'No relevant clinical documents or patient history were available to calculate an estimate.',
      };
    }

    // Calculate normalized percentage
    const rawRisk = (weightedSum / availableWeight) * 100;
    const clampedRisk = Math.max(0, Math.min(100, rawRisk));
    const roundedRisk = Math.round(clampedRisk * 10) / 10;

    // Category determination (PRD Section 21)
    let riskCategory: RiskCategory;
    if (roundedRisk <= RISK_THRESHOLDS.LOW_MAX) {
      riskCategory = 'Low';
    } else if (roundedRisk <= RISK_THRESHOLDS.MODERATE_MAX) {
      riskCategory = 'Moderate';
    } else {
      riskCategory = 'High';
    }

    // Evidence coverage calculation (PRD Section 20)
    const evidenceCoverageScore = Math.round((availableWeight / totalConfiguredWeight) * 100);
    let evidenceCoverage: EvidenceCoverage;
    if (evidenceCoverageScore < EVIDENCE_COVERAGE_THRESHOLDS.LIMITED_MAX) {
      evidenceCoverage = 'Limited';
    } else if (evidenceCoverageScore <= EVIDENCE_COVERAGE_THRESHOLDS.MODERATE_MAX) {
      evidenceCoverage = 'Moderate';
    } else {
      evidenceCoverage = 'Broad';
    }

    // Build Ranked Contributing Factors (PRD Section 24)
    const contributingFactors: ContributingFactor[] = features
      .filter((f) => f.available)
      .map((f) => {
        const weightedContribution = f.normalizedContribution * f.weight;
        let impact: 'low' | 'moderate' | 'high' = 'low';
        if (f.normalizedContribution >= 0.65) impact = 'high';
        else if (f.normalizedContribution >= 0.35) impact = 'moderate';

        return {
          name: f.name,
          displayName: f.displayName,
          impact,
          normalizedContribution: f.normalizedContribution,
          weightedContribution: Math.round(weightedContribution * 10) / 10,
          weight: f.weight,
          reason: f.evidence,
          sourceDocument: f.sourceDocument,
          pageNumber: f.pageNumber,
          evidenceSnippet: f.rawValue !== null ? String(f.rawValue) : undefined,
          confidence: f.confidence,
        };
      })
      .sort((a, b) => b.weightedContribution - a.weightedContribution);

    // Formulate Clinical Safety Alerts
    const clinicalSafetyAlerts: string[] = [CLINICAL_SAFETY_MESSAGES.PRIMARY_DISCLAIMER];

    if (patientInput?.severity === 'Severe') {
      clinicalSafetyAlerts.push(CLINICAL_SAFETY_MESSAGES.EMERGENCY_WARNING);
    }

    const genePresent = features.find((f) => f.name === 'resistance_gene' && f.available);
    if (genePresent) {
      clinicalSafetyAlerts.push('Molecular resistance gene/mutation documented. Urgent infectious disease consultation is recommended.');
    }

    if (evidenceCoverage === 'Limited') {
      clinicalSafetyAlerts.push('Evidence coverage is Limited. The estimate is based on limited available information and should be interpreted with extreme caution.');
    }

    return {
      riskPercentage: roundedRisk,
      riskCategory,
      modelVersion: RISK_MODEL_METADATA.MODEL_VERSION,
      calculationVersion: RISK_MODEL_METADATA.CALCULATION_VERSION,
      featureConfigVersion: RISK_MODEL_METADATA.FEATURE_CONFIG_VERSION,
      evidenceCoverage,
      evidenceCoverageScore,
      totalAvailableWeight: availableWeight,
      totalConfiguredWeight,
      availableFeatureCount: availableCount,
      contributingFactors,
      features,
      clinicalSafetyAlerts,
      calculatedAt: new Date().toISOString(),
      isSufficientEvidence: true,
    };
  }
}

export const defaultRiskEngine = new AMRCalculationEngine();
