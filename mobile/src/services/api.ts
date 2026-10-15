
import { Platform } from 'react-native';
import {
  AnalysisRecord,
  DocumentRecord,
  EntityRecord,
  SusceptibilityRecord,
  PatientInputRecord,
  RiskResultRecord,
  DemoCase
} from '../types';

let currentApiUrl = Platform.select({
  android: 'http://10.0.2.2:8000',
  default: 'http://localhost:8000'
});

export const getApiUrl = () => currentApiUrl;
export const setApiUrl = (url: string) => {
  currentApiUrl = url.replace(/\/$/, '');
};

let authToken: string | null = null;
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

const getHeaders = (isJson = true) => {
  const headers: Record<string, string> = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  if (authToken) headers['Authorization'] = 'Bearer ' + authToken;
  return headers;
};

export const api = {
  async checkHealth(): Promise<{ status: string; version: string }> {
    const res = await fetch(currentApiUrl + '/api/health');
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async loginDemo(): Promise<{ token: string; user: any }> {
    const res = await fetch(currentApiUrl + '/api/auth/demo', {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Demo login failed');
    const data = await res.json();
    setAuthToken(data.token);
    return data;
  },

  async listAnalyses(): Promise<AnalysisRecord[]> {
    const res = await fetch(currentApiUrl + '/api/analyses', {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch analyses');
    return res.json();
  },

  async createAnalysis(title?: string): Promise<AnalysisRecord> {
    const res = await fetch(currentApiUrl + '/api/analyses', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title })
    });
    if (!res.ok) throw new Error('Failed to create analysis');
    return res.json();
  },

  async getAnalysis(id: string): Promise<{
    analysis: AnalysisRecord;
    documents: DocumentRecord[];
    entities: EntityRecord[];
    susceptibilities: SusceptibilityRecord[];
    patientInput?: PatientInputRecord;
    riskResult?: RiskResultRecord;
  }> {
    const res = await fetch(currentApiUrl + '/api/analyses/' + id, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch analysis details');
    return res.json();
  },

  async deleteAnalysis(id: string): Promise<void> {
    const res = await fetch(currentApiUrl + '/api/analyses/' + id, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete analysis');
  },

  async uploadDocument(
    analysisId: string,
    fileUri: string,
    originalFilename: string,
    mimeType: string
  ): Promise<DocumentRecord> {
    const formData = new FormData();
    // @ts-ignore
    formData.append('file', {
      uri: fileUri,
      name: originalFilename,
      type: mimeType
    });

    const res = await fetch(currentApiUrl + '/api/analyses/' + analysisId + '/documents', {
      method: 'POST',
      headers: getHeaders(false),
      body: formData
    });
    if (!res.ok) throw new Error('Failed to upload document');
    return res.json();
  },

  async runOcr(documentId: string): Promise<any> {
    const res = await fetch(currentApiUrl + '/api/analyses/documents/' + documentId + '/ocr', {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to run OCR');
    return res.json();
  },

  async runExtraction(analysisId: string): Promise<any> {
    const res = await fetch(currentApiUrl + '/api/analyses/' + analysisId + '/extract', {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to extract medical entities');
    return res.json();
  },

  async updateEntities(analysisId: string, entities: EntityRecord[]): Promise<void> {
    const res = await fetch(currentApiUrl + '/api/analyses/' + analysisId + '/entities', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ entities })
    });
    if (!res.ok) throw new Error('Failed to update entities');
  },

  async updateSusceptibilities(analysisId: string, susceptibilities: SusceptibilityRecord[]): Promise<void> {
    const res = await fetch(currentApiUrl + '/api/analyses/' + analysisId + '/susceptibilities', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ susceptibilities })
    });
    if (!res.ok) throw new Error('Failed to update susceptibilities');
  },

  async savePatientInput(analysisId: string, input: PatientInputRecord): Promise<any> {
    const res = await fetch(currentApiUrl + '/api/analyses/' + analysisId + '/patient-inputs', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error('Failed to save patient inputs');
    return res.json();
  },

  async calculateRisk(analysisId: string): Promise<any> {
    const res = await fetch(currentApiUrl + '/api/analyses/' + analysisId + '/calculate-risk', {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Risk calculation failed');
    return res.json();
  },

  async getDemoCases(): Promise<DemoCase[]> {
    const res = await fetch(currentApiUrl + '/api/demo/cases');
    if (!res.ok) throw new Error('Failed to fetch demo cases');
    return res.json();
  },

  async loadDemoCase(caseId: string): Promise<any> {
    const res = await fetch(currentApiUrl + '/api/demo/load-case/' + caseId, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to load demo case');
    return res.json();
  },

  async getAdminConfig(): Promise<any> {
    const res = await fetch(currentApiUrl + '/api/admin/config', {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to get admin config');
    return res.json();
  },

  async updateWeights(weights: any): Promise<any> {
    const res = await fetch(currentApiUrl + '/api/admin/weights', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ weights })
    });
    if (!res.ok) throw new Error('Failed to update weights');
    return res.json();
  }
};
