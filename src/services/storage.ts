/**
 * ResistAI - Storage & Audit Logging Service
 * Hybrid Offline-First Persistence (AsyncStorage + Supabase Cloud DB)
 * PRD Sections 28, 29, 41, 57
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AMRAnalysis, AuditEvent, FeatureWeightsConfig } from '../types/amr';
import { DEFAULT_FEATURE_WEIGHTS } from '../constants/amrConfig';
import { SYNTHETIC_DEMO_CASES } from './demoData';
import { defaultRiskEngine } from './riskEngine';
import { SupabaseService, isSupabaseConfigured } from './supabase';
import { AuthService } from './auth';

const STORAGE_KEYS = {
  ANALYSES: '@resistai_analyses_v1',
  FEATURE_WEIGHTS: '@resistai_feature_weights_v1',
  AUDIT_EVENTS: '@resistai_audit_events_v1',
  FIRST_RUN_INITIALIZED: '@resistai_initialized_v1',
};

export class StorageService {
  /**
   * Initializes default demo data on first launch.
   */
  public static async initializeIfNeeded(): Promise<void> {
    try {
      const initialized = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_RUN_INITIALIZED);
      if (!initialized) {
        // Pre-compute risk for demo cases so they are immediately interactive
        const precomputedDemos: AMRAnalysis[] = SYNTHETIC_DEMO_CASES.map((demo) => {
          const analysis = { ...demo.analysis };
          const features = defaultRiskEngine.extractFeatures(
            analysis.extractedEntities,
            analysis.susceptibilityResults,
            analysis.patientInput,
            analysis.cultureFindings
          );
          analysis.riskResult = defaultRiskEngine.calculateRisk(features, analysis.patientInput);
          return analysis;
        });

        await AsyncStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(precomputedDemos));
        await AsyncStorage.setItem(STORAGE_KEYS.FEATURE_WEIGHTS, JSON.stringify(DEFAULT_FEATURE_WEIGHTS));
        await this.logAuditEvent('ANALYSIS_CREATED', 'System initialized with synthetic demonstration records');
        await AsyncStorage.setItem(STORAGE_KEYS.FIRST_RUN_INITIALIZED, 'true');

        // Sync to Supabase if configured
        if (isSupabaseConfigured()) {
          for (const d of precomputedDemos) {
            await SupabaseService.syncAnalysis(d);
          }
        }
      }
    } catch (err) {
      console.error('Storage initialization failed:', err);
    }
  }

  public static async getAllAnalyses(): Promise<AMRAnalysis[]> {
    try {
      await this.initializeIfNeeded();

      // If Supabase is active, try to fetch remote records
      if (isSupabaseConfigured()) {
        const remote = await SupabaseService.fetchAnalyses();
        if (remote && remote.length > 0) {
          await AsyncStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(remote));
          return remote;
        }
      }

      const raw = await AsyncStorage.getItem(STORAGE_KEYS.ANALYSES);
      if (!raw) return [];
      const list: AMRAnalysis[] = JSON.parse(raw);
      // Sort newest first
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.error('Failed to load analyses:', err);
      return [];
    }
  }

  public static async getAnalysisById(id: string): Promise<AMRAnalysis | null> {
    try {
      const all = await this.getAllAnalyses();
      return all.find((a) => a.id === id) || null;
    } catch (err) {
      console.error('Failed to get analysis:', err);
      return null;
    }
  }

  public static async saveAnalysis(analysis: AMRAnalysis): Promise<void> {
    try {
      const session = await AuthService.getSession();
      if (session?.user?.id && !analysis.userId) {
        analysis.userId = session.user.id;
      }

      const all = await this.getAllAnalyses();
      const existingIdx = all.findIndex((a) => a.id === analysis.id);

      const isNew = existingIdx < 0;
      analysis.updatedAt = new Date().toISOString();

      if (isNew) {
        all.unshift(analysis);
        await this.logAuditEvent('ANALYSIS_CREATED', `New analysis created: ${analysis.id}`, {
          analysisId: analysis.id,
          isDemo: Boolean(analysis.isDemo),
        });
      } else {
        all[existingIdx] = analysis;
        await this.logAuditEvent('RISK_CALCULATED', `Analysis updated: ${analysis.id}`, {
          analysisId: analysis.id,
          riskPercentage: analysis.riskResult?.riskPercentage ?? 'none',
        });
      }

      await AsyncStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(all));

      // Dual write to Supabase if configured
      if (isSupabaseConfigured()) {
        await SupabaseService.syncAnalysis(analysis);
      }
    } catch (err) {
      console.error('Failed to save analysis:', err);
      throw err;
    }
  }

  /**
   * Data Deletion (PRD Section 28)
   * Purges database record, OCR text, entities, and risk results.
   */
  public static async deleteAnalysis(id: string): Promise<void> {
    try {
      const all = await this.getAllAnalyses();
      const filtered = all.filter((a) => a.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(filtered));

      await this.logAuditEvent('ANALYSIS_DELETED', `Analysis record purged: ${id}`, {
        analysisId: id,
      });

      // Delete from Supabase if configured
      if (isSupabaseConfigured()) {
        await SupabaseService.deleteAnalysis(id);
      }
    } catch (err) {
      console.error('Failed to delete analysis:', err);
      throw err;
    }
  }

  public static async getFeatureWeights(): Promise<FeatureWeightsConfig> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.FEATURE_WEIGHTS);
      if (!raw) return DEFAULT_FEATURE_WEIGHTS;
      return JSON.parse(raw);
    } catch {
      return DEFAULT_FEATURE_WEIGHTS;
    }
  }

  public static async saveFeatureWeights(weights: FeatureWeightsConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FEATURE_WEIGHTS, JSON.stringify(weights));
      await this.logAuditEvent('MANUAL_CORRECTION', 'Custom feature weights updated by researcher/admin');
    } catch (err) {
      console.error('Failed to save feature weights:', err);
    }
  }

  public static async resetFeatureWeights(): Promise<FeatureWeightsConfig> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FEATURE_WEIGHTS, JSON.stringify(DEFAULT_FEATURE_WEIGHTS));
      await this.logAuditEvent('MANUAL_CORRECTION', 'Feature weights reset to default prototype specification');
      return DEFAULT_FEATURE_WEIGHTS;
    } catch {
      return DEFAULT_FEATURE_WEIGHTS;
    }
  }

  public static async getAuditEvents(): Promise<AuditEvent[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.AUDIT_EVENTS);
      if (!raw) return [];
      const list: AuditEvent[] = JSON.parse(raw);
      return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch {
      return [];
    }
  }

  /**
   * Logs structured audit events.
   * STRICT PRIVACY: Never includes patient names, OCR raw clinical text, or PHI.
   */
  public static async logAuditEvent(
    eventType: AuditEvent['eventType'],
    description: string,
    metadata?: Record<string, string | number | boolean>
  ): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.AUDIT_EVENTS);
      const events: AuditEvent[] = raw ? JSON.parse(raw) : [];

      const newEvent: AuditEvent = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        eventType,
        description,
        metadata,
      };

      // Keep recent 100 audit events locally
      events.unshift(newEvent);
      if (events.length > 100) events.pop();

      await AsyncStorage.setItem(STORAGE_KEYS.AUDIT_EVENTS, JSON.stringify(events));

      // Sync audit event to Supabase if configured
      if (isSupabaseConfigured()) {
        await SupabaseService.syncAuditEvent(newEvent);
      }
    } catch (err) {
      console.warn('Failed to record audit event:', err);
    }
  }
}
