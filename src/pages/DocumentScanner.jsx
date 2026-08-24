import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { Upload, FileText, CheckCircle, Save, Loader2, RefreshCw, UserCircle2, Pill, Activity, History, Scan } from 'lucide-react';
import { parseDocumentData } from '../services/geminiService';
import '../index.css';

export default function DocumentScanner() {
  const [activeTab, setActiveTab] = useState('scanner');
  const [file, setFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  
  const [scannedHistory, setScannedHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    patient: { 
      firstName: '', lastName: '', dateOfBirth: '', gender: '', contactNumber: '',
      occupation: '', knownAllergies: '', pastMedicalHistory: '', surgicalHistory: '',
      smokingHistory: '', alcoholicIntake: '', emergencyContactName: '', guardianName: ''
    },
    medicalRecord: { chiefComplaint: '', diagnosis: '', visitDate: '' },
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
  });

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    if (!selectedFile.name.endsWith('.docx')) {
      toast.error('Please upload a .docx file');
      return;
    }

    setFile(selectedFile);
    setIsScanning(true);
    setScanComplete(false);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const extractedData = await parseDocumentData(arrayBuffer);
      
      setFormData({
        patient: { ...formData.patient, ...extractedData.patient },
        medicalRecord: { ...formData.medicalRecord, ...extractedData.medicalRecord },
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
      console.error(error);
      toast.error('Failed to parse document. Please check console for details.');
    } finally {
      setIsScanning(false);
    }
  };

  const handlePatientChange = (e) => {
    setFormData(prev => ({ ...prev, patient: { ...prev.patient, [e.target.name]: e.target.value } }));
  };

  const handleMedicalRecordChange = (e) => {
    setFormData(prev => ({ ...prev, medicalRecord: { ...prev.medicalRecord, [e.target.name]: e.target.value } }));
  };

  const handleSave = async () => {
    if (!formData.patient.firstName || !formData.patient.lastName) {
      toast.error('Patient first name and last name are required');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Get or Create Patient
      let patientId;
      const { data: existingPatient, error: searchError } = await supabase
        .from('patients')
        .select('patient_id')
        .ilike('first_name', formData.patient.firstName)
        .ilike('last_name', formData.patient.lastName)
        .maybeSingle();

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }

      const patientPayload = {};
      if (formData.patient.firstName) patientPayload.first_name = formData.patient.firstName;
      if (formData.patient.lastName) patientPayload.last_name = formData.patient.lastName;
      if (formData.patient.dateOfBirth) patientPayload.date_of_birth = formData.patient.dateOfBirth;
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

      // 2. Insert Medical Record
      if (formData.medicalRecord.chiefComplaint || formData.medicalRecord.diagnosis) {
        const { error: medRecError } = await supabase
          .from('medical_records')
          .insert({
            patient_id: patientId,
            chief_complaint: formData.medicalRecord.chiefComplaint,
            diagnosis: formData.medicalRecord.diagnosis,
            record_date: formData.medicalRecord.visitDate ? new Date(formData.medicalRecord.visitDate).toISOString() : new Date().toISOString()
          });
        if (medRecError) throw medRecError;
      }

      // 3. Insert Prescriptions and resolve Medicines
      if (formData.prescriptions.length > 0) {
        const { data: presData, error: presError } = await supabase
          .from('prescriptions')
          .insert({
            patient_id: patientId,
            notes: "Extracted from document via AI Scanner"
          })
          .select()
          .single();
          
        if (presError) throw presError;
        const newPrescriptionId = presData.prescription_id;

        for (const p of formData.prescriptions) {
          if (!p.medicationName) continue;
          
          let medId;
          const { data: existingMed, error: medSearchError } = await supabase
            .from('medicines')
            .select('medicine_id')
            .ilike('medicine_name', p.medicationName.trim())
            .maybeSingle();
            
          if (medSearchError && medSearchError.code !== 'PGRST116') throw medSearchError;
          
          if (existingMed) {
            medId = existingMed.medicine_id;
          } else {
            const { data: newMed, error: medInsertError } = await supabase
              .from('medicines')
              .insert({ medicine_name: p.medicationName.trim() })
              .select('medicine_id')
              .single();
              
            if (medInsertError) throw medInsertError;
            medId = newMed.medicine_id;
          }
          
          const durationMatch = p.duration ? p.duration.match(/\d+/) : null;
          const durationDays = durationMatch ? parseInt(durationMatch[0]) : null;
          
          const { error: itemError } = await supabase
            .from('prescription_items')
            .insert({
              prescription_id: newPrescriptionId,
              medicine_id: medId,
              dosage: p.dosage || '',
              frequency: p.frequency || '',
              duration_days: durationDays,
              instructions: p.duration || ''
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
            record_date: report.date ? new Date(report.date).toISOString() : new Date().toISOString()
          });
        });
      };

      pushImaging(ultrasoundReports, 'Ultrasound');
      pushImaging(arterialDuplexScan, 'Arterial Duplex');
      pushImaging(venousDuplexScan, 'Venous Duplex');
      pushImaging(xrayReports, 'X-Ray');

      if (imagingInserts.length > 0) {
        const { error: imgError } = await supabase.from('imaging_reports').insert(imagingInserts);
        if (imgError) throw imgError;
      }

      // 5. Insert Vital Signs
      if (formData.vitalSigns.length > 0) {
        const vitalInserts = formData.vitalSigns.map(v => ({
          patient_id: patientId,
          record_date: v.date ? new Date(v.date).toISOString() : new Date().toISOString(),
          age: parseInt(v.age) || null,
          weight_kg: parseFloat(v.weight) || null,
          bp: v.bp || '',
          spo2: parseFloat(v.spo2) || null,
          pr: parseInt(v.pr) || null,
          temperature_c: parseFloat(v.temperature) || null
        }));
        const { error: vitalError } = await supabase.from('vital_signs').insert(vitalInserts);
        if (vitalError) throw vitalError;
      }

      // 6. Insert Labs (CBC, Chemistry, Serology, Urinalysis)
      if (formData.labs.cbc.length > 0) {
        const cbcInserts = formData.labs.cbc.map(l => ({
          patient_id: patientId,
          test_date: l.date ? new Date(l.date).toISOString() : new Date().toISOString(),
          wbc: parseFloat(l.wbc) || null,
          rbc: parseFloat(l.rbc) || null,
          hemoglobin: parseFloat(l.hemoglobin) || null,
          hematocrit: parseFloat(l.hematocrit) || null,
          platelet_count: parseFloat(l.plateletCount) || null,
          segmenters: parseFloat(l.segmenters) || null,
          lymphocytes: parseFloat(l.lymphocytes) || null,
          monocytes: parseFloat(l.monocytes) || null,
          eosinophils: parseFloat(l.eosinophils) || null
        }));
        const { error: cbcError } = await supabase.from('lab_cbc').insert(cbcInserts);
        if (cbcError) throw cbcError;
      }

      if (formData.labs.chemistry.length > 0) {
        const chemInserts = formData.labs.chemistry.map(l => ({
          patient_id: patientId,
          test_date: l.date ? new Date(l.date).toISOString() : new Date().toISOString(),
          creatinine: parseFloat(l.creatinine) || null,
          sodium: parseFloat(l.sodium) || null,
          potassium: parseFloat(l.potassium) || null,
          chloride: parseFloat(l.chloride) || null,
          ionized_calcium: parseFloat(l.ionizedCalcium) || null,
          bun: parseFloat(l.bun) || null,
          uric_acid: parseFloat(l.uricAcid) || null,
          fbs: parseFloat(l.fbs) || null,
          rbs: parseFloat(l.rbs) || null,
          total_cholesterol: parseFloat(l.totalCholesterol) || null,
          triglycerides: parseFloat(l.triglycerides) || null,
          hdl: parseFloat(l.hdl) || null,
          ldl: parseFloat(l.ldl) || null
        }));
        const { error: chemError } = await supabase.from('lab_chemistry').insert(chemInserts);
        if (chemError) throw chemError;
      }

      if (formData.labs.serology.length > 0) {
        const serologyInserts = formData.labs.serology.map(l => ({
          patient_id: patientId,
          test_date: l.date ? new Date(l.date).toISOString() : new Date().toISOString(),
          tsh: parseFloat(l.tsh) || null
        }));
        const { error: serologyError } = await supabase.from('lab_serology').insert(serologyInserts);
        if (serologyError) throw serologyError;
      }

      if (formData.labs.urinalysis.length > 0) {
        const uaInserts = formData.labs.urinalysis.map(l => ({
          patient_id: patientId,
          test_date: l.date ? new Date(l.date).toISOString() : new Date().toISOString(),
          color: l.color || '',
          transparency: l.transparency || '',
          protein: l.protein || '',
          ph: parseFloat(l.ph) || null,
          specific_gravity: parseFloat(l.specificGravity) || null,
          glucose: l.glucose || '',
          pus_cells: l.pusCells || '',
          rbc_micro: l.rbcMicro || '',
          epithelial_cells: l.epithelialCells || '',
          bacteria: l.bacteria || ''
        }));
        const { error: uaError } = await supabase.from('lab_urinalysis').insert(uaInserts);
        if (uaError) throw uaError;
      }

      // 7. Insert into medical_documents to track that this was a scan
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
      
      // Reset
      setFile(null);
      setScanComplete(false);
      setFormData({
        patient: { 
          firstName: '', lastName: '', dateOfBirth: '', gender: '', contactNumber: '',
          occupation: '', knownAllergies: '', pastMedicalHistory: '', surgicalHistory: '',
          smokingHistory: '', alcoholicIntake: '', emergencyContactName: '', guardianName: ''
        },
        medicalRecord: { chiefComplaint: '', diagnosis: '', visitDate: '' },
        prescriptions: [],
        imagingReports: { ultrasoundReports: [], arterialDuplexScan: [], venousDuplexScan: [], xrayReports: [] },
        vitalSigns: [],
        labs: { cbc: [], chemistry: [], serology: [], urinalysis: [] }
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Refresh history if we switch to it
      fetchHistory();

    } catch (error) {
      console.error(error);
      toast.error('Failed to save data. ' + (error.message || ''));
    } finally {
      setIsSaving(false);
    }
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

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Document Scanner</h1>
            <p style={{ color: 'var(--text-gray)', marginTop: '0.25rem' }}>Upload patient document (.docx) to automatically extract and digitize records.</p>
          </div>
          
          <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <button 
              className={`btn ${activeTab === 'scanner' ? 'btn-primary' : ''}`}
              style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: activeTab === 'scanner' ? 'var(--primary)' : 'transparent', color: activeTab === 'scanner' ? '#fff' : 'var(--text-gray)', border: 'none', boxShadow: 'none' }}
              onClick={() => setActiveTab('scanner')}
            >
              <Scan size={18} /> Scanner
            </button>
            <button 
              className={`btn ${activeTab === 'history' ? 'btn-primary' : ''}`}
              style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: activeTab === 'history' ? 'var(--primary)' : 'transparent', color: activeTab === 'history' ? '#fff' : 'var(--text-gray)', border: 'none', boxShadow: 'none' }}
              onClick={() => setActiveTab('history')}
            >
              <History size={18} /> Scanned History
            </button>
          </div>
        </div>

        {activeTab === 'scanner' && (
          <>
            <div className="upload-zone" onClick={() => !isScanning && !scanComplete && fileInputRef.current?.click()}>
          <input 
            type="file" 
            accept=".docx" 
            style={{ display: 'none' }} 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          
          {!isScanning && !scanComplete && (
            <>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fff', boxShadow: '0 4px 14px rgba(14,186,177,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '1rem' }}>
                <Upload size={40} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-dark)' }}>Drag & Drop or Click to Upload Document</h3>
                <p style={{ color: 'var(--text-gray)', fontSize: '1rem', marginTop: '0.5rem' }}>Supports .docx patient records and imaging reports</p>
              </div>
            </>
          )}

          {isScanning && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <Loader2 className="animate-spin" size={48} color="var(--primary)" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-dark)' }}>Analyzing Document...</h3>
              <p style={{ color: 'var(--text-gray)', fontSize: '1rem' }}>Extracting demographics, medical history, and imaging reports using AI.</p>
            </div>
          )}
        </div>

        {scanComplete && (
          <div className="premium-banner" style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}>
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-dark)' }}>Document Parsed Successfully</h3>
                <p style={{ color: 'var(--text-gray)', fontSize: '0.95rem', marginTop: '0.25rem' }}>{file?.name}</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setScanComplete(false);
                if(fileInputRef.current) fileInputRef.current.value = '';
              }} 
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#fff', border: '1px solid var(--border-color)', borderRadius: '0.5rem', fontWeight: '600' }}
            >
              <RefreshCw size={18} /> Scan Another
            </button>
          </div>
        )}

        {scanComplete && (
          <>
            <div className="glass-card">
              <div className="card-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <h3 className="card-title" style={{ fontSize: '1.125rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserCircle2 size={20} /> Patient Demographics
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input type="text" className="form-control" name="firstName" value={formData.patient.firstName || ''} onChange={handlePatientChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input type="text" className="form-control" name="lastName" value={formData.patient.lastName || ''} onChange={handlePatientChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input type="date" className="form-control" name="dateOfBirth" value={formData.patient.dateOfBirth || ''} onChange={handlePatientChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <input type="text" className="form-control" name="gender" value={formData.patient.gender || ''} onChange={handlePatientChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Number</label>
                  <input type="text" className="form-control" name="contactNumber" value={formData.patient.contactNumber || ''} onChange={handlePatientChange} />
                </div>
              </div>
            </div>

            <div className="glass-card">
              <div className="card-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <h3 className="card-title" style={{ fontSize: '1.125rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserCircle2 size={20} /> Medical History & Lifestyle
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Occupation</label>
                  <input type="text" className="form-control" name="occupation" value={formData.patient.occupation || ''} onChange={handlePatientChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Known Allergies</label>
                  <input type="text" className="form-control" name="knownAllergies" value={formData.patient.knownAllergies || ''} onChange={handlePatientChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Past Medical History</label>
                  <input type="text" className="form-control" name="pastMedicalHistory" value={formData.patient.pastMedicalHistory || ''} onChange={handlePatientChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Surgical History</label>
                  <input type="text" className="form-control" name="surgicalHistory" value={formData.patient.surgicalHistory || ''} onChange={handlePatientChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Smoking History</label>
                  <input type="text" className="form-control" name="smokingHistory" value={formData.patient.smokingHistory || ''} onChange={handlePatientChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Alcohol Intake</label>
                  <input type="text" className="form-control" name="alcoholicIntake" value={formData.patient.alcoholicIntake || ''} onChange={handlePatientChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Emergency Contact Name</label>
                  <input type="text" className="form-control" name="emergencyContactName" value={formData.patient.emergencyContactName || ''} onChange={handlePatientChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Guardian Name (If Minor)</label>
                  <input type="text" className="form-control" name="guardianName" value={formData.patient.guardianName || ''} onChange={handlePatientChange} />
                </div>
              </div>
            </div>

            <div className="glass-card">
              <div className="card-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <h3 className="card-title" style={{ fontSize: '1.125rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} /> Medical Record
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Chief Complaint</label>
                  <textarea className="form-control" rows="3" name="chiefComplaint" value={formData.medicalRecord.chiefComplaint || ''} onChange={handleMedicalRecordChange}></textarea>
                </div>
                <div className="form-group">
                  <label className="form-label">Diagnosis</label>
                  <input type="text" className="form-control" name="diagnosis" value={formData.medicalRecord.diagnosis || ''} onChange={handleMedicalRecordChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Visit Date</label>
                  <input type="date" className="form-control" name="visitDate" value={formData.medicalRecord.visitDate || ''} onChange={handleMedicalRecordChange} />
                </div>
              </div>
            </div>

            {formData.prescriptions.length > 0 && (
              <div className="glass-card">
                <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                  <h3 className="card-title" style={{ fontSize: '1.125rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Pill size={20} /> Prescriptions Extracted ({formData.prescriptions.length})
                  </h3>
                </div>
                <div className="table-container">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Medication</th>
                        <th>Dosage</th>
                        <th>Frequency</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.prescriptions.map((p, idx) => (
                        <tr key={idx}>
                          <td>{p.medicationName}</td>
                          <td>{p.dosage}</td>
                          <td>{p.frequency}</td>
                          <td>{p.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {formData.vitalSigns.length > 0 && (
              <div className="glass-card">
                <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                  <h3 className="card-title" style={{ fontSize: '1.125rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={20} /> Vital Signs ({formData.vitalSigns.length})
                  </h3>
                </div>
                <div className="table-container">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Age</th>
                        <th>Weight</th>
                        <th>BP</th>
                        <th>SpO2</th>
                        <th>PR</th>
                        <th>Temp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.vitalSigns.map((v, idx) => (
                        <tr key={idx}>
                          <td>{v.date}</td>
                          <td>{v.age}</td>
                          <td>{v.weight}</td>
                          <td>{v.bp}</td>
                          <td>{v.spo2}</td>
                          <td>{v.pr}</td>
                          <td>{v.temperature}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {formData.labs.cbc.length > 0 && (
              <div className="glass-card">
                <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                  <h3 className="card-title" style={{ fontSize: '1.125rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={20} /> Complete Blood Count ({formData.labs.cbc.length})
                  </h3>
                </div>
                <div className="table-container" style={{ overflowX: 'auto' }}>
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>WBC</th>
                        <th>RBC</th>
                        <th>Hgb</th>
                        <th>Hct</th>
                        <th>Plat</th>
                        <th>Seg</th>
                        <th>Lym</th>
                        <th>Mon</th>
                        <th>Eos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.labs.cbc.map((l, idx) => (
                        <tr key={idx}>
                          <td>{l.date}</td>
                          <td>{l.wbc}</td>
                          <td>{l.rbc}</td>
                          <td>{l.hemoglobin}</td>
                          <td>{l.hematocrit}</td>
                          <td>{l.plateletCount}</td>
                          <td>{l.segmenters}</td>
                          <td>{l.lymphocytes}</td>
                          <td>{l.monocytes}</td>
                          <td>{l.eosinophils}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {formData.labs.chemistry.length > 0 && (
              <div className="glass-card">
                <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                  <h3 className="card-title" style={{ fontSize: '1.125rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={20} /> Blood Chemistry ({formData.labs.chemistry.length})
                  </h3>
                </div>
                <div className="table-container" style={{ overflowX: 'auto' }}>
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Crea</th>
                        <th>Na</th>
                        <th>K</th>
                        <th>Cl</th>
                        <th>iCa</th>
                        <th>BUN</th>
                        <th>UA</th>
                        <th>FBS</th>
                        <th>RBS</th>
                        <th>Chol</th>
                        <th>Trig</th>
                        <th>HDL</th>
                        <th>LDL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.labs.chemistry.map((l, idx) => (
                        <tr key={idx}>
                          <td>{l.date}</td>
                          <td>{l.creatinine}</td>
                          <td>{l.sodium}</td>
                          <td>{l.potassium}</td>
                          <td>{l.chloride}</td>
                          <td>{l.ionizedCalcium}</td>
                          <td>{l.bun}</td>
                          <td>{l.uricAcid}</td>
                          <td>{l.fbs}</td>
                          <td>{l.rbs}</td>
                          <td>{l.totalCholesterol}</td>
                          <td>{l.triglycerides}</td>
                          <td>{l.hdl}</td>
                          <td>{l.ldl}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {formData.labs.serology.length > 0 && (
              <div className="glass-card">
                <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                  <h3 className="card-title" style={{ fontSize: '1.125rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={20} /> Serology ({formData.labs.serology.length})
                  </h3>
                </div>
                <div className="table-container">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>TSH</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.labs.serology.map((l, idx) => (
                        <tr key={idx}>
                          <td>{l.date}</td>
                          <td>{l.tsh}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {formData.labs.urinalysis.length > 0 && (
              <div className="glass-card">
                <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                  <h3 className="card-title" style={{ fontSize: '1.125rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={20} /> Urinalysis ({formData.labs.urinalysis.length})
                  </h3>
                </div>
                <div className="table-container" style={{ overflowX: 'auto' }}>
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Color</th>
                        <th>Transp.</th>
                        <th>Protein</th>
                        <th>pH</th>
                        <th>Sp.Grav</th>
                        <th>Glucose</th>
                        <th>Pus</th>
                        <th>RBC</th>
                        <th>Epithelial</th>
                        <th>Bacteria</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.labs.urinalysis.map((l, idx) => (
                        <tr key={idx}>
                          <td>{l.date}</td>
                          <td>{l.color}</td>
                          <td>{l.transparency}</td>
                          <td>{l.protein}</td>
                          <td>{l.ph}</td>
                          <td>{l.specificGravity}</td>
                          <td>{l.glucose}</td>
                          <td>{l.pusCells}</td>
                          <td>{l.rbcMicro}</td>
                          <td>{l.epithelialCells}</td>
                          <td>{l.bacteria}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {Object.entries(formData.imagingReports).map(([key, reports]) => {
              if (reports.length === 0) return null;
              const title = key === 'ultrasoundReports' ? 'Ultrasound Reports' : key === 'arterialDuplexScan' ? 'Arterial Duplex Scan' : key === 'venousDuplexScan' ? 'Venous Duplex Scan' : 'X-Ray Reports';
              return (
                <div className="glass-card" key={key}>
                  <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                    <h3 className="card-title" style={{ fontSize: '1.125rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity size={20} /> {title} ({reports.length})
                    </h3>
                  </div>
                  <div className="table-container">
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Location</th>
                          <th>Impression</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map((r, idx) => (
                          <tr key={idx}>
                            <td>{r.date}</td>
                            <td>{r.location}</td>
                            <td style={{ whiteSpace: 'pre-wrap' }}>{r.impression}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', marginBottom: '2rem' }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving} style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
                {isSaving ? <><Loader2 className="animate-spin" size={20} /> Saving...</> : <><Save size={20} /> Save to Database</>}
              </button>
            </div>
          </>
        )}
        </>
        )}

        {activeTab === 'history' && (
          <div className="glass-card">
            <div className="card-header" style={{ marginBottom: '1.5rem' }}>
              <h3 className="card-title" style={{ fontSize: '1.125rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={20} /> Previously Scanned Patients
              </h3>
            </div>
            
            {loadingHistory ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-gray)' }}>
                <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto', marginBottom: '1rem', color: 'var(--primary)' }} />
                Loading history...
              </div>
            ) : scannedHistory.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-gray)' }}>
                No patients have been scanned yet.
              </div>
            ) : (
              <div className="table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Scan Date</th>
                      <th>Patient Name</th>
                      <th>Gender</th>
                      <th>Contact Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scannedHistory.map((record, idx) => (
                      <tr key={idx}>
                        <td>{new Date(record.issue_date).toLocaleString()}</td>
                        <td style={{ fontWeight: '500' }}>{record.patients?.last_name}, {record.patients?.first_name}</td>
                        <td>{record.patients?.gender || '-'}</td>
                        <td>{record.patients?.contact_number || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
