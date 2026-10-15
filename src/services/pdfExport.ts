/**
 * Resist - PDF Export and Sharing Service
 * Generates single/multi-page print-optimized PDF reports without scrollbars
 * or UI action buttons.
 */

import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';
import { AMRAnalysis } from '../types/amr';

export class PDFExportService {
  public static async exportAndShareAnalysisPDF(analysis: AMRAnalysis): Promise<string> {
    try {
      // Determine host for PDFKit API
      let serverBase = '';
      if (Platform.OS === 'web') {
        serverBase = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081';
      } else {
        const host = Constants.expoConfig?.hostUri?.split(':')[0] || 'localhost';
        serverBase = `http://${host}:8081`;
      }

      const pdfUrl = `${serverBase}/api/generate-pdf`;
      const response = await fetch(pdfUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysis),
      });

      if (response.ok) {
        const cleanTitle = (analysis.title || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `Resist_Report_${cleanTitle}.pdf`;

        if (Platform.OS === 'web') {
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
          return blobUrl;
        } else {
          // Native mobile: save to cache and share
          const fileUri = `${FileSystem.cacheDirectory || ''}${fileName}`;
          const arrayBuffer = await response.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);

          await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });

          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(fileUri, {
              UTI: '.pdf',
              mimeType: 'application/pdf',
              dialogTitle: `Resist Report - ${analysis.title}`,
            });
          }
          return fileUri;
        }
      }
    } catch (err) {
      console.warn('PDFKit service request failed, falling back to clean document print:', err);
    }

    // Fallback: Generate clean print without UI elements or scrollbars
    const html = this.buildHTMLReport(analysis);

    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return '';
    }

    const { uri } = await Print.printToFileAsync({ html });
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Resist Report - ${analysis.title}`,
      });
    }

    return uri;
  }

  private static buildHTMLReport(analysis: AMRAnalysis): string {
    const risk = analysis.riskResult;
    const patient = analysis.patientInput;
    const culture = analysis.cultureFindings;
    const factors = risk?.contributingFactors || [];
    const resistanceMarkers = analysis.extractedEntities.filter((e) => e.entityType === 'resistance_marker');

    const factorRows = factors
      .map(
        (f) => `
        <tr style="page-break-inside: avoid;">
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111827;">${f.displayName}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563;">${f.reason}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 800; color: #111827; text-transform: uppercase; font-size: 11px;">${f.impact}</td>
        </tr>`
      )
      .join('');

    const markerBadges = resistanceMarkers.length > 0
      ? `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb; page-break-inside: avoid;">
          <div style="font-size: 11px; font-weight: 700; color: #111827; margin-bottom: 6px;">Documented Resistance Markers:</div>
          <div>
            ${resistanceMarkers.map((m) => `<span style="display: inline-block; background: #f3f4f6; border: 1px solid #d1d5db; color: #111827; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; margin-right: 6px; margin-bottom: 6px;">${m.normalizedValue}</span>`).join('')}
          </div>
        </div>`
      : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Resist Report - ${analysis.title}</title>
  <style>
    @page {
      margin: 12mm 15mm;
      size: A4 portrait;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      height: auto !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      line-height: 1.5;
      background: #ffffff;
      overflow: visible !important;
    }
    ::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }
    .page-container {
      padding: 0;
      width: 100%;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 2px solid #111827;
      padding-bottom: 12px;
      margin-bottom: 18px;
      page-break-inside: avoid;
    }
    .app-title {
      font-size: 26px;
      font-weight: 900;
      color: #111827;
      letter-spacing: -0.5px;
      line-height: 1;
    }
    .subtitle {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
      font-weight: 500;
    }
    .report-title {
      font-size: 16px;
      font-weight: 800;
      color: #111827;
      margin-top: 4px;
    }
    .score-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 22px;
      text-align: center;
      margin-bottom: 18px;
      page-break-inside: avoid;
    }
    .score-value {
      font-size: 52px;
      font-weight: 900;
      color: #111827;
      line-height: 1;
    }
    .score-max {
      font-size: 22px;
      color: #9ca3af;
      font-weight: 700;
    }
    .score-label {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #111827;
      margin-top: 6px;
    }
    .coverage-badge {
      display: inline-block;
      margin-top: 6px;
      font-size: 10px;
      font-weight: 700;
      color: #4b5563;
      background: #e5e7eb;
      padding: 3px 10px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #111827;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 6px;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      page-break-after: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    th {
      background: #f3f4f6;
      padding: 8px 12px;
      text-align: left;
      font-weight: 700;
      color: #374151;
      border-bottom: 1px solid #d1d5db;
    }
    .info-grid {
      display: flex;
      gap: 12px;
      margin-bottom: 8px;
    }
    .info-box {
      flex: 1;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .info-label {
      font-size: 10px;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-val {
      font-size: 13px;
      font-weight: 800;
      color: #111827;
      margin-top: 2px;
    }
    .history-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #f3f4f6;
      font-size: 12px;
    }
    .history-label {
      color: #6b7280;
      font-weight: 500;
    }
    .history-val {
      color: #111827;
      font-weight: 700;
      text-align: right;
    }
    .footer {
      margin-top: 24px;
      border-top: 1px solid #e5e7eb;
      padding-top: 12px;
      font-size: 10px;
      color: #9ca3af;
      text-align: center;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="header">
      <div>
        <div class="app-title">Resist</div>
        <div class="subtitle">AMR Risk Assessment Report</div>
        <div class="report-title">${analysis.title}</div>
      </div>
      <div style="text-align: right; font-size: 11px; color: #6b7280;">
        <div><strong>Date:</strong> ${new Date(analysis.createdAt).toLocaleDateString()}</div>
        <div><strong>Record ID:</strong> ${analysis.id}</div>
      </div>
    </div>

    <div class="score-card">
      <div>
        <span class="score-value">${risk?.riskPercentage !== null && risk?.riskPercentage !== undefined ? risk?.riskPercentage : 'N/A'}</span>
        <span class="score-max"> / 100</span>
      </div>
      <div class="score-label">${risk?.riskCategory ? `${risk.riskCategory} AMR Risk` : 'Insufficient Data'}</div>
      <div class="coverage-badge">Evidence Coverage: ${risk?.evidenceCoverage || 'Limited'} (${risk?.evidenceCoverageScore || 0} pts)</div>
    </div>

    <div class="section-card">
      <div class="section-title">Major Contributing Factors</div>
      ${
        factors.length > 0
          ? `<table>
              <thead>
                <tr>
                  <th>Factor</th>
                  <th>Clinical Evidence</th>
                  <th style="text-align: right;">Impact</th>
                </tr>
              </thead>
              <tbody>
                ${factorRows}
              </tbody>
            </table>`
          : '<p style="font-size: 12px; color: #6b7280; margin: 0;">No available evidence factors identified.</p>'
      }
    </div>

    <div class="section-card">
      <div class="section-title">Microbiology & Pathogen Findings</div>
      <div class="info-grid">
        <div class="info-box">
          <div class="info-label">Specimen</div>
          <div class="info-val">${culture?.specimen || 'Not documented'}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Isolated Organism</div>
          <div class="info-val">${culture?.organism || 'None identified'}</div>
        </div>
      </div>
      ${markerBadges}
    </div>

    <div class="section-card">
      <div class="section-title">Patient Clinical Information</div>
      <div class="history-row">
        <span class="history-label">Reported Symptoms:</span>
        <span class="history-val">${patient.symptoms || 'None recorded'}</span>
      </div>
      <div class="history-row">
        <span class="history-label">Duration:</span>
        <span class="history-val">${patient.symptomDuration}</span>
      </div>
      <div class="history-row">
        <span class="history-label">Severity:</span>
        <span class="history-val">${patient.severity}</span>
      </div>
      <div class="history-row">
        <span class="history-label">Infection Category:</span>
        <span class="history-val">${patient.infectionType}</span>
      </div>
      <div class="history-row">
        <span class="history-label">Prior Antibiotic Exposure:</span>
        <span class="history-val">${patient.previousAntibioticExposure}</span>
      </div>
      <div class="history-row">
        <span class="history-label">Course Completion:</span>
        <span class="history-val">${patient.courseCompletion}</span>
      </div>
      <div class="history-row">
        <span class="history-label">Persistent / Recurrent:</span>
        <span class="history-val">${patient.persistentInfection}</span>
      </div>
    </div>

    <div class="section-card">
      <div class="section-title">Model Metadata</div>
      <div class="history-row" style="border-bottom: none;">
        <span class="history-label">Model Engine:</span>
        <span class="history-val">${risk?.modelVersion || 'ResistAI Local ML (Logistic Regression + Risk Engine)'}</span>
      </div>
      <div class="history-row" style="border-bottom: none;">
        <span class="history-label">Evaluated Feature Count:</span>
        <span class="history-val">${risk?.availableFeatureCount || 0} of ${risk?.features?.length || 13} features</span>
      </div>
    </div>

    <div class="footer">
      Resist Report • Record ID: ${analysis.id} • Generated ${new Date().toLocaleDateString()}
    </div>
  </div>
</body>
</html>
    `;
  }
}
