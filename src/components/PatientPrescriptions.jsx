import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { Edit, Trash2, Plus, FileSignature, Eye, Printer } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import TablePrintControls from './TablePrintControls';
import '../index.css';

export default function PatientPrescriptions({ patientId }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const printColumns = [
    { label: 'ID', key: 'prescription_id' },
    { label: 'Date', render: (r) => new Date(r.prescription_date).toLocaleDateString() },
    { label: 'Doctor', render: (r) => r.doctors ? `Dr. ${r.doctors.first_name} ${r.doctors.last_name}` : '-' },
    { label: 'Status', key: 'status' }
  ];

  useEffect(() => {
    fetchPrescriptions();
  }, [page, patientId]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
      .from('prescriptions')
      .select('*, doctors(first_name, last_name)', { count: 'exact' })
      .eq('patient_id', patientId)
      .range(from, to)
      .order('prescription_date', { ascending: false });

    if (error) {
      toast.error('Failed to load prescriptions');
    } else {
      setPrescriptions(data);
      setTotalCount(count);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from('prescriptions')
      .delete()
      .eq('prescription_id', selectedId);

    if (error) {
      toast.error('Failed to delete prescription.');
    } else {
      toast.success('Prescription deleted successfully');
      fetchPrescriptions();
    }
    setModalOpen(false);
  };

  const openConfirmModal = (id) => {
    setSelectedId(id);
    setModalOpen(true);
  };

  const handlePrintRx = async (prescription) => {
    const { data: patient } = await supabase
      .from('patients')
      .select('first_name, last_name, address, date_of_birth, gender')
      .eq('patient_id', patientId)
      .single();

    if (!patient) {
      toast.error('Could not load patient details for printing.');
      return;
    }

    const age = patient.date_of_birth ? Math.floor((new Date() - new Date(patient.date_of_birth).getTime()) / 3.15576e+10) : '-';
    const gender = patient.gender === 'Male' ? 'M' : patient.gender === 'Female' ? 'F' : '-';

    const { data: items } = await supabase
      .from('prescription_items')
      .select('*, medicines(medicine_name)')
      .eq('prescription_id', prescription.prescription_id);

    let itemsHtml = (prescription.notes && !prescription.notes.includes('Extracted from document')) ? `<div style="font-family: Arial, sans-serif; font-size: 14px; margin-bottom: 20px;">Notes: ${prescription.notes}</div>` : '';
    
    if (items && items.length > 0) {
      itemsHtml += items.map((item, i) => {
        const medName = item.medicines ? item.medicines.medicine_name : '';
        const sig = `Sig: ${item.dosage || ''} ${item.frequency || ''} ${item.instructions || ''}`.trim();
        return `<div style="margin-bottom: 10px;">${i + 1}. ${medName} &nbsp;&nbsp;&nbsp;&nbsp; #${item.quantity || ''}<br/><span style="margin-left: 20px;">${sig}</span></div>`;
      }).join('');
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print the prescription');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Prescription</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&display=swap');
          body { font-family: 'Times New Roman', Times, serif; color: black; padding: 20px; }
          .cursive-text { font-family: 'Dancing Script', cursive; }
          .header-right { text-align: right; font-size: 11px; margin-bottom: 20px; font-weight: bold; font-style: italic; }
          .header-center { text-align: center; font-size: 12px; margin-bottom: 10px; font-style: italic; }
          .doc-name { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 10px; font-style: italic; letter-spacing: 1px; }
          .doc-specialty { text-align: center; font-size: 11px; margin-bottom: 15px; }
          .affiliations { display: flex; justify-content: space-between; font-size: 11px; border-bottom: 1px dashed black; padding-bottom: 10px; margin-bottom: 10px; line-height: 1.4; }
          .patient-info { width: 100%; font-size: 12px; margin-bottom: 20px; border-bottom: 1px solid black; padding-bottom: 10px; border-top: 1px solid black; padding-top: 10px; border-style: double; border-width: 3px 0; }
          .patient-info td { padding: 2px; }
          .rx-symbol { font-size: 44px; font-weight: bold; margin-bottom: 20px; color: #1e3a8a; }
          .rx-items { margin-left: 30px; font-size: 20px; min-height: 350px; white-space: pre-wrap; line-height: 1.6; }
          .footer { text-align: right; margin-top: 50px; font-size: 12px; font-style: italic; line-height: 1.4; }
        </style>
      </head>
      <body>
        <div style="max-width: 700px; margin: 0 auto; padding: 20px;">
          <div class="header-right">
              PTR #: 6226871<br/>
              S2 Lic #
          </div>
          <div class="header-center">
              S2015621PNP071328-K<br/><br/>
              "A merry heart doeth good like a medicine." Proverbs 17:22
          </div>
          <div class="doc-name cursive-text">
              GLADDAYS CASUGA-NAPIGKIT, MD, FPCP, FPCC, FPSVM
          </div>
          <div class="doc-specialty">
              <strong>Internal Medicine, Adult Cardiology, Vascular Medicine</strong><br/>
              Fellow, Philippine College of Physician<br/>
              Fellow, Philippine College of Cardiology<br/>
              Fellow, Philippine Society of Vascular Medicine
          </div>
          
          <div class="affiliations">
            <div>
              <strong>Hospital Affiliations:</strong><br/>
              Adventist Medical Center-Valencia<br/>
              Abella Midway Hospital<br/>
              Lavina General Hospital<br/>
              Valencia Polymedic General Hospital<br/>
              Medidas Medical Center<br/>
              Esther Hospital
            </div>
            <div>
              <strong>Clinic Address & Clinic Hours:</strong><br/>
              Adventist Medical Center: M-T-Th-F (1:00 pm to 4:00 pm)<br/>
              Abella Midway Hospital: Wed (1:00 pm to 4:00 pm)
            </div>
          </div>
          
          <table class="patient-info">
            <tr>
              <td style="width: 60%;">Name: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>${patient.last_name}, ${patient.first_name}</strong></td>
              <td style="width: 40%;">Date: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
            </tr>
            <tr>
              <td>Address: &nbsp;&nbsp;&nbsp;${patient.address || '-'}</td>
              <td>Age/Sex: &nbsp;${age}/${gender}</td>
            </tr>
          </table>

          <div class="rx-symbol cursive-text">Rx</div>
          
          <div class="rx-items cursive-text">${itemsHtml}</div>
          
          <div class="footer">
              <strong style="font-family: Arial, sans-serif; font-style: normal;">DR. GLADDAYS CASUGA-NAPIGKIT</strong><br/>
              Internist-Cardiologist-<br/>
              Vascular Specialist<br/>
              Lic #: 0110138
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 800); // Allow custom font to load
  };

  return (
    <div className="section-panel" style={{ margin: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)' }}>
          Prescriptions
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <TablePrintControls records={prescriptions} title="Prescriptions" columns={printColumns} dateField="prescription_date" />
          <Link to={`/pharmacy/prescriptions/add?patientId=${patientId}`} className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            <Plus size={16} /> New Prescription
          </Link>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Doctor</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td>
            </tr>
          ) : prescriptions.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No prescriptions found.</td>
            </tr>
          ) : (
            prescriptions.map(presc => (
              <tr key={presc.prescription_id}>
                <td>{presc.prescription_id}</td>
                <td>{new Date(presc.prescription_date).toLocaleDateString()}</td>
                <td>Dr. {presc.doctors?.first_name} {presc.doctors?.last_name}</td>
                <td>
                  <span className={`badge ${presc.status === 'active' ? 'badge-blue' : presc.status === 'completed' ? 'badge-green' : ''}`}>
                    {presc.status}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <Link to={`/patients/${patientId}/view/prescriptions/${presc.prescription_id}`} className="icon-btn" style={{ color: 'var(--primary)' }} title="View">
                      <Eye size={16} />
                    </Link>
                    <button className="icon-btn" onClick={() => handlePrintRx(presc)} style={{ color: 'var(--text-gray)' }} title="Print Rx">
                      <Printer size={16} />
                    </button>
                    <Link to={`/pharmacy/prescriptions/edit/${presc.prescription_id}?patientId=${patientId}`} className="icon-btn edit" title="Edit">
                      <Edit size={16} />
                    </Link>
                    <button className="icon-btn delete" title="Delete" onClick={() => openConfirmModal(presc.prescription_id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

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
        title="Delete Prescription"
        message="Are you sure you want to permanently delete this prescription?"
        confirmText="Delete"
        confirmType="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
