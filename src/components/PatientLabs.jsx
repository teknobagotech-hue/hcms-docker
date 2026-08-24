import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Eye, FileText, FlaskConical, Stethoscope, Image as ImageIcon } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import TablePrintControls from './TablePrintControls';

export default function PatientLabs({ patientId }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 5;

  const categories = [
    { id: 'cbc', label: 'CBC', table: 'lab_cbc', idField: 'cbc_id', dateField: 'test_date', icon: <FlaskConical size={16} /> },
    { id: 'chem', label: 'Chemistry', table: 'lab_chemistry', idField: 'chem_id', dateField: 'test_date', icon: <FlaskConical size={16} /> },
    { id: 'serology', label: 'Serology', table: 'lab_serology', idField: 'serology_id', dateField: 'test_date', icon: <FlaskConical size={16} /> },
    { id: 'ua', label: 'Urinalysis', table: 'lab_urinalysis', idField: 'ua_id', dateField: 'test_date', icon: <FlaskConical size={16} /> },
    { id: 'imaging', label: 'Imaging', table: 'imaging_reports', idField: 'imaging_id', dateField: 'record_date', icon: <ImageIcon size={16} /> }
  ];

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialCat = searchParams.get('labCat') || 'cbc';
  const [activeCategory, setActiveCategory] = useState(initialCat);
  
  useEffect(() => {
    const cat = new URLSearchParams(location.search).get('labCat');
    if (cat && categories.some(c => c.id === cat)) {
      setActiveCategory(cat);
    }
  }, [location.search]);

  const currentCat = categories.find(c => c.id === activeCategory);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, patientId]);

  useEffect(() => {
    fetchRecords();
  }, [activeCategory, patientId, currentPage]);

  const fetchRecords = async () => {
    setLoading(true);
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    let query = supabase
      .from(currentCat.table)
      .select('*', { count: 'exact' })
      .eq('patient_id', patientId)
      .order(currentCat.dateField, { ascending: false })
      .range(from, to);
    
    const { data, error, count } = await query;
    if (error) {
      toast.error(`Failed to load ${currentCat.label}`);
    } else {
      setRecords(data);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    const { error } = await supabase.from(currentCat.table).delete().eq(currentCat.idField, selectedId);
    if (error) toast.error('Failed to delete record');
    else {
      toast.success('Record deleted');
      fetchRecords();
    }
    setModalOpen(false);
  };

  const renderTableHeaders = () => {
    switch (activeCategory) {
      case 'cbc': return <tr><th>Date</th><th>WBC</th><th>RBC</th><th>HGB</th><th>HCT</th><th>PLT</th><th>Actions</th></tr>;
      case 'chem': return <tr><th>Date</th><th>Creatinine</th><th>BUN</th><th>SGPT</th><th>SGOT</th><th>FBS</th><th>Actions</th></tr>;
      case 'serology': return <tr><th>Date</th><th>TSH</th><th>Actions</th></tr>;
      case 'ua': return <tr><th>Date</th><th>Color</th><th>Trans.</th><th>pH</th><th>Sp.Grav</th><th>Protein</th><th>Actions</th></tr>;
      case 'imaging': return <tr><th>Date</th><th>Modality</th><th>Location</th><th>Impression</th><th>Actions</th></tr>;
      default: return null;
    }
  };

  const getPrintColumns = () => {
    switch (activeCategory) {
      case 'cbc': return [{label: 'Date', key: 'test_date'}, {label: 'WBC', key: 'wbc'}, {label: 'RBC', key: 'rbc'}, {label: 'HGB', key: 'hemoglobin'}, {label: 'HCT', key: 'hematocrit'}, {label: 'PLT', key: 'platelet_count'}];
      case 'chem': return [{label: 'Date', key: 'test_date'}, {label: 'Creatinine', key: 'creatinine'}, {label: 'BUN', key: 'bun'}, {label: 'SGPT', key: 'sgpt_alt'}, {label: 'SGOT', key: 'sgot_ast'}, {label: 'FBS', key: 'fbs'}];
      case 'serology': return [{label: 'Date', key: 'test_date'}, {label: 'TSH', key: 'tsh'}];
      case 'ua': return [{label: 'Date', key: 'test_date'}, {label: 'Color', key: 'color'}, {label: 'Trans.', key: 'transparency'}, {label: 'pH', key: 'ph'}, {label: 'Sp.Grav', key: 'specific_gravity'}, {label: 'Protein', key: 'protein'}];
      case 'imaging': return [{label: 'Date', key: 'record_date'}, {label: 'Modality', key: 'modality'}, {label: 'Location', key: 'location'}, {label: 'Impression', key: 'impression'}];
      default: return [];
    }
  };

  const renderRowData = (rec) => {
    switch (activeCategory) {
      case 'cbc': return <><td style={{fontWeight:500}}>{rec.test_date}</td><td>{rec.wbc||'-'}</td><td>{rec.rbc||'-'}</td><td>{rec.hemoglobin||'-'}</td><td>{rec.hematocrit||'-'}</td><td>{rec.platelet_count||'-'}</td></>;
      case 'chem': return <><td style={{fontWeight:500}}>{rec.test_date}</td><td>{rec.creatinine||'-'}</td><td>{rec.bun||'-'}</td><td>{rec.sgpt_alt||'-'}</td><td>{rec.sgot_ast||'-'}</td><td>{rec.fbs||'-'}</td></>;
      case 'serology': return <><td style={{fontWeight:500}}>{rec.test_date}</td><td>{rec.tsh||'-'}</td></>;
      case 'ua': return <><td style={{fontWeight:500}}>{rec.test_date}</td><td>{rec.color||'-'}</td><td>{rec.transparency||'-'}</td><td>{rec.ph||'-'}</td><td>{rec.specific_gravity||'-'}</td><td>{rec.protein||'-'}</td></>;
      case 'imaging': return <><td style={{fontWeight:500}}>{rec.record_date}</td><td>{rec.modality}</td><td>{rec.location}</td><td><div style={{maxWidth:'200px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{rec.impression}</div></td></>;
      default: return null;
    }
  };

  return (
    <div className="section-panel" style={{ margin: 0 }}>
      
      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {categories.map(cat => (
          <button 
            key={cat.id} 
            onClick={() => setActiveCategory(cat.id)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              padding: '0.5rem 1rem', borderRadius: '2rem', border: 'none', cursor: 'pointer',
              backgroundColor: activeCategory === cat.id ? 'var(--primary)' : '#F1F5F9',
              color: activeCategory === cat.id ? '#fff' : 'var(--text-gray)',
              fontWeight: 500, fontSize: '0.875rem', transition: 'all 0.2s ease'
            }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)' }}>
          {currentCat.label} Records
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <TablePrintControls records={records} title={`${currentCat.label} Records`} columns={getPrintColumns()} dateField={currentCat.dateField} />
          <Link to={`/patients/${patientId}/lab/${currentCat.id}/add`} className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            <Plus size={16} /> Add {currentCat.label}
          </Link>
        </div>
      </div>

      <table className="data-table">
        <thead>
          {renderTableHeaders()}
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
          ) : records.length === 0 ? (
            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-gray)' }}>No {currentCat.label} records found.</td></tr>
          ) : (
            records.map(rec => (
              <tr key={rec[currentCat.idField]}>
                {renderRowData(rec)}
                <td>
                  <div className="table-actions">
                    <Link to={`/patients/${patientId}/view/${currentCat.id}/${rec[currentCat.idField]}`} className="icon-btn" style={{ color: 'var(--primary)' }}>
                      <Eye size={16} />
                    </Link>
                    <Link to={`/patients/${patientId}/lab/${currentCat.id}/edit/${rec[currentCat.idField]}`} className="icon-btn edit">
                      <Edit size={16} />
                    </Link>
                    <button className="icon-btn delete" onClick={() => { setSelectedId(rec[currentCat.idField]); setModalOpen(true); }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalCount > itemsPerPage && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '1rem 0', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ color: 'var(--text-gray)', fontSize: '0.875rem' }}>
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} records
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.875rem', background: '#fff', border: '1px solid var(--border-color)', color: currentPage === 1 ? '#ccc' : 'var(--text-dark)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', borderRadius: '0.25rem' }}
            >
              Previous
            </button>
            <button 
              className="btn" 
              disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
              onClick={() => setCurrentPage(p => p + 1)}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.875rem', background: '#fff', border: '1px solid var(--border-color)', color: currentPage >= Math.ceil(totalCount / itemsPerPage) ? '#ccc' : 'var(--text-dark)', cursor: currentPage >= Math.ceil(totalCount / itemsPerPage) ? 'not-allowed' : 'pointer', borderRadius: '0.25rem' }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={modalOpen} 
        onCancel={() => setModalOpen(false)}
        title={`Delete ${currentCat.label} Record`}
        message={`Are you sure you want to delete this ${currentCat.label} record?`}
        confirmText="Delete"
        confirmType="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
