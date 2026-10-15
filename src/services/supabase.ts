/**
 * ResistAI - Supabase Database Client & Sync Service
 * Seamless Cloud Database Persistence with Offline-First Fallback
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AMRAnalysis, AuditEvent } from '../types/amr';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.trim().length > 0 &&
    !supabaseUrl.includes('your-project-id') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.trim().length > 0 &&
    !supabaseAnonKey.includes('your-anon-key-here')
  );
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  return clientInstance;
};

export class SupabaseService {
  /**
   * Tests the connection to Supabase database.
   */
  public static async testConnection(): Promise<{ connected: boolean; message: string }> {
    if (!isSupabaseConfigured()) {
      return {
        connected: false,
        message: 'Supabase credentials are not configured in .env yet. Running in local offline storage mode.',
      };
    }

    try {
      const client = getSupabaseClient();
      if (!client) {
        return { connected: false, message: 'Could not initialize Supabase client.' };
      }

      // Ping table or health check
      const { error } = await client.from('analyses').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        // Table might not be created yet, but connection was reached
        if (error.code === '42P01') {
          return {
            connected: true,
            message: 'Connected to Supabase project! (Note: Run supabase_schema.sql to create tables)',
          };
        }
        return { connected: false, message: `Supabase error: ${error.message}` };
      }

      return { connected: true, message: 'Successfully connected to Supabase PostgreSQL database!' };
    } catch (err: any) {
      return { connected: false, message: err?.message || 'Failed to reach Supabase endpoint.' };
    }
  }

  /**
   * Syncs an analysis record to Supabase.
   */
  public static async syncAnalysis(analysis: AMRAnalysis): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    try {
      const payload = {
        id: analysis.id,
        title: analysis.title,
        status: analysis.status,
        is_demo: Boolean(analysis.isDemo),
        created_at: analysis.createdAt,
        updated_at: analysis.updatedAt,
        culture_findings: analysis.cultureFindings || {},
        patient_input: analysis.patientInput || {},
        susceptibility_results: analysis.susceptibilityResults || [],
        extracted_entities: analysis.extractedEntities || [],
        risk_result: analysis.riskResult || {},
        documents: analysis.documents || [],
      };

      const { error } = await client.from('analyses').upsert(payload, { onConflict: 'id' });
      if (error) {
        console.warn('Supabase analysis sync error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase sync exception:', err);
      return false;
    }
  }

  /**
   * Fetches analyses from Supabase database.
   */
  public static async fetchAnalyses(): Promise<AMRAnalysis[] | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch error:', error.message);
        return null;
      }

      if (!data) return [];

      return data.map((row: any) => ({
        id: row.id,
        title: row.title,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isDemo: row.is_demo,
        cultureFindings: row.culture_findings,
        patientInput: row.patient_input,
        susceptibilityResults: row.susceptibility_results || [],
        extractedEntities: row.extracted_entities || [],
        riskResult: row.risk_result,
        documents: row.documents || [],
      }));
    } catch (err) {
      console.warn('Supabase fetch exception:', err);
      return null;
    }
  }

  /**
   * Deletes an analysis record from Supabase.
   */
  public static async deleteAnalysis(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    try {
      const { error } = await client.from('analyses').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Syncs privacy-safe audit event to Supabase.
   */
  public static async syncAuditEvent(event: AuditEvent): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    try {
      const { error } = await client.from('audit_events').insert({
        id: event.id,
        event_type: event.eventType,
        description: event.description,
        timestamp: event.timestamp,
        analysis_id: event.analysisId,
        metadata: event.metadata || {},
      });
      return !error;
    } catch {
      return false;
    }
  }
}
