import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Printer, X, FileText, Send } from 'lucide-react';
import { printMedicalCertificate, printReferralLetter, getAge } from '../utils/printDocumentTemplates';
import toast from 'react-hot-toast';

export default function DocumentPrintModal({ isOpen, onClose, patientId, initialDocument = null, defaultDocType = 'Medical Certificate' }) {
  const [docType, setDocType] = useState(defaultDocType);
  const [patient, setPatient] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(false);

  // Form states for customization
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientAddress, setPatientAddress] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [consultDate, setConsultDate] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [remarks, setRemarks] = useState('');

  // Medical Cert specific
  const [advisedRest, setAdvisedRest] = useState(false);
  const [restDays, setRestDays] = useState('');
  const [fitEmployment, setFitEmployment] = useState(false);
  const [avoidStrenuous, setAvoidStrenuous] = useState(false);
  const [strenuousText, setStrenuousText] = useState('');
  const [financialAssistance, setFinancialAssistance] = useState(false);

  // Referral Letter specific
  const [referredToDoctor, setReferredToDoctor] = useState('');
  const [purpose, setPurpose] = useState('');
  const [clinicOrDate, setClinicOrDate] = useState('');
  const [complaints, setComplaints] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialDocument?.document_type) {
        if (initialDocument.document_type.toLowerCase().includes('referral')) {
          setDocType('Referral Letter');
        } else {
          setDocType('Medical Certificate');
        }
      } else if (defaultDocType) {
        setDocType(defaultDocType);
      }

      fetchPatientData();
    }
  }, [isOpen, patientId, initialDocument, defaultDocType]);

  const fetchPatientData = async () => {
    setLoadingPatient(true);
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('patient_id', patientId)
      .single();

    if (data) {
      setPatient(data);
      const fullName = `${data.first_name || ''} ${data.middle_name || ''} ${data.last_name || ''}`.replace(/\s+/g, ' ').trim();
      setPatientName(fullName);
      setPatientAge(data.date_of_birth ? getAge(data.date_of_birth) : '');
      setPatientAddress(data.address || '');

      const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
      const todayLong = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      setIssueDate(initialDocument?.issue_date ? new Date(initialDocument.issue_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : today);
      setConsultDate(initialDocument?.issue_date ? new Date(initialDocument.issue_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : todayLong);

      setDiagnosis(initialDocument?.diagnosis_impression || '');
      setRemarks(initialDocument?.remarks_recommendations || '');
      setReferredToDoctor(initialDocument?.referred_to_doctor || '');
      setPurpose(initialDocument?.purpose || '');
      setClinicOrDate('my clinic');
      setComplaints(initialDocument?.purpose || '');
    }
    setLoadingPatient(false);
  };

  if (!isOpen) return null;

  const handlePrint = () => {
    if (docType === 'Medical Certificate') {
      printMedicalCertificate({
        patient,
        document: initialDocument,
        customFields: {
          patientName,
          patientAge,
          patientAddress,
          issueDate,
          consultDate,
          diagnosis,
          remarks,
          advisedRest,
          restDays,
          fitEmployment,
          avoidStrenuous,
          strenuousText,
          financialAssistance
        }
      });
    } else {
      printReferralLetter({
        patient,
        document: initialDocument,
        customFields: {
          patientName,
          issueDate,
          referredToDoctor,
          purpose,
          clinicOrDate,
          complaints,
          diagnosis
        }
      });
    }
    toast.success(`Opening ${docType} print view...`);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '1rem',
        width: '100%',
        maxWidth: '650px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
          borderTopLeftRadius: '1rem',
          borderTopRightRadius: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ backgroundColor: '#0d9488', color: '#fff', padding: '0.5rem', borderRadius: '0.5rem' }}>
              <Printer size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                Print Official Document
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                Generate official Medical Certificate or Referral Letter
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Document Type Selector Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#f1f5f9', padding: '0.35rem', borderRadius: '0.5rem' }}>
            <button
              onClick={() => setDocType('Medical Certificate')}
              style={{
                flex: 1,
                padding: '0.6rem',
                borderRadius: '0.375rem',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundColor: docType === 'Medical Certificate' ? '#ffffff' : 'transparent',
                color: docType === 'Medical Certificate' ? '#0d9488' : '#64748b',
                boxShadow: docType === 'Medical Certificate' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <FileText size={16} /> Medical Certificate
            </button>
            <button
              onClick={() => setDocType('Referral Letter')}
              style={{
                flex: 1,
                padding: '0.6rem',
                borderRadius: '0.375rem',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundColor: docType === 'Referral Letter' ? '#ffffff' : 'transparent',
                color: docType === 'Referral Letter' ? '#0d9488' : '#64748b',
                boxShadow: docType === 'Referral Letter' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Send size={16} /> Referral Letter
            </button>
          </div>

          {/* Form Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Patient Name</label>
              <input type="text" className="form-input" style={{ paddingLeft: '0.75rem' }} value={patientName} onChange={e => setPatientName(e.target.value)} />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Issue Date</label>
              <input type="text" className="form-input" style={{ paddingLeft: '0.75rem' }} value={issueDate} onChange={e => setIssueDate(e.target.value)} />
            </div>

            {docType === 'Medical Certificate' && (
              <>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Age</label>
                  <input type="text" className="form-input" style={{ paddingLeft: '0.75rem' }} value={patientAge} onChange={e => setPatientAge(e.target.value)} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Consultation Date</label>
                  <input type="text" className="form-input" style={{ paddingLeft: '0.75rem' }} value={consultDate} onChange={e => setConsultDate(e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1', margin: 0 }}>
                  <label className="form-label">Residing Address</label>
                  <input type="text" className="form-input" style={{ paddingLeft: '0.75rem' }} value={patientAddress} onChange={e => setPatientAddress(e.target.value)} />
                </div>
              </>
            )}

            {docType === 'Referral Letter' && (
              <>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Referred To (Dr. / Hospital)</label>
                  <input type="text" className="form-input" style={{ paddingLeft: '0.75rem' }} placeholder="Dr. Smith / Heart Center" value={referredToDoctor} onChange={e => setReferredToDoctor(e.target.value)} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Clinic / Date Came In</label>
                  <input type="text" className="form-input" style={{ paddingLeft: '0.75rem' }} value={clinicOrDate} onChange={e => setClinicOrDate(e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1', margin: 0 }}>
                  <label className="form-label">Purpose of Referral</label>
                  <input type="text" className="form-input" style={{ paddingLeft: '0.75rem' }} placeholder="Further evaluation & management" value={purpose} onChange={e => setPurpose(e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1', margin: 0 }}>
                  <label className="form-label">Symptoms / Reason for Visit</label>
                  <input type="text" className="form-input" style={{ paddingLeft: '0.75rem' }} placeholder="Chest pain, shortness of breath" value={complaints} onChange={e => setComplaints(e.target.value)} />
                </div>
              </>
            )}

            <div className="form-group" style={{ gridColumn: '1 / -1', margin: 0 }}>
              <label className="form-label">Impression / Diagnosis</label>
              <textarea className="form-input" style={{ paddingLeft: '0.75rem', minHeight: '60px' }} value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
            </div>

            {docType === 'Medical Certificate' && (
              <>
                <div className="form-group" style={{ gridColumn: '1 / -1', margin: 0 }}>
                  <label className="form-label">Remarks / Recommendations</label>
                  <textarea className="form-input" style={{ paddingLeft: '0.75rem', minHeight: '60px' }} value={remarks} onChange={e => setRemarks(e.target.value)} />
                </div>

                {/* Medical Cert Options Checklist */}
                <div style={{ gridColumn: '1 / -1', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.75rem' }}>Certificate Recommendations Checklist:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={advisedRest} onChange={e => setAdvisedRest(e.target.checked)} />
                      <span>Advised rest for </span>
                      <input type="text" style={{ width: '60px', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} value={restDays} onChange={e => setRestDays(e.target.value)} placeholder="days" />
                      <span> days.</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={fitEmployment} onChange={e => setFitEmployment(e.target.checked)} />
                      <span>Fit for employment.</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={avoidStrenuous} onChange={e => setAvoidStrenuous(e.target.checked)} />
                      <span>Avoid strenuous activities such as:</span>
                      <input type="text" style={{ flex: 1, padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} value={strenuousText} onChange={e => setStrenuousText(e.target.value)} placeholder="e.g. heavy lifting" />
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={financialAssistance} onChange={e => setFinancialAssistance(e.target.checked)} />
                      <span>For Financial/ Medical assistance.</span>
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justify: 'flex-end',
          gap: '0.75rem',
          backgroundColor: '#f8fafc',
          borderBottomLeftRadius: '1rem',
          borderBottomRightRadius: '1rem'
        }}>
          <button onClick={onClose} className="btn btn-cancel">Cancel</button>
          <button onClick={handlePrint} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0d9488' }}>
            <Printer size={16} /> Print {docType}
          </button>
        </div>
      </div>
    </div>
  );
}
