/**
 * ResistAI - Unit Tests for AMR Risk Calculation Engine
 * PRD Section 55
 */

import { AMRCalculationEngine } from '../services/riskEngine';
import {
  ExtractedEntity,
  PatientClinicalInput,
  SusceptibilityResult,
  CultureFinding,
  AMRFeature,
} from '../types/amr';

function runTests() {
  console.log('🧪 Starting ResistAI AMR Risk Engine Unit Tests...\n');
  const engine = new AMRCalculationEngine();
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // --- TEST CASE 1: Low Risk (Uncomplicated, completed course, no resistance) ---
  {
    const entities: ExtractedEntity[] = [
      {
        id: '1',
        entityType: 'organism',
        rawValue: 'Escherichia coli',
        normalizedValue: 'Escherichia coli',
        sourceText: 'E. coli',
        pageNumber: 1,
        confidence: 0.95,
        extractionMethod: 'nlp_medical_dictionary',
      },
    ];
    const susceptibility: SusceptibilityResult[] = [
      { id: '1', antibiotic: 'Nitrofurantoin', interpretation: 'Susceptible', pageNumber: 1, confidence: 0.95 },
      { id: '2', antibiotic: 'Ciprofloxacin', interpretation: 'Susceptible', pageNumber: 1, confidence: 0.95 },
      { id: '3', antibiotic: 'Ceftriaxone', interpretation: 'Susceptible', pageNumber: 1, confidence: 0.95 },
    ];
    const patientInput: PatientClinicalInput = {
      symptoms: 'Mild burning on urination',
      symptomDuration: '3–7 days',
      severity: 'Mild',
      infectionType: 'Urinary',
      previousAntibioticExposure: 'One previous course',
      courseCompletion: 'Completed as prescribed',
      persistentInfection: 'No',
    };
    const culture: CultureFinding = {
      specimen: 'Urine',
      organism: 'Escherichia coli',
      isPositive: true,
      mixedGrowth: false,
      contaminationSuspected: false,
    };

    const features = engine.extractFeatures(entities, susceptibility, patientInput, culture);
    const result = engine.calculateRisk(features, patientInput);

    assert(result.isSufficientEvidence, 'Case 1 has sufficient evidence');
    assert(result.riskCategory === 'Low', `Case 1 category is Low (got ${result.riskCategory}, ${result.riskPercentage}%)`);
    assert(result.riskPercentage !== null && result.riskPercentage <= 30.0, `Case 1 risk <= 30% (got ${result.riskPercentage}%)`);
  }

  // --- TEST CASE 2: High Risk (MDR Klebsiella, ESBL, incomplete treatment, repeated exposure) ---
  {
    const entities: ExtractedEntity[] = [
      {
        id: '1',
        entityType: 'organism',
        normalizedValue: 'Klebsiella pneumoniae',
        rawValue: 'Klebsiella pneumoniae',
        sourceText: 'K. pneumoniae',
        pageNumber: 1,
        confidence: 0.98,
        extractionMethod: 'nlp_medical_dictionary',
      },
      {
        id: '2',
        entityType: 'resistance_marker',
        normalizedValue: 'ESBL',
        rawValue: 'ESBL',
        sourceText: 'ESBL Positive',
        pageNumber: 1,
        confidence: 0.97,
        extractionMethod: 'nlp_medical_dictionary',
      },
      {
        id: '3',
        entityType: 'resistance_gene',
        normalizedValue: 'blaCTX-M',
        rawValue: 'blaCTX-M',
        sourceText: 'blaCTX-M detected',
        pageNumber: 1,
        confidence: 0.99,
        extractionMethod: 'regex_pattern',
      },
    ];
    const susceptibility: SusceptibilityResult[] = [
      { id: '1', antibiotic: 'Ceftriaxone', interpretation: 'Resistant', pageNumber: 1, confidence: 0.98 },
      { id: '2', antibiotic: 'Ciprofloxacin', interpretation: 'Resistant', pageNumber: 1, confidence: 0.98 },
      { id: '3', antibiotic: 'Levofloxacin', interpretation: 'Resistant', pageNumber: 1, confidence: 0.98 },
      { id: '4', antibiotic: 'Meropenem', interpretation: 'Susceptible', pageNumber: 1, confidence: 0.98 },
    ];
    const patientInput: PatientClinicalInput = {
      symptoms: 'High fever, recurrent flank pain',
      symptomDuration: 'More than 14 days',
      severity: 'Severe',
      infectionType: 'Urinary',
      previousAntibioticExposure: 'Frequent/repeated exposure',
      courseCompletion: 'Stopped early',
      persistentInfection: 'Recurrent',
    };
    const culture: CultureFinding = {
      specimen: 'Catheterized Urine',
      organism: 'Klebsiella pneumoniae',
      isPositive: true,
      mixedGrowth: false,
      contaminationSuspected: false,
    };

    const features = engine.extractFeatures(entities, susceptibility, patientInput, culture);
    const result = engine.calculateRisk(features, patientInput);

    assert(result.isSufficientEvidence, 'Case 2 has sufficient evidence');
    assert(result.riskCategory === 'High', `Case 2 category is High (got ${result.riskCategory}, ${result.riskPercentage}%)`);
    assert(result.riskPercentage !== null && result.riskPercentage > 60.0, `Case 2 risk > 60% (got ${result.riskPercentage}%)`);
    assert(result.evidenceCoverage === 'Broad', `Case 2 has Broad evidence coverage (got ${result.evidenceCoverage})`);
  }

  // --- TEST CASE 3: Only One Weak Feature Available ---
  {
    const features: AMRFeature[] = [
      {
        name: 'symptom_duration',
        displayName: 'Symptom Duration',
        rawValue: '3–7 days',
        normalizedContribution: 0.3,
        weight: 3,
        available: true,
        evidence: 'Reported 3-7 days',
        confidence: 0.8,
      },
      {
        name: 'documented_resistance',
        displayName: 'Documented Resistance',
        rawValue: null,
        normalizedContribution: 0,
        weight: 10,
        available: false,
        evidence: 'None',
        confidence: 0,
      },
    ];

    const result = engine.calculateRisk(features);
    assert(result.evidenceCoverage === 'Limited', `Case 3 yields Limited coverage (got ${result.evidenceCoverage})`);
  }

  // --- TEST CASE 4: No Usable Evidence (Insufficient Information) ---
  {
    const features: AMRFeature[] = [
      {
        name: 'documented_resistance',
        displayName: 'Documented Resistance',
        rawValue: null,
        normalizedContribution: 0,
        weight: 10,
        available: false,
        evidence: 'None',
        confidence: 0,
      },
      {
        name: 'organism_signal',
        displayName: 'Organism Baseline Risk Signal',
        rawValue: null,
        normalizedContribution: 0,
        weight: 7,
        available: false,
        evidence: 'None',
        confidence: 0,
      },
    ];

    const result = engine.calculateRisk(features);
    assert(!result.isSufficientEvidence, 'Case 4 correctly flags insufficient evidence');
    assert(result.riskPercentage === null, 'Case 4 risk percentage is null to prevent misleading estimate');
  }

  // --- TEST CASE 5: Missing Susceptibility Is Not Treated As Susceptible ---
  {
    const entities: ExtractedEntity[] = [];
    const susceptibility: SusceptibilityResult[] = []; // No AST
    const patientInput: PatientClinicalInput = {
      symptoms: 'Fever',
      symptomDuration: '3–7 days',
      severity: 'Moderate',
      infectionType: 'Respiratory',
      previousAntibioticExposure: 'Unknown',
      courseCompletion: 'Unknown',
      persistentInfection: 'Unknown',
    };

    const features = engine.extractFeatures(entities, susceptibility, patientInput);
    const astFeature = features.find((f) => f.name === 'susceptibility_resistance');

    assert(astFeature !== undefined && !astFeature.available, 'Missing susceptibility is unavailable, NOT assumed susceptible');
  }

  // --- TEST BOUNDARIES (PRD Section 55) ---
  {
    // Test 30.0 -> Low, 30.1 -> Moderate
    const featLow: AMRFeature[] = [
      {
        name: 'f1',
        displayName: 'F1',
        rawValue: 'val',
        normalizedContribution: 0.30,
        weight: 10,
        available: true,
        evidence: '',
        confidence: 1,
      },
    ];
    const resLow = engine.calculateRisk(featLow);
    assert(resLow.riskPercentage === 30.0 && resLow.riskCategory === 'Low', 'Boundary: 30.0% is Low');

    const featMod: AMRFeature[] = [
      {
        name: 'f1',
        displayName: 'F1',
        rawValue: 'val',
        normalizedContribution: 0.301,
        weight: 10,
        available: true,
        evidence: '',
        confidence: 1,
      },
    ];
    const resMod = engine.calculateRisk(featMod);
    assert(resMod.riskPercentage === 30.1 && resMod.riskCategory === 'Moderate', 'Boundary: 30.1% is Moderate');

    // Test 60.0 -> Moderate, 60.1 -> High
    const featModHigh: AMRFeature[] = [
      {
        name: 'f1',
        displayName: 'F1',
        rawValue: 'val',
        normalizedContribution: 0.60,
        weight: 10,
        available: true,
        evidence: '',
        confidence: 1,
      },
    ];
    const resModHigh = engine.calculateRisk(featModHigh);
    assert(resModHigh.riskPercentage === 60.0 && resModHigh.riskCategory === 'Moderate', 'Boundary: 60.0% is Moderate');

    const featHigh: AMRFeature[] = [
      {
        name: 'f1',
        displayName: 'F1',
        rawValue: 'val',
        normalizedContribution: 0.601,
        weight: 10,
        available: true,
        evidence: '',
        confidence: 1,
      },
    ];
    const resHigh = engine.calculateRisk(featHigh);
    assert(resHigh.riskPercentage === 60.1 && resHigh.riskCategory === 'High', 'Boundary: 60.1% is High');
  }

  console.log(`\n========================================`);
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
