import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { Search, Edit, Archive, Plus, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import TablePrintControls from '../../components/TablePrintControls';
import '../../index.css';

export default function PatientInsuranceList() {
  const [policies, setPolicies] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  const printColumns = [
    { label: 'Policy #', key: 'insurance_number' },
    { 
      label: 'Patient', 
      render: (r) => r.patients ? `${r.patients.last_name}, ${r.patients.first_name}` : '-' 
    },
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
    fetchProviders();
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [page, searchQuery, statusFilter, providerFilter]);

  const fetchProviders = async () => {
    const { data } = await supabase
      .from('insurance_providers')
      .select('insurance_provider_id, provider_name')
      .order('provider_name');
    if (data) setProviders(data);
  };

  const fetchPolicies = async () => {
    setLoading(true);
    let query = supabase
      .from('patient_insurance')
      .select(`
        *,
        patients (patient_id, first_name, last_name, middle_name),
        insurance_providers (insurance_provider_id, provider_name)
      `, { count: 'exact' });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (providerFilter !== 'all') {
      query = query.eq('insurance_provider_id', providerFilter);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, count, error } = await query;

    if (error) {
      toast.error('Failed to load patient insurance policies');
      console.error(error);
    } else {
      setPolicies(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const filteredPolicies = policies.filter(policy => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const patientName = policy.patients ? `${policy.patients.first_name} ${policy.patients.last_name}`.toLowerCase() : '';
    const providerName = policy.insurance_providers ? policy.insurance_providers.provider_name.toLowerCase() : '';
    const policyNum = (policy.insurance_number || '').toLowerCase();
    const details = (policy.coverage_details || '').toLowerCase();

    return patientName.includes(q) || providerName.includes(q) || policyNum.includes(q) || details.includes(q);
  });

  const handleArchive = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const { error } = await supabase
      .from('patient_insurance')
      .update({ status: newStatus })
      .eq('patient_insurance_id', id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Policy set to ${newStatus}`);
      fetchPolicies();
    }
    setModalOpen(false);
  };

  const openConfirmModal = (action, policy) => {
    const patientName = policy.patients ? `${policy.patients.first_name} ${policy.patients.last_name}` : 'Patient';
    if (action === 'toggle-status') {
      const isArchiving = policy.status === 'active';
      setModalConfig({
        title: isArchiving ? 'Deactivate Policy' : 'Activate Policy',
        message: `Are you sure you want to mark policy "${policy.insurance_number}" for ${patientName} as ${isArchiving ? 'inactive' : 'active'}?`,
        confirmText: isArchiving ? 'Deactivate' : 'Activate',
        confirmType: isArchiving ? 'warning' : 'primary',
        onConfirm: () => handleArchive(policy.patient_insurance_id, policy.status)
      });
    }
    setModalOpen(true);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container">
        
        <div className="page-header-flex">
          <div>
            <h1 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck className="text-primary" size={24} />
              Patient Insurance Policies
            </h1>
            <p className="card-subtitle">Manage patient health insurance records and coverage details</p>
          </div>
          <div className="header-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <TablePrintControls 
              records={filteredPolicies} 
              title="Patient Insurance Registry" 
              columns={printColumns}
            />
            <Link to="/billing/patient-insurance/add" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} /> Add Patient Insurance
            </Link>
          </div>
        </div>

        <div className="section-panel">
          <div className="filter-toolbar">
            <div className="input-wrapper" style={{ flex: 1, minWidth: '220px' }}>
              <Search className="input-icon" size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Search patient, provider, or policy #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="form-input filter-select"
              style={{ width: 'auto', minWidth: '160px', paddingLeft: '1rem' }}
              value={providerFilter}
              onChange={(e) => { setProviderFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Providers</option>
              {providers.map(p => (
                <option key={p.insurance_provider_id} value={p.insurance_provider_id}>
                  {p.provider_name}
                </option>
              ))}
            </select>

            <select
              className="form-input filter-select"
              style={{ width: 'auto', minWidth: '140px', paddingLeft: '1rem' }}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Policy / Card #</th>
                  <th>Patient Name</th>
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
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td>
                  </tr>
                ) : filteredPolicies.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                      {searchQuery ? `No policies matching "${searchQuery}"` : 'No patient insurance records found.'}
                    </td>
                  </tr>
                ) : (
                  filteredPolicies.map(pol => (
                    <tr key={pol.patient_insurance_id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                        {pol.insurance_number}
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        {pol.patients ? (
                          <Link to={`/patients/view/${pol.patient_id}?tab=insurance`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            {pol.patients.last_name}, {pol.patients.first_name}
                          </Link>
                        ) : 'Unknown Patient'}
                      </td>
                      <td>{pol.insurance_providers ? pol.insurance_providers.provider_name : '-'}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                            <Edit size={18} />
                          </Link>
                          <button 
                            className="icon-btn archive" 
                            title={pol.status === 'active' ? 'Deactivate' : 'Activate'} 
                            onClick={() => openConfirmModal('toggle-status', pol)}
                          >
                            {pol.status === 'active' ? <XCircle size={18} /> : <CheckCircle size={18} />}
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
              <button 
                className="page-btn" 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                <button 
                  key={num} 
                  className={`page-btn ${page === num ? 'active' : ''}`}
                  onClick={() => setPage(num)}
                >
                  {num}
                </button>
              ))}
              <button 
                className="page-btn" 
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={modalOpen} 
        onCancel={() => setModalOpen(false)}
        {...modalConfig}
      />
    </div>
  );
}
