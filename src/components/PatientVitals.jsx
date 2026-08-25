import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import TablePrintControls from './TablePrintControls';

export default function PatientVitals({ patientId }) {
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');

  const printColumns = [
    { label: 'Date', render: (r) => new Date(r.record_date).toLocaleDateString() },
    { label: 'BP (mmHg)', key: 'bp' },
    { label: 'Pulse (bpm)', key: 'pr' },
    { label: 'SpO2 (%)', key: 'spo2' },
    { label: 'Temp (°C)', key: 'temperature_c' },
    { label: 'Weight (kg)', key: 'weight_kg' }
  ];

  useEffect(() => {
    fetchVitals();
  }, [page, patientId]);

  const fetchVitals = async () => {
    setLoading(true);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
      .from('vital_signs')
      .select('*', { count: 'exact' })
      .eq('patient_id', patientId)
      .range(from, to)
      .order('record_date', { ascending: false });

    if (error) {
      toast.error('Failed to load vital signs');
    } else {
      setVitals(data);
      setTotalCount(count);
    }
    setLoading(false);
  };

  const displayedVitals = vitals.filter(record => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    return Object.values(record).some(val => val !== null && val !== undefined && String(val).toLowerCase().includes(q));
  });

  const handleDelete = async () => {
    const { error } = await supabase
      .from('vital_signs')
      .delete()
      .eq('vital_id', selectedId);

    if (error) {
      toast.error('Failed to delete vital signs record');
    } else {
      toast.success('Record deleted');
      fetchVitals();
    }
    setModalOpen(false);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="section-panel" style={{ margin: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)' }}>
          Vital Signs Log
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <TablePrintControls 
            records={vitals} 
            title="Vital Signs Log" 
            columns={printColumns} 
            dateField="record_date" 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
          <Link to={`/patients/${patientId}/vitals/add`} className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            <Plus size={16} /> Record Vitals
          </Link>
        </div>
      </div>

      <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: '#ffffff' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>BP (mmHg)</th>
              <th>Pulse (bpm)</th>
              <th>SpO2 (%)</th>
              <th>Temp (°C)</th>
              <th>Weight (kg)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
            ) : displayedVitals.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-gray)' }}>{searchTerm ? `No records matching "${searchTerm}"` : 'No vital signs recorded.'}</td></tr>
            ) : (
              displayedVitals.map(record => (
                <tr key={record.vital_id}>
                  <td style={{ fontWeight: 500 }}>
                    {new Date(record.record_date).toLocaleDateString()}
                  </td>
                  <td>{record.bp || '-'}</td>
                  <td>{record.pr || '-'}</td>
                  <td>{record.spo2 || '-'}</td>
                  <td>{record.temperature_c || '-'}</td>
                  <td>{record.weight_kg || '-'}</td>
                  <td>
                    <div className="table-actions">
                      <Link to={`/patients/${patientId}/view/vitals/${record.vital_id}`} className="icon-btn" style={{ color: 'var(--primary)' }}>
                        <Eye size={16} />
                      </Link>
                      <Link to={`/patients/${patientId}/vitals/edit/${record.vital_id}`} className="icon-btn edit">
                        <Edit size={16} />
                      </Link>
                      <button className="icon-btn delete" onClick={() => { setSelectedId(record.vital_id); setModalOpen(true); }}>
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

      {totalPages > 1 && (
        <div className="pagination" style={{ marginTop: '1rem' }}>
          <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
            <button key={num} className={`page-btn ${page === num ? 'active' : ''}`} onClick={() => setPage(num)}>{num}</button>
          ))}
          <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      <ConfirmModal 
        isOpen={modalOpen} 
        onCancel={() => setModalOpen(false)}
        title="Delete Record"
        message="Are you sure you want to delete this vital signs record?"
        confirmText="Delete"
        confirmType="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
