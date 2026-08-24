import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, FileText, Eye } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import TablePrintControls from './TablePrintControls';

export default function PatientDocuments({ patientId }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const printColumns = [
    { label: 'Issue Date', render: (r) => new Date(r.issue_date).toLocaleDateString() },
    { label: 'Type', key: 'document_type' },
    { label: 'Purpose', key: 'purpose' },
    { label: 'Diagnosis', key: 'diagnosis_impression' }
  ];

  useEffect(() => {
    fetchRecords();
  }, [patientId]);

  const fetchRecords = async () => {
    setLoading(true);
    let query = supabase.from('medical_documents').select('*').eq('patient_id', patientId).order('issue_date', { ascending: false }).limit(20);
    
    const { data, error } = await query;
    if (error) {
      toast.error(`Failed to load Documents`);
    } else {
      setRecords(data);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('medical_documents').delete().eq('document_id', selectedId);
    if (error) toast.error('Failed to delete record');
    else {
      toast.success('Record deleted');
      fetchRecords();
    }
    setModalOpen(false);
  };

  return (
    <div className="section-panel" style={{ margin: 0 }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)' }}>
          Documents Records
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <TablePrintControls records={records} title="Documents Records" columns={printColumns} dateField="issue_date" />
          <Link to={`/patients/${patientId}/lab/docs/add`} className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            <Plus size={16} /> Add Document
          </Link>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Issue Date</th>
            <th>Type</th>
            <th>Purpose</th>
            <th>Diagnosis</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
          ) : records.length === 0 ? (
            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-gray)' }}>No documents records found.</td></tr>
          ) : (
            records.map(rec => (
              <tr key={rec.document_id}>
                <td style={{fontWeight:500}}>{new Date(rec.issue_date).toLocaleDateString()}</td>
                <td>{rec.document_type === 'AI Scanner Result' ? 'Scanner Result' : rec.document_type}</td>
                <td>{rec.purpose}</td>
                <td><div style={{maxWidth:'150px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{rec.diagnosis_impression === 'Document auto-parsed via Gemini AI' ? 'Document auto-parsed' : rec.diagnosis_impression}</div></td>
                <td>
                  <div className="table-actions">
                    <Link to={`/patients/${patientId}/view/documents/${rec.document_id}`} className="icon-btn" style={{ color: 'var(--primary)' }}>
                      <Eye size={16} />
                    </Link>
                    <Link to={`/patients/${patientId}/lab/docs/edit/${rec.document_id}`} className="icon-btn edit">
                      <Edit size={16} />
                    </Link>
                    <button className="icon-btn delete" onClick={() => { setSelectedId(rec.document_id); setModalOpen(true); }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <ConfirmModal 
        isOpen={modalOpen} 
        onCancel={() => setModalOpen(false)}
        title={`Delete Document Record`}
        message={`Are you sure you want to delete this document record?`}
        confirmText="Delete"
        confirmType="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
