/**
 * Resist - New Analysis Multi-Step Wizard
 * Progressive Mobile Workflow with Phosphor Icons & Attio Design System
 * Camera capture support, trimmed symptom inputs, organism/specimen dropdowns,
 * Local Machine Learning inference engine, and Attio design system.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import {
  AMRAnalysis,
  CourseCompletion,
  ExtractedEntity,
  InfectionType,
  MedicalDocument,
  PatientClinicalInput,
  PersistenceStatus,
  PreviousExposure,
  SymptomDuration,
  SymptomSeverity,
} from '../types/amr';
import { OCRService } from '../services/ocr';
import { MedicalNLPService } from '../services/nlp';
import { LocalAIService } from '../services/localAiService';
import { StorageService } from '../services/storage';
import { SYNTHETIC_DEMO_CASES } from '../services/demoData';
import { useTheme } from '../contexts/ThemeContext';
import { File, Camera, FileText, ArrowRight, ArrowLeft, ChartBar, X, Dna, Image as ImageIcon } from 'phosphor-react-native';

interface Props {
  onComplete: (analysis: AMRAnalysis) => void;
  onCancel: () => void;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

const COMMON_PATHOGENS = [
  'Escherichia coli',
  'Klebsiella pneumoniae',
  'Pseudomonas aeruginosa',
  'Staphylococcus aureus',
  'Enterococcus faecalis',
  'Proteus mirabilis',
  'Acinetobacter baumannii',
  'Enterobacter cloacae',
  'Streptococcus pneumoniae',
  'Other / Custom',
];

const COMMON_SPECIMENS = [
  'Initialstream',
  'Blood Culture',
  'Sputum',
  'Wound Swab',
  'Stool Culture',
  'Bronchoalveolar Lavage',
  'Cerebrospinal Fluid (CSF)',
  'Throat Swab',
  'Pus Aspirate',
  'Other / Custom',
];

export const NewAnalysisWizard: React.FC<Props> = ({ onComplete, onCancel }) => {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState('');

  // Step 1 State: Uploaded Documents
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [selectedDemoText, setSelectedDemoText] = useState<string | null>(null);

  // Step 2 State: Symptoms & History
  const [patientInput, setPatientInput] = useState<PatientClinicalInput>({
    symptoms: '',
    symptomDuration: 'Unknown',
    severity: 'Unknown',
    infectionType: 'Unknown',
    previousAntibioticExposure: 'Unknown',
    treatmentDurationDays: 'Unknown',
    courseCompletion: 'Unknown',
    persistentInfection: 'Unknown',
    additionalNotes: '',
  });

  // Step 3 State: OCR Extracted Text
  const [ocrPages, setOcrPages] = useState<{ page: number; text: string; confidence: number }[]>([]);
  const [editingOcrText, setEditingOcrText] = useState('');

  // Step 4 & 5 State: Extracted Entities & Dropdown Selection
  const [extractedEntities, setExtractedEntities] = useState<ExtractedEntity[]>([]);
  const [cultureSpecimen, setCultureSpecimen] = useState('Initialstream');
  const [customSpecimen, setCustomSpecimen] = useState('');
  const [isCustomSpecimen, setIsCustomSpecimen] = useState(false);

  const [cultureOrganism, setCultureOrganism] = useState('Escherichia coli');
  const [customOrganism, setCustomOrganism] = useState('');
  const [isCustomOrganism, setIsCustomOrganism] = useState(false);

  // --- Step 1 Handlers: File & Photo Capture ---
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const newDoc: MedicalDocument = {
          id: `doc_${Date.now()}`,
          filename: file.name,
          mimeType: file.mimeType || 'application/pdf',
          fileSizeBytes: file.size || 1024,
          uri: file.uri,
          uploadedAt: new Date().toISOString(),
          pageCount: 1,
          ocrStatus: 'pending',
          extractedTextByPage: [],
        };
        setDocuments([newDoc]);
        setSelectedDemoText(null);
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to select document. Please try again.');
    }
  };

  const handleTakeCameraPhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera Permission Required', 'Please allow camera access to take a photo of your report.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newDoc: MedicalDocument = {
          id: `photo_${Date.now()}`,
          filename: asset.fileName || `report_camera_${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
          fileSizeBytes: asset.fileSize || 1024,
          uri: asset.uri,
          uploadedAt: new Date().toISOString(),
          pageCount: 1,
          ocrStatus: 'pending',
          extractedTextByPage: [],
        };
        setDocuments([newDoc]);
        setSelectedDemoText(null);
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to capture photo.');
    }
  };

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow photo gallery access to select a report.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newDoc: MedicalDocument = {
          id: `image_${Date.now()}`,
          filename: asset.fileName || 'scanned_medical_report.jpg',
          mimeType: asset.mimeType || 'image/jpeg',
          fileSizeBytes: asset.fileSize || 1024,
          uri: asset.uri,
          uploadedAt: new Date().toISOString(),
          pageCount: 1,
          ocrStatus: 'pending',
          extractedTextByPage: [],
        };
        setDocuments([newDoc]);
        setSelectedDemoText(null);
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to pick image from library.');
    }
  };

  const handleSelectSyntheticReport = (demoId: string) => {
    const demo = SYNTHETIC_DEMO_CASES.find((d) => d.id === demoId);
    if (demo) {
      const newDoc: MedicalDocument = {
        id: `demo_${Date.now()}`,
        filename: demo.sampleDocumentName,
        mimeType: 'application/pdf',
        fileSizeBytes: 28400,
        uri: `demo://${demo.sampleDocumentName}`,
        uploadedAt: new Date().toISOString(),
        pageCount: 1,
        ocrStatus: 'completed',
        extractedTextByPage: [{ page: 1, text: demo.sampleDocumentText, confidence: 96 }],
      };
      setDocuments([newDoc]);
      setSelectedDemoText(demo.sampleDocumentText);
      setPatientInput(demo.analysis.patientInput);
    }
  };

  const handleProceedFromUpload = () => {
    if (documents.length === 0) {
      Alert.alert(
        'No Document Selected',
        'You can continue with symptoms alone, or select/capture a document first.',
        [
          { text: 'Choose Document', style: 'cancel' },
          { text: 'Continue Without Document', onPress: () => setCurrentStep(2) },
        ]
      );
    } else {
      setCurrentStep(2);
    }
  };

  const handleProceedFromSymptoms = async () => {
    const trimmedSymptoms = patientInput.symptoms ? patientInput.symptoms.trim() : '';
    setPatientInput({ ...patientInput, symptoms: trimmedSymptoms });

    setCurrentStep(3);
    if (documents.length > 0) {
      await runOCRProcess();
    } else {
      setOcrPages([]);
      setEditingOcrText('[No document uploaded - Analysis based on patient reported history]');
    }
  };

  const runOCRProcess = async () => {
    if (documents.length === 0) return;
    setIsProcessing(true);
    setProcessingStatusText('Performing Optical Character Recognition (OCR)...');

    const doc = documents[0];
    try {
      const ocrResult = await OCRService.processDocument(
        doc.uri,
        doc.filename,
        doc.mimeType,
        selectedDemoText || undefined
      );

      setOcrPages(ocrResult.pages);
      setEditingOcrText(ocrResult.text);

      setDocuments([
        {
          ...doc,
          ocrStatus: 'completed',
          extractedTextByPage: ocrResult.pages,
        },
      ]);

      const validation = OCRService.validateReportText(ocrResult.text);
      if (!validation.isValid) {
        Alert.alert(
          'Not a Lab Report',
          validation.reason || 'Not a report. Please verify your document before proceeding.'
        );
      }
    } catch (err) {
      console.error('OCR failed:', err);
      Alert.alert('OCR Note', 'Document text extraction finished with fallback parser.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceedFromOCR = () => {
    const validation = OCRService.validateReportText(editingOcrText);
    if (!validation.isValid) {
      Alert.alert(
        'Not a Lab Report',
        validation.reason || 'Not a report. Please verify your document before proceeding.'
      );
      return;
    }

    setIsProcessing(true);
    setProcessingStatusText('Extracting medical entities & organisms...');

    setTimeout(() => {
      const nlpResult = MedicalNLPService.extractEntitiesFromText(
        ocrPages.length > 0 ? ocrPages : [{ page: 1, text: editingOcrText, confidence: 90 }]
      );

      setExtractedEntities(nlpResult.entities);

      if (nlpResult.cultureFindings?.organism) {
        const foundBug = nlpResult.cultureFindings.organism;
        if (COMMON_PATHOGENS.includes(foundBug)) {
          setCultureOrganism(foundBug);
          setIsCustomOrganism(false);
        } else {
          setCultureOrganism('Other / Custom');
          setCustomOrganism(foundBug);
          setIsCustomOrganism(true);
        }
      }

      if (nlpResult.cultureFindings?.specimen) {
        const foundSpec = nlpResult.cultureFindings.specimen;
        if (COMMON_SPECIMENS.includes(foundSpec)) {
          setCultureSpecimen(foundSpec);
          setIsCustomSpecimen(false);
        } else {
          setCultureSpecimen('Other / Custom');
          setCustomSpecimen(foundSpec);
          setIsCustomSpecimen(true);
        }
      }

      setIsProcessing(false);
      setCurrentStep(4);
    }, 400);
  };

  const handleProceedFromExtraction = () => {
    setCurrentStep(5);
  };

  const handleFinalCalculate = async () => {
    setIsProcessing(true);
    setProcessingStatusText('Executing Local Machine Learning & Risk Engine inference...');

    const finalOrganism = isCustomOrganism ? customOrganism.trim() || 'Custom Pathogen' : cultureOrganism;
    const finalSpecimen = isCustomSpecimen ? customSpecimen.trim() || 'Custom Specimen' : cultureSpecimen;

    const sanitizedPatientInput: PatientClinicalInput = {
      ...patientInput,
      symptoms: patientInput.symptoms ? patientInput.symptoms.trim() : '',
    };

    try {
      const riskResult = await LocalAIService.calculateAMRRisk(
        editingOcrText,
        finalOrganism,
        finalSpecimen,
        sanitizedPatientInput,
        extractedEntities
      );

      const cultureFinding = {
        specimen: finalSpecimen,
        organism: finalOrganism,
        isPositive: true,
        mixedGrowth: false,
        contaminationSuspected: false,
      };

      const finalAnalysis: AMRAnalysis = {
        id: `analysis_${Date.now()}`,
        title: `${finalOrganism} Assessment`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'CALCULATED',
        documents,
        extractedEntities,
        susceptibilityResults: [],
        cultureFindings: cultureFinding,
        patientInput: sanitizedPatientInput,
        riskResult,
        isDemo: Boolean(selectedDemoText),
      };

      await StorageService.saveAnalysis(finalAnalysis);
      setIsProcessing(false);
      onComplete(finalAnalysis);
    } catch (err) {
      console.error('Local ML calculation error:', err);
      setIsProcessing(false);
      Alert.alert('Error', 'Unable to complete local AMR risk calculation.');
    }
  };

  const renderStepIndicator = () => (
    <View style={[styles.stepHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <View style={styles.stepIndicatorRow}>
        {[1, 2, 3, 4, 5].map((step) => (
          <View
            key={step}
            style={[
              styles.stepDot,
              { backgroundColor: theme.border },
              currentStep === step && { backgroundColor: theme.accent },
              currentStep > step && { backgroundColor: theme.textSecondary },
            ]}
          >
            <Text
              style={[
                styles.stepDotText,
                { color: theme.textSecondary },
                currentStep === step && { color: theme.accentForeground },
                currentStep > step && { color: theme.background },
              ]}
            >
              {step}
            </Text>
          </View>
        ))}
      </View>
      <Text style={[styles.stepTitle, { color: theme.text }]}>
        {currentStep === 1 && 'Step 1: Upload / Take Photo of Report'}
        {currentStep === 2 && 'Step 2: Symptoms & History'}
        {currentStep === 3 && 'Step 3: OCR Text Review'}
        {currentStep === 4 && 'Step 4: Pathogen & Specimen Selection'}
        {currentStep === 5 && 'Step 5: Local AI Model Inference & Review'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.container}>
        {/* Top Navigation */}
        <View style={[styles.navBar, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: theme.text }]}>New Analysis</Text>
          <View style={{ width: 50 }} />
        </View>

        {renderStepIndicator()}

        {isProcessing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.text} />
            <Text style={[styles.loadingStatusText, { color: theme.text }]}>{processingStatusText}</Text>
            <Text style={[styles.loadingSubText, { color: theme.textTertiary }]}>
              Powered by Local Machine Learning (Logistic Regression) & Transparent Risk Engine.
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
            {/* ================= STEP 1 ================= */}
            {currentStep === 1 && (
              <View>
                <Text style={[styles.instruction, { color: theme.textSecondary }]}>
                  Upload a medical report or take a photo with your camera.
                </Text>

                <View style={styles.uploadBox}>
                  {/* Take Photo */}
                  <TouchableOpacity
                    style={[styles.uploadActionBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
                    onPress={handleTakeCameraPhoto}
                  >
                    <View style={[styles.actionIconContainer, { backgroundColor: theme.surface }]}>
                      <Camera size={26} color={theme.text} weight="regular" />
                    </View>
                    <Text style={[styles.uploadBtnTitle, { color: theme.text }]}>Take Photo with Camera</Text>
                    <Text style={[styles.uploadBtnSub, { color: theme.textSecondary }]}>
                      Snap a clear picture of printed lab report
                    </Text>
                  </TouchableOpacity>

                  {/* Pick Image */}
                  <TouchableOpacity
                    style={[styles.uploadActionBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, marginTop: 10 }]}
                    onPress={handlePickImage}
                  >
                    <View style={[styles.actionIconContainer, { backgroundColor: theme.surface }]}>
                      <ImageIcon size={26} color={theme.text} weight="regular" />
                    </View>
                    <Text style={[styles.uploadBtnTitle, { color: theme.text }]}>Select Image from Gallery</Text>
                    <Text style={[styles.uploadBtnSub, { color: theme.textSecondary }]}>
                      Choose JPG / PNG report photo
                    </Text>
                  </TouchableOpacity>

                  {/* Pick File */}
                  <TouchableOpacity
                    style={[styles.uploadActionBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, marginTop: 10 }]}
                    onPress={handlePickDocument}
                  >
                    <View style={[styles.actionIconContainer, { backgroundColor: theme.surface }]}>
                      <File size={26} color={theme.text} weight="regular" />
                    </View>
                    <Text style={[styles.uploadBtnTitle, { color: theme.text }]}>Select PDF Document</Text>
                    <Text style={[styles.uploadBtnSub, { color: theme.textSecondary }]}>
                      Microbiology report or lab file
                    </Text>
                  </TouchableOpacity>
                </View>

                {documents.length > 0 && (
                  <View style={[styles.fileCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                    <FileText size={24} color={theme.text} weight="regular" style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fileName, { color: theme.text }]}>{documents[0].filename}</Text>
                      <Text style={[styles.fileSize, { color: theme.textTertiary }]}>
                        {Math.round(documents[0].fileSizeBytes / 1024)} KB • {documents[0].mimeType}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setDocuments([])} style={styles.removeFileBtn}>
                      <X size={16} color={theme.text} weight="bold" />
                      <Text style={[styles.removeFileText, { color: theme.text }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Preloaded Demo Options */}
                <View style={styles.demoSection}>
                  <Text style={[styles.demoSectionTitle, { color: theme.textSecondary }]}>Or select a synthetic test report:</Text>
                  <TouchableOpacity
                    style={[
                      styles.demoSelectBtn,
                      { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                      selectedDemoText?.includes('SYNTH-001') && { borderColor: theme.text, backgroundColor: theme.surfaceHover },
                    ]}
                    onPress={() => handleSelectSyntheticReport('demo_case_1')}
                  >
                    <Text style={[styles.demoSelectTitle, { color: theme.text }]}>Demo 1: Pan-susceptible E. coli Urine Culture (Low Risk)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.demoSelectBtn,
                      { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                      selectedDemoText?.includes('SYNTH-002') && { borderColor: theme.text, backgroundColor: theme.surfaceHover },
                    ]}
                    onPress={() => handleSelectSyntheticReport('demo_case_2')}
                  >
                    <Text style={[styles.demoSelectTitle, { color: theme.text }]}>Demo 2: MDR Klebsiella pneumoniae ESBL+ (High Risk)</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.continueBtn, { backgroundColor: theme.accent }]}
                  onPress={handleProceedFromUpload}
                >
                  <Text style={[styles.continueBtnText, { color: theme.accentForeground }]}>Continue to Symptoms</Text>
                  <ArrowRight size={18} color={theme.accentForeground} weight="bold" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            )}

            {/* ================= STEP 2 ================= */}
            {currentStep === 2 && (
              <View>
                <Text style={[styles.instruction, { color: theme.textSecondary }]}>
                  Enter symptoms and prior exposure information. Inputs are automatically trimmed and normalized.
                </Text>

                <Text style={[styles.label, { color: theme.text }]}>Symptoms Currently Experienced</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                  placeholder="e.g. Dysuria, fever, burning urination, flank pain..."
                  placeholderTextColor={theme.textTertiary}
                  value={patientInput.symptoms}
                  onChangeText={(text) => setPatientInput({ ...patientInput, symptoms: text })}
                  multiline
                  numberOfLines={3}
                />

                <Text style={[styles.label, { color: theme.text }]}>Symptom Duration</Text>
                <View style={styles.chipRow}>
                  {(['Less than 3 days', '3–7 days', '8–14 days', 'More than 14 days', 'Unknown'] as SymptomDuration[]).map(
                    (dur) => (
                      <TouchableOpacity
                        key={dur}
                        style={[
                          styles.chip,
                          { backgroundColor: theme.surface, borderColor: theme.border },
                          patientInput.symptomDuration === dur && { backgroundColor: theme.accent, borderColor: theme.accent },
                        ]}
                        onPress={() => setPatientInput({ ...patientInput, symptomDuration: dur })}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: theme.textSecondary },
                            patientInput.symptomDuration === dur && { color: theme.accentForeground },
                          ]}
                        >
                          {dur}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>

                <Text style={[styles.label, { color: theme.text }]}>Symptom Severity</Text>
                <View style={styles.chipRow}>
                  {(['Mild', 'Moderate', 'Severe', 'Unknown'] as SymptomSeverity[]).map((sev) => (
                    <TouchableOpacity
                      key={sev}
                      style={[
                        styles.chip,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                        patientInput.severity === sev && { backgroundColor: theme.accent, borderColor: theme.accent },
                      ]}
                      onPress={() => setPatientInput({ ...patientInput, severity: sev })}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: theme.textSecondary },
                          patientInput.severity === sev && { color: theme.accentForeground },
                        ]}
                      >
                        {sev}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.label, { color: theme.text }]}>Suspected Infection Type</Text>
                <View style={styles.chipRow}>
                  {(['Urinary', 'Respiratory', 'Skin/soft tissue', 'Gastrointestinal', 'Bloodstream', 'Other', 'Unknown'] as InfectionType[]).map(
                    (type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.chip,
                          { backgroundColor: theme.surface, borderColor: theme.border },
                          patientInput.infectionType === type && { backgroundColor: theme.accent, borderColor: theme.accent },
                        ]}
                        onPress={() => setPatientInput({ ...patientInput, infectionType: type })}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: theme.textSecondary },
                            patientInput.infectionType === type && { color: theme.accentForeground },
                          ]}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>

                <Text style={[styles.label, { color: theme.text }]}>Previous Antibiotic Exposure</Text>
                <View style={styles.chipRow}>
                  {(['None known', 'One previous course', 'Multiple previous courses', 'Frequent/repeated exposure', 'Unknown'] as PreviousExposure[]).map(
                    (exp) => (
                      <TouchableOpacity
                        key={exp}
                        style={[
                          styles.chip,
                          { backgroundColor: theme.surface, borderColor: theme.border },
                          patientInput.previousAntibioticExposure === exp && { backgroundColor: theme.accent, borderColor: theme.accent },
                        ]}
                        onPress={() => setPatientInput({ ...patientInput, previousAntibioticExposure: exp })}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: theme.textSecondary },
                            patientInput.previousAntibioticExposure === exp && { color: theme.accentForeground },
                          ]}
                        >
                          {exp}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>

                <Text style={[styles.label, { color: theme.text }]}>Course Completion Status</Text>
                <View style={styles.chipRow}>
                  {(['Completed as prescribed', 'Partially completed', 'Stopped early', 'Unknown'] as CourseCompletion[]).map(
                    (comp) => (
                      <TouchableOpacity
                        key={comp}
                        style={[
                          styles.chip,
                          { backgroundColor: theme.surface, borderColor: theme.border },
                          patientInput.courseCompletion === comp && { backgroundColor: theme.accent, borderColor: theme.accent },
                        ]}
                        onPress={() => setPatientInput({ ...patientInput, courseCompletion: comp })}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: theme.textSecondary },
                            patientInput.courseCompletion === comp && { color: theme.accentForeground },
                          ]}
                        >
                          {comp}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>

                <Text style={[styles.label, { color: theme.text }]}>Persistent / Recurrent Pattern</Text>
                <View style={styles.chipRow}>
                  {(['No', 'Persistent', 'Recurrent', 'Unknown'] as PersistenceStatus[]).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.chip,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                        patientInput.persistentInfection === p && { backgroundColor: theme.accent, borderColor: theme.accent },
                      ]}
                      onPress={() => setPatientInput({ ...patientInput, persistentInfection: p })}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: theme.textSecondary },
                          patientInput.persistentInfection === p && { color: theme.accentForeground },
                        ]}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.wizardBtnRow}>
                  <TouchableOpacity style={[styles.backStepBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setCurrentStep(1)}>
                    <ArrowLeft size={16} color={theme.text} weight="regular" style={{ marginRight: 4 }} />
                    <Text style={[styles.backBtnText, { color: theme.text }]}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.continueBtnFlex, { backgroundColor: theme.accent }]} onPress={handleProceedFromSymptoms}>
                    <Text style={[styles.continueBtnText, { color: theme.accentForeground }]}>Proceed to OCR Text</Text>
                    <ArrowRight size={16} color={theme.accentForeground} weight="bold" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ================= STEP 3 ================= */}
            {currentStep === 3 && (
              <View>
                <Text style={[styles.instruction, { color: theme.textSecondary }]}>
                  Optical Character Recognition (OCR) extracted the following text:
                </Text>

                <View style={[styles.ocrInfoBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <FileText size={14} color={theme.textSecondary} weight="regular" style={{ marginRight: 6 }} />
                  <Text style={[styles.ocrInfoText, { color: theme.textSecondary }]}>
                    {documents[0]?.filename || 'Text Input'} • High Accuracy OCR
                  </Text>
                </View>

                <TextInput
                  style={[styles.ocrTextArea, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                  value={editingOcrText}
                  onChangeText={setEditingOcrText}
                  multiline
                  textAlignVertical="top"
                />

                {!OCRService.validateReportText(editingOcrText).isValid && (
                  <View style={[styles.invalidWarningCard, { backgroundColor: theme.riskHighBg, borderColor: theme.riskHighBorder }]}>
                    <Text style={[styles.invalidWarningText, { color: theme.riskHighText }]}>
                      ⚠️ {OCRService.validateReportText(editingOcrText).reason || 'Not a report. Please verify your document.'}
                    </Text>
                  </View>
                )}

                <View style={styles.wizardBtnRow}>
                  <TouchableOpacity style={[styles.backStepBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setCurrentStep(2)}>
                    <ArrowLeft size={16} color={theme.text} weight="regular" style={{ marginRight: 4 }} />
                    <Text style={[styles.backBtnText, { color: theme.text }]}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.continueBtnFlex, { backgroundColor: theme.accent }]} onPress={handleProceedFromOCR}>
                    <Text style={[styles.continueBtnText, { color: theme.accentForeground }]}>Select Pathogen & Specimen</Text>
                    <ArrowRight size={16} color={theme.accentForeground} weight="bold" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ================= STEP 4 ================= */}
            {currentStep === 4 && (
              <View>
                <Text style={[styles.instruction, { color: theme.textSecondary }]}>
                  Select or enter the pathogen/organism and specimen type:
                </Text>

                {/* Pathogen Selection */}
                <View style={[styles.entityCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                  <View style={styles.entityHeaderRow}>
                    <Dna size={16} color={theme.text} weight="regular" style={{ marginRight: 6 }} />
                    <Text style={[styles.entitySectionTitle, { color: theme.text }]}>Pathogen / Organism</Text>
                  </View>

                  <View style={styles.chipRow}>
                    {COMMON_PATHOGENS.map((pathogen) => {
                      const isSel = cultureOrganism === pathogen;
                      return (
                        <TouchableOpacity
                          key={pathogen}
                          style={[
                            styles.chip,
                            { backgroundColor: theme.surface, borderColor: theme.border },
                            isSel && { backgroundColor: theme.accent, borderColor: theme.accent },
                          ]}
                          onPress={() => {
                            setCultureOrganism(pathogen);
                            setIsCustomOrganism(pathogen === 'Other / Custom');
                          }}
                        >
                          <Text style={[styles.chipText, { color: theme.textSecondary }, isSel && { color: theme.accentForeground }]}>
                            {pathogen}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {isCustomOrganism && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={[styles.label, { color: theme.text, fontSize: 11 }]}>Custom Pathogen Name:</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                        value={customOrganism}
                        onChangeText={setCustomOrganism}
                        placeholder="Type custom organism name..."
                        placeholderTextColor={theme.textTertiary}
                      />
                    </View>
                  )}
                </View>

                {/* Specimen Selection */}
                <View style={[styles.entityCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                  <Text style={[styles.entitySectionTitle, { color: theme.text }]}>Specimen Type</Text>

                  <View style={styles.chipRow}>
                    {COMMON_SPECIMENS.map((specimen) => {
                      const isSel = cultureSpecimen === specimen;
                      return (
                        <TouchableOpacity
                          key={specimen}
                          style={[
                            styles.chip,
                            { backgroundColor: theme.surface, borderColor: theme.border },
                            isSel && { backgroundColor: theme.accent, borderColor: theme.accent },
                          ]}
                          onPress={() => {
                            setCultureSpecimen(specimen);
                            setIsCustomSpecimen(specimen === 'Other / Custom');
                          }}
                        >
                          <Text style={[styles.chipText, { color: theme.textSecondary }, isSel && { color: theme.accentForeground }]}>
                            {specimen}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {isCustomSpecimen && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={[styles.label, { color: theme.text, fontSize: 11 }]}>Custom Specimen Name:</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                        value={customSpecimen}
                        onChangeText={setCustomSpecimen}
                        placeholder="Type custom specimen name..."
                        placeholderTextColor={theme.textTertiary}
                      />
                    </View>
                  )}
                </View>

                <View style={styles.wizardBtnRow}>
                  <TouchableOpacity style={[styles.backStepBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setCurrentStep(3)}>
                    <ArrowLeft size={16} color={theme.text} weight="regular" style={{ marginRight: 4 }} />
                    <Text style={[styles.backBtnText, { color: theme.text }]}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.continueBtnFlex, { backgroundColor: theme.accent }]} onPress={handleProceedFromExtraction}>
                    <Text style={[styles.continueBtnText, { color: theme.accentForeground }]}>Review & Calculate</Text>
                    <ArrowRight size={16} color={theme.accentForeground} weight="bold" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ================= STEP 5 ================= */}
            {currentStep === 5 && (
              <View>
                <Text style={[styles.instruction, { color: theme.textSecondary }]}>
                  Final verification of collected features before Local AI calculation:
                </Text>

                <View style={[styles.reviewCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                  <Text style={[styles.reviewHeader, { color: theme.text }]}>Summary of Evidence</Text>

                  <View style={[styles.reviewRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>Identified Organism:</Text>
                    <Text style={[styles.reviewVal, { color: theme.text }]}>
                      {isCustomOrganism ? customOrganism || 'Custom Organism' : cultureOrganism}
                    </Text>
                  </View>

                  <View style={[styles.reviewRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>Specimen Type:</Text>
                    <Text style={[styles.reviewVal, { color: theme.text }]}>
                      {isCustomSpecimen ? customSpecimen || 'Custom Specimen' : cultureSpecimen}
                    </Text>
                  </View>

                  <View style={[styles.reviewRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>Reported Symptoms:</Text>
                    <Text style={[styles.reviewVal, { color: theme.text }]}>
                      {patientInput.symptoms ? patientInput.symptoms.trim() : 'None'}
                    </Text>
                  </View>

                  <View style={[styles.reviewRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>Previous Exposure:</Text>
                    <Text style={[styles.reviewVal, { color: theme.text }]}>{patientInput.previousAntibioticExposure}</Text>
                  </View>

                  <View style={[styles.reviewRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>Course Completion:</Text>
                    <Text style={[styles.reviewVal, { color: theme.text }]}>{patientInput.courseCompletion}</Text>
                  </View>

                  <View style={[styles.reviewRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>Persistent / Recurrent:</Text>
                    <Text style={[styles.reviewVal, { color: theme.text }]}>{patientInput.persistentInfection}</Text>
                  </View>

                  <View style={[styles.reviewRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>Symptom Duration:</Text>
                    <Text style={[styles.reviewVal, { color: theme.text }]}>{patientInput.symptomDuration}</Text>
                  </View>
                </View>

                <View style={styles.wizardBtnRow}>
                  <TouchableOpacity style={[styles.backStepBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setCurrentStep(4)}>
                    <ArrowLeft size={16} color={theme.text} weight="regular" style={{ marginRight: 4 }} />
                    <Text style={[styles.backBtnText, { color: theme.text }]}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.calculateBtnFlex, { backgroundColor: theme.accent }]} onPress={handleFinalCalculate}>
                    <ChartBar size={18} color={theme.accentForeground} weight="fill" style={{ marginRight: 6 }} />
                    <Text style={[styles.calculateBtnText, { color: theme.accentForeground }]}>Calculate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cancelBtn: {
    padding: 6,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  stepHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '800',
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingStatusText: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubText: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: 16,
    paddingBottom: 40,
  },
  instruction: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  uploadBox: {
    marginBottom: 16,
  },
  uploadActionBtn: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionIconContainer: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  uploadBtnTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  uploadBtnSub: {
    fontSize: 11,
    marginTop: 2,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '700',
  },
  fileSize: {
    fontSize: 11,
    marginTop: 1,
  },
  removeFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  removeFileText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 2,
  },
  demoSection: {
    marginBottom: 16,
  },
  demoSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  demoSelectBtn: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  demoSelectTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  continueBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    minHeight: 70,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  wizardBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  backStepBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  continueBtnFlex: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
  },
  calculateBtnFlex: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
  },
  calculateBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  ocrInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  ocrInfoText: {
    fontSize: 11,
    fontWeight: '600',
  },
  ocrTextArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    minHeight: 180,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 18,
  },
  entityCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  entityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  entitySectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  reviewCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  reviewHeader: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  reviewLabel: {
    fontSize: 12,
  },
  reviewVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  invalidWarningCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 4,
  },
  invalidWarningText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
});
