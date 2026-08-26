import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Upload, FileText, Image as ImageIcon, X, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';
import { uploadFileToFirebase, MAX_FILE_SIZE_BYTES } from '../../firebaseClient';
import '../../index.css';

export default function ImagingForm() {
  const { patient_id, id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    modality: '',
    location: '',
    impression: '',
    record_date: '',
    file_url: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadInfo, setUploadInfo] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isEditing) setFormData(prev => ({ ...prev, record_date: new Date().toISOString().split('T')[0] }));
    else fetchRecord();
  }, [id]);

  const fetchRecord = async () => {
    const { data, error } = await supabase.from('imaging_reports').select('*').eq('imaging_id', id).single();
    if (error) {
      toast.error('Failed to load Imaging record');
      navigate(`/patients/view/${patient_id}?tab=labs&labCat=imaging`);
    } else if (data) {
      setFormData({
        modality: data.modality || '',
        location: data.location || '',
        impression: data.impression || '',
        record_date: data.record_date || '',
        file_url: data.file_url || ''
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const processFile = async (file) => {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      toast.error(`File size (${sizeMB} MB) exceeds the 10MB limit!`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadFileToFirebase(
        file,
        `imaging-reports/${patient_id}`,
        (progress) => setUploadProgress(progress)
      );

      setFormData(prev => ({ ...prev, file_url: result.url }));
      setUploadInfo(result);

      if (result.isCompressed) {
        const orig = (result.originalSize / (1024 * 1024)).toFixed(2);
        const comp = (result.uploadedSize / 1024 > 1024) 
          ? `${(result.uploadedSize / (1024 * 1024)).toFixed(2)} MB` 
          : `${Math.round(result.uploadedSize / 1024)} KB`;
        toast.success(`Image compressed (${orig} MB → ${comp}) & saved to Firebase!`);
      } else {
        toast.success('File uploaded successfully to Firebase Storage!');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to upload file to Firebase');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, file_url: '' }));
    setUploadInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const dataToSubmit = { ...formData, patient_id: parseInt(patient_id) };
    Object.keys(dataToSubmit).forEach(k => { if (dataToSubmit[k] === '') dataToSubmit[k] = null; });

    let error;
    if (isEditing) {
      const { error: err } = await supabase.from('imaging_reports').update(dataToSubmit).eq('imaging_id', id);
      error = err;
    } else {
      const { error: err } = await supabase.from('imaging_reports').insert([dataToSubmit]);
      error = err;
    }
    setLoading(false);

    if (error) toast.error(error.message);
    else {
      toast.success('Imaging Report recorded');
      navigate(`/patients/view/${patient_id}?tab=labs&labCat=imaging`);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  const isImageFile = formData.file_url && (
    formData.file_url.match(/\.(jpeg|jpg|png|gif|webp)/i) || 
    formData.file_url.includes('firebasestorage.googleapis.com')
  );

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '650px' }}>
        <div className="section-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
          <Link to={`/patients/view/${patient_id}?tab=labs&labCat=imaging`} className="icon-btn" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            {isEditing ? 'Edit Imaging Report' : 'Upload Imaging Report'}
          </h1>
        </div>

        <div className="section-panel">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Record Date</label>
              <input 
                type="date" 
                name="record_date" 
                className="form-input" 
                style={{ paddingLeft: '1rem' }} 
                value={formData.record_date} 
                onChange={handleChange} 
              />
            </div>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Modality *</label>
              <SearchableSelect
                name="modality"
                options={[
                  { label: 'X-Ray', value: 'X-Ray' },
                  { label: 'MRI', value: 'MRI' },
                  { label: 'CT Scan', value: 'CT Scan' },
                  { label: 'Ultrasound', value: 'Ultrasound' },
                  { label: 'ECG', value: 'ECG' },
                  { label: 'ULTRASOUND REPORTS', value: 'ULTRASOUND REPORTS' },
                  { label: 'ARTERIAL DUPLEX SCAN', value: 'ARTERIAL DUPLEX SCAN' },
                  { label: 'VENOUS DUPLEX SCAN', value: 'VENOUS DUPLEX SCAN' },
                  { label: 'Other', value: 'Other' }
                ]}
                value={formData.modality}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Body Location / Region</label>
              <input 
                type="text" 
                name="location" 
                className="form-input" 
                style={{ paddingLeft: '1rem' }} 
                value={formData.location} 
                onChange={handleChange} 
                placeholder="e.g. Chest PA, Abdomen, Left Knee" 
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Impression / Findings</label>
              <textarea 
                name="impression" 
                className="form-input" 
                style={{ paddingLeft: '1rem', minHeight: '100px' }} 
                value={formData.impression} 
                onChange={handleChange} 
                placeholder="Radiologist's findings or impression..."
              ></textarea>
            </div>

            {/* File Upload Section */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Attach X-Ray / Document</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal' }}>Max 10MB</span>
              </label>

              <input 
                type="file" 
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*,.pdf"
                onChange={handleFileChange}
              />

              {uploading ? (
                <div style={{
                  border: '2px dashed var(--primary)',
                  borderRadius: '0.75rem',
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  backgroundColor: '#F0FDFA'
                }}>
                  <Loader2 size={32} className="spin" style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
                  <div style={{ fontWeight: 600, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>
                    Uploading to Firebase Storage... {uploadProgress}%
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
                    Compressing image & reducing file size
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: 'var(--primary)', transition: 'width 0.2s' }}></div>
                  </div>
                </div>
              ) : formData.file_url ? (
                <div style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  position: 'relative'
                }}>
                  {isImageFile ? (
                    <div style={{ width: '56px', height: '56px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0, border: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={formData.file_url} alt="X-Ray preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.onerror = null; e.target.style.display='none'; }} />
                    </div>
                  ) : (
                    <div style={{ width: '56px', height: '56px', borderRadius: '0.5rem', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={28} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                      <CheckCircle2 size={16} style={{ color: '#10b981' }} /> File Attached (Firebase)
                    </div>
                    <a 
                      href={formData.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}
                    >
                      View File <ExternalLink size={12} />
                    </a>
                    {uploadInfo?.isCompressed && (
                      <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.2rem', fontWeight: 500 }}>
                        ⚡ Compressed: {formatFileSize(uploadInfo.originalSize)} → {formatFileSize(uploadInfo.uploadedSize)}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="icon-btn delete"
                    title="Remove attachment"
                    style={{ padding: '0.5rem', borderRadius: '50%' }}
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    border: isDragging ? '2px dashed var(--primary)' : '2px dashed #cbd5e1',
                    borderRadius: '0.75rem',
                    padding: '2rem 1.5rem',
                    textAlign: 'center',
                    backgroundColor: isDragging ? '#F0FDFA' : '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#E0F2FE', color: '#0284C7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                    <Upload size={24} />
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.95rem' }}>
                    Click or drag X-Ray image or document to upload
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Supports PNG, JPG, WEBP images or PDF files (Max 10MB)
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#ECFDF5', color: '#047857', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 500, marginTop: '0.75rem' }}>
                    ⚡ Auto-compresses images to optimize storage
                  </div>
                </div>
              )}
            </div>

            {/* Direct File URL Input fallback */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', color: '#64748b' }}>File URL (Optional Direct Link)</label>
              <input 
                type="text" 
                name="file_url" 
                className="form-input" 
                style={{ paddingLeft: '1rem', fontSize: '0.85rem' }} 
                value={formData.file_url} 
                onChange={handleChange} 
                placeholder="https://..." 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <Link to={`/patients/view/${patient_id}?tab=labs&labCat=imaging`} className="btn btn-cancel" style={{ textDecoration: 'none' }}>Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={loading || uploading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={16} />{loading ? 'Saving...' : 'Save Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

