import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Eye, Printer } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import TablePrintControls from './TablePrintControls';
import DocumentPrintModal from './DocumentPrintModal';

export default function PatientDocuments({ patientId }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Print Modal states
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedDocForPrint, setSelectedDocForPrint] = useState(null);
  const [defaultDocType, setDefaultDocType] = useState('Medical Certificate');

  const printColumns = [
    { label: 'Issue Date', render: (r) => new Date(r.issue_date).toLocaleDateString() },
    { label: 'Type', key: 'document_type' },
    { label: 'Purpose', key: 'purpose' },
    { label: 'Diagnosis', key: 'diagnosis_impression' }
  ];

  useEffect(() => {
    fetchRecords();
  }, [page, patientId]);

  const fetchRecords = async () => {
    setLoading(true);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('medical_documents')
      .select('*', { count: 'exact' })
      .eq('patient_id', patientId)
      .range(from, to)
      .order('issue_date', { ascending: false });
    
    const { data, count, error } = await query;
    if (error) {
      toast.error(`Failed to load Documents`);
    } else {
      setRecords(data);
      setTotalCount(count);
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

  const handleOpenPrint = (doc = null, type = 'Medical Certificate') => {
    setSelectedDocForPrint(doc);
    setDefaultDocType(type);
    setPrintModalOpen(true);
  };

  return (
    <div className="section-panel" style={{ margin: 0 }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)' }}>
          Documents Records
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <TablePrintControls records={records} title="Documents Records" columns={printColumns} dateField="issue_date" />


          <Link to={`/patients/${patientId}/lab/docs/add`} className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            <Plus size={16} /> Add Document
          </Link>
        </div>
      </div>

      <div className="table-responsive">
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
                  <td>{rec.purpose || '-'}</td>
                  <td><div style={{maxWidth:'150px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{rec.diagnosis_impression === 'Document auto-parsed via Gemini AI' ? 'Document auto-parsed' : (rec.diagnosis_impression || '-')}</div></td>
                  <td>
                    <div className="table-actions">
                      <button 
                        className="icon-btn print" 
                        title="Print Official Document"
                        onClick={() => handleOpenPrint(rec, rec.document_type?.toLowerCase().includes('referral') ? 'Referral Letter' : 'Medical Certificate')}
                        style={{ color: '#0d9488' }}
                      >
                        <Printer size={16} />
                      </button>
                      <Link to={`/patients/${patientId}/view/documents/${rec.document_id}`} className="icon-btn" style={{ color: 'var(--primary)' }} title="View Record">
                        <Eye size={16} />
                      </Link>
                      <Link to={`/patients/${patientId}/lab/docs/edit/${rec.document_id}`} className="icon-btn edit" title="Edit Record">
                        <Edit size={16} />
                      </Link>
                      <button className="icon-btn delete" title="Delete Record" onClick={() => { setSelectedId(rec.document_id); setModalOpen(true); }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {Math.ceil(totalCount / limit) > 1 && (
        <div className="pagination" style={{ marginTop: '1rem' }}>
          <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
          {Array.from({ length: Math.ceil(totalCount / limit) }, (_, i) => i + 1).map(num => (
            <button key={num} className={`page-btn ${page === num ? 'active' : ''}`} onClick={() => setPage(num)}>{num}</button>
          ))}
          <button className="page-btn" disabled={page === Math.ceil(totalCount / limit)} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      <ConfirmModal 
        isOpen={modalOpen} 
        onCancel={() => setModalOpen(false)}
        title={`Delete Document Record`}
        message={`Are you sure you want to delete this document record?`}
        confirmText="Delete"
        confirmType="danger"
        onConfirm={handleDelete}
      />

      <DocumentPrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        patientId={patientId}
        initialDocument={selectedDocForPrint}
        defaultDocType={defaultDocType}
      />
    </div>
  );
}
