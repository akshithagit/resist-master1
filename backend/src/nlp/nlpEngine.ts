import { v4 as uuidv4 } from 'uuid';
import {
  EntityRecord,
  SusceptibilityRecord,
  SusceptibilityInterpretation
} from '../types/index.js';

interface ExtractionResult {
  entities: EntityRecord[];
  susceptibilityResults: SusceptibilityRecord[];
}

export class NlpEngine {
  private knownOrganisms: { pattern: RegExp; normalized: string }[] = [
    { pattern: /\b(escherichia\s+coli|e\.?\s*coli)\b/i, normalized: 'Escherichia coli' },
    { pattern: /\b(klebsiella\s+pneumoniae|k\.?\s*pneumoniae|klebsiella\s+species|klebsiella\s+sp\.?)\b/i, normalized: 'Klebsiella pneumoniae' },
    { pattern: /\b(staphylococcus\s+aureus|s\.?\s*aureus|staph\s+aureus)\b/i, normalized: 'Staphylococcus aureus' },
    { pattern: /\b(pseudomonas\s+aeruginosa|p\.?\s*aeruginosa|pseudomonas\s+sp\.?)\b/i, normalized: 'Pseudomonas aeruginosa' },
    { pattern: /\b(enterococcus\s+faecium|e\.?\s*faecium)\b/i, normalized: 'Enterococcus faecium' },
    { pattern: /\b(enterococcus\s+faecalis|e\.?\s*faecalis|enterococcus\s+species)\b/i, normalized: 'Enterococcus faecalis' },
    { pattern: /\b(acinetobacter\s+baumannii|a\.?\s*baumannii)\b/i, normalized: 'Acinetobacter baumannii' },
    { pattern: /\b(proteus\s+mirabilis|p\.?\s*mirabilis|proteus\s+vulgaris)\b/i, normalized: 'Proteus mirabilis' },
    { pattern: /\b(streptococcus\s+pneumoniae|s\.?\s*pneumoniae)\b/i, normalized: 'Streptococcus pneumoniae' },
    { pattern: /\b(enterobacter\s+cloacae|e\.?\s*cloacae|enterobacter\s+aerogenes)\b/i, normalized: 'Enterobacter cloacae complex' },
    { pattern: /\b(serratia\s+marcescens|s\.?\s*marcescens)\b/i, normalized: 'Serratia marcescens' }
  ];

  private knownAntibiotics = [
    'Amikacin', 'Amoxicillin', 'Amoxicillin-Clavulanate', 'Ampicillin', 'Ampicillin-Sulbactam',
    'Azithromycin', 'Aztreonam', 'Cefazolin', 'Cefepime', 'Cefixime', 'Cefotaxime', 'Cefoxitin',
    'Ceftazidime', 'Ceftriaxone', 'Cefuroxime', 'Ciprofloxacin', 'Clarithromycin', 'Clindamycin',
    'Colistin', 'Daptomycin', 'Doxycycline', 'Ertapenem', 'Gentamicin', 'Imipenem', 'Levofloxacin',
    'Linezolid', 'Meropenem', 'Minocycline', 'Moxifloxacin', 'Nitrofurantoin', 'Oxacillin',
    'Piperacillin-Tazobactam', 'Polymyxin B', 'Rifampin', 'Sulfamethoxazole-Trimethoprim',
    'Teicoplanin', 'Tetracycline', 'Tigecycline', 'Tobramycin', 'Vancomycin'
  ];

  private resistanceMarkers = [
    { pattern: /\b(MRSA|Methicillin[\s-]Resistant\s+Staph\w*)\b/i, normalized: 'MRSA (Methicillin-Resistant S. aureus)' },
    { pattern: /\b(ESBL|Extended[\s-]Spectrum\s+Beta[\s-]Lactamase)\b/i, normalized: 'ESBL Producer' },
    { pattern: /\b(VRE|Vancomycin[\s-]Resistant\s+Enterococc\w*)\b/i, normalized: 'VRE (Vancomycin-Resistant Enterococcus)' },
    { pattern: /\b(CRE|Carbapenem[\s-]Resistant\s+Enterobacter\w*|CRKP)\b/i, normalized: 'CRE (Carbapenem-Resistant Enterobacteriaceae)' },
    { pattern: /\b(MDR|Multi[\s-]Drug\s+Resistan\w*)\b/i, normalized: 'MDR (Multidrug-Resistant)' },
    { pattern: /\b(XDR|Extensively\s+Drug\s+Resistan\w*)\b/i, normalized: 'XDR (Extensively Drug-Resistant)' },
    { pattern: /\b(PDR|Pan[\s-]Drug\s+Resistan\w*)\b/i, normalized: 'PDR (Pandrug-Resistant)' }
  ];

