import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Heart, CheckCircle2, XCircle, Eye } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import TablePrintControls from './TablePrintControls';

export default function PatientRecords({ patientId }) {
  const [records, setRecords] = useState([]);
  const [cardio, setCardio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCardio, setLoadingCardio] = useState(true);
  
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const printColumns = [
    { label: 'Date', render: (r) => new Date(r.record_date).toLocaleDateString() },
    { label: 'Attending Doctor', render: (r) => r.doctors ? `Dr. ${r.doctors.first_name} ${r.doctors.last_name}` : '-' },
    { label: 'Chief Complaint', key: 'chief_complaint' },
    { label: 'Diagnosis', key: 'diagnosis' }
  ];

  useEffect(() => {
    fetchRecords();
    fetchCardio();
  }, [page, patientId]);

  const fetchRecords = async () => {
    setLoading(true);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
      .from('medical_records')
      .select('*, doctors(first_name, last_name)', { count: 'exact' })
      .eq('patient_id', patientId)
      .range(from, to)
      .order('record_date', { ascending: false });

    if (error) {
      toast.error('Failed to load medical records');
    } else {
      setRecords(data);
      setTotalCount(count);
    }
    setLoading(false);
  };

  const fetchCardio = async () => {
    setLoadingCardio(true);
    const { data } = await supabase
      .from('patient_cardio_history')
      .select('*')
      .eq('patient_id', patientId)
      .maybeSingle();
    
    if (data) setCardio(data);
    setLoadingCardio(false);
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from('medical_records')
      .delete()
      .eq('record_id', selectedId);

    if (error) {
      toast.error('Failed to delete medical record');
    } else {
      toast.success('Record deleted');
      fetchRecords();
    }
    setModalOpen(false);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Cardio History Summary Card */}
      <div className="section-panel" style={{ margin: 0, backgroundColor: '#FDF8F6', border: '1px solid #F87171' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Heart size={18} fill="#EF4444" color="#EF4444" /> Cardiovascular Risk Profile
          </h3>
          <Link to={`/patients/${patientId}/cardio/edit`} className="btn btn-primary" style={{ backgroundColor: '#EF4444', borderColor: '#EF4444', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            <Edit size={16} /> Edit Profile
          </Link>
        </div>

        {loadingCardio ? (
          <div>Loading cardio profile...</div>
        ) : !cardio ? (
          <div style={{ color: '#7F1D1D' }}>No cardiovascular history profile found for this patient. Click "Edit Profile" to create one.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: cardio.hypertension ? '#991B1B' : '#047857', fontWeight: 500 }}>
              {cardio.hypertension ? <XCircle size={18} /> : <CheckCircle2 size={18} />} Hypertension: {cardio.hypertension ? 'Yes' : 'No'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: cardio.diabetes ? '#991B1B' : '#047857', fontWeight: 500 }}>
              {cardio.diabetes ? <XCircle size={18} /> : <CheckCircle2 size={18} />} Diabetes: {cardio.diabetes ? 'Yes' : 'No'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: cardio.previous_heart_attack ? '#991B1B' : '#047857', fontWeight: 500 }}>
              {cardio.previous_heart_attack ? <XCircle size={18} /> : <CheckCircle2 size={18} />} Prev Heart Attack: {cardio.previous_heart_attack ? 'Yes' : 'No'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: cardio.family_history_heart_disease ? '#991B1B' : '#047857', fontWeight: 500 }}>
              {cardio.family_history_heart_disease ? <XCircle size={18} /> : <CheckCircle2 size={18} />} Family History: {cardio.family_history_heart_disease ? 'Yes' : 'No'}
            </div>
            <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem', color: '#7F1D1D' }}>
              <strong>Smoker Status:</strong> {cardio.smoker_status || 'Unknown'} <br/>
              {cardio.pacemaker_details && <><strong>Pacemaker:</strong> {cardio.pacemaker_details}</>}
            </div>
          </div>
        )}
      </div>

      {/* Medical Records Table */}
      <div className="section-panel" style={{ margin: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)' }}>
            Clinical Encounters (Medical Records)
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <TablePrintControls records={records} title="Clinical Encounters" columns={printColumns} dateField="record_date" />
            <Link to={`/patients/${patientId}/records/add`} className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              <Plus size={16} /> New Encounter
            </Link>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Attending Doctor</th>
              <th>Chief Complaint</th>
              <th>Diagnosis</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-gray)' }}>No encounters recorded.</td></tr>
            ) : (
              records.map(record => (
                <tr key={record.record_id}>
                  <td style={{ fontWeight: 500 }}>
                    {new Date(record.record_date).toLocaleDateString()}
                  </td>
                  <td>{record.doctors ? `Dr. ${record.doctors.first_name} ${record.doctors.last_name}` : '-'}</td>
                  <td>
                    <div style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {record.chief_complaint || '-'}
                    </div>
                  </td>
                  <td>
                    <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {record.diagnosis || '-'}
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link to={`/patients/${patientId}/view/records/${record.record_id}`} className="icon-btn" style={{ color: 'var(--primary)' }}>
                        <Eye size={16} />
                      </Link>
                      <Link to={`/patients/${patientId}/records/edit/${record.record_id}`} className="icon-btn edit">
                        <Edit size={16} />
                      </Link>
                      <button className="icon-btn delete" onClick={() => { setSelectedId(record.record_id); setModalOpen(true); }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="pagination" style={{ marginTop: '1rem' }}>
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
              <button key={num} className={`page-btn ${page === num ? 'active' : ''}`} onClick={() => setPage(num)}>{num}</button>
            ))}
            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={modalOpen} 
        onCancel={() => setModalOpen(false)}
        title="Delete Encounter"
        message="Are you sure you want to delete this medical record? This action cannot be undone."
        confirmText="Delete"
        confirmType="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
