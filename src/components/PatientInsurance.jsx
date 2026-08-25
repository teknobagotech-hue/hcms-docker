import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import TablePrintControls from './TablePrintControls';

export default function PatientInsurance({ patientId }) {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const printColumns = [
    { label: 'Policy #', key: 'insurance_number' },
    { 
      label: 'Insurance Provider', 
      render: (r) => r.insurance_providers ? r.insurance_providers.provider_name : '-' 
    },
    { label: 'Coverage Details', key: 'coverage_details' },
    { 
      label: 'Effective Date', 
      render: (r) => r.effective_date ? new Date(r.effective_date).toLocaleDateString() : '-' 
    },
    { 
      label: 'Expiration Date', 
      render: (r) => r.expiration_date ? new Date(r.expiration_date).toLocaleDateString() : '-' 
    },
    { label: 'Status', key: 'status' }
  ];

  useEffect(() => {
    fetchPolicies();
  }, [page, patientId]);

  const fetchPolicies = async () => {
    setLoading(true);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
      .from('patient_insurance')
      .select(`
        *,
        insurance_providers (insurance_provider_id, provider_name, contact_number, address)
      `, { count: 'exact' })
      .eq('patient_id', patientId)
      .range(from, to)
      .order('status', { ascending: true }) // Active first
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load patient insurance records');
      console.error(error);
    } else {
      setPolicies(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const displayedPolicies = policies.filter(policy => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    const providerName = policy.insurance_providers ? policy.insurance_providers.provider_name.toLowerCase() : '';
    const policyNum = (policy.insurance_number || '').toLowerCase();
    const details = (policy.coverage_details || '').toLowerCase();

    return providerName.includes(q) || policyNum.includes(q) || details.includes(q);
  });

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const { error } = await supabase
      .from('patient_insurance')
      .update({ status: newStatus })
      .eq('patient_insurance_id', id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Policy status updated to ${newStatus}`);
      fetchPolicies();
    }
    setModalOpen(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('patient_insurance')
      .delete()
      .eq('patient_insurance_id', id);

    if (error) {
      toast.error('Failed to delete insurance policy');
    } else {
      toast.success('Insurance policy deleted');
      fetchPolicies();
    }
    setModalOpen(false);
  };

  const openConfirmModal = (action, policy) => {
    if (action === 'toggle-status') {
      const isArchiving = policy.status === 'active';
      setModalConfig({
        title: isArchiving ? 'Deactivate Policy' : 'Activate Policy',
        message: `Are you sure you want to mark policy "${policy.insurance_number}" as ${isArchiving ? 'inactive' : 'active'}?`,
        confirmText: isArchiving ? 'Deactivate' : 'Activate',
        confirmType: isArchiving ? 'warning' : 'primary',
        onConfirm: () => handleToggleStatus(policy.patient_insurance_id, policy.status)
      });
    } else if (action === 'delete') {
      setModalConfig({
        title: 'Delete Insurance Policy',
        message: `Are you sure you want to delete policy "${policy.insurance_number}"?`,
        confirmText: 'Delete',
        confirmType: 'danger',
        onConfirm: () => handleDelete(policy.patient_insurance_id)
      });
    }
    setModalOpen(true);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="section-panel" style={{ margin: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={20} color="var(--primary)" /> Health Insurance Policies
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <TablePrintControls 
            records={policies} 
            title="Patient Insurance Log" 
            columns={printColumns} 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
          <Link 
            to={`/patients/${patientId}/insurance/add`} 
            className="btn btn-primary" 
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          >
            <Plus size={16} /> Add Insurance Policy
          </Link>
        </div>
      </div>

      <div style={{ width: '100%', overflowX: 'auto', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: '#ffffff' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Policy / Card #</th>
              <th>Insurance Provider</th>
              <th>Coverage Details</th>
              <th>Effective Date</th>
              <th>Expiration Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
            ) : displayedPolicies.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-gray)' }}>
                  {searchTerm ? `No policies matching "${searchTerm}"` : 'No health insurance policies recorded for this patient.'}
                </td>
              </tr>
            ) : (
              displayedPolicies.map(pol => (
                <tr key={pol.patient_insurance_id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    {pol.insurance_number}
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {pol.insurance_providers ? pol.insurance_providers.provider_name : '-'}
                  </td>
                  <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pol.coverage_details || '-'}
                  </td>
                  <td>{pol.effective_date ? new Date(pol.effective_date).toLocaleDateString() : '-'}</td>
                  <td>{pol.expiration_date ? new Date(pol.expiration_date).toLocaleDateString() : '-'}</td>
                  <td>
                    <span 
                      className="badge" 
                      style={{ 
                        backgroundColor: pol.status === 'active' ? '#DBEAFE' : '#F1F5F9', 
                        color: pol.status === 'active' ? '#1D4ED8' : '#64748B' 
                      }}
                    >
                      {pol.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link to={`/billing/patient-insurance/edit/${pol.patient_insurance_id}`} className="icon-btn edit" title="Edit">
                        <Edit size={16} />
                      </Link>
                      <button 
                        className="icon-btn archive" 
                        title={pol.status === 'active' ? 'Deactivate' : 'Activate'} 
                        onClick={() => openConfirmModal('toggle-status', pol)}
                      >
                        {pol.status === 'active' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                      </button>
                      <button className="icon-btn delete" title="Delete" onClick={() => openConfirmModal('delete', pol)}>
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
        {...modalConfig}
      />
    </div>
  );
}
