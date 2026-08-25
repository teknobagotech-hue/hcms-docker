import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Unauthorized from './pages/Unauthorized';

import DepartmentsList from './pages/DepartmentsList';
import DepartmentForm from './pages/DepartmentForm';
import DepartmentView from './pages/DepartmentView';
import DoctorsList from './pages/DoctorsList';
import DoctorForm from './pages/DoctorForm';
import DoctorView from './pages/DoctorView';
import UsersList from './pages/UsersList';
import UserForm from './pages/UserForm';
import UserView from './pages/UserView';
import Profile from './pages/Profile';
import PatientsList from './pages/PatientsList';
import PatientForm from './pages/PatientForm';
import PatientView from './pages/PatientView';
import PatientPrint from './pages/PatientPrint';
import AppointmentForm from './pages/AppointmentForm';
import VitalSignsForm from './pages/VitalSignsForm';
import MedicalRecordForm from './pages/MedicalRecordForm';
import CardioHistoryForm from './pages/CardioHistoryForm';
import DocumentScanner from './pages/DocumentScanner';
import RecordView from './pages/RecordView';

import CBCForm from './pages/lab/CBCForm';
import ChemForm from './pages/lab/ChemForm';
import SerologyForm from './pages/lab/SerologyForm';
import UrinalysisForm from './pages/lab/UrinalysisForm';
import ImagingForm from './pages/lab/ImagingForm';
import MedicalDocumentForm from './pages/lab/MedicalDocumentForm';

import MedicinesList from './pages/inventory/MedicinesList';
import MedicineForm from './pages/inventory/MedicineForm';
import InventoryCategoriesList from './pages/inventory/InventoryCategoriesList';
import CategoryForm from './pages/inventory/CategoryForm';
import InventoryItemsList from './pages/inventory/InventoryItemsList';
import InventoryItemForm from './pages/inventory/InventoryItemForm';

import SuppliersList from './pages/inventory/SuppliersList';
import SupplierForm from './pages/inventory/SupplierForm';
import StockReceiptsList from './pages/inventory/StockReceiptsList';
import StockReceiptForm from './pages/inventory/StockReceiptForm';
import StockReceiptView from './pages/inventory/StockReceiptView';

import PrescriptionsList from './pages/pharmacy/PrescriptionsList';
import PrescriptionForm from './pages/pharmacy/PrescriptionForm';
import WithdrawalsList from './pages/pharmacy/WithdrawalsList';
import WithdrawalForm from './pages/pharmacy/WithdrawalForm';

import InsuranceProvidersList from './pages/billing/InsuranceProvidersList';
import InsuranceProviderForm from './pages/billing/InsuranceProviderForm';
import PatientInsuranceList from './pages/billing/PatientInsuranceList';
import PatientInsuranceForm from './pages/billing/PatientInsuranceForm';
import BillingList from './pages/billing/BillingList';
import BillingForm from './pages/billing/BillingForm';

import './index.css';

function RoleGuard({ allowedRoles, children }) {
  const { session, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-gray)' }}>
        Loading permissions...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return children ? <LayoutWrapper>{<Unauthorized />}</LayoutWrapper> : <Unauthorized />;
  }

  return children;
}

function LayoutWrapper({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        {children}
      </div>
    </div>
  );
}

function AppRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-gray)' }}>
        Loading session...
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/unauthorized" element={<RoleGuard><LayoutWrapper><Unauthorized /></LayoutWrapper></RoleGuard>} />
        
        {/* Dashboard Route */}
        <Route 
          path="/" 
          element={
            <RoleGuard>
              <LayoutWrapper>
                <Dashboard />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />

        {/* Departments Routes */}
        <Route 
          path="/departments" 
          element={
            <RoleGuard allowedRoles={['admin', 'doctor']}>
              <LayoutWrapper>
                <DepartmentsList />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />
        <Route 
          path="/departments/add" 
          element={
            <RoleGuard allowedRoles={['admin', 'doctor']}>
              <LayoutWrapper>
                <DepartmentForm />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />
        <Route 
          path="/departments/edit/:id" 
          element={
            <RoleGuard allowedRoles={['admin', 'doctor']}>
              <LayoutWrapper>
                <DepartmentForm />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />
        <Route 
          path="/departments/view/:id" 
          element={
            <RoleGuard allowedRoles={['admin', 'doctor']}>
              <LayoutWrapper>
                <DepartmentView />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />

        {/* Doctors Routes */}
        <Route 
          path="/doctors" 
          element={
            <RoleGuard allowedRoles={['admin', 'doctor', 'receptionist']}>
              <LayoutWrapper>
                <DoctorsList />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />
        <Route 
          path="/doctors/add" 
          element={
            <RoleGuard allowedRoles={['admin']}>
              <LayoutWrapper>
                <DoctorForm />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />
        <Route 
          path="/doctors/edit/:id" 
          element={
            <RoleGuard allowedRoles={['admin']}>
              <LayoutWrapper>
                <DoctorForm />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />
        <Route 
          path="/doctors/view/:id" 
          element={
            <RoleGuard allowedRoles={['admin', 'doctor', 'receptionist']}>
              <LayoutWrapper>
                <DoctorView />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />

        {/* Users Management Routes (Admin Only) */}
        <Route 
          path="/users" 
          element={
            <RoleGuard allowedRoles={['admin']}>
              <LayoutWrapper>
                <UsersList />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />
        <Route 
          path="/users/add" 
          element={
            <RoleGuard allowedRoles={['admin']}>
              <LayoutWrapper>
                <UserForm />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />
        <Route 
          path="/users/edit/:id" 
          element={
            <RoleGuard allowedRoles={['admin']}>
              <LayoutWrapper>
                <UserForm />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />
        <Route 
          path="/users/view/:id" 
          element={
            <RoleGuard allowedRoles={['admin']}>
              <LayoutWrapper>
                <UserView />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />

        {/* Profile Route */}
        <Route 
          path="/profile" 
          element={
            <RoleGuard>
              <LayoutWrapper>
                <Profile />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />

        {/* Patients Routes */}
        <Route 
          path="/patients" 
          element={
            <RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist', 'lab_technician', 'staff']}>
              <LayoutWrapper>
                <PatientsList />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />
        <Route 
          path="/patients/add" 
          element={
            <RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist']}>
              <LayoutWrapper>
                <PatientForm />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />
        <Route 
          path="/patients/edit/:id" 
          element={
            <RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist']}>
              <LayoutWrapper>
                <PatientForm />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />
        <Route 
          path="/patients/view/:id" 
          element={
            <RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist', 'lab_technician', 'staff']}>
              <LayoutWrapper>
                <PatientView />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />
        <Route 
          path="/patients/print/:id" 
          element={
            <RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist']}>
              <PatientPrint />
            </RoleGuard>
          } 
        />
        
        {/* Document Scanner Route */}
        <Route 
          path="/patients/scan" 
          element={
            <RoleGuard allowedRoles={['admin', 'doctor', 'nurse']}>
              <LayoutWrapper>
                <DocumentScanner />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />

        {/* Generic Record View Route */}
        <Route 
          path="/patients/:id/view/:type/:recordId" 
          element={
            <RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'lab_technician']}>
              <LayoutWrapper>
                <RecordView />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />

        {/* Appointments Sub-module Routes */}
        <Route 
          path="/patients/:patient_id/appointments/add" 
          element={
            <RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist']}>
              <LayoutWrapper>
                <AppointmentForm />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />
        <Route 
          path="/patients/:patient_id/appointments/edit/:id" 
          element={
            <RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist']}>
              <LayoutWrapper>
                <AppointmentForm />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />

        {/* Vitals Sub-module Routes */}
        <Route 
          path="/patients/:patient_id/vitals/add" 
          element={
            <RoleGuard allowedRoles={['admin', 'doctor', 'nurse']}>
              <LayoutWrapper>
                <VitalSignsForm />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />
        <Route 
          path="/patients/:patient_id/vitals/edit/:id" 
          element={
            <RoleGuard allowedRoles={['admin', 'doctor', 'nurse']}>
              <LayoutWrapper>
                <VitalSignsForm />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />

        {/* Medical Records Sub-module Routes */}
        <Route 
          path="/patients/:patient_id/records/add" 
          element={
            <RoleGuard allowedRoles={['admin', 'doctor', 'nurse']}>
              <LayoutWrapper>
                <MedicalRecordForm />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />
        <Route 
          path="/patients/:patient_id/records/edit/:id" 
          element={
            <RoleGuard allowedRoles={['admin', 'doctor', 'nurse']}>
              <LayoutWrapper>
                <MedicalRecordForm />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />
        <Route 
          path="/patients/:patient_id/cardio/edit" 
          element={
            <RoleGuard allowedRoles={['admin', 'doctor', 'nurse']}>
              <LayoutWrapper>
                <CardioHistoryForm />
              </LayoutWrapper>
            </RoleGuard>
          } 
        />

        {/* Labs & Imaging Routes */}
        <Route path="/patients/:patient_id/lab/cbc/add" element={<RoleGuard allowedRoles={['admin', 'doctor', 'lab_technician']}><LayoutWrapper><CBCForm /></LayoutWrapper></RoleGuard>} />
        <Route path="/patients/:patient_id/lab/cbc/edit/:id" element={<RoleGuard allowedRoles={['admin', 'doctor', 'lab_technician']}><LayoutWrapper><CBCForm /></LayoutWrapper></RoleGuard>} />
        
        <Route path="/patients/:patient_id/lab/chem/add" element={<RoleGuard allowedRoles={['admin', 'doctor', 'lab_technician']}><LayoutWrapper><ChemForm /></LayoutWrapper></RoleGuard>} />
        <Route path="/patients/:patient_id/lab/chem/edit/:id" element={<RoleGuard allowedRoles={['admin', 'doctor', 'lab_technician']}><LayoutWrapper><ChemForm /></LayoutWrapper></RoleGuard>} />
        
        <Route path="/patients/:patient_id/lab/serology/add" element={<RoleGuard allowedRoles={['admin', 'doctor', 'lab_technician']}><LayoutWrapper><SerologyForm /></LayoutWrapper></RoleGuard>} />
        <Route path="/patients/:patient_id/lab/serology/edit/:id" element={<RoleGuard allowedRoles={['admin', 'doctor', 'lab_technician']}><LayoutWrapper><SerologyForm /></LayoutWrapper></RoleGuard>} />
        
        <Route path="/patients/:patient_id/lab/ua/add" element={<RoleGuard allowedRoles={['admin', 'doctor', 'lab_technician']}><LayoutWrapper><UrinalysisForm /></LayoutWrapper></RoleGuard>} />
        <Route path="/patients/:patient_id/lab/ua/edit/:id" element={<RoleGuard allowedRoles={['admin', 'doctor', 'lab_technician']}><LayoutWrapper><UrinalysisForm /></LayoutWrapper></RoleGuard>} />
        
        <Route path="/patients/:patient_id/lab/imaging/add" element={<RoleGuard allowedRoles={['admin', 'doctor', 'lab_technician']}><LayoutWrapper><ImagingForm /></LayoutWrapper></RoleGuard>} />
        <Route path="/patients/:patient_id/lab/imaging/edit/:id" element={<RoleGuard allowedRoles={['admin', 'doctor', 'lab_technician']}><LayoutWrapper><ImagingForm /></LayoutWrapper></RoleGuard>} />
        
        <Route path="/patients/:patient_id/lab/docs/add" element={<RoleGuard allowedRoles={['admin', 'doctor', 'lab_technician']}><LayoutWrapper><MedicalDocumentForm /></LayoutWrapper></RoleGuard>} />
        <Route path="/patients/:patient_id/lab/docs/edit/:id" element={<RoleGuard allowedRoles={['admin', 'doctor', 'lab_technician']}><LayoutWrapper><MedicalDocumentForm /></LayoutWrapper></RoleGuard>} />

        {/* Inventory & Medicines Routes */}
        <Route path="/inventory/medicines" element={<RoleGuard allowedRoles={['admin', 'pharmacist', 'doctor']}><LayoutWrapper><MedicinesList /></LayoutWrapper></RoleGuard>} />
        <Route path="/inventory/medicines/add" element={<RoleGuard allowedRoles={['admin', 'pharmacist']}><LayoutWrapper><MedicineForm /></LayoutWrapper></RoleGuard>} />
        <Route path="/inventory/medicines/edit/:id" element={<RoleGuard allowedRoles={['admin', 'pharmacist']}><LayoutWrapper><MedicineForm /></LayoutWrapper></RoleGuard>} />
        
        <Route path="/inventory/categories" element={<RoleGuard allowedRoles={['admin', 'pharmacist']}><LayoutWrapper><InventoryCategoriesList /></LayoutWrapper></RoleGuard>} />
        <Route path="/inventory/categories/add" element={<RoleGuard allowedRoles={['admin', 'pharmacist']}><LayoutWrapper><CategoryForm /></LayoutWrapper></RoleGuard>} />
        <Route path="/inventory/categories/edit/:id" element={<RoleGuard allowedRoles={['admin', 'pharmacist']}><LayoutWrapper><CategoryForm /></LayoutWrapper></RoleGuard>} />
        
        <Route path="/inventory/items" element={<RoleGuard allowedRoles={['admin', 'pharmacist']}><LayoutWrapper><InventoryItemsList /></LayoutWrapper></RoleGuard>} />
        <Route path="/inventory/items/add" element={<RoleGuard allowedRoles={['admin', 'pharmacist']}><LayoutWrapper><InventoryItemForm /></LayoutWrapper></RoleGuard>} />
        <Route path="/inventory/items/edit/:id" element={<RoleGuard allowedRoles={['admin', 'pharmacist']}><LayoutWrapper><InventoryItemForm /></LayoutWrapper></RoleGuard>} />

        {/* Suppliers & Stock Receipts Routes */}
        <Route path="/inventory/suppliers" element={<RoleGuard allowedRoles={['admin', 'pharmacist']}><LayoutWrapper><SuppliersList /></LayoutWrapper></RoleGuard>} />
        <Route path="/inventory/suppliers/add" element={<RoleGuard allowedRoles={['admin', 'pharmacist']}><LayoutWrapper><SupplierForm /></LayoutWrapper></RoleGuard>} />
        <Route path="/inventory/suppliers/edit/:id" element={<RoleGuard allowedRoles={['admin', 'pharmacist']}><LayoutWrapper><SupplierForm /></LayoutWrapper></RoleGuard>} />

        <Route path="/inventory/receipts" element={<RoleGuard allowedRoles={['admin', 'pharmacist']}><LayoutWrapper><StockReceiptsList /></LayoutWrapper></RoleGuard>} />
        <Route path="/inventory/receipts/add" element={<RoleGuard allowedRoles={['admin', 'pharmacist']}><LayoutWrapper><StockReceiptForm /></LayoutWrapper></RoleGuard>} />
        <Route path="/inventory/receipts/edit/:id" element={<RoleGuard allowedRoles={['admin', 'pharmacist']}><LayoutWrapper><StockReceiptForm /></LayoutWrapper></RoleGuard>} />
        <Route path="/inventory/receipts/view/:id" element={<RoleGuard allowedRoles={['admin', 'pharmacist']}><LayoutWrapper><StockReceiptView /></LayoutWrapper></RoleGuard>} />

        {/* Pharmacy Sales & Prescriptions */}
        <Route path="/pharmacy/prescriptions" element={<RoleGuard allowedRoles={['admin', 'pharmacist', 'doctor']}><LayoutWrapper><PrescriptionsList /></LayoutWrapper></RoleGuard>} />
        <Route path="/pharmacy/prescriptions/add" element={<RoleGuard allowedRoles={['admin', 'pharmacist', 'doctor']}><LayoutWrapper><PrescriptionForm /></LayoutWrapper></RoleGuard>} />
        <Route path="/pharmacy/prescriptions/edit/:id" element={<RoleGuard allowedRoles={['admin', 'pharmacist', 'doctor']}><LayoutWrapper><PrescriptionForm /></LayoutWrapper></RoleGuard>} />

        <Route path="/pharmacy/sales" element={<RoleGuard allowedRoles={['admin', 'pharmacist']}><LayoutWrapper><WithdrawalsList /></LayoutWrapper></RoleGuard>} />
        <Route path="/pharmacy/sales/add" element={<RoleGuard allowedRoles={['admin', 'pharmacist']}><LayoutWrapper><WithdrawalForm /></LayoutWrapper></RoleGuard>} />
        <Route path="/pharmacy/sales/edit/:id" element={<RoleGuard allowedRoles={['admin', 'pharmacist']}><LayoutWrapper><WithdrawalForm /></LayoutWrapper></RoleGuard>} />

        {/* Billing & Insurance */}
        <Route path="/billing/insurance" element={<RoleGuard allowedRoles={['admin', 'receptionist']}><LayoutWrapper><InsuranceProvidersList /></LayoutWrapper></RoleGuard>} />
        <Route path="/billing/insurance/add" element={<RoleGuard allowedRoles={['admin', 'receptionist']}><LayoutWrapper><InsuranceProviderForm /></LayoutWrapper></RoleGuard>} />
        <Route path="/billing/insurance/edit/:id" element={<RoleGuard allowedRoles={['admin', 'receptionist']}><LayoutWrapper><InsuranceProviderForm /></LayoutWrapper></RoleGuard>} />

        <Route path="/billing/patient-insurance" element={<RoleGuard allowedRoles={['admin', 'receptionist', 'doctor']}><LayoutWrapper><PatientInsuranceList /></LayoutWrapper></RoleGuard>} />
        <Route path="/billing/patient-insurance/add" element={<RoleGuard allowedRoles={['admin', 'receptionist', 'doctor']}><LayoutWrapper><PatientInsuranceForm /></LayoutWrapper></RoleGuard>} />
        <Route path="/billing/patient-insurance/edit/:id" element={<RoleGuard allowedRoles={['admin', 'receptionist', 'doctor']}><LayoutWrapper><PatientInsuranceForm /></LayoutWrapper></RoleGuard>} />
        <Route path="/patients/:patient_id/insurance/add" element={<RoleGuard allowedRoles={['admin', 'receptionist', 'doctor']}><LayoutWrapper><PatientInsuranceForm /></LayoutWrapper></RoleGuard>} />

        <Route path="/billing/records" element={<RoleGuard allowedRoles={['admin', 'receptionist']}><LayoutWrapper><BillingList /></LayoutWrapper></RoleGuard>} />
        <Route path="/billing/records/add" element={<RoleGuard allowedRoles={['admin', 'receptionist']}><LayoutWrapper><BillingForm /></LayoutWrapper></RoleGuard>} />
        <Route path="/billing/records/edit/:id" element={<RoleGuard allowedRoles={['admin', 'receptionist']}><LayoutWrapper><BillingForm /></LayoutWrapper></RoleGuard>} />

      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
