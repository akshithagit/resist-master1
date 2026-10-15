import assert from 'assert';
import { riskCalculator } from '../risk/calculator.js';
import { config } from '../core/config.js';
import {
  EntityRecord,
  SusceptibilityRecord,
  PatientInputRecord
} from '../types/index.js';

console.log('--- RUNNING RESISTAI RISK ENGINE TESTS ---');

// Test 1: Insufficient Evidence (Case 4)
{
  const result = riskCalculator.calculate('test-analysis-1', [], [], undefined);
  assert.strictEqual(result.riskPercentage, null, 'Risk percentage must be null when no evidence available');
  assert.strictEqual(result.riskCategory, null, 'Risk category must be null');
  assert.strictEqual(result.evidenceCoverage, 'Limited', 'Coverage must be Limited');
  assert.strictEqual(result.coveragePercentage, 0, 'Coverage percentage must be 0%');
  console.log('✓ Test 1 Passed: Insufficient evidence handled safely');
}

// Test 2: Low Risk Profile (Case 1)
{
  const entities: EntityRecord[] = [
    {
      id: 'e1',
      analysisId: 'test-2',
      entityType: 'organism',
      rawValue: 'Escherichia coli',
      normalizedValue: 'Escherichia coli',
      sourceText: 'E. coli isolated',
      pageNumber: 1,
      confidence: 0.95,
      extractionMethod: 'rule_nlp_hybrid',
      createdAt: ''
    }
  ];

  const susceptibilities: SusceptibilityRecord[] = [
    { id: 's1', analysisId: 'test-2', organism: 'E. coli', antibiotic: 'Nitrofurantoin', interpretation: 'Susceptible', confidence: 0.95 },
    { id: 's2', analysisId: 'test-2', organism: 'E. coli', antibiotic: 'Ciprofloxacin', interpretation: 'Susceptible', confidence: 0.95 },
    { id: 's3', analysisId: 'test-2', organism: 'E. coli', antibiotic: 'Amoxicillin-Clavulanate', interpretation: 'Susceptible', confidence: 0.95 }
  ];

  const patientInput: PatientInputRecord = {
    id: 'p1',
    analysisId: 'test-2',
    symptoms: 'Mild burning on urination',
    symptomDuration: 'less_than_3_days',
    severity: 'mild',
    infectionType: 'urinary',
    previousAntibioticExposure: 'one_previous_course',
    treatmentDuration: 5,
    courseCompletion: 'completed',
    persistentInfection: 'no',
    createdAt: ''
  };

  const result = riskCalculator.calculate('test-2', entities, susceptibilities, patientInput);
  assert(result.riskPercentage !== null, 'Risk should be calculated');
  assert(result.riskPercentage <= 30.0, `Expected Low Risk (<=30), got ${result.riskPercentage}%`);
  assert.strictEqual(result.riskCategory, 'Low');
  console.log(`✓ Test 2 Passed: Low risk profile correctly classified (${result.riskPercentage}%, ${result.riskCategory})`);
}

