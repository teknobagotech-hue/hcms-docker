import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../index.css';

export default function PatientPrint() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    patient: null,
    vitals: [],
    cbc: [],
    chem: [],
    serology: [],
    ua: [],
    imaging: [],
    docs: []
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
      docsRes
    ] = await Promise.all([
      supabase.from('patients').select('*').eq('patient_id', id).single(),
      supabase.from('vital_signs').select('*').eq('patient_id', id).order('record_date', { ascending: false }),
      supabase.from('lab_cbc').select('*').eq('patient_id', id).order('test_date', { ascending: false }),
      supabase.from('lab_chemistry').select('*').eq('patient_id', id).order('test_date', { ascending: false }),
      supabase.from('lab_serology').select('*').eq('patient_id', id).order('test_date', { ascending: false }),
      supabase.from('lab_urinalysis').select('*').eq('patient_id', id).order('test_date', { ascending: false }),
      supabase.from('imaging_reports').select('*').eq('patient_id', id).order('record_date', { ascending: false }),
      supabase.from('medical_documents').select('*').eq('patient_id', id).order('issue_date', { ascending: false })
    ]);

    setData({
      patient: patientRes.data,
      vitals: vitalsRes.data || [],
      cbc: cbcRes.data || [],
      chem: chemRes.data || [],
      serology: serologyRes.data || [],
      ua: uaRes.data || [],
      imaging: imagingRes.data || [],
      docs: docsRes.data || []
    });

    setLoading(false);
    
    // Once data is loaded and rendered, trigger print
    setTimeout(() => {
      window.print();
    }, 1000);
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Preparing document...</div>;
  if (!data.patient) return <div style={{ padding: '2rem', textAlign: 'center' }}>Patient not found.</div>;

  const { patient, vitals, cbc, chem, serology, ua, imaging, docs } = data;

  const calculateAge = (dob) => {
    if (!dob) return '';
    const diff_ms = Date.now() - new Date(dob).getTime();
    const age_dt = new Date(diff_ms);
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  };

  return (
    <div className="print-container" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <style>
        {`
          @media print {
            body { background: white; margin: 0; padding: 0; }
            .print-container { padding: 0 !important; width: 100% !important; max-width: 100% !important; }
            @page { margin: 1.5cm; }
            .page-break { page-break-before: always; }
            .no-break { page-break-inside: avoid; }
            button { display: none !important; }
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
            <p style={{ margin: '0.35rem 0' }}><strong>Allergies:</strong> {patient.allergies || 'None'}</p>
            <p style={{ margin: '0.35rem 0' }}><strong>Alcohol Intake:</strong> {patient.alcoholic_intake || 'N/A'}</p>
            <p style={{ margin: '0.35rem 0' }}><strong>Smoking History:</strong> {patient.smoking_history || 'N/A'}</p>
          </div>

          {/* OBGYN & Emergency */}
          <div>
            {patient.gender === 'Female' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid #ddd', paddingBottom: '0.25rem', marginBottom: '0.75rem' }}>OBGYN History</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <p style={{ margin: '0.35rem 0' }}><strong>Gravida:</strong> {patient.gravida || '-'}</p>
                  <p style={{ margin: '0.35rem 0' }}><strong>Para:</strong> {patient.para || '-'}</p>
                  <p style={{ margin: '0.35rem 0' }}><strong>LMP:</strong> {patient.lmp || '-'}</p>
                  <p style={{ margin: '0.35rem 0' }}><strong>Menopause Age:</strong> {patient.menopause_age || '-'}</p>
                </div>
              </div>
            )}

            <div>
              <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid #ddd', paddingBottom: '0.25rem', marginBottom: '0.75rem' }}>Emergency Contact</h3>
              <p style={{ margin: '0.35rem 0' }}><strong>Name:</strong> {patient.emergency_contact_name || 'N/A'}</p>
              <p style={{ margin: '0.35rem 0' }}><strong>Relationship:</strong> {patient.emergency_contact_relationship || 'N/A'}</p>
              <p style={{ margin: '0.35rem 0' }}><strong>Phone:</strong> {patient.emergency_contact_phone || 'N/A'}</p>
              {patient.emergency_contact_address && <p style={{ margin: '0.35rem 0' }}><strong>Address:</strong> {patient.emergency_contact_address}</p>}
            </div>
          </div>
          
          {/* Guardian Information */}
          <div>
            <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid #ddd', paddingBottom: '0.25rem', marginBottom: '0.75rem' }}>Guardian Information (If minor)</h3>
            {patient.guardian_name ? (
              <>
                <p style={{ margin: '0.35rem 0' }}><strong>Name:</strong> {patient.guardian_name}</p>
                <p style={{ margin: '0.35rem 0' }}><strong>Relationship:</strong> {patient.guardian_relationship || 'N/A'}</p>
                <p style={{ margin: '0.35rem 0' }}><strong>Phone:</strong> {patient.guardian_phone || 'N/A'}</p>
                {patient.guardian_address && <p style={{ margin: '0.35rem 0' }}><strong>Address:</strong> {patient.guardian_address}</p>}
              </>
            ) : (
              <p style={{ margin: '0.35rem 0', color: '#666' }}>No guardian specified</p>
            )}
          </div>
        </div>
      </div>

      {/* Vitals */}
      {vitals.length > 0 && (
        <div className="no-break">
          <h2 className="section-title">VITAL SIGNS</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>WEIGHT</th>
                <th>BP</th>
                <th>SpO2</th>
                <th>PR</th>
                <th>Temp</th>
              </tr>
            </thead>
            <tbody>
              {vitals.map(v => (
                <tr key={v.vital_id}>
                  <td>{new Date(v.record_date).toLocaleDateString()}</td>
                  <td>{v.weight_kg ? `${v.weight_kg} kg` : '-'}</td>
                  <td>{v.bp || '-'}</td>
                  <td>{v.spo2 ? `${v.spo2}%` : '-'}</td>
                  <td>{v.pr || '-'}</td>
                  <td>{v.temperature_c ? `${v.temperature_c} C` : '-'}</td>
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
          <table className="print-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>WBC</th>
                <th>RBC</th>
                <th>Hgb</th>
                <th>Hct</th>
                <th>Plt</th>
                <th>Neutrophils</th>
                <th>Lymphs</th>
                <th>Mono</th>
                <th>Eos</th>
              </tr>
            </thead>
            <tbody>
              {cbc.map(l => (
                <tr key={l.cbc_id}>
                  <td>{new Date(l.test_date).toLocaleDateString()}</td>
                  <td>{l.wbc || '-'}</td>
                  <td>{l.rbc || '-'}</td>
                  <td>{l.hemoglobin || '-'}</td>
                  <td>{l.hematocrit || '-'}</td>
                  <td>{l.platelet_count || '-'}</td>
                  <td>{l.neutrophils || '-'}</td>
                  <td>{l.lymphocytes || '-'}</td>
                  <td>{l.monocytes || '-'}</td>
                  <td>{l.eosinophils || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lab Chemistry */}
      {chem.length > 0 && (
        <div className="no-break">
          <h2 className="section-title">BLOOD CHEMISTRY</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="print-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>Creatinine</th>
                  <th>Na</th>
                  <th>K</th>
                  <th>Cl</th>
                  <th>FBS</th>
                  <th>HbA1c</th>
                  <th>Chol</th>
                  <th>Trig</th>
                  <th>HDL</th>
                  <th>LDL</th>
                  <th>AST</th>
                  <th>ALT</th>
                  <th>Uric Acid</th>
                </tr>
              </thead>
              <tbody>
                {chem.map(l => (
                  <tr key={l.chem_id}>
                    <td>{new Date(l.test_date).toLocaleDateString()}</td>
                    <td>{l.creatinine || '-'}</td>
                    <td>{l.sodium || '-'}</td>
                    <td>{l.potassium || '-'}</td>
                    <td>{l.chloride || '-'}</td>
                    <td>{l.fbs || '-'}</td>
                    <td>{l.hba1c || '-'}</td>
                    <td>{l.total_cholesterol || '-'}</td>
                    <td>{l.triglycerides || '-'}</td>
                    <td>{l.hdl || '-'}</td>
                    <td>{l.ldl || '-'}</td>
                    <td>{l.sgot_ast || '-'}</td>
                    <td>{l.sgpt_alt || '-'}</td>
                    <td>{l.uric_acid || '-'}</td>
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
                <th style={{ width: '25%' }}>MODALITY & LOCATION</th>
                <th style={{ width: '60%' }}>IMPRESSION</th>
              </tr>
            </thead>
            <tbody>
              {imaging.map(img => (
                <tr key={img.imaging_id}>
                  <td>{img.record_date ? new Date(img.record_date).toLocaleDateString() : '-'}</td>
                  <td>
                    <strong>{img.modality || '-'}</strong>
                    {img.location && <div>{img.location}</div>}
                  </td>
                  <td style={{ whiteSpace: 'pre-wrap' }}>{img.impression || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Medical Documents */}
      {docs.length > 0 && (
        <div className="no-break">
          <h2 className="section-title">MEDICAL DOCUMENTS (CERTIFICATES & REFERRALS)</h2>
          {docs.map(doc => (
            <div key={doc.document_id} style={{ marginBottom: '1rem', border: '1px solid #ddd', padding: '1rem' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>{doc.document_type === 'AI Scanner Result' ? 'Scanner Result' : doc.document_type} - {new Date(doc.issue_date).toLocaleDateString()}</p>
              {doc.referred_to_doctor && <p><strong>Referred To:</strong> {doc.referred_to_doctor}</p>}
              {doc.purpose && <p><strong>Purpose:</strong> {doc.purpose}</p>}
              <p><strong>Diagnosis/Impression:</strong><br/>{doc.diagnosis_impression === 'Document auto-parsed via Gemini AI' ? 'Document auto-parsed' : (doc.diagnosis_impression || '-')}</p>
              <p><strong>Remarks/Recommendations:</strong><br/>{doc.remarks_recommendations || '-'}</p>
            </div>
          ))}
        </div>
      )}
      
      <div style={{ textAlign: 'center', marginTop: '2rem' }} className="no-print">
        <button 
          onClick={() => window.print()}
          className="btn btn-primary"
          style={{ padding: '0.75rem 2rem', fontSize: '1rem', cursor: 'pointer' }}
        >
          Print Document
        </button>
      </div>
    </div>
  );
}
