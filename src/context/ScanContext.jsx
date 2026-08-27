import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { parseDocumentData } from '../services/geminiService';

export const parseDateToISO = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  let d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  const cleaned = trimmed.replace(/[\.,]/g, '').replace(/-/g, '/');
  d = new Date(cleaned);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  const match = trimmed.match(/(\d{1,2})[\/\-\s]+(\d{1,2})[\/\-\s]+(\d{2,4})/);
  if (match) {
    let month = parseInt(match[1], 10);
    let day = parseInt(match[2], 10);
    let year = parseInt(match[3], 10);
    if (year < 100) year += 2000;
    d = new Date(year, month - 1, day);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  }

  return null;
};

export const parseNumeric = (val) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const cleaned = String(val).replace(/,/g, '.').replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

const initialFormData = {
  patient: { 
    firstName: '', lastName: '', address: '', dateOfBirth: '', gender: '', contactNumber: '',
    occupation: '', knownAllergies: '', pastMedicalHistory: '', surgicalHistory: '',
    smokingHistory: '', alcoholicIntake: '', emergencyContactName: '', guardianName: '',
    medications: '', previousHospitalization: ''
  },
  medicalRecord: { chiefComplaint: '', diagnosis: '', visitDate: '' },
  consultations: [],
  prescriptions: [],
  imagingReports: {
    ultrasoundReports: [],
    arterialDuplexScan: [],
    venousDuplexScan: [],
    xrayReports: []
  },
  vitalSigns: [],
  labs: {
    cbc: [],
    chemistry: [],
    serology: [],
    urinalysis: []
  }
};

const ScanContext = createContext(null);