// Test 3: High Risk Profile with Resistant Pathogen (Case 2)
{
  const entities: EntityRecord[] = [
    {
      id: 'e1',
      analysisId: 'test-3',
      entityType: 'organism',
      rawValue: 'Klebsiella pneumoniae',
      normalizedValue: 'Klebsiella pneumoniae',
      sourceText: 'Klebsiella isolated',
      pageNumber: 1,
      confidence: 0.95,
      extractionMethod: 'rule_nlp_hybrid',
      createdAt: ''
    },
    {
      id: 'e2',
      analysisId: 'test-3',
      entityType: 'resistance_marker',
      rawValue: 'ESBL',
      normalizedValue: 'ESBL Producer',
      sourceText: 'ESBL screen positive',
      pageNumber: 1,
      confidence: 0.98,
      extractionMethod: 'rule_nlp_hybrid',
      createdAt: ''
    },
    {
      id: 'e3',
      analysisId: 'test-3',
      entityType: 'resistance_gene',
      rawValue: 'blaNDM-1',
      normalizedValue: 'blaNDM (New Delhi Metallo-beta-lactamase)',
      sourceText: 'blaNDM-1 detected',
      pageNumber: 1,
      confidence: 0.99,
      extractionMethod: 'rule_nlp_hybrid',
      createdAt: ''
    }
  ];

  const susceptibilities: SusceptibilityRecord[] = [
    { id: 's1', analysisId: 'test-3', organism: 'K. pneumoniae', antibiotic: 'Meropenem', interpretation: 'Resistant', confidence: 0.95 },
    { id: 's2', analysisId: 'test-3', organism: 'K. pneumoniae', antibiotic: 'Ceftriaxone', interpretation: 'Resistant', confidence: 0.95 },
    { id: 's3', analysisId: 'test-3', organism: 'K. pneumoniae', antibiotic: 'Ciprofloxacin', interpretation: 'Resistant', confidence: 0.95 },
    { id: 's4', analysisId: 'test-3', organism: 'K. pneumoniae', antibiotic: 'Colistin', interpretation: 'Susceptible', confidence: 0.95 }
  ];

  const patientInput: PatientInputRecord = {
    id: 'p1',
    analysisId: 'test-3',
    symptoms: 'High fever, unresolving',
    symptomDuration: 'more_than_14_days',
    severity: 'severe',
    infectionType: 'urinary',
    previousAntibioticExposure: 'frequent_repeated',
    treatmentDuration: 21,
    courseCompletion: 'stopped_early',
    persistentInfection: 'recurrent',
    createdAt: ''
  };

  const result = riskCalculator.calculate('test-3', entities, susceptibilities, patientInput);
  assert(result.riskPercentage !== null);
  assert(result.riskPercentage > 60.0, `Expected High Risk (>60), got ${result.riskPercentage}%`);
  assert.strictEqual(result.riskCategory, 'High');
  assert.strictEqual(result.evidenceCoverage, 'Broad', 'Expected Broad evidence coverage');
  assert(result.majorFactors.length > 0, 'Should have major contributing factors');
  console.log(`✓ Test 3 Passed: High risk profile verified (${result.riskPercentage}%, ${result.riskCategory}, coverage: ${result.coveragePercentage}%)`);
}

// Test 4: Missing Susceptibility Gap (Case 5)
{
  const entities: EntityRecord[] = [
    {
      id: 'e1',
      analysisId: 'test-4',
      entityType: 'organism',
      rawValue: 'Pseudomonas aeruginosa',
      normalizedValue: 'Pseudomonas aeruginosa',
      sourceText: 'Pseudomonas aeruginosa pure growth',
      pageNumber: 1,
      confidence: 0.95,
      extractionMethod: 'rule_nlp_hybrid',
      createdAt: ''
    }
  ];

  // Susceptibility is empty (in progress)
  const result = riskCalculator.calculate('test-4', entities, [], undefined);
  const suscFeature = result.features.find(f => f.featureName === 'susceptibility_resistance');
  assert(suscFeature !== undefined);
  assert.strictEqual(suscFeature?.available, false, 'Missing susceptibility MUST be marked as unavailable, not 0 contribution');
  console.log('✓ Test 4 Passed: Missing susceptibility is NOT assumed susceptible');
}

// Test 5: Exact Category Thresholds
{
  assert.strictEqual(config.thresholds.lowMax, 30.0);
  assert.strictEqual(config.thresholds.moderateMax, 60.0);
  assert.strictEqual(config.thresholds.highMax, 100.0);
  console.log('✓ Test 5 Passed: Category threshold boundaries verified (0-30 Low, 31-60 Moderate, 61-100 High)');
}

console.log('ALL TESTS PASSED SUCCESSFULLY!');
