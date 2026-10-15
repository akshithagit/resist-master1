import fs from 'fs';
import path from 'path';
import { config } from '../core/config.js';
import {
  User,
  AnalysisRecord,
  DocumentRecord,
  ExtractedTextRecord,
  EntityRecord,
  SusceptibilityRecord,
  PatientInputRecord,
  RiskFeatureRecord,
  RiskResultRecord,
  AuditEventRecord,
  FeatureWeightsConfig
} from '../types/index.js';

interface DatabaseSchema {
  users: User[];
  analyses: AnalysisRecord[];
  documents: DocumentRecord[];
  extractedTexts: ExtractedTextRecord[];
  entities: EntityRecord[];
  susceptibilityResults: SusceptibilityRecord[];
  patientInputs: PatientInputRecord[];
  riskFeatures: RiskFeatureRecord[];
  riskResults: RiskResultRecord[];
  auditEvents: AuditEventRecord[];
  activeWeights: FeatureWeightsConfig;
}

class DatabaseStore {
  private dbFilePath: string;
  private data: DatabaseSchema;
  private isSaving: boolean = false;

  constructor() {
    this.dbFilePath = path.join(config.dataDir, 'resistai_db.json');
    if (!fs.existsSync(config.dataDir)) {
      fs.mkdirSync(config.dataDir, { recursive: true });
    }
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[DB] Failed to read database, initializing fresh state', err);
    }
    return {
      users: [],
      analyses: [],
      documents: [],
      extractedTexts: [],
      entities: [],
      susceptibilityResults: [],
      patientInputs: [],
      riskFeatures: [],
      riskResults: [],
      auditEvents: [],
      activeWeights: { ...config.defaultWeights }
    };
  }

  public async save(): Promise<void> {
    if (this.isSaving) return;
    this.isSaving = true;
    try {
      const tempPath = this.dbFilePath + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempPath, this.dbFilePath);
    } catch (err) {
      console.error('[DB] Error persisting database file:', err);
    } finally {
      this.isSaving = false;
    }
  }

  // Users
  public async findUserByEmail(email: string): Promise<User | undefined> {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public async findUserById(id: string): Promise<User | undefined> {
    return this.data.users.find(u => u.id === id);
  }

  public async createUser(user: User): Promise<User> {
    this.data.users.push(user);
    await this.save();
    return user;
  }

  // Analyses
  public async getAnalyses(userId?: string): Promise<AnalysisRecord[]> {
    if (userId) {
      return this.data.analyses.filter(a => a.userId === userId && a.status !== 'DELETED');
    }
    return this.data.analyses.filter(a => a.status !== 'DELETED');
  }

  public async getAnalysisById(id: string): Promise<AnalysisRecord | undefined> {
    return this.data.analyses.find(a => a.id === id && a.status !== 'DELETED');
  }

  public async createAnalysis(record: AnalysisRecord): Promise<AnalysisRecord> {
    this.data.analyses.push(record);
    await this.save();
    return record;
  }

  public async updateAnalysis(id: string, updates: Partial<AnalysisRecord>): Promise<AnalysisRecord | undefined> {
    const idx = this.data.analyses.findIndex(a => a.id === id);
    if (idx === -1) return undefined;
    this.data.analyses[idx] = {
      ...this.data.analyses[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.save();
    return this.data.analyses[idx];
  }

  public async deleteAnalysis(id: string): Promise<boolean> {
    const analysis = this.data.analyses.find(a => a.id === id);
    if (!analysis) return false;

    // Hard delete or status update
    analysis.status = 'DELETED';
    analysis.updatedAt = new Date().toISOString();

    // Clean up connected documents files if practical
    const docs = this.data.documents.filter(d => d.analysisId === id);
    for (const d of docs) {
      try {
        const filePath = path.join(config.uploadDir, d.storageKey);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.warn('[DB] Could not delete physical document:', d.storageKey);
      }
    }

    await this.save();
    return true;
  }

  // Documents
  public async getDocuments(analysisId: string): Promise<DocumentRecord[]> {
    return this.data.documents.filter(d => d.analysisId === analysisId);
  }

  public async getDocumentById(id: string): Promise<DocumentRecord | undefined> {
    return this.data.documents.find(d => d.id === id);
  }

  public async createDocument(doc: DocumentRecord): Promise<DocumentRecord> {
    this.data.documents.push(doc);
    await this.save();
    return doc;
  }

  public async updateDocument(id: string, updates: Partial<DocumentRecord>): Promise<DocumentRecord | undefined> {
    const idx = this.data.documents.findIndex(d => d.id === id);
    if (idx === -1) return undefined;
    this.data.documents[idx] = { ...this.data.documents[idx], ...updates };
    await this.save();
    return this.data.documents[idx];
  }

  // Extracted Texts
  public async getExtractedTexts(documentId: string): Promise<ExtractedTextRecord[]> {
    return this.data.extractedTexts.filter(t => t.documentId === documentId);
  }

  public async addExtractedTexts(records: ExtractedTextRecord[]): Promise<void> {
    this.data.extractedTexts.push(...records);
    await this.save();
  }

  // Entities
  public async getEntities(analysisId: string): Promise<EntityRecord[]> {
    return this.data.entities.filter(e => e.analysisId === analysisId);
  }

  public async replaceEntities(analysisId: string, entities: EntityRecord[]): Promise<void> {
    this.data.entities = this.data.entities.filter(e => e.analysisId !== analysisId);
    this.data.entities.push(...entities);
    await this.save();
  }

  public async addEntity(entity: EntityRecord): Promise<void> {
    this.data.entities.push(entity);
    await this.save();
  }

  // Susceptibility Results
  public async getSusceptibilityResults(analysisId: string): Promise<SusceptibilityRecord[]> {
    return this.data.susceptibilityResults.filter(s => s.analysisId === analysisId);
  }

  public async replaceSusceptibilityResults(analysisId: string, records: SusceptibilityRecord[]): Promise<void> {
    this.data.susceptibilityResults = this.data.susceptibilityResults.filter(s => s.analysisId !== analysisId);
    this.data.susceptibilityResults.push(...records);
    await this.save();
  }

  // Patient Inputs
  public async getPatientInput(analysisId: string): Promise<PatientInputRecord | undefined> {
    return this.data.patientInputs.find(p => p.analysisId === analysisId);
  }

  public async setPatientInput(input: PatientInputRecord): Promise<PatientInputRecord> {
    const idx = this.data.patientInputs.findIndex(p => p.analysisId === input.analysisId);
    if (idx >= 0) {
      this.data.patientInputs[idx] = input;
    } else {
      this.data.patientInputs.push(input);
    }
    await this.save();
    return input;
  }

  // Risk Features
  public async getRiskFeatures(analysisId: string): Promise<RiskFeatureRecord[]> {
    return this.data.riskFeatures.filter(r => r.analysisId === analysisId);
  }

  public async replaceRiskFeatures(analysisId: string, features: RiskFeatureRecord[]): Promise<void> {
    this.data.riskFeatures = this.data.riskFeatures.filter(r => r.analysisId !== analysisId);
    this.data.riskFeatures.push(...features);
    await this.save();
  }

  // Risk Results
  public async getRiskResult(analysisId: string): Promise<RiskResultRecord | undefined> {
    return this.data.riskResults.find(r => r.analysisId === analysisId);
  }

  public async setRiskResult(result: RiskResultRecord): Promise<RiskResultRecord> {
    const idx = this.data.riskResults.findIndex(r => r.analysisId === result.analysisId);
    if (idx >= 0) {
      this.data.riskResults[idx] = result;
    } else {
      this.data.riskResults.push(result);
    }
    await this.save();
    return result;
  }

  // Audit Events
  public async logAuditEvent(event: AuditEventRecord): Promise<void> {
    this.data.auditEvents.push(event);
    await this.save();
  }

  public async getAuditEvents(limit: number = 50): Promise<AuditEventRecord[]> {
    return this.data.auditEvents.slice(-limit).reverse();
  }

  // Config weights
  public getWeights(): FeatureWeightsConfig {
    return { ...this.data.activeWeights };
  }

  public async updateWeights(weights: Partial<FeatureWeightsConfig>): Promise<FeatureWeightsConfig> {
    this.data.activeWeights = {
      ...this.data.activeWeights,
      ...weights
    };
    await this.save();
    return this.data.activeWeights;
  }
}

export const db = new DatabaseStore();