export function ScanProvider({ children }) {
  const [file, setFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStepText, setScanStepText] = useState('Step 1/4: Reading document text & tables...');
  const [estimatedTimeSec, setEstimatedTimeSec] = useState(12);
  const [formData, setFormData] = useState(initialFormData);
  const [activeTab, setActiveTab] = useState('scanner');
  
  const [scannedHistory, setScannedHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [dupModalOpen, setDupModalOpen] = useState(false);
  const [dupMessage, setDupMessage] = useState('');

  const progressIntervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const updateProgressState = () => {
    if (!startTimeRef.current) return;
    const elapsedMs = Date.now() - startTimeRef.current;
    const targetSec = 12;
    const progressRatio = Math.min(1, elapsedMs / (targetSec * 1000));
    const computedProgress = Math.min(92, Math.floor(5 + progressRatio * 87));
    
    setScanProgress(computedProgress);
    const remainingSec = Math.max(1, Math.ceil((100 - computedProgress) / 8));
    setEstimatedTimeSec(remainingSec);

    if (computedProgress < 25) {
      setScanStepText('Step 1/4: Reading document text & tables...');
    } else if (computedProgress < 55) {
      setScanStepText('Step 2/4: Analyzing Demographics & Medical Records with AI...');
    } else if (computedProgress < 85) {
      setScanStepText('Step 3/4: Extracting Prescriptions & Lab Flow Sheets...');
    } else {
      setScanStepText('Step 4/4: Finalizing record structuring...');
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isScanning) {
        updateProgressState();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [isScanning]);

  const startScan = async (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.endsWith('.docx')) {
      toast.error('Please upload a .docx file');
      return;
    }

    setFile(selectedFile);
    setIsScanning(true);
    setScanComplete(false);
    setScanProgress(5);
    setEstimatedTimeSec(12);
    setScanStepText('Step 1/4: Reading document text & tables...');
    
    startTimeRef.current = Date.now();

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      updateProgressState();
    }, 300);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const extractedData = await parseDocumentData(arrayBuffer);
      
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setScanProgress(100);
      setScanStepText('Step 4/4: Scan Complete!');
      setEstimatedTimeSec(0);

      await new Promise(r => setTimeout(r, 300));
      
      const consultationsList = extractedData.consultations || [];
      const latestConsult = consultationsList.length > 0 ? consultationsList[0] : null;

      setFormData({
        patient: { ...initialFormData.patient, ...extractedData.patient },
        medicalRecord: {
          chiefComplaint: extractedData.medicalRecord?.chiefComplaint || latestConsult?.chiefComplaint || '',
          diagnosis: extractedData.medicalRecord?.diagnosis || latestConsult?.diagnosis || '',
          visitDate: extractedData.medicalRecord?.visitDate || latestConsult?.visitDate || ''
        },
        consultations: consultationsList,
        prescriptions: extractedData.prescriptions || [],
        imagingReports: {
          ultrasoundReports: extractedData.imagingReports?.ultrasoundReports || [],
          arterialDuplexScan: extractedData.imagingReports?.arterialDuplexScan || [],
          venousDuplexScan: extractedData.imagingReports?.venousDuplexScan || [],
          xrayReports: extractedData.imagingReports?.xrayReports || []
        },
        vitalSigns: extractedData.vitalSigns || [],
        labs: {
          cbc: extractedData.labs?.cbc || [],
          chemistry: extractedData.labs?.chemistry || [],
          serology: extractedData.labs?.serology || [],
          urinalysis: extractedData.labs?.urinalysis || []
        }
      });
      
      setScanComplete(true);
      toast.success('Document parsed successfully!');
    } catch (error) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      console.error('Scan Error:', error);
      toast.error('Failed to parse document. Please check file format.');
    } finally {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setIsScanning(false);
    }
  };

  const resetScan = () => {
    setFile(null);
    setScanComplete(false);
    setIsScanning(false);
    setScanProgress(0);
    setFormData(initialFormData);
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('medical_documents')
        .select(`
          issue_date,
          patients (
            patient_id,
            first_name,
            last_name,
            gender,
            contact_number
          )
        `)
        .in('document_type', ['Scanner Result', 'AI Scanner Result'])
        .order('issue_date', { ascending: false });

      if (error) throw error;
      setScannedHistory(data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load scan history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handlePatientChange = (e) => {
    setFormData(prev => ({ ...prev, patient: { ...prev.patient, [e.target.name]: e.target.value } }));
  };

  const handleMedicalRecordChange = (e) => {
    setFormData(prev => ({ ...prev, medicalRecord: { ...prev.medicalRecord, [e.target.name]: e.target.value } }));
  };

  const handleConsultationChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.consultations];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, consultations: updated };
    });
  };

  const addConsultation = () => {
    setFormData(prev => ({
      ...prev,
      consultations: [...prev.consultations, { visitDate: '', chiefComplaint: '', diagnosis: '', plan: '' }]
    }));
  };

  const removeConsultation = (index) => {
    setFormData(prev => ({
      ...prev,
      consultations: prev.consultations.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async (forceSave = false) => {
    if (!formData.patient.firstName || !formData.patient.lastName) {
      toast.error('Patient first name and last name are required');
      return;
    }

    setIsSaving(true);
    try {
      let patientId;
      const { data: existingPatients, error: searchError } = await supabase
        .from('patients')
        .select('patient_id')
        .ilike('first_name', formData.patient.firstName.trim())
        .ilike('last_name', formData.patient.lastName.trim())
        .limit(1);

      if (searchError) throw searchError;

      const existingPatient = existingPatients && existingPatients.length > 0 ? existingPatients[0] : null;

      if (existingPatient && !forceSave) {
        patientId = existingPatient.patient_id;
        let isDuplicate = false;
        let dupDetail = '';

        const checkDiag = formData.medicalRecord.diagnosis || (formData.consultations.length > 0 ? formData.consultations[0].diagnosis : '');
        const checkChief = formData.medicalRecord.chiefComplaint || (formData.consultations.length > 0 ? formData.consultations[0].chiefComplaint : '');

        if (checkChief || checkDiag) {
          let query = supabase
            .from('medical_records')
            .select('record_id, diagnosis, chief_complaint')
            .eq('patient_id', patientId);

          if (checkDiag) {
            query = query.ilike('diagnosis', `%${checkDiag.trim()}%`);
          } else if (checkChief) {
            query = query.ilike('chief_complaint', `%${checkChief.trim()}%`);
          }

          const { data: existingRecs } = await query;
          if (existingRecs && existingRecs.length > 0) {
            isDuplicate = true;
            dupDetail = existingRecs[0].diagnosis || existingRecs[0].chief_complaint || '';
          }
        }

        if (!isDuplicate && formData.prescriptions.length > 0) {
          const { data: existingPres } = await supabase
            .from('prescriptions')
            .select('prescription_id')
            .eq('patient_id', patientId)
            .limit(1);

          if (existingPres && existingPres.length > 0) {
            isDuplicate = true;
            dupDetail = 'Scanned prescriptions';
          }
        }

        if (isDuplicate) {
          setIsSaving(false);
          setDupMessage(
            `Duplicate Record Warning: Patient "${formData.patient.firstName} ${formData.patient.lastName}" already has matching record data (${dupDetail}) saved in the database. Are you sure you want to save this document again?`
          );
          setDupModalOpen(true);
          return;
        }
      }

      const patientPayload = {};
      if (formData.patient.firstName) patientPayload.first_name = formData.patient.firstName;
      if (formData.patient.lastName) patientPayload.last_name = formData.patient.lastName;
      if (formData.patient.address) patientPayload.address = formData.patient.address;
      
      const parsedDob = parseDateToISO(formData.patient.dateOfBirth);
      if (parsedDob) patientPayload.date_of_birth = parsedDob;
      
      if (formData.patient.gender) patientPayload.gender = formData.patient.gender;
      if (formData.patient.contactNumber) patientPayload.contact_number = formData.patient.contactNumber;
      if (formData.patient.occupation) patientPayload.occupation = formData.patient.occupation;
      if (formData.patient.knownAllergies) patientPayload.allergies = formData.patient.knownAllergies;
      if (formData.patient.pastMedicalHistory) patientPayload.medical_history = formData.patient.pastMedicalHistory;
      if (formData.patient.surgicalHistory) patientPayload.surgical_history = formData.patient.surgicalHistory;
      if (formData.patient.smokingHistory) patientPayload.smoking_history = formData.patient.smokingHistory;
      if (formData.patient.alcoholicIntake) patientPayload.alcoholic_intake = formData.patient.alcoholicIntake;
      if (formData.patient.emergencyContactName) patientPayload.emergency_contact_name = formData.patient.emergencyContactName;
      if (formData.patient.guardianName) patientPayload.guardian_name = formData.patient.guardianName;
      if (formData.patient.medications) patientPayload.medications = formData.patient.medications;
      if (formData.patient.previousHospitalization) patientPayload.previous_hospitalization = formData.patient.previousHospitalization;

      if (existingPatient) {
        patientId = existingPatient.patient_id;
        if (Object.keys(patientPayload).length > 0) {
          const { error: updateError } = await supabase
            .from('patients')
            .update(patientPayload)
            .eq('patient_id', patientId);
          if (updateError) throw updateError;
        }
      } else {
        const { data: newPatient, error: insertError } = await supabase
          .from('patients')
          .insert([patientPayload])
          .select('patient_id')
          .single();

        if (insertError) throw insertError;
        patientId = newPatient.patient_id;
      }

      // 2. Insert Medical Records / Consultations
      const recordsToInsert = [];

      if (formData.consultations && formData.consultations.length > 0) {
        formData.consultations.forEach(c => {
          if (c.chiefComplaint || c.diagnosis || c.visitDate || c.plan) {
            recordsToInsert.push({
              patient_id: patientId,
              chief_complaint: c.chiefComplaint || '',
              diagnosis: c.diagnosis || '',
              plan: c.plan || '',
              assessment: c.diagnosis || '',
              subjective: c.chiefComplaint || '',
              record_date: parseDateToISO(c.visitDate) || new Date().toISOString()
            });
          }
        });
      } else if (formData.medicalRecord.chiefComplaint || formData.medicalRecord.diagnosis) {
        recordsToInsert.push({
          patient_id: patientId,
          chief_complaint: formData.medicalRecord.chiefComplaint || '',
          diagnosis: formData.medicalRecord.diagnosis || '',
          record_date: parseDateToISO(formData.medicalRecord.visitDate) || new Date().toISOString()
        });
      }

      if (recordsToInsert.length > 0) {
        const { error: medRecError } = await supabase
          .from('medical_records')
          .insert(recordsToInsert);
        if (medRecError) throw medRecError;
      }

      // 3. Insert Prescriptions and resolve Medicines
      if (formData.prescriptions.length > 0) {
        const { data: presData, error: presError } = await supabase
          .from('prescriptions')
          .insert({
            patient_id: patientId,
            notes: 'Scanned from document'
          })
          .select()
          .single();
          
        if (presError) throw presError;
        const newPrescriptionId = presData.prescription_id;

        for (const p of formData.prescriptions) {
          if (!p.medicationName) continue;
          
          let medId;
          const { data: existingMeds, error: medSearchError } = await supabase
            .from('medicines')
            .select('medicine_id')
            .ilike('medicine_name', p.medicationName.trim())
            .limit(1);
            
          if (medSearchError) throw medSearchError;
          
          if (existingMeds && existingMeds.length > 0) {
            medId = existingMeds[0].medicine_id;
          } else {
            const { data: newMed, error: medInsertError } = await supabase
              .from('medicines')
              .insert({ medicine_name: p.medicationName.trim() })
              .select('medicine_id')
              .single();
              
            if (medInsertError) throw medInsertError;
            medId = newMed.medicine_id;
          }
          
          const durationMatch = p.duration ? String(p.duration).match(/\d+/) : null;
          const durationDays = durationMatch ? parseInt(durationMatch[0]) : null;
          
          const { error: itemError } = await supabase
            .from('prescription_items')
            .insert({
              prescription_id: newPrescriptionId,
              medicine_id: medId,
              dosage: p.dosage || '',
              frequency: p.frequency || '',
              duration_days: durationDays,
              instructions: p.instructions || p.duration || ''
            });
            
          if (itemError) throw itemError;
        }
      }

      // 4. Insert Imaging Reports
      const imagingInserts = [];
      const { ultrasoundReports, arterialDuplexScan, venousDuplexScan, xrayReports } = formData.imagingReports;
      
      const pushImaging = (reports, modality) => {
        reports.forEach(report => {
          imagingInserts.push({
            patient_id: patientId,
            modality: modality,
            location: report.location || '',
            impression: report.impression || '',
            record_date: parseDateToISO(report.date) || new Date().toISOString().split('T')[0]
          });
        });
      };

      pushImaging(ultrasoundReports || [], 'Ultrasound');
      pushImaging(arterialDuplexScan || [], 'Arterial Duplex');
      pushImaging(venousDuplexScan || [], 'Venous Duplex');
      pushImaging(xrayReports || [], 'X-Ray');

      if (imagingInserts.length > 0) {
        const { error: imgError } = await supabase.from('imaging_reports').insert(imagingInserts);
        if (imgError) throw imgError;
      }

      // 5. Insert Vital Signs
      if (formData.vitalSigns.length > 0) {
        const vitalInserts = formData.vitalSigns.map(v => ({
          patient_id: patientId,
          record_date: parseDateToISO(v.date) || new Date().toISOString().split('T')[0],
          age: parseNumeric(v.age),
          weight_kg: parseNumeric(v.weight),
          bp: v.bp || '',
          spo2: parseNumeric(v.spo2),
          pr: parseNumeric(v.pr),
          temperature_c: parseNumeric(v.temperature)
        }));
        const { error: vitalError } = await supabase.from('vital_signs').insert(vitalInserts);
        if (vitalError) throw vitalError;
      }

      // 6. Insert Labs (CBC, Chemistry, Serology, Urinalysis)
      if (formData.labs.cbc.length > 0) {
        const cbcInserts = formData.labs.cbc.map(l => ({
          patient_id: patientId,
          test_date: parseDateToISO(l.date) || new Date().toISOString().split('T')[0],
          wbc: parseNumeric(l.wbc),
          rbc: parseNumeric(l.rbc),
          hemoglobin: parseNumeric(l.hemoglobin),
          hematocrit: parseNumeric(l.hematocrit),
          platelet_count: parseNumeric(l.plateletCount || l.platelet_count),
          segmenters: parseNumeric(l.segmenters),
          neutrophils: parseNumeric(l.neutrophils),
          lymphocytes: parseNumeric(l.lymphocytes),
          monocytes: parseNumeric(l.monocytes),
          eosinophils: parseNumeric(l.eosinophils)
        }));
        const { error: cbcError } = await supabase.from('lab_cbc').insert(cbcInserts);
        if (cbcError) throw cbcError;
      }

      if (formData.labs.chemistry.length > 0) {
        const chemInserts = formData.labs.chemistry.map(l => ({
          patient_id: patientId,
          test_date: parseDateToISO(l.date) || new Date().toISOString().split('T')[0],
          creatinine: parseNumeric(l.creatinine),
          sodium: parseNumeric(l.sodium),
          potassium: parseNumeric(l.potassium),
          chloride: parseNumeric(l.chloride),
          ionized_calcium: parseNumeric(l.ionizedCalcium || l.ionized_calcium),
          bun: parseNumeric(l.bun),
          uric_acid: parseNumeric(l.uricAcid || l.uric_acid),
          phosphorous: parseNumeric(l.phosphorous),
          sgpt_alt: parseNumeric(l.sgptAlt || l.sgpt_alt),
          sgot_ast: parseNumeric(l.sgotAst || l.sgot_ast),
          hba1c: parseNumeric(l.hba1c),
          fbs: parseNumeric(l.fbs),
          rbs: parseNumeric(l.rbs),
          total_cholesterol: parseNumeric(l.totalCholesterol || l.total_cholesterol),
          triglycerides: parseNumeric(l.triglycerides),
          hdl: parseNumeric(l.hdl),
          ldl: parseNumeric(l.ldl),
          vldl: parseNumeric(l.vldl),
          chol_hdl_ratio: parseNumeric(l.cholHdlRatio || l.chol_hdl_ratio),
          d_dimer: parseNumeric(l.dDimer || l.d_dimer),
          procalcitonin: parseNumeric(l.procalcitonin),
          albumin: parseNumeric(l.albumin),
          trop_i: parseNumeric(l.tropI || l.trop_i),
          pro_bnp: parseNumeric(l.proBnp || l.pro_bnp),
          ptpa_patient: parseNumeric(l.ptpaPatient || l.ptpa_patient),
          ptpa_control: parseNumeric(l.ptpaControl || l.ptpa_control),
          percent_activity: parseNumeric(l.percentActivity || l.percent_activity),
          inr: parseNumeric(l.inr),
          ptpa_ratio: parseNumeric(l.ptpaRatio || l.ptpa_ratio)
        }));
        const { error: chemError } = await supabase.from('lab_chemistry').insert(chemInserts);
        if (chemError) throw chemError;
      }

      if (formData.labs.serology.length > 0) {
        const serologyInserts = formData.labs.serology.map(l => ({
          patient_id: patientId,
          test_date: parseDateToISO(l.date) || new Date().toISOString().split('T')[0],
          tsh: parseNumeric(l.tsh)
        }));
        const { error: serologyError } = await supabase.from('lab_serology').insert(serologyInserts);
        if (serologyError) throw serologyError;
      }

      if (formData.labs.urinalysis.length > 0) {
        const uaInserts = formData.labs.urinalysis.map(l => ({
          patient_id: patientId,
          test_date: parseDateToISO(l.date) || new Date().toISOString().split('T')[0],
          color: l.color || '',
          transparency: l.transparency || '',
          protein: l.protein || '',
          ph: parseNumeric(l.ph),
          specific_gravity: parseNumeric(l.specificGravity),
          glucose: l.glucose || '',
          pus_cells: l.pusCells || '',
          rbc_micro: l.rbcMicro || '',
          epithelial_cells: l.epithelialCells || '',
          bacteria: l.bacteria || ''
        }));
        const { error: uaError } = await supabase.from('lab_urinalysis').insert(uaInserts);
        if (uaError) throw uaError;
      }

      // 7. Track scan document
      const { error: docError } = await supabase
        .from('medical_documents')
        .insert({
          patient_id: patientId,
          document_type: 'Scanner Result',
          diagnosis_impression: 'Document auto-parsed',
          purpose: 'Automated Record Digitization'
        });
      if (docError) throw docError;

      toast.success('Patient data saved successfully!');
      resetScan();
      fetchHistory();
    } catch (error) {
      console.error('Save Error:', error);
      toast.error('Failed to save data. ' + (error.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScanContext.Provider value={{
      file,
      isScanning,
      isSaving,
      scanComplete,
      scanProgress,
      scanStepText,
      estimatedTimeSec,
      formData,
      setFormData,
      activeTab,
      setActiveTab,
      scannedHistory,
      loadingHistory,
      fetchHistory,
      dupModalOpen,
      setDupModalOpen,
      dupMessage,
      startScan,
      resetScan,
      handlePatientChange,
      handleMedicalRecordChange,
      handleConsultationChange,
      addConsultation,
      removeConsultation,
      handleSave
    }}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScan() {
  const context = useContext(ScanContext);
  if (!context) {
    throw new Error('useScan must be used within a ScanProvider');
  }
  return context;
}
