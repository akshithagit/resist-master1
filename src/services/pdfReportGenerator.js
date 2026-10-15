const PDFDocument = require('pdfkit');

/**
 * Generates a clean, professional vector PDF report using PDFKit.
 * Output has zero scrollbars, zero UI buttons, and adheres to standard A4 printing rules.
 *
 * @param {object} analysis - The AMRAnalysis object
 * @returns {Promise<Buffer>} - Buffer of the binary PDF
 */
function generateAMRPDFBuffer(analysis) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        bufferPages: true,
        info: {
          Title: `Resist AMR Report - ${analysis.title || 'Report'}`,
          Author: 'Resist Clinical Intelligence',
          Subject: 'Antimicrobial Resistance Risk Analysis',
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const risk = analysis.riskResult || {};
      const culture = analysis.cultureFindings || {};
      const patient = analysis.patientInput || {};
      const factors = risk.contributingFactors || [];
      const extracted = analysis.extractedEntities || [];
      const markers = extracted.filter((e) => e.entityType === 'resistance_marker');
      const astEntities = extracted.filter(
        (e) => e.entityType === 'susceptibility' || e.entityType === 'antibiotic'
      );

      // --- 1. HEADER ---
      doc.fontSize(24).font('Helvetica-Bold').fillColor('#111827').text('RESIST', 40, 40);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#4B5563').text(
        'CLINICAL ANTIMICROBIAL RESISTANCE RISK ASSESSMENT',
        40,
        68
      );

      // Header right metadata
      const reportDate = analysis.createdAt
        ? new Date(analysis.createdAt).toLocaleDateString()
        : new Date().toLocaleDateString();
      const reportId = (analysis.id || 'N/A').slice(0, 16);

      doc.fontSize(8.5).font('Helvetica').fillColor('#4B5563');
      doc.text(`Date: ${reportDate}`, 360, 42, { align: 'right', width: 195 });
      doc.text(`Record ID: ${reportId}`, 360, 55, { align: 'right', width: 195 });
      doc.text(`Subject: ${analysis.title || 'AMR Evaluation'}`, 360, 68, {
        align: 'right',
        width: 195,
      });

      // Divider line
      doc.moveTo(40, 86).lineTo(555, 86).lineWidth(1.5).strokeColor('#111827').stroke();

      // --- 2. RISK SCORE HIGHLIGHT CARD ---
      let y = 100;
      doc.roundedRect(40, y, 515, 78, 8).fillAndStroke('#F9FAFB', '#E5E7EB');

      const score = risk.riskPercentage != null ? risk.riskPercentage : 'N/A';
      const category = (risk.riskCategory || 'Low').toUpperCase();

      // Numeric score
      doc.fillColor('#111827').fontSize(38).font('Helvetica-Bold').text(String(score), 56, y + 14);
      doc.fontSize(16).font('Helvetica').fillColor('#9CA3AF').text(' / 100', doc.x, y + 28);

      // Risk Category Badge Text
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#111827').text(`${category} AMR RISK`, 175, y + 16);

      // Coverage & Model metadata
      const modelLabel = risk.modelVersion || 'ResistAI Local ML (Logistic Regression)';
      const coverageLabel = risk.evidenceCoverage || 'Moderate';
      const coverageScore = risk.evidenceCoverageScore || 0;

      doc.fontSize(8.5).font('Helvetica').fillColor('#4B5563').text(
        `Evidence Coverage: ${coverageLabel} (${coverageScore}%)   •   Model: ${modelLabel}`,
        175,
        y + 38
      );
      doc.fontSize(8).font('Helvetica').fillColor('#6B7280').text(
        'Calculated based on clinical parameters, laboratory microbiology findings, and antibiotic exposure history.',
        175,
        y + 53,
        { width: 360 }
      );

      // --- 3. PATIENT CLINICAL HISTORY & MICROBIOLOGY SUMMARY ---
      y = 194;
      doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#111827').text(
        'CLINICAL PRESENTATION & MICROBIOLOGY',
        40,
        y
      );
      y += 16;

      // Two rounded boxes: Left = Microbiology, Right = Clinical History
      const boxWidth = 250;
      const boxHeight = 105;
      doc.roundedRect(40, y, boxWidth, boxHeight, 6).fillAndStroke('#FFFFFF', '#E5E7EB');
      doc.roundedRect(305, y, boxWidth, boxHeight, 6).fillAndStroke('#FFFFFF', '#E5E7EB');

      // Left: Microbiology & Pathogen
      doc.fillColor('#6B7280').fontSize(7.5).font('Helvetica-Bold').text('SPECIMEN SOURCE', 52, y + 10);
      doc.fillColor('#111827').fontSize(9.5).font('Helvetica').text(culture.specimen || 'Clinical Specimen', 52, y + 22);

      doc.fillColor('#6B7280').fontSize(7.5).font('Helvetica-Bold').text('ISOLATED ORGANISM', 52, y + 42);
      doc.fillColor('#111827').fontSize(10.5).font('Helvetica-Bold').text(culture.organism || 'None documented', 52, y + 54);

      doc.fillColor('#6B7280').fontSize(7.5).font('Helvetica-Bold').text('RESISTANCE MARKERS', 52, y + 74);
      if (markers.length > 0) {
        doc.fillColor('#DC2626').fontSize(8.5).font('Helvetica-Bold').text(
          markers.map((m) => m.normalizedValue).join(', '),
          52,
          y + 86,
          { width: 225 }
        );
      } else {
        doc.fillColor('#4B5563').fontSize(8.5).font('Helvetica').text('No phenotypic markers detected', 52, y + 86);
      }

      // Right: Clinical History
      doc.fillColor('#6B7280').fontSize(7.5).font('Helvetica-Bold').text('REPORTED SYMPTOMS & DURATION', 317, y + 10);
      const symptomsText = `${patient.symptoms || 'Symptoms documented'} (${patient.symptomDuration || 'N/A'})`;
      doc.fillColor('#111827').fontSize(8.5).font('Helvetica').text(symptomsText, 317, y + 22, { width: 225 });

      doc.fillColor('#6B7280').fontSize(7.5).font('Helvetica-Bold').text('ANTIBIOTIC EXPOSURE & COURSE', 317, y + 42);
      doc.fillColor('#111827').fontSize(8.5).font('Helvetica').text(
        `Prior Exposure: ${patient.previousAntibioticExposure || 'None'}  |  Course: ${patient.courseCompletion || 'N/A'}`,
        317,
        y + 54,
        { width: 225 }
      );

      doc.fillColor('#6B7280').fontSize(7.5).font('Helvetica-Bold').text('INFECTION CATEGORY & SEVERITY', 317, y + 74);
      doc.fillColor('#111827').fontSize(8.5).font('Helvetica').text(
        `${patient.infectionType || 'General'} (Severity: ${patient.severity || 'Moderate'}, Persistence: ${patient.persistentInfection || 'None'})`,
        317,
        y + 86,
        { width: 225 }
      );

      // --- 4. MAJOR CONTRIBUTING FACTORS TABLE ---
      y += boxHeight + 18;
      doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#111827').text(
        'EXPLAINABILITY: CONTRIBUTING RISK FACTORS',
        40,
        y
      );
      y += 16;

      // Table Header Row
      doc.rect(40, y, 515, 20).fillAndStroke('#F3F4F6', '#E5E7EB');
      doc.fillColor('#374151').fontSize(8).font('Helvetica-Bold');
      doc.text('FACTOR', 50, y + 6);
      doc.text('CLINICAL EVIDENCE & RATIONALE', 170, y + 6);
      doc.text('IMPACT', 485, y + 6, { align: 'right', width: 60 });
      y += 20;

      const factorsToRender = factors.length > 0 ? factors.slice(0, 5) : [
        {
          name: 'baseline_assessment',
          displayName: 'Clinical Presentation',
          reason: 'Calculated using standard clinical guidelines and symptom duration parameters.',
          impact: 'moderate',
        },
      ];

      factorsToRender.forEach((f) => {
        const rowHeight = 28;
        doc.rect(40, y, 515, rowHeight).strokeColor('#E5E7EB').stroke();
        doc.fillColor('#111827').fontSize(8.5).font('Helvetica-Bold').text(
          f.displayName || f.name,
          50,
          y + 6,
          { width: 115 }
        );
        doc.fillColor('#4B5563').fontSize(8).font('Helvetica').text(
          f.reason || 'Clinical observation and guideline indicator.',
          170,
          y + 6,
          { width: 305 }
        );

        const imp = (f.impact || 'MODERATE').toUpperCase();
        let impactColor = '#111827';
        if (imp === 'HIGH') impactColor = '#DC2626';
        else if (imp === 'MODERATE') impactColor = '#D97706';
        else if (imp === 'LOW') impactColor = '#059669';

        doc.fillColor(impactColor).fontSize(7.5).font('Helvetica-Bold').text(
          imp,
          485,
          y + 6,
          { align: 'right', width: 60 }
        );
        y += rowHeight;
      });

      // --- 5. SUSCEPTIBILITY / LAB FINDINGS (If available) ---
      if (astEntities.length > 0 && y < 650) {
        y += 16;
        doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#111827').text(
          'ANTIMICROBIAL SUSCEPTIBILITY FINDINGS',
          40,
          y
        );
        y += 16;

        doc.rect(40, y, 515, 18).fillAndStroke('#F3F4F6', '#E5E7EB');
        doc.fillColor('#374151').fontSize(8).font('Helvetica-Bold');
        doc.text('AGENT / DRUG', 50, y + 5);
        doc.text('INTERPRETATION', 420, y + 5, { align: 'right', width: 125 });
        y += 18;

        astEntities.slice(0, 4).forEach((item) => {
          doc.rect(40, y, 515, 20).strokeColor('#E5E7EB').stroke();
          doc.fillColor('#111827').fontSize(8).font('Helvetica').text(item.rawValue || item.normalizedValue, 50, y + 5);
          doc.fillColor('#374151').fontSize(8).font('Helvetica-Bold').text(
            item.entityType.toUpperCase(),
            420,
            y + 5,
            { align: 'right', width: 125 }
          );
          y += 20;
        });
      }

      // --- 6. CLINICAL SAFETY DISCLAIMER ---
      const footerY = 750;
      doc.moveTo(40, footerY).lineTo(555, footerY).lineWidth(0.5).strokeColor('#D1D5DB').stroke();

      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#4B5563').text(
        'CLINICAL NOTICE & DISCLAIMER',
        40,
        footerY + 8
      );
      doc.fontSize(7).font('Helvetica').fillColor('#6B7280').text(
        'This antimicrobial resistance risk assessment report was generated by the Resist clinical platform for educational and decision-support assistance. All antimicrobial therapy decisions should be verified by a licensed clinician using formal microbiology culture and antimicrobial susceptibility testing (AST) results.',
        40,
        footerY + 18,
        { width: 515 }
      );

      doc.fontSize(7).font('Helvetica').fillColor('#9CA3AF').text(
        `Resist Platform • Generated on ${new Date().toLocaleString()} • Confidential Medical Report`,
        40,
        footerY + 40,
        { align: 'center', width: 515 }
      );

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = {
  generateAMRPDFBuffer,
};