  private resistanceGenes = [
    { pattern: /\b(mecA|mecC)\b/i, normalized: 'mecA/mecC (Methicillin resistance)' },
    { pattern: /\b(blaCTX-M[\w-]*)\b/i, normalized: 'blaCTX-M (ESBL gene)' },
    { pattern: /\b(blaNDM[\w-]*)\b/i, normalized: 'blaNDM (New Delhi Metallo-beta-lactamase)' },
    { pattern: /\b(blaKPC[\w-]*)\b/i, normalized: 'blaKPC (Klebsiella pneumoniae carbapenemase)' },
    { pattern: /\b(blaOXA-48[\w-]*)\b/i, normalized: 'blaOXA-48-like (Carbapenemase)' },
    { pattern: /\b(blaVIM[\w-]*|blaIMP[\w-]*)\b/i, normalized: 'Metallo-beta-lactamase (VIM/IMP)' },
    { pattern: /\b(vanA|vanB)\b/i, normalized: 'vanA/vanB (Vancomycin resistance)' },
    { pattern: /\b(mcr-1|mcr-[1-9])\b/i, normalized: 'mcr-1 (Colistin resistance)' }
  ];

  public extractFromText(
    textList: { pageNumber: number; text: string; documentId?: string }[],
    analysisId: string
  ): ExtractionResult {
    const entities: EntityRecord[] = [];
    const susceptibilityResults: SusceptibilityRecord[] = [];

    let isolatedOrganism = 'Clinical isolate';

    for (const item of textList) {
      const { pageNumber, text, documentId } = item;
      const lines = text.split('\n');

      // 1. Organisms
      for (const org of this.knownOrganisms) {
        const match = text.match(org.pattern);
        if (match) {
          isolatedOrganism = org.normalized;
          entities.push({
            id: uuidv4(),
            analysisId,
            entityType: 'organism',
            rawValue: match[0],
            normalizedValue: org.normalized,
            sourceText: this.getSurroundingSnippet(text, match.index || 0, match[0].length),
            pageNumber,
            confidence: 0.95,
            extractionMethod: 'rule_nlp_hybrid',
            createdAt: new Date().toISOString()
          });
        }
      }

      // 2. Culture & Specimen findings
      const specimenMatch = text.match(/\b(urine|blood|sputum|wound|pus|swab|bronchial|csf|synovial|pleural|stool)\b/i);
      if (specimenMatch) {
        entities.push({
          id: uuidv4(),
          analysisId,
          entityType: 'culture',
          rawValue: specimenMatch[0],
          normalizedValue: 'Specimen: ' + specimenMatch[0].toUpperCase(),
          sourceText: this.getSurroundingSnippet(text, specimenMatch.index || 0, specimenMatch[0].length),
          pageNumber,
          confidence: 0.90,
          extractionMethod: 'rule_nlp_hybrid',
          createdAt: new Date().toISOString()
        });
      }

      const colonyMatch = text.match(/([>≥]?\s*\d+[\d,]*\s*(?:CFU\/m[lL]|\^?\s*10\^?\d+))/i);
      if (colonyMatch) {
        entities.push({
          id: uuidv4(),
          analysisId,
          entityType: 'culture',
          rawValue: colonyMatch[0],
          normalizedValue: 'Colony count: ' + colonyMatch[0].trim(),
          sourceText: this.getSurroundingSnippet(text, colonyMatch.index || 0, colonyMatch[0].length),
          pageNumber,
          confidence: 0.92,
          extractionMethod: 'rule_nlp_hybrid',
          createdAt: new Date().toISOString()
        });
      }

      // 3. Explicit Resistance Markers (MDR, ESBL, MRSA, VRE, etc.)
      for (const marker of this.resistanceMarkers) {
        const match = text.match(marker.pattern);
        if (match) {
          entities.push({
            id: uuidv4(),
            analysisId,
            entityType: 'resistance_marker',
            rawValue: match[0],
            normalizedValue: marker.normalized,
            sourceText: this.getSurroundingSnippet(text, match.index || 0, match[0].length),
            pageNumber,
            confidence: 0.96,
            extractionMethod: 'rule_nlp_hybrid',
            createdAt: new Date().toISOString()
          });
        }
      }

      // 4. Explicit Resistance Genes (ONLY if explicitly documented in the report)
      for (const gene of this.resistanceGenes) {
        const match = text.match(gene.pattern);
        if (match) {
          entities.push({
            id: uuidv4(),
            analysisId,
            entityType: 'resistance_gene',
            rawValue: match[0],
            normalizedValue: gene.normalized,
            sourceText: this.getSurroundingSnippet(text, match.index || 0, match[0].length),
            pageNumber,
            confidence: 0.98,
            extractionMethod: 'rule_nlp_hybrid',
            createdAt: new Date().toISOString()
          });
        }
      }

      // 5. Line-by-line Susceptibility extraction
      for (const line of lines) {
        for (const abx of this.knownAntibiotics) {
          const abxRegex = new RegExp('\\b' + abx.replace(/[-]/g, '[- ]') + '\\b', 'i');
          if (abxRegex.test(line)) {
            // Check for interpretation: Resistant (R), Susceptible (S), Intermediate (I)
            let interpretation: SusceptibilityInterpretation | null = null;
            if (/\b(Resistant|Resist|(?<=\s)R(?=\s|$|[,\.]))\b/i.test(line)) {
              interpretation = 'Resistant';
            } else if (/\b(Intermediate|Interm|(?<=\s)I(?=\s|$|[,\.]))\b/i.test(line)) {
              interpretation = 'Intermediate';
            } else if (/\b(Susceptible|Sensitive|(?<=\s)S(?=\s|$|[,\.]))\b/i.test(line)) {
              interpretation = 'Susceptible';
            }

            // Extract MIC if documented
            const micMatch = line.match(/(?:MIC[:\s]*|[<>=≤≥]\s*)(\d+(?:\.\d+)?)\s*(?:ug\/mL|mcg\/mL|mg\/L|µg\/mL)?/i);
            const micValue = micMatch ? micMatch[1] : undefined;
            const micUnit = micMatch ? (line.includes('mg/L') ? 'mg/L' : 'µg/mL') : undefined;

            if (interpretation) {
              const exists = susceptibilityResults.some(
                s => s.antibiotic.toLowerCase() === abx.toLowerCase() && s.pageNumber === pageNumber
              );
              if (!exists) {
                susceptibilityResults.push({
                  id: uuidv4(),
                  analysisId,
                  organism: isolatedOrganism,
                  antibiotic: abx,
                  interpretation,
                  micValue,
                  micUnit,
                  sourceDocumentId: documentId,
                  pageNumber,
                  confidence: 0.93,
                  isUserModified: false
                });

                const micStr = micValue ? (' (MIC: ' + micValue + ' ' + (micUnit || 'µg/mL') + ')') : '';
                entities.push({
                  id: uuidv4(),
                  analysisId,
                  entityType: 'susceptibility',
                  rawValue: line.trim(),
                  normalizedValue: abx + ': ' + interpretation + micStr,
                  sourceText: line.trim(),
                  pageNumber,
                  confidence: 0.93,
                  extractionMethod: 'rule_nlp_hybrid',
                  createdAt: new Date().toISOString()
                });
              }
            }
          }
        }
      }
    }

    return { entities, susceptibilityResults };
  }

  private getSurroundingSnippet(fullText: string, startIndex: number, length: number): string {
    const start = Math.max(0, startIndex - 60);
    const end = Math.min(fullText.length, startIndex + length + 60);
    let snippet = fullText.slice(start, end).replace(/\s+/g, ' ').trim();
    if (start > 0) snippet = '...' + snippet;
    if (end < fullText.length) snippet = snippet + '...';
    return snippet;
  }
}

export const nlpEngine = new NlpEngine();
