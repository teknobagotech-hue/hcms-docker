import React, { useRef, useEffect } from 'react';
import { useScan } from '../context/ScanContext';
import { Upload, FileText, CheckCircle, Save, Loader2, RefreshCw, UserCircle2, Pill, Activity, History, Scan, Clock, Sparkles, Plus, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import '../index.css';

export default function DocumentScanner() {
  const {
    file,
    isScanning,
    isSaving,
    scanComplete,
    scanProgress,
    scanStepText,
    estimatedTimeSec,
    formData,
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
  } = useScan();

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      startScan(selectedFile);
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', width: '100%', maxWidth: '520px', margin: '0 auto', padding: '1rem 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)' }}>
                    <Loader2 className="animate-spin" size={32} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-dark)', margin: 0 }}>Analyzing Document...</h3>
                  </div>

                  {/* Progress Bar Track */}
                  <div style={{ width: '100%', backgroundColor: '#e2e8f0', borderRadius: '9999px', height: '14px', overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
                    <div 
                      style={{ 
                        width: `${scanProgress}%`, 
                        height: '100%', 
                        background: 'linear-gradient(90deg, #0eba71, #10b981)', 
                        borderRadius: '9999px',
                        transition: 'width 0.3s ease-in-out'
                      }} 
                    />
                  </div>

                  {/* Step & Percentage */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '0.9rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: '600' }}>
                      <Sparkles size={16} /> {scanStepText}
                    </span>
                    <span style={{ fontWeight: '800', color: 'var(--text-dark)', fontSize: '1rem' }}>
                      {scanProgress}%
                    </span>
                  </div>

                  {/* Estimated Time Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#475569', background: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '9999px', border: '1px solid #e2e8f0' }}>
                    <Clock size={16} color="var(--primary)" />
                    <span>Estimated time: <strong style={{ color: 'var(--text-dark)' }}>{estimatedTimeSec > 0 ? `~${estimatedTimeSec} seconds remaining` : 'Finishing up...'}</strong></span>
                  </div>
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
                    resetScan();
                    if (fileInputRef.current) fileInputRef.current.value = '';
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
                    <div className="form-group">
                      <label className="form-label">Address</label>
                      <input type="text" className="form-control" name="address" value={formData.patient.address || ''} onChange={handlePatientChange} />
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
                  <div className="card-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="card-title" style={{ fontSize: '1.125rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={20} /> Latest Clinical Encounter / Medical Record
                    </h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                    <div className="form-group">
                      <label className="form-label">Chief Complaint (S-O)</label>
                      <textarea className="form-control" rows="3" name="chiefComplaint" value={formData.medicalRecord.chiefComplaint || ''} onChange={handleMedicalRecordChange}></textarea>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Diagnosis (A)</label>
                      <input type="text" className="form-control" name="diagnosis" value={formData.medicalRecord.diagnosis || ''} onChange={handleMedicalRecordChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Visit Date</label>
                      <input type="date" className="form-control" name="visitDate" value={formData.medicalRecord.visitDate || ''} onChange={handleMedicalRecordChange} />
                    </div>
                  </div>
                </div>

                <div className="glass-card">
                  <div className="card-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="card-title" style={{ fontSize: '1.125rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={20} /> Consultations Extracted ({formData.consultations.length})
                    </h3>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={addConsultation}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
                    >
                      <Plus size={16} /> Add Consultation
                    </button>
                  </div>
                  {formData.consultations.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                      No consultations extracted. Click "Add Consultation" to add one manually.
                    </div>
                  ) : (
                    <div className="table-container" style={{ overflowX: 'auto' }}>
                      <table className="premium-table">
                        <thead>
                          <tr>
                            <th style={{ width: '130px' }}>Date</th>
                            <th style={{ width: '35%' }}>Subjective & Objective (S-O)</th>
                            <th style={{ width: '35%' }}>Assessment / Diagnosis (A)</th>
                            <th>Plan / Recommendations (P)</th>
                            <th style={{ width: '60px' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.consultations.map((c, idx) => (
                            <tr key={idx}>
                              <td>
                                <input 
                                  type="text" 
                                  className="form-control" 
                                  value={c.visitDate || ''} 
                                  onChange={(e) => handleConsultationChange(idx, 'visitDate', e.target.value)} 
                                  placeholder="YYYY-MM-DD"
                                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.875rem' }}
                                />
                              </td>
                              <td>
                                <textarea 
                                  className="form-control" 
                                  rows="2" 
                                  value={c.chiefComplaint || ''} 
                                  onChange={(e) => handleConsultationChange(idx, 'chiefComplaint', e.target.value)} 
                                  placeholder="Subjective / Objective findings"
                                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.875rem', resize: 'vertical' }}
                                />
                              </td>
                              <td>
                                <textarea 
                                  className="form-control" 
                                  rows="2" 
                                  value={c.diagnosis || ''} 
                                  onChange={(e) => handleConsultationChange(idx, 'diagnosis', e.target.value)} 
                                  placeholder="Assessment / Diagnosis"
                                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.875rem', resize: 'vertical' }}
                                />
                              </td>
                              <td>
                                <textarea 
                                  className="form-control" 
                                  rows="2" 
                                  value={c.plan || ''} 
                                  onChange={(e) => handleConsultationChange(idx, 'plan', e.target.value)} 
                                  placeholder="Plan / Recommendations"
                                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.875rem', resize: 'vertical' }}
                                />
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button 
                                  type="button" 
                                  className="icon-btn delete" 
                                  onClick={() => removeConsultation(idx)}
                                  title="Remove Consultation"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
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
                            <th>Neut</th>
                            <th>Lym</th>
                            <th>Mon</th>
                            <th>Eos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.labs.cbc.map((l, idx) => (
                            <tr key={idx}>
                              <td>{l.date || '-'}</td>
                              <td>{l.wbc || '-'}</td>
                              <td>{l.rbc || '-'}</td>
                              <td>{l.hemoglobin || '-'}</td>
                              <td>{l.hematocrit || '-'}</td>
                              <td>{l.plateletCount || l.platelet_count || '-'}</td>
                              <td>{l.segmenters || '-'}</td>
                              <td>{l.neutrophils || '-'}</td>
                              <td>{l.lymphocytes || '-'}</td>
                              <td>{l.monocytes || '-'}</td>
                              <td>{l.eosinophils || '-'}</td>
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
                            <th>Phos</th>
                            <th>SGPT</th>
                            <th>SGOT</th>
                            <th>HbA1c</th>
                            <th>FBS</th>
                            <th>RBS</th>
                            <th>Chol</th>
                            <th>Trig</th>
                            <th>HDL</th>
                            <th>LDL</th>
                            <th>VLDL</th>
                            <th>Chol/HDL</th>
                            <th>D-Dimer</th>
                            <th>Procalcitonin</th>
                            <th>Albumin</th>
                            <th>Trop-I</th>
                            <th>Pro-BNP</th>
                            <th>PTPA Pat</th>
                            <th>PTPA Ctrl</th>
                            <th>% Act</th>
                            <th>INR</th>
                            <th>PTPA Ratio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.labs.chemistry.map((l, idx) => (
                            <tr key={idx}>
                              <td>{l.date || '-'}</td>
                              <td>{l.creatinine || '-'}</td>
                              <td>{l.sodium || '-'}</td>
                              <td>{l.potassium || '-'}</td>
                              <td>{l.chloride || '-'}</td>
                              <td>{l.ionizedCalcium || l.ionized_calcium || '-'}</td>
                              <td>{l.bun || '-'}</td>
                              <td>{l.uricAcid || l.uric_acid || '-'}</td>
                              <td>{l.phosphorous || '-'}</td>
                              <td>{l.sgptAlt || l.sgpt_alt || '-'}</td>
                              <td>{l.sgotAst || l.sgot_ast || '-'}</td>
                              <td>{l.hba1c || '-'}</td>
                              <td>{l.fbs || '-'}</td>
                              <td>{l.rbs || '-'}</td>
                              <td>{l.totalCholesterol || l.total_cholesterol || '-'}</td>
                              <td>{l.triglycerides || '-'}</td>
                              <td>{l.hdl || '-'}</td>
                              <td>{l.ldl || '-'}</td>
                              <td>{l.vldl || '-'}</td>
                              <td>{l.cholHdlRatio || l.chol_hdl_ratio || '-'}</td>
                              <td>{l.dDimer || l.d_dimer || '-'}</td>
                              <td>{l.procalcitonin || '-'}</td>
                              <td>{l.albumin || '-'}</td>
                              <td>{l.tropI || l.trop_i || '-'}</td>
                              <td>{l.proBnp || l.pro_bnp || '-'}</td>
                              <td>{l.ptpaPatient || l.ptpa_patient || '-'}</td>
                              <td>{l.ptpaControl || l.ptpa_control || '-'}</td>
                              <td>{l.percentActivity || l.percent_activity || '-'}</td>
                              <td>{l.inr || '-'}</td>
                              <td>{l.ptpaRatio || l.ptpa_ratio || '-'}</td>
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
                  if (!reports || reports.length === 0) return null;
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
                  <button className="btn btn-primary" onClick={() => handleSave(false)} disabled={isSaving} style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
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

      <ConfirmModal
        isOpen={dupModalOpen}
        title="Duplicate Entry Detected"
        message={dupMessage}
        confirmText="Save Anyway"
        confirmType="warning"
        onConfirm={() => {
          setDupModalOpen(false);
          handleSave(true);
        }}
        onCancel={() => setDupModalOpen(false)}
      />
    </div>
  );
}
