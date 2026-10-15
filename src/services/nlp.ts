/**
 * ResistAI - Medical NLP and Entity Extraction Service
 * PRD Sections 12 & 13 - Free / Hybrid Rule & Dictionary Architecture
 */

import {
  CultureFinding,
  ExtractedEntity,
  SusceptibilityResult,
} from '../types/amr';
import {
  KNOWN_ANTIBIOTICS,
  KNOWN_ORGANISMS,
  KNOWN_RESISTANCE_GENES,
  KNOWN_RESISTANCE_MARKERS,
} from '../constants/amrConfig';

export interface NLPExtractionResult {
  entities: ExtractedEntity[];
  susceptibilityResults: SusceptibilityResult[];
  cultureFindings?: CultureFinding;
}

export class MedicalNLPService {
  /**
   * Main entity extraction pipeline.
   * Processes OCR text page-by-page.
   */
  public static extractEntitiesFromText(
    pages: { page: number; text: string; confidence: number }[]
  ): NLPExtractionResult {
    const entities: ExtractedEntity[] = [];
    const susceptibilityResults: SusceptibilityResult[] = [];
    let cultureFinding: CultureFinding | undefined;

    let idCounter = 1;

    for (const pageItem of pages) {
      const { page, text } = pageItem;
      const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

      // --- 1. Culture & Specimen Extraction ---
      let specimen = 'Unknown';
      let cultureOrganism = '';
      let colonyCount = '';
      let isPositive = false;
      let mixedGrowth = false;
      let contaminationSuspected = false;

      // Detect Specimen
      const specimenRegex = /(?:Specimen|Sample|Source|Sample Type)\s*[:=-]\s*([A-Za-z\s/]+)/i;
      const specimenMatch = text.match(specimenRegex);
      if (specimenMatch) {
        specimen = specimenMatch[1].trim();
      } else {
        if (/urine/i.test(text)) specimen = 'Urine';
        else if (/blood/i.test(text)) specimen = 'Blood';
        else if (/sputum/i.test(text)) specimen = 'Sputum';
        else if (/wound|pus/i.test(text)) specimen = 'Wound / Pus';
        else if (/swab/i.test(text)) specimen = 'Swab';
      }

      // Detect Colony Count
      const cfuRegex = /(\b(?:>|<|>=|<=)?\s*\d+(?:[,\.]\d+)?\s*(?:x\s*10\^?\d+|\^?\d+)?\s*(?:CFU\/m[lL]|colony\s*forming|cfu))/i;
      const cfuMatch = text.match(cfuRegex);
      if (cfuMatch) {
        colonyCount = cfuMatch[0].trim();
      }

      // Detect Growth / Positivity
      if (/(?:isolated|growth of|positive culture|heavy growth|pure growth|colony count)/i.test(text)) {
        isPositive = true;
      }
      if (/(?:mixed growth|polymicrobial|mixed flora)/i.test(text)) {
        mixedGrowth = true;
      }
      if (/(?:contamination|commensal|probable contaminant|skin flora)/i.test(text)) {
        contaminationSuspected = true;
      }

      // --- 2. Organism Extraction ---
      for (const org of KNOWN_ORGANISMS) {
        for (const alias of org.aliases) {
          const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b${escaped}\\b`, 'i');
          const match = text.match(regex);
          if (match) {
            // Check if not already added
            if (!entities.some((e) => e.entityType === 'organism' && e.normalizedValue === org.name)) {
              entities.push({
                id: `org_${idCounter++}`,
                entityType: 'organism',
                rawValue: match[0],
                normalizedValue: org.name,
                sourceText: match[0],
                pageNumber: page,
                confidence: 0.96,
                extractionMethod: 'nlp_medical_dictionary',
              });
              if (!cultureOrganism) cultureOrganism = org.name;
            }
            break;
          }
        }
      }

      // --- 3. Resistance Genes Extraction (STRICT: only if explicitly documented) ---
      for (const gene of KNOWN_RESISTANCE_GENES) {
        const escaped = gene.gene.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        const match = text.match(regex);
        if (match) {
          if (!entities.some((e) => e.entityType === 'resistance_gene' && e.normalizedValue === gene.gene)) {
            entities.push({
              id: `gene_${idCounter++}`,
              entityType: 'resistance_gene',
              rawValue: match[0],
              normalizedValue: gene.gene,
              sourceText: match[0],
              pageNumber: page,
              confidence: 0.98,
              extractionMethod: 'regex_pattern',
            });
          }
        }
      }

      // --- 4. Resistance Indicators Extraction ---
      for (const marker of KNOWN_RESISTANCE_MARKERS) {
        const escaped = marker.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match word boundary
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        const match = text.match(regex);
        if (match) {
          if (!entities.some((e) => e.entityType === 'resistance_marker' && e.normalizedValue === marker.term)) {
            entities.push({
              id: `marker_${idCounter++}`,
              entityType: 'resistance_marker',
              rawValue: match[0],
              normalizedValue: marker.term,
              sourceText: match[0],
              pageNumber: page,
              confidence: 0.95,
              extractionMethod: 'nlp_medical_dictionary',
            });
          }
        }
      }

      // --- 5. Susceptibility Results Extraction ---
      // Pattern matches lines like:
      // "Ciprofloxacin : Resistant (MIC > 4)" or "Amikacin Susceptible <= 2 ug/ml" or "Ceftriaxone R"
      for (const line of lines) {
        for (const abx of KNOWN_ANTIBIOTICS) {
          const abxRegex = new RegExp(`\\b${abx.replace(/-/g, '[-\\s]')}\\b`, 'i');
          if (abxRegex.test(line)) {
            let interpretation: 'Susceptible' | 'Intermediate' | 'Resistant' | 'Unknown' = 'Unknown';
            
            // Look for interpretation in line
            if (/\b(?:Resistant|Resist|Res|\[R\]|\bR\b)\b/i.test(line)) {
              interpretation = 'Resistant';
            } else if (/\b(?:Intermediate|Intermed|Int|\[I\]|\bI\b)\b/i.test(line)) {
              interpretation = 'Intermediate';
            } else if (/\b(?:Susceptible|Sensitive|Sens|\[S\]|\bS\b)\b/i.test(line)) {
              interpretation = 'Susceptible';
            }

            // Extract MIC if available
            let micValue: string | undefined;
            const micRegex = /(?:MIC\s*[:=-]?\s*)?([<>]=?\s*\d+(?:\.\d+)?)\s*(?:ug\/m[lL]|µg\/m[lL]|mg\/[lL]|mcg\/m[lL])?/i;
            const micMatch = line.match(micRegex);
            if (micMatch && micMatch[1]) {
              micValue = micMatch[1].trim();
            }

            if (interpretation !== 'Unknown') {
              // Avoid duplicates
              if (!susceptibilityResults.some((s) => s.antibiotic.toLowerCase() === abx.toLowerCase())) {
                susceptibilityResults.push({
                  id: `ast_${idCounter++}`,
                  antibiotic: abx,
                  interpretation,
                  micValue: micValue ? `${micValue} µg/mL` : undefined,
                  pageNumber: page,
                  confidence: 0.94,
                });

                // Also add as entity
                entities.push({
                  id: `abx_${idCounter++}`,
                  entityType: 'antibiotic',
                  rawValue: line,
                  normalizedValue: `${abx} (${interpretation})`,
                  sourceText: line,
                  pageNumber: page,
                  confidence: 0.94,
                  extractionMethod: 'ocr_rule_hybrid',
                });
              }
            }
          }
        }
      }

      // Check for Laboratory quantitative signals (e.g. WBC count / pus cells / CRP)
      const labMatch = text.match(/(?:pus cells|WBC|leukocytes|CRP)\s*[:=-]?\s*([0-9-+\s><A-Za-z/]+)/i);
      if (labMatch) {
        entities.push({
          id: `lab_${idCounter++}`,
          entityType: 'lab_value',
          rawValue: labMatch[0],
          normalizedValue: labMatch[0].trim(),
          sourceText: labMatch[0],
          pageNumber: page,
          confidence: 0.90,
          extractionMethod: 'regex_pattern',
        });
      }

      // Construct Culture Finding
      if (isPositive || specimen !== 'Unknown') {
        cultureFinding = {
          specimen,
          organism: cultureOrganism || 'Bacterial Isolate',
          colonyCount: colonyCount || undefined,
          isPositive,
          mixedGrowth,
          contaminationSuspected,
          notes: `Extracted from page ${page}`,
        };
      }
    }

    return {
      entities,
      susceptibilityResults,
      cultureFindings: cultureFinding,
    };
  }
}
