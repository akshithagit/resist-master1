import {
  EntityRecord,
  SusceptibilityRecord,
  PatientInputRecord,
  RiskFeatureRecord,
  RiskResultRecord,
  ContributingFactor,
  FeatureWeightsConfig,
  RiskCategory,
  EvidenceCoverageLevel
} from '../types/index.js';
import { config } from '../core/config.js';
import { v4 as uuidv4 } from 'uuid';

export interface CalculatedRiskOutput {
  riskPercentage: number | null;
  riskCategory: RiskCategory | null;
  evidenceCoverage: EvidenceCoverageLevel;
  coveragePercentage: number;
  features: RiskFeatureRecord[];
  majorFactors: ContributingFactor[];
  limitations: string[];
}

export class RiskCalculator {
  /**
   * Normalize input clinical records into a weighted feature set and compute the AMR risk index.
   */
  public calculate(
    analysisId: string,
    entities: EntityRecord[],
    susceptibilities: SusceptibilityRecord[],
    patientInput: PatientInputRecord | undefined,
    weights: FeatureWeightsConfig = config.defaultWeights
  ): CalculatedRiskOutput {
    const features: RiskFeatureRecord[] = [];

    // 1. Documented Resistance (ESBL, MRSA, VRE, CRE, MDR, etc.)
    const resistanceEntities = entities.filter(e => e.entityType === 'resistance_marker');
    if (resistanceEntities.length > 0) {
      const markers = resistanceEntities.map(e => e.normalizedValue).join(', ');
      features.push({
        id: uuidv4(),
        analysisId,
        featureName: 'documented_resistance',
        rawValue: markers,
        normalizedContribution: 0.95,
        weight: weights.documented_resistance,
        available: true,
        evidence: resistanceEntities[0].sourceText,
        confidence: resistanceEntities[0].confidence,
        reason: 'Explicit antimicrobial resistance markers were documented in the clinical report (' + markers + ').',
        createdAt: new Date().toISOString()
      });
    } else {
      features.push({
        id: uuidv4(),
        analysisId,
        featureName: 'documented_resistance',
        rawValue: 'None documented',
        normalizedContribution: 0.0,
        weight: weights.documented_resistance,
        available: false,
        evidence: '',
        confidence: 0,
        reason: 'No explicit resistance markers detected in document text.',
        createdAt: new Date().toISOString()
      });
    }

    // 2. Susceptibility Resistance Pattern
    if (susceptibilities.length > 0) {
      const total = susceptibilities.length;
      const resistantCount = susceptibilities.filter(s => s.interpretation === 'Resistant').length;
      const intermediateCount = susceptibilities.filter(s => s.interpretation === 'Intermediate').length;
      const susceptibleCount = susceptibilities.filter(s => s.interpretation === 'Susceptible').length;

      // Check for critical reserve antibiotic resistance
      const criticalAntibiotics = ['Meropenem', 'Imipenem', 'Colistin', 'Vancomycin', 'Linezolid'];
      const hasCriticalResistance = susceptibilities.some(
        s => s.interpretation === 'Resistant' && criticalAntibiotics.some(c => s.antibiotic.toLowerCase().includes(c.toLowerCase()))
      );

      let contribution = 0.15;
      let reason = 'Laboratory susceptibility panel showed predominantly susceptible isolates (' + susceptibleCount + '/' + total + ').';

      const resistantRatio = (resistantCount + 0.5 * intermediateCount) / total;

      if (hasCriticalResistance || resistantRatio >= 0.5) {
        contribution = 0.92;
        reason = 'Susceptibility panel demonstrated high resistance (' + resistantCount + ' resistant of ' + total + ' tested), including key reserve antimicrobials.';
      } else if (resistantCount > 0 || intermediateCount > 0) {
        contribution = 0.55;
        reason = 'Susceptibility panel revealed mixed resistance profile (' + resistantCount + ' resistant, ' + intermediateCount + ' intermediate, ' + susceptibleCount + ' susceptible).';
      }

      features.push({
        id: uuidv4(),
        analysisId,
        featureName: 'susceptibility_resistance',
        rawValue: resistantCount + ' R, ' + intermediateCount + ' I, ' + susceptibleCount + ' S (Total: ' + total + ')',
        normalizedContribution: contribution,
        weight: weights.susceptibility_resistance,
        available: true,
        evidence: 'Antimicrobial susceptibility profile: ' + susceptibilities.slice(0, 4).map(s => s.antibiotic + ' (' + s.interpretation + ')').join(', '),
        confidence: 0.94,
        reason,
        createdAt: new Date().toISOString()
      });
    } else {
      features.push({
        id: uuidv4(),
        analysisId,
        featureName: 'susceptibility_resistance',
        rawValue: 'Unavailable',
        normalizedContribution: 0.0,
        weight: weights.susceptibility_resistance,
        available: false,
        evidence: '',
        confidence: 0,
        reason: 'No antimicrobial susceptibility testing panel was documented. Missing data is not assumed to be susceptible.',
        createdAt: new Date().toISOString()
      });
    }

    // 3. Resistance Gene / Mutation
    const geneEntities = entities.filter(e => e.entityType === 'resistance_gene');
    if (geneEntities.length > 0) {
      const genes = geneEntities.map(g => g.normalizedValue).join(', ');
      features.push({
        id: uuidv4(),
        analysisId,
        featureName: 'resistance_gene',
        rawValue: genes,
        normalizedContribution: 1.0,
        weight: weights.resistance_gene,
        available: true,
        evidence: geneEntities[0].sourceText,
        confidence: geneEntities[0].confidence,
        reason: 'Specific molecular resistance genes were explicitly detected (' + genes + ').',
        createdAt: new Date().toISOString()
      });
    } else {
      features.push({
        id: uuidv4(),
        analysisId,
        featureName: 'resistance_gene',
        rawValue: 'None documented',
        normalizedContribution: 0.0,
        weight: weights.resistance_gene,
        available: false,
        evidence: '',
        confidence: 0,
        reason: 'No explicit molecular resistance genes were noted in the report.',
        createdAt: new Date().toISOString()
      });
    }

    // 4. Organism Signal
    const organismEntities = entities.filter(e => e.entityType === 'organism');
    if (organismEntities.length > 0) {
      const orgName = organismEntities[0].normalizedValue;
      const eskape = ['Klebsiella', 'Staphylococcus', 'Enterococcus', 'Acinetobacter', 'Pseudomonas', 'Enterobacter'];
      const isEskape = eskape.some(e => orgName.toLowerCase().includes(e.toLowerCase()));

      const contribution = isEskape ? 0.70 : 0.40;
      features.push({
        id: uuidv4(),
        analysisId,
        featureName: 'organism_signal',
        rawValue: orgName,
        normalizedContribution: contribution,
        weight: weights.organism_signal,
        available: true,
        evidence: organismEntities[0].sourceText,
        confidence: organismEntities[0].confidence,
        reason: isEskape 
          ? 'Isolated pathogen (' + orgName + ') belongs to high-priority pathogen groups associated with antimicrobial resistance challenges.'
          : 'Pathogen identified: ' + orgName + '.',
        createdAt: new Date().toISOString()
      });
    } else {
      features.push({
        id: uuidv4(),
        analysisId,
        featureName: 'organism_signal',
        rawValue: 'Unavailable',
        normalizedContribution: 0.0,
        weight: weights.organism_signal,
        available: false,
        evidence: '',
        confidence: 0,
        reason: 'Specific organism was not documented in the report.',
        createdAt: new Date().toISOString()
      });
    }

    // 5. Culture Findings
    const cultureEntities = entities.filter(e => e.entityType === 'culture');
    if (cultureEntities.length > 0) {
      const cultureDetails = cultureEntities.map(c => c.normalizedValue).join('; ');
      features.push({
        id: uuidv4(),
        analysisId,
        featureName: 'culture_signal',
        rawValue: cultureDetails,
        normalizedContribution: 0.55,
        weight: weights.culture_signal,
        available: true,
        evidence: cultureEntities[0].sourceText,
        confidence: 0.90,
        reason: 'Microbiology culture documented viable bacterial growth (' + cultureDetails + ').',
        createdAt: new Date().toISOString()
      });
    } else {
      features.push({
        id: uuidv4(),
        analysisId,
        featureName: 'culture_signal',
        rawValue: 'Unavailable',
        normalizedContribution: 0.0,
        weight: weights.culture_signal,
        available: false,
        evidence: '',
        confidence: 0,
        reason: 'No culture/specimen quantification details found.',
        createdAt: new Date().toISOString()
      });
    }

    // 6. Repeated Antibiotic Exposure
    if (patientInput && patientInput.previousAntibioticExposure && patientInput.previousAntibioticExposure !== 'unknown') {
      let contribution = 0.0;
      let reason = 'No previous antibiotic exposure reported in the preceding months.';

      if (patientInput.previousAntibioticExposure === 'frequent_repeated') {
        contribution = 0.80;
        reason = 'Frequent or repeated antimicrobial exposure documented, which strongly selects for resistant flora.';
      } else if (patientInput.previousAntibioticExposure === 'multiple_previous_courses') {
        contribution = 0.55;
        reason = 'Multiple prior antibiotic courses were completed in recent months.';
      } else if (patientInput.previousAntibioticExposure === 'one_previous_course') {
        contribution = 0.25;
        reason = 'Single previous antibiotic course reported.';
      }

      features.push({
        id: uuidv4(),
        analysisId,
        featureName: 'repeated_antibiotic_exposure',
        rawValue: patientInput.previousAntibioticExposure.replace(/_/g, ' '),
        normalizedContribution: contribution,
        weight: weights.repeated_antibiotic_exposure,
        available: true,
        evidence: 'User-provided medical history: ' + patientInput.previousAntibioticExposure.replace(/_/g, ' '),
        confidence: 0.90,
        reason,
        createdAt: new Date().toISOString()
      });
    } else {
      features.push({
        id: uuidv4(),
        analysisId,
        featureName: 'repeated_antibiotic_exposure',
        rawValue: 'Unavailable',
        normalizedContribution: 0.0,
        weight: weights.repeated_antibiotic_exposure,
        available: false,
        evidence: '',
        confidence: 0,
        reason: 'Previous antibiotic exposure history not provided.',
        createdAt: new Date().toISOString()
      });
    }

    // 7. Persistent & Recurrent Infection
    if (patientInput && patientInput.persistentInfection && patientInput.persistentInfection !== 'unknown') {
      let contribution = 0.0;
      let reason = 'Infection not reported as persistent or recurrent.';

      if (patientInput.persistentInfection === 'recurrent') {
        contribution = 0.75;
        reason = 'Recurrent episode reported, indicating potential treatment failure or bacterial persistence.';
      } else if (patientInput.persistentInfection === 'persistent') {
        contribution = 0.60;
        reason = 'Ongoing unresolving symptoms despite intervention.';
      }

      features.push({
        id: uuidv4(),
        analysisId,
        featureName: 'persistent_infection',
        rawValue: patientInput.persistentInfection,
        normalizedContribution: contribution,
        weight: weights.persistent_infection,
        available: true,
        evidence: 'Clinical trajectory: ' + patientInput.persistentInfection,
        confidence: 0.88,
        reason,
        createdAt: new Date().toISOString()
      });
    } else {
      features.push({
        id: uuidv4(),
        analysisId,
        featureName: 'persistent_infection',
        rawValue: 'Unavailable',
        normalizedContribution: 0.0,
        weight: weights.persistent_infection,
        available: false,
        evidence: '',
        confidence: 0,
        reason: 'Persistence / recurrence status not provided.',
        createdAt: new Date().toISOString()
      });
    }

    // 8. Incomplete Treatment
    if (patientInput && patientInput.courseCompletion && patientInput.courseCompletion !== 'unknown') {
      let contribution = 0.0;
      let reason = 'Previous course completed as prescribed.';

      if (patientInput.courseCompletion === 'stopped_early') {
        contribution = 0.70;
        reason = 'Antibiotic therapy stopped early, which can facilitate survival of sub-populations with reduced susceptibility.';
      } else if (patientInput.courseCompletion === 'partially_completed') {
        contribution = 0.50;
        reason = 'Previous therapy only partially completed.';
      }

      features.push({
        id: uuidv4(),
        analysisId,
        featureName: 'incomplete_treatment',
        rawValue: patientInput.courseCompletion.replace(/_/g, ' '),
        normalizedContribution: contribution,
        weight: weights.incomplete_treatment,
        available: true,
        evidence: 'Course completion: ' + patientInput.courseCompletion.replace(/_/g, ' '),
        confidence: 0.85,
        reason,
        createdAt: new Date().toISOString()
      });
    } else {
      features.push({
        id: uuidv4(),
        analysisId,
        featureName: 'incomplete_treatment',
        rawValue: 'Unavailable',
        normalizedContribution: 0.0,
        weight: weights.incomplete_treatment,
        available: false,
        evidence: '',
        confidence: 0,
        reason: 'Treatment completion details not provided.',
        createdAt: new Date().toISOString()
      });
    }

    // 9. Prolonged Treatment Duration
    if (patientInput && typeof patientInput.treatmentDuration === 'number') {
      const days = patientInput.treatmentDuration;
      let contribution = 0.15;
      let reason = 'Standard treatment duration (' + days + ' days).';

      if (days > 14) {
        contribution = 0.75;
        reason = 'Prolonged antimicrobial treatment duration (' + days + ' days) increases selective pressure.';
      } else if (days >= 8) {
        contribution = 0.40;
        reason = 'Moderate antibiotic duration (' + days + ' days).';
      }

      features.push({
        id: uuidv4(),
        analysisId,
        featureName: 'prolonged_treatment',
        rawValue: days + ' days',
        normalizedContribution: contribution,
        weight: weights.prolonged_treatment,
        available: true,
        evidence: 'Duration: ' + days + ' days',
        confidence: 0.85,
        reason,
        createdAt: new Date().toISOString()
      });
    } else {
      features.push({
        id: uuidv4(),
        analysisId,
        featureName: 'prolonged_treatment',
        rawValue: 'Unavailable',
        normalizedContribution: 0.0,
        weight: weights.prolonged_treatment,
        available: false,
        evidence: '',
        confidence: 0,
        reason: 'Treatment duration not documented.',
        createdAt: new Date().toISOString()
      });
    }

    // 10. Symptom Duration
    if (patientInput && patientInput.symptomDuration && patientInput.symptomDuration !== 'unknown') {
      let contribution = 0.10;
      let reason = 'Acute symptom presentation (< 3 days).';

      if (patientInput.symptomDuration === 'more_than_14_days') {
        contribution = 0.80;
        reason = 'Protracted symptom duration (>14 days) suggests potential refractory condition.';
      } else if (patientInput.symptomDuration === '8_to_14_days') {
        contribution = 0.50;
        reason = 'Subacute symptom duration (8 to 14 days).';
      } else if (patientInput.symptomDuration === '3_to_7_days') {
        contribution = 0.25;
        reason = 'Moderate symptom duration (3 to 7 days).';
      }

      features.push({
        id: uuidv4(),
        analysisId,
        featureName: 'symptom_duration',
        rawValue: patientInput.symptomDuration.replace(/_/g, ' '),
        normalizedContribution: contribution,
        weight: weights.symptom_duration,
        available: true,
        evidence: 'Duration: ' + patientInput.symptomDuration.replace(/_/g, ' '),
        confidence: 0.85,
        reason,
        createdAt: new Date().toISOString()
      });
    } else {
      features.push({
        id: uuidv4(),
        analysisId,
        featureName: 'symptom_duration',
        rawValue: 'Unavailable',
        normalizedContribution: 0.0,
        weight: weights.symptom_duration,
        available: false,
        evidence: '',
        confidence: 0,
        reason: 'Symptom duration was not provided.',
        createdAt: new Date().toISOString()
      });
    }

    // 11. Symptom Severity
    if (patientInput && patientInput.severity && patientInput.severity !== 'unknown') {
      let contribution = 0.20;
      let reason = 'Mild symptom severity.';

      if (patientInput.severity === 'severe') {
        contribution = 0.80;
        reason = 'Severe clinical symptomatology documented.';
      } else if (patientInput.severity === 'moderate') {
        contribution = 0.50;
        reason = 'Moderate clinical symptoms reported.';
      }

      features.push({
        id: uuidv4(),
        analysisId,
        featureName: 'symptom_severity',
        rawValue: patientInput.severity,
        normalizedContribution: contribution,
        weight: weights.symptom_severity,
        available: true,
        evidence: 'Severity: ' + patientInput.severity,
        confidence: 0.85,
        reason,
        createdAt: new Date().toISOString()
      });
    } else {
      features.push({
        id: uuidv4(),
        analysisId,
        featureName: 'symptom_severity',
        rawValue: 'Unavailable',
        normalizedContribution: 0.0,
        weight: weights.symptom_severity,
        available: false,
        evidence: '',
        confidence: 0,
        reason: 'Symptom severity not provided.',
        createdAt: new Date().toISOString()
      });
    }

    // === EXACT WEIGHTED FORMULA (Section 18 & 54) ===
    let weightedSum = 0;
    let availableWeight = 0;
    let totalConfiguredWeight = 0;

    for (const f of features) {
      totalConfiguredWeight += f.weight;
      if (f.available) {
        weightedSum += f.normalizedContribution * f.weight;
        availableWeight += f.weight;
      }
    }

    // Evidence coverage calculation
    const coveragePercentage = totalConfiguredWeight > 0 
      ? Math.round((availableWeight / totalConfiguredWeight) * 100) 
      : 0;

    let evidenceCoverage: EvidenceCoverageLevel = 'Limited';
    if (coveragePercentage > 75) {
      evidenceCoverage = 'Broad';
    } else if (coveragePercentage >= 40) {
      evidenceCoverage = 'Moderate';
    }

    // If no available features: Insufficient evidence
    if (availableWeight === 0) {
      return {
        riskPercentage: null,
        riskCategory: null,
        evidenceCoverage: 'Limited',
        coveragePercentage: 0,
        features,
        majorFactors: [],
        limitations: [
          'Insufficient evidence for a prototype estimate.',
          'Upload laboratory reports or provide treatment history to enable assessment.'
        ]
      };
    }

    const rawRisk = (weightedSum / availableWeight) * 100;
    const clampedRisk = Math.max(0, Math.min(100, rawRisk));
    const riskPercentage = Math.round(clampedRisk * 10) / 10;

    // Strict boundary categorization (Section 21 & 55)
    let riskCategory: RiskCategory = 'Low';
    if (riskPercentage <= config.thresholds.lowMax) {
      riskCategory = 'Low';
    } else if (riskPercentage <= config.thresholds.moderateMax) {
      riskCategory = 'Moderate';
    } else {
      riskCategory = 'High';
    }

    // Rank major contributing factors by weighted contribution
    const availableFeatures = features.filter(f => f.available);
    const sortedFeatures = [...availableFeatures].sort((a, b) => {
      const aImpact = a.normalizedContribution * a.weight;
      const bImpact = b.normalizedContribution * b.weight;
      return bImpact - aImpact;
    });

    const majorFactors: ContributingFactor[] = sortedFeatures.slice(0, 5).map(f => {
      const weightedContribution = Math.round((f.normalizedContribution * f.weight) * 10) / 10;
      let impact: 'high' | 'moderate' | 'low' = 'low';
      if (f.normalizedContribution >= 0.7) {
        impact = 'high';
      } else if (f.normalizedContribution >= 0.4) {
        impact = 'moderate';
      }

      return {
        name: this.formatFeatureName(f.featureName),
        featureKey: f.featureName,
        contribution: Math.round(f.normalizedContribution * 100) / 100,
        weight: f.weight,
        weightedContribution,
        impact,
        reason: f.reason || 'Observed clinical indicator',
        evidence: {
          document: 'Uploaded Medical Report',
          page: 1,
          snippet: f.evidence,
          confidence: f.confidence
        }
      };
    });

    const limitations = [
      'This is a prototype risk estimate generated from available report and user information.',
      'It is NOT a clinically validated probability, confirmed diagnosis, or antibiotic prescription.',
      'Laboratory culture and antimicrobial susceptibility testing interpreted by a qualified physician remain necessary.',
      'Do not start, stop, extend, or change antibiotics based solely on this result.'
    ];

    return {
      riskPercentage,
      riskCategory,
      evidenceCoverage,
      coveragePercentage,
      features,
      majorFactors,
      limitations
    };
  }

  private formatFeatureName(key: string): string {
    const map: Record<string, string> = {
      documented_resistance: 'Documented Resistance',
      susceptibility_resistance: 'Susceptibility Resistance Pattern',
      resistance_gene: 'Molecular Resistance Gene',
      organism_signal: 'Pathogen Species Profile',
      repeated_antibiotic_exposure: 'Repeated Antibiotic Exposure',
      persistent_infection: 'Persistent / Recurrent Infection',
      incomplete_treatment: 'Incomplete Antibiotic Course',
      prolonged_treatment: 'Prolonged Treatment Duration',
      symptom_duration: 'Symptom Duration',
      symptom_severity: 'Symptom Severity',
      culture_signal: 'Culture & Colony Quantification'
    };
    return map[key] || key.replace(/_/g, ' ');
  }
}

export const riskCalculator = new RiskCalculator();
