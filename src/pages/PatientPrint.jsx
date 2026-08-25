import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../index.css';

export default function PatientPrint() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    patient: null,
    cardio: null,
    vitals: [],
    cbc: [],
    chem: [],
    serology: [],
    ua: [],
    imaging: [],
    docs: [],
    records: [],
    appointments: []
  });

  useEffect(() => {
    fetchAllData();
  }, [id]);

  const fetchAllData = async () => {
    setLoading(true);
    
    const [
      patientRes, 
      vitalsRes, 
      cbcRes, 
      chemRes, 
      serologyRes, 
      uaRes, 
      imagingRes,
      docsRes,
      recordsRes,
      appointmentsRes,
      cardioRes
    ] = await Promise.all([
      supabase.from('patients').select('*').eq('patient_id', id).single(),
      supabase.from('vital_signs').select('*').eq('patient_id', id).order('record_date', { ascending: false }),
      supabase.from('lab_cbc').select('*').eq('patient_id', id).order('test_date', { ascending: false }),
      supabase.from('lab_chemistry').select('*').eq('patient_id', id).order('test_date', { ascending: false }),
      supabase.from('lab_serology').select('*').eq('patient_id', id).order('test_date', { ascending: false }),
      supabase.from('lab_urinalysis').select('*').eq('patient_id', id).order('test_date', { ascending: false }),
      supabase.from('imaging_reports').select('*').eq('patient_id', id).order('record_date', { ascending: false }),
      supabase.from('medical_documents').select('*').eq('patient_id', id).order('issue_date', { ascending: false }),
      supabase.from('medical_records').select('*, doctors(first_name, last_name, specialty)').eq('patient_id', id).order('record_date', { ascending: false }),
      supabase.from('appointments').select('*, doctors(first_name, last_name, specialty)').eq('patient_id', id).order('appointment_date', { ascending: false }),
      supabase.from('patient_cardio_history').select('*').eq('patient_id', id).maybeSingle()
    ]);

    setData({
      patient: patientRes.data,
      vitals: vitalsRes.data || [],
      cbc: cbcRes.data || [],
      chem: chemRes.data || [],
      serology: serologyRes.data || [],
      ua: uaRes.data || [],
      imaging: imagingRes.data || [],
      docs: docsRes.data || [],
      records: recordsRes.data || [],
      appointments: appointmentsRes.data || [],
      cardio: cardioRes.data || null
    });

    setLoading(false);
    
    // Once data is loaded and rendered, trigger print
    setTimeout(() => {
      window.print();
    }, 1000);
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Preparing document...</div>;
  if (!data.patient) return <div style={{ padding: '2rem', textAlign: 'center' }}>Patient not found.</div>;

  const { patient, vitals, cbc, chem, serology, ua, imaging, docs, records, appointments, cardio } = data;

  const calculateAge = (dob) => {
    if (!dob) return '';
    const diff_ms = Date.now() - new Date(dob).getTime();
    const age_dt = new Date(diff_ms);
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  };

  const allCbcColumns = [
    { label: 'DATE', key: 'test_date', render: l => new Date(l.test_date).toLocaleDateString() },
    { label: 'WBC', key: 'wbc' },
    { label: 'RBC', key: 'rbc' },
    { label: 'Hgb', key: 'hemoglobin' },
    { label: 'Hct', key: 'hematocrit' },
    { label: 'Plt', key: 'platelet_count' },
    { label: 'Seg', key: 'segmenters' },
    { label: 'Neutrophils', key: 'neutrophils' },
    { label: 'Lymphs', key: 'lymphocytes' },
    { label: 'Mono', key: 'monocytes' },
    { label: 'Eos', key: 'eosinophils' }
  ];
  const activeCbcCols = allCbcColumns.filter(c => c.key === 'test_date' || cbc.some(l => l[c.key] !== null && l[c.key] !== undefined && l[c.key] !== ''));

  const allChemColumns = [
    { label: 'DATE', key: 'test_date', render: l => new Date(l.test_date).toLocaleDateString() },
    { label: 'Creatinine', key: 'creatinine' },
    { label: 'Na', key: 'sodium' },
    { label: 'K', key: 'potassium' },
    { label: 'Cl', key: 'chloride' },
    { label: 'iCa', key: 'ionized_calcium' },
    { label: 'BUN', key: 'bun' },
    { label: 'UA', key: 'uric_acid' },
    { label: 'Phos', key: 'phosphorous' },
    { label: 'SGPT', key: 'sgpt_alt' },
    { label: 'SGOT', key: 'sgot_ast' },
    { label: 'HbA1c', key: 'hba1c' },
    { label: 'FBS', key: 'fbs' },
    { label: 'RBS', key: 'rbs' },
    { label: 'Chol', key: 'total_cholesterol' },
    { label: 'Trig', key: 'triglycerides' },
    { label: 'HDL', key: 'hdl' },
    { label: 'LDL', key: 'ldl' },
    { label: 'VLDL', key: 'vldl' },
    { label: 'Chol/HDL', key: 'chol_hdl_ratio' },
    { label: 'D-Dimer', key: 'd_dimer' },
    { label: 'Procalcitonin', key: 'procalcitonin' },
    { label: 'Albumin', key: 'albumin' },
    { label: 'Trop-I', key: 'trop_i' },
    { label: 'Pro-BNP', key: 'pro_bnp' },
    { label: 'PTPA Pat', key: 'ptpa_patient' },
    { label: 'PTPA Ctrl', key: 'ptpa_control' },
    { label: '% Act', key: 'percent_activity' },
    { label: 'INR', key: 'inr' },
    { label: 'PTPA Ratio', key: 'ptpa_ratio' }
  ];
  const activeChemCols = allChemColumns.filter(c => c.key === 'test_date' || chem.some(l => l[c.key] !== null && l[c.key] !== undefined && l[c.key] !== ''));

  return (
    <div className="print-container" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <style>
        {`
          @media print {
            body { background: white; margin: 0; padding: 0; font-size: 10pt; }
            .print-container { padding: 0 !important; width: 100% !important; max-width: 100% !important; margin: 0 !important; }
            @page { margin: 1cm; size: auto; }
            .page-break { page-break-before: always; }
            .no-break { page-break-inside: avoid; }
            button { display: none !important; }
            .print-table-wrapper { overflow: visible !important; width: 100% !important; }
            .print-table { width: 100% !important; font-size: 8pt !important; table-layout: auto !important; }
            .print-table th, .print-table td { padding: 3px 5px !important; white-space: nowrap !important; }
          }
          .print-header { text-align: center; margin-bottom: 2rem; border-bottom: 2px solid #000; padding-bottom: 1rem; }
          .print-title { font-size: 1.25rem; font-weight: bold; margin: 0 0 0.5rem 0; }
          .print-subtitle { font-size: 0.9rem; margin: 0; }
          .print-table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 0.85rem; }
          .print-table th, .print-table td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
          .print-table th { background-color: #f8f9fa; font-weight: bold; }
          .section-title { font-size: 1.1rem; font-weight: bold; margin: 1.5rem 0 0.75rem 0; border-bottom: 1px solid #ddd; padding-bottom: 0.25rem; }
          .patient-info { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; font-size: 0.9rem; }
          .patient-info p { margin: 0.25rem 0; }
        `}
      </style>

      {/* Doctor Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: '0 0 0.25rem 0', color: '#000' }}>Gladdays Casuga-Napigkit, MD, MBA, FPCP, FPCC, FPSVM</h1>
        <p style={{ fontSize: '1rem', color: '#333', margin: '0 0 0.5rem 0' }}>Internal Medicine, Adult Cardiology, Vascular Medicine</p>
        <p style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#000', margin: 0 }}>PATIENT PROFILE</p>
      </div>

      {/* Patient Information */}
      <div className="no-break">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', borderBottom: '2px solid #000', paddingBottom: '0.75rem' }}>
          <h1 className="print-title" style={{ margin: 0, fontSize: '1.75rem' }}>
            {patient.last_name}, {patient.first_name} {patient.middle_name}
          </h1>
          <div style={{ textAlign: 'right', fontSize: '0.9rem' }}>
            <p style={{ margin: 0 }}><strong>Patient ID:</strong> #{patient.patient_id}</p>
            <p style={{ margin: 0 }}><strong>Date Printed:</strong> {new Date().toLocaleDateString()}</p>
            <p style={{ margin: 0 }}><strong>Status:</strong> {patient.status?.toUpperCase() || 'N/A'}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem', fontSize: '0.9rem' }}>
          {/* Personal & Contact Information */}
          <div>
            <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid #ddd', paddingBottom: '0.25rem', marginBottom: '0.75rem' }}>Personal & Contact Information</h3>
            <p style={{ margin: '0.35rem 0' }}><strong>DOB / Age:</strong> {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'} ({calculateAge(patient.date_of_birth)} yrs)</p>
            <p style={{ margin: '0.35rem 0' }}><strong>Gender:</strong> {patient.gender || 'N/A'}</p>
            <p style={{ margin: '0.35rem 0' }}><strong>Marital Status:</strong> {patient.marital_status || 'N/A'}</p>
            <p style={{ margin: '0.35rem 0' }}><strong>Occupation:</strong> {patient.occupation || 'N/A'}</p>
            <p style={{ margin: '0.35rem 0' }}><strong>Contact Number:</strong> {patient.contact_number || 'N/A'}</p>
            <p style={{ margin: '0.35rem 0' }}><strong>Email Address:</strong> {patient.email || 'N/A'}</p>
            <p style={{ margin: '0.35rem 0' }}><strong>Home Address:</strong> {patient.address || 'N/A'}</p>
          </div>

          {/* General Medical History */}
          <div>
            <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid #ddd', paddingBottom: '0.25rem', marginBottom: '0.75rem' }}>General Medical History</h3>
            <p style={{ margin: '0.35rem 0' }}><strong>Medical History:</strong> {patient.medical_history || 'N/A'}</p>
            <p style={{ margin: '0.35rem 0' }}><strong>Surgical History:</strong> {patient.surgical_history || 'N/A'}</p>
            <p style={{ margin: '0.35rem 0' }}><strong>Known Allergies:</strong> {patient.allergies || 'N/A'}</p>
            <p style={{ margin: '0.35rem 0' }}><strong>Smoking History:</strong> {patient.smoking_history || 'N/A'}</p>
            <p style={{ margin: '0.35rem 0' }}><strong>Alcohol Intake:</strong> {patient.alcoholic_intake || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Cardiovascular History */}
      {cardio && (
        <div className="no-break" style={{ marginBottom: '2rem' }}>
          <h2 className="section-title">CARDIOVASCULAR HISTORY</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
            <p style={{ margin: '0.25rem 0' }}><strong>Smoker Status:</strong> {cardio.smoker_status || 'N/A'}</p>
            <p style={{ margin: '0.25rem 0' }}><strong>Hypertension:</strong> {cardio.hypertension ? 'Yes' : 'No'}</p>
            <p style={{ margin: '0.25rem 0' }}><strong>Diabetes:</strong> {cardio.diabetes ? 'Yes' : 'No'}</p>
            <p style={{ margin: '0.25rem 0' }}><strong>Family History Heart Disease:</strong> {cardio.family_history_heart_disease ? 'Yes' : 'No'}</p>
            <p style={{ margin: '0.25rem 0' }}><strong>Previous Heart Attack:</strong> {cardio.previous_heart_attack ? 'Yes' : 'No'}</p>
            <p style={{ margin: '0.25rem 0' }}><strong>Pacemaker Details:</strong> {cardio.pacemaker_details || 'N/A'}</p>
          </div>
        </div>
      )}

      {/* Clinical Encounters (Medical Records) */}
      {records.length > 0 && (
        <div className="no-break">
          <h2 className="section-title">CLINICAL ENCOUNTERS (MEDICAL RECORDS)</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: '15%' }}>DATE</th>
                <th style={{ width: '20%' }}>ATTENDING DOCTOR</th>
                <th style={{ width: '25%' }}>CHIEF COMPLAINT</th>
                <th style={{ width: '20%' }}>DIAGNOSIS</th>
                <th style={{ width: '20%' }}>PLAN / DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => {
                const planOrDetails = [
                  r.plan ? `Plan: ${r.plan}` : null,
                  r.treatment ? `Treatment: ${r.treatment}` : null,
                  r.subjective ? `Subjective: ${r.subjective}` : null,
                  r.objective ? `Objective: ${r.objective}` : null,
                  r.assessment ? `Assessment: ${r.assessment}` : null
                ].filter(Boolean).join('\n');

                return (
                  <tr key={r.record_id}>
                    <td>{r.record_date ? new Date(r.record_date).toLocaleDateString() : '-'}</td>
                    <td>{r.doctors ? `Dr. ${r.doctors.first_name} ${r.doctors.last_name}` : '-'}</td>
                    <td style={{ whiteSpace: 'pre-wrap' }}>{r.chief_complaint || '-'}</td>
                    <td style={{ whiteSpace: 'pre-wrap' }}>{r.diagnosis || '-'}</td>
                    <td style={{ whiteSpace: 'pre-wrap' }}>{planOrDetails || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Appointment History */}
      {appointments.length > 0 && (
        <div className="no-break">
          <h2 className="section-title">APPOINTMENT HISTORY</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>DATE & TIME</th>
                <th style={{ width: '25%' }}>DOCTOR</th>
                <th style={{ width: '38%' }}>PURPOSE</th>
                <th style={{ width: '15%' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(appt => (
                <tr key={appt.appointment_id}>
                  <td>{appt.appointment_date ? new Date(appt.appointment_date).toLocaleString() : '-'}</td>
                  <td>{appt.doctors ? `Dr. ${appt.doctors.first_name} ${appt.doctors.last_name}${appt.doctors.specialty ? ` (${appt.doctors.specialty})` : ''}` : 'Unassigned'}</td>
                  <td style={{ whiteSpace: 'pre-wrap' }}>{appt.purpose || '-'}</td>
                  <td style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{appt.status || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Vital Signs */}
      {vitals.length > 0 && (
        <div className="no-break">
          <h2 className="section-title">VITAL SIGNS LOG</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>BP</th>
                <th>PULSE</th>
                <th>SPO2</th>
                <th>TEMP</th>
                <th>WEIGHT</th>
              </tr>
            </thead>
            <tbody>
              {vitals.map(v => (
                <tr key={v.vital_id}>
                  <td>{new Date(v.record_date).toLocaleDateString()}</td>
                  <td>{v.bp || '-'}</td>
                  <td>{v.pr || '-'}</td>
                  <td>{v.spo2 || '-'}</td>
                  <td>{v.temperature_c || '-'}</td>
                  <td>{v.weight_kg || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lab CBC */}
      {cbc.length > 0 && (
        <div className="no-break">
          <h2 className="section-title">LAB FLOW SHEET - COMPLETE BLOOD COUNT</h2>
          <div className="print-table-wrapper" style={{ width: '100%' }}>
            <table className="print-table">
              <thead>
                <tr>
                  {activeCbcCols.map(col => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cbc.map(l => (
                  <tr key={l.cbc_id}>
                    {activeCbcCols.map(col => (
                      <td key={col.key}>
                        {col.render ? col.render(l) : (l[col.key] !== null && l[col.key] !== undefined && l[col.key] !== '' ? l[col.key] : '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lab Chemistry */}
      {chem.length > 0 && (
        <div className="no-break">
          <h2 className="section-title">BLOOD CHEMISTRY</h2>
          <div className="print-table-wrapper" style={{ width: '100%' }}>
            <table className="print-table">
              <thead>
                <tr>
                  {activeChemCols.map(col => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chem.map(l => (
                  <tr key={l.chem_id}>
                    {activeChemCols.map(col => (
                      <td key={col.key}>
                        {col.render ? col.render(l) : (l[col.key] !== null && l[col.key] !== undefined && l[col.key] !== '' ? l[col.key] : '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lab Serology */}
      {serology.length > 0 && (
        <div className="no-break">
          <h2 className="section-title">SEROLOGY</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>TSH</th>
              </tr>
            </thead>
            <tbody>
              {serology.map(l => (
                <tr key={l.serology_id}>
                  <td>{new Date(l.test_date).toLocaleDateString()}</td>
                  <td>{l.tsh || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Urinalysis */}
      {ua.length > 0 && (
        <div className="no-break">
          <h2 className="section-title">CLINICAL MICROSCOPY (URINALYSIS)</h2>
          {ua.map(l => (
            <div key={l.ua_id} style={{ marginBottom: '1rem', border: '1px solid #ddd', padding: '1rem' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>DATE: {new Date(l.test_date).toLocaleDateString()}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                <div>
                  <strong>PHYSICAL EXAM</strong><br/>
                  Color: {l.color || '-'}<br/>
                  Transparency: {l.transparency || '-'}
                </div>
                <div>
                  <strong>CHEMICAL EXAM</strong><br/>
                  Protein: {l.protein || '-'}<br/>
                  pH: {l.ph || '-'}<br/>
                  Sp. Gravity: {l.specific_gravity || '-'}<br/>
                  Glucose: {l.glucose || '-'}
                </div>
                <div>
                  <strong>MICROSCOPIC EXAM</strong><br/>
                  Pus Cells: {l.pus_cells || '-'}<br/>
                  RBC: {l.rbc_micro || '-'}<br/>
                  Epithelial Cells: {l.epithelial_cells || '-'}<br/>
                  Bacteria: {l.bacteria || '-'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Imaging */}
      {imaging.length > 0 && (
        <div className="no-break">
          <h2 className="section-title">IMAGING REPORTS</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: '15%' }}>DATE</th>
                <th style={{ width: '20%' }}>MODALITY</th>
                <th style={{ width: '20%' }}>LOCATION</th>
                <th style={{ width: '45%' }}>IMPRESSION</th>
              </tr>
            </thead>
            <tbody>
              {imaging.map(img => (
                <tr key={img.imaging_id}>
                  <td>{img.record_date ? new Date(img.record_date).toLocaleDateString() : '-'}</td>
                  <td>{img.modality || '-'}</td>
                  <td>{img.location || '-'}</td>
                  <td style={{ whiteSpace: 'pre-wrap' }}>{img.impression || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Documents */}
      {docs.length > 0 && (
        <div className="no-break">
          <h2 className="section-title">MEDICAL DOCUMENTS & CERTIFICATES</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: '20%' }}>ISSUE DATE</th>
                <th style={{ width: '25%' }}>TYPE</th>
                <th style={{ width: '30%' }}>PURPOSE</th>
                <th style={{ width: '25%' }}>DIAGNOSIS / IMPRESSION</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(doc => (
                <tr key={doc.document_id}>
                  <td>{doc.issue_date ? new Date(doc.issue_date).toLocaleDateString() : '-'}</td>
                  <td>{doc.document_type || '-'}</td>
                  <td>{doc.purpose || '-'}</td>
                  <td>{doc.diagnosis_impression || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
