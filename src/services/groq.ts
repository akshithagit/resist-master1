/**
 * ResistAI - External API Free Migration Layer
 * Deprecated: Groq API has been completely removed as requested.
 * All inference and processing are delegated locally to LocalAIService.
 */

import { LocalAIService } from './localAiService';
import { PatientClinicalInput, RiskCalculationResult } from '../types/amr';

export class GroqService {
  /**
   * @deprecated External Groq API removed. Uses LocalAIService.
   */
  public static async extractTextFromImageWithGroq(
    base64ImageData: string,
    mimeType: string = 'image/jpeg'
  ): Promise<string> {
    return LocalAIService.extractTextFromImageLocally(base64ImageData, 'document.png', mimeType);
  }

  /**
   * @deprecated External Groq API removed. Uses LocalAIService.
   */
  public static async calculateAMRRiskWithGroq(
    ocrText: string,
    organism: string,
    specimen: string,
    patientInput: PatientClinicalInput
  ): Promise<RiskCalculationResult> {
    return LocalAIService.calculateAMRRisk(ocrText, organism, specimen, patientInput);
  }
}
