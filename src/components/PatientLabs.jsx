import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Eye, FileText, FlaskConical, Stethoscope, Image as ImageIcon, ExternalLink } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import TablePrintControls from './TablePrintControls';

export default function PatientLabs({ patientId }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'cbc', label: 'CBC', table: 'lab_cbc', idField: 'cbc_id', dateField: 'test_date', icon: <FlaskConical size={16} /> },
    { id: 'chem', label: 'Chemistry', table: 'lab_chemistry', idField: 'chem_id', dateField: 'test_date', icon: <FlaskConical size={16} /> },
    { id: 'serology', label: 'Serology', table: 'lab_serology', idField: 'serology_id', dateField: 'test_date', icon: <FlaskConical size={16} /> },
    { id: 'ua', label: 'Urinalysis', table: 'lab_urinalysis', idField: 'ua_id', dateField: 'test_date', icon: <FlaskConical size={16} /> },
    { id: 'imaging', label: 'X-rays', table: 'imaging_reports', idField: 'imaging_id', dateField: 'record_date', icon: <ImageIcon size={16} /> }
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
    setSearchTerm('');
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

  const displayedRecords = records.filter(rec => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return Object.values(rec).some(val => val !== null && val !== undefined && String(val).toLowerCase().includes(term));
  });

  const handleDelete = async () => {
    const { error } = await supabase.from(currentCat.table).delete().eq(currentCat.idField, selectedId);
    if (error) toast.error('Failed to delete record');
    else {
      toast.success('Record deleted');
      fetchRecords();
    }
    setModalOpen(false);
  };

  const getColCount = () => {
    switch (activeCategory) {
      case 'cbc': return 12;
      case 'chem': return 31;
      case 'serology': return 3;
      case 'ua': return 12;
      case 'imaging': return 6;
      default: return 7;
    }
  };

  const renderTableHeaders = () => {
    switch (activeCategory) {
      case 'cbc':
        return (
          <tr>
            <th>Date</th>
            <th>WBC</th>
            <th>RBC</th>
            <th>HGB</th>
            <th>HCT</th>
            <th>PLT</th>
            <th>Seg</th>
            <th>Neut</th>
            <th>Lym</th>
            <th>Mon</th>
            <th>Eos</th>
            <th>Actions</th>
          </tr>
        );
      case 'chem':
        return (
          <tr>
            <th>Date</th>
            <th>Creatinine</th>
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
            <th>Actions</th>
          </tr>
        );
      case 'serology':
        return (
          <tr>
            <th>Date</th>
            <th>TSH</th>
            <th>Actions</th>
          </tr>
        );
      case 'ua':
        return (
          <tr>
            <th>Date</th>
            <th>Color</th>
            <th>Trans.</th>
            <th>Protein</th>
            <th>pH</th>
            <th>Sp.Grav</th>
            <th>Glucose</th>
            <th>Pus</th>
            <th>RBC</th>
            <th>Epithelial</th>
            <th>Bacteria</th>
            <th>Actions</th>
          </tr>
        );
      case 'imaging':
        return (
          <tr>
            <th>Date</th>
            <th>Modality</th>
            <th>Location</th>
            <th>Impression</th>
            <th>Attachment</th>
            <th>Actions</th>
          </tr>
        );
      default:
        return null;
    }
  };

  const getPrintColumns = () => {
    switch (activeCategory) {
      case 'cbc':
        return [
          { label: 'Date', key: 'test_date' },
          { label: 'WBC', key: 'wbc' },
          { label: 'RBC', key: 'rbc' },
          { label: 'HGB', key: 'hemoglobin' },
          { label: 'HCT', key: 'hematocrit' },
          { label: 'PLT', key: 'platelet_count' },
          { label: 'Seg', key: 'segmenters' },
          { label: 'Neut', key: 'neutrophils' },
          { label: 'Lym', key: 'lymphocytes' },
          { label: 'Mon', key: 'monocytes' },
          { label: 'Eos', key: 'eosinophils' }
        ];
      case 'chem':
        return [
          { label: 'Date', key: 'test_date' },
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
      case 'serology':
        return [
          { label: 'Date', key: 'test_date' },
          { label: 'TSH', key: 'tsh' }
        ];
      case 'ua':
        return [
          { label: 'Date', key: 'test_date' },
          { label: 'Color', key: 'color' },
          { label: 'Trans.', key: 'transparency' },
          { label: 'Protein', key: 'protein' },
          { label: 'pH', key: 'ph' },
          { label: 'Sp.Grav', key: 'specific_gravity' },
          { label: 'Glucose', key: 'glucose' },
          { label: 'Pus', key: 'pus_cells' },
          { label: 'RBC', key: 'rbc_micro' },
          { label: 'Epithelial', key: 'epithelial_cells' },
          { label: 'Bacteria', key: 'bacteria' }
        ];
      case 'imaging':
        return [
          { label: 'Date', key: 'record_date' },
          { label: 'Modality', key: 'modality' },
          { label: 'Location', key: 'location' },
          { label: 'Impression', key: 'impression' },
          { label: 'File URL', key: 'file_url' }
        ];
      default:
        return [];
    }
  };

  const renderRowData = (rec) => {
    switch (activeCategory) {
      case 'cbc':
        return (
          <>
            <td style={{ fontWeight: 500 }}>{rec.test_date}</td>
            <td>{rec.wbc ?? '-'}</td>
            <td>{rec.rbc ?? '-'}</td>
            <td>{rec.hemoglobin ?? '-'}</td>
            <td>{rec.hematocrit ?? '-'}</td>
            <td>{rec.platelet_count ?? '-'}</td>
            <td>{rec.segmenters ?? '-'}</td>
            <td>{rec.neutrophils ?? '-'}</td>
            <td>{rec.lymphocytes ?? '-'}</td>
            <td>{rec.monocytes ?? '-'}</td>
            <td>{rec.eosinophils ?? '-'}</td>
          </>
        );
      case 'chem':
        return (
          <>
            <td style={{ fontWeight: 500 }}>{rec.test_date}</td>
            <td>{rec.creatinine ?? '-'}</td>
            <td>{rec.sodium ?? '-'}</td>
            <td>{rec.potassium ?? '-'}</td>
            <td>{rec.chloride ?? '-'}</td>
            <td>{rec.ionized_calcium ?? '-'}</td>
            <td>{rec.bun ?? '-'}</td>
            <td>{rec.uric_acid ?? '-'}</td>
            <td>{rec.phosphorous ?? '-'}</td>
            <td>{rec.sgpt_alt ?? '-'}</td>
            <td>{rec.sgot_ast ?? '-'}</td>
            <td>{rec.hba1c ?? '-'}</td>
            <td>{rec.fbs ?? '-'}</td>
            <td>{rec.rbs ?? '-'}</td>
            <td>{rec.total_cholesterol ?? '-'}</td>
            <td>{rec.triglycerides ?? '-'}</td>
            <td>{rec.hdl ?? '-'}</td>
            <td>{rec.ldl ?? '-'}</td>
            <td>{rec.vldl ?? '-'}</td>
            <td>{rec.chol_hdl_ratio ?? '-'}</td>
            <td>{rec.d_dimer ?? '-'}</td>
            <td>{rec.procalcitonin ?? '-'}</td>
            <td>{rec.albumin ?? '-'}</td>
            <td>{rec.trop_i ?? '-'}</td>
            <td>{rec.pro_bnp ?? '-'}</td>
            <td>{rec.ptpa_patient ?? '-'}</td>
            <td>{rec.ptpa_control ?? '-'}</td>
            <td>{rec.percent_activity ?? '-'}</td>
            <td>{rec.inr ?? '-'}</td>
            <td>{rec.ptpa_ratio ?? '-'}</td>
          </>
        );
      case 'serology':
        return (
          <>
            <td style={{ fontWeight: 500 }}>{rec.test_date}</td>
            <td>{rec.tsh ?? '-'}</td>
          </>
        );
      case 'ua':
        return (
          <>
            <td style={{ fontWeight: 500 }}>{rec.test_date}</td>
            <td>{rec.color || '-'}</td>
            <td>{rec.transparency || '-'}</td>
            <td>{rec.protein || '-'}</td>
            <td>{rec.ph ?? '-'}</td>
            <td>{rec.specific_gravity ?? '-'}</td>
            <td>{rec.glucose || '-'}</td>
            <td>{rec.pus_cells || '-'}</td>
            <td>{rec.rbc_micro || '-'}</td>
            <td>{rec.epithelial_cells || '-'}</td>
            <td>{rec.bacteria || '-'}</td>
          </>
        );
      case 'imaging':
        return (
          <>
            <td style={{ fontWeight: 500 }}>{rec.record_date}</td>
            <td>{rec.modality}</td>
            <td>{rec.location}</td>
            <td>
              <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {rec.impression}
              </div>
            </td>
            <td>
              {rec.file_url ? (
                <a 
                  href={rec.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.65rem', backgroundColor: '#e0f2fe', color: '#0284c7', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}
                >
                  <ExternalLink size={12} /> View File
                </a>
              ) : (
                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>None</span>
              )}
            </td>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="section-panel" style={{ margin: 0 }}>
      
      {/* Category Pills */}
      <div className="tabs-nav-container" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {categories.map(cat => (
          <button 
            key={cat.id} 
            onClick={() => setActiveCategory(cat.id)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              padding: '0.5rem 1rem', borderRadius: '2rem', border: 'none', cursor: 'pointer',
              backgroundColor: activeCategory === cat.id ? 'var(--primary)' : '#F1F5F9',
              color: activeCategory === cat.id ? '#fff' : 'var(--text-gray)',
              fontWeight: 500, fontSize: '0.875rem', transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
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
          <TablePrintControls 
            records={records} 
            title={`${currentCat.label} Records`} 
            columns={getPrintColumns()} 
            dateField={currentCat.dateField}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
          <Link to={`/patients/${patientId}/lab/${currentCat.id}/add`} className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            <Plus size={16} /> Add {currentCat.label}
          </Link>
        </div>
      </div>

      <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <table className="data-table" style={{ width: '100%', minWidth: activeCategory === 'chem' ? '2200px' : activeCategory === 'cbc' ? '1200px' : activeCategory === 'ua' ? '1200px' : '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            {renderTableHeaders()}
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={getColCount()} style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
            ) : displayedRecords.length === 0 ? (
              <tr><td colSpan={getColCount()} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-gray)' }}>{searchTerm ? `No records matching "${searchTerm}"` : `No ${currentCat.label} records found.`}</td></tr>
            ) : (
              displayedRecords.map((rec, index) => (
                <tr key={rec[currentCat.idField] || rec.id || `${activeCategory}-${index}`}>
                  {renderRowData(rec)}
                  <td style={{ textAlign: 'center' }}>
                    <div className="table-actions" style={{ justifyContent: 'center' }}>
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
      </div>

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
