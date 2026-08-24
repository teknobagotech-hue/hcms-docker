import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
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

import PrescriptionsList from './pages/pharmacy/PrescriptionsList';
import PrescriptionForm from './pages/pharmacy/PrescriptionForm';
import WithdrawalsList from './pages/pharmacy/WithdrawalsList';
import WithdrawalForm from './pages/pharmacy/WithdrawalForm';

import InsuranceProvidersList from './pages/billing/InsuranceProvidersList';
import InsuranceProviderForm from './pages/billing/InsuranceProviderForm';
import BillingList from './pages/billing/BillingList';
import BillingForm from './pages/billing/BillingForm';

import { supabase } from './supabaseClient';
import './index.css';

function PrivateRoute({ children, session }) {
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-gray)' }}>
        Loading session...
      </div>
    );
  }

  const Layout = ({ children }) => (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} />
      <div className="main-content">
        <Header toggleSidebar={toggleSidebar} />
        {children}
      </div>
    </div>
  );

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
        
        {/* Dashboard Route */}
        <Route 
          path="/" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          } 
        />

        {/* Departments Routes */}
        <Route 
          path="/departments" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <DepartmentsList />
              </Layout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/departments/add" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <DepartmentForm />
              </Layout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/departments/edit/:id" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <DepartmentForm />
              </Layout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/departments/view/:id" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <DepartmentView />
              </Layout>
            </PrivateRoute>
          } 
        />

        {/* Doctors Routes */}
        <Route 
          path="/doctors" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <DoctorsList />
              </Layout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/doctors/add" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <DoctorForm />
              </Layout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/doctors/edit/:id" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <DoctorForm />
              </Layout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/doctors/view/:id" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <DoctorView />
              </Layout>
            </PrivateRoute>
          } 
        />

        {/* Users Routes */}
        <Route 
          path="/users" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <UsersList />
              </Layout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/users/add" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <UserForm />
              </Layout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/users/edit/:id" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <UserForm />
              </Layout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/users/view/:id" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <UserView />
              </Layout>
            </PrivateRoute>
          } 
        />

        {/* Profile Route */}
        <Route 
          path="/profile" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <Profile />
              </Layout>
            </PrivateRoute>
          } 
        />

        {/* Patients Routes */}
        <Route 
          path="/patients" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <PatientsList />
              </Layout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/patients/add" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <PatientForm />
              </Layout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/patients/edit/:id" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <PatientForm />
              </Layout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/patients/view/:id" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <PatientView />
              </Layout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/patients/print/:id" 
          element={
            <PrivateRoute session={session}>
              <PatientPrint />
            </PrivateRoute>
          } 
        />
        
        {/* Document Scanner Route */}
        <Route 
          path="/patients/scan" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <DocumentScanner />
              </Layout>
            </PrivateRoute>
          } 
        />

        {/* Generic Record View Route */}
        <Route 
          path="/patients/:id/view/:type/:recordId" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <RecordView />
              </Layout>
            </PrivateRoute>
          } 
        />

        {/* Appointments Sub-module Routes */}
        <Route 
          path="/patients/:patient_id/appointments/add" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <AppointmentForm />
              </Layout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/patients/:patient_id/appointments/edit/:id" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <AppointmentForm />
              </Layout>
            </PrivateRoute>
          } 
        />

        {/* Vitals Sub-module Routes */}
        <Route 
          path="/patients/:patient_id/vitals/add" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <VitalSignsForm />
              </Layout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/patients/:patient_id/vitals/edit/:id" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <VitalSignsForm />
              </Layout>
            </PrivateRoute>
          } 
        />

        {/* Medical Records Sub-module Routes */}
        <Route 
          path="/patients/:patient_id/records/add" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <MedicalRecordForm />
              </Layout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/patients/:patient_id/records/edit/:id" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <MedicalRecordForm />
              </Layout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/patients/:patient_id/cardio/edit" 
          element={
            <PrivateRoute session={session}>
              <Layout>
                <CardioHistoryForm />
              </Layout>
            </PrivateRoute>
          } 
        />

        {/* Phase 4: Labs & Imaging Routes */}
        <Route path="/patients/:patient_id/lab/cbc/add" element={<PrivateRoute session={session}><Layout><CBCForm /></Layout></PrivateRoute>} />
        <Route path="/patients/:patient_id/lab/cbc/edit/:id" element={<PrivateRoute session={session}><Layout><CBCForm /></Layout></PrivateRoute>} />
        
        <Route path="/patients/:patient_id/lab/chem/add" element={<PrivateRoute session={session}><Layout><ChemForm /></Layout></PrivateRoute>} />
        <Route path="/patients/:patient_id/lab/chem/edit/:id" element={<PrivateRoute session={session}><Layout><ChemForm /></Layout></PrivateRoute>} />
        
        <Route path="/patients/:patient_id/lab/serology/add" element={<PrivateRoute session={session}><Layout><SerologyForm /></Layout></PrivateRoute>} />
        <Route path="/patients/:patient_id/lab/serology/edit/:id" element={<PrivateRoute session={session}><Layout><SerologyForm /></Layout></PrivateRoute>} />
        
        <Route path="/patients/:patient_id/lab/ua/add" element={<PrivateRoute session={session}><Layout><UrinalysisForm /></Layout></PrivateRoute>} />
        <Route path="/patients/:patient_id/lab/ua/edit/:id" element={<PrivateRoute session={session}><Layout><UrinalysisForm /></Layout></PrivateRoute>} />
        
        <Route path="/patients/:patient_id/lab/imaging/add" element={<PrivateRoute session={session}><Layout><ImagingForm /></Layout></PrivateRoute>} />
        <Route path="/patients/:patient_id/lab/imaging/edit/:id" element={<PrivateRoute session={session}><Layout><ImagingForm /></Layout></PrivateRoute>} />
        
        <Route path="/patients/:patient_id/lab/docs/add" element={<PrivateRoute session={session}><Layout><MedicalDocumentForm /></Layout></PrivateRoute>} />
        <Route path="/patients/:patient_id/lab/docs/edit/:id" element={<PrivateRoute session={session}><Layout><MedicalDocumentForm /></Layout></PrivateRoute>} />

        {/* Phase 1: Inventory & Medicines Routes */}
        <Route path="/inventory/medicines" element={<PrivateRoute session={session}><Layout><MedicinesList /></Layout></PrivateRoute>} />
        <Route path="/inventory/medicines/add" element={<PrivateRoute session={session}><Layout><MedicineForm /></Layout></PrivateRoute>} />
        <Route path="/inventory/medicines/edit/:id" element={<PrivateRoute session={session}><Layout><MedicineForm /></Layout></PrivateRoute>} />
        
        <Route path="/inventory/categories" element={<PrivateRoute session={session}><Layout><InventoryCategoriesList /></Layout></PrivateRoute>} />
        <Route path="/inventory/categories/add" element={<PrivateRoute session={session}><Layout><CategoryForm /></Layout></PrivateRoute>} />
        <Route path="/inventory/categories/edit/:id" element={<PrivateRoute session={session}><Layout><CategoryForm /></Layout></PrivateRoute>} />
        
        <Route path="/inventory/items" element={<PrivateRoute session={session}><Layout><InventoryItemsList /></Layout></PrivateRoute>} />
        <Route path="/inventory/items/add" element={<PrivateRoute session={session}><Layout><InventoryItemForm /></Layout></PrivateRoute>} />
        <Route path="/inventory/items/edit/:id" element={<PrivateRoute session={session}><Layout><InventoryItemForm /></Layout></PrivateRoute>} />

        {/* Phase 2: Suppliers & Stock Receipts Routes */}
        <Route path="/inventory/suppliers" element={<PrivateRoute session={session}><Layout><SuppliersList /></Layout></PrivateRoute>} />
        <Route path="/inventory/suppliers/add" element={<PrivateRoute session={session}><Layout><SupplierForm /></Layout></PrivateRoute>} />
        <Route path="/inventory/suppliers/edit/:id" element={<PrivateRoute session={session}><Layout><SupplierForm /></Layout></PrivateRoute>} />

        <Route path="/inventory/receipts" element={<PrivateRoute session={session}><Layout><StockReceiptsList /></Layout></PrivateRoute>} />
        <Route path="/inventory/receipts/add" element={<PrivateRoute session={session}><Layout><StockReceiptForm /></Layout></PrivateRoute>} />
        <Route path="/inventory/receipts/edit/:id" element={<PrivateRoute session={session}><Layout><StockReceiptForm /></Layout></PrivateRoute>} />

        {/* Phase 3: Pharmacy Sales & Prescriptions */}
        <Route path="/pharmacy/prescriptions" element={<PrivateRoute session={session}><Layout><PrescriptionsList /></Layout></PrivateRoute>} />
        <Route path="/pharmacy/prescriptions/add" element={<PrivateRoute session={session}><Layout><PrescriptionForm /></Layout></PrivateRoute>} />
        <Route path="/pharmacy/prescriptions/edit/:id" element={<PrivateRoute session={session}><Layout><PrescriptionForm /></Layout></PrivateRoute>} />

        <Route path="/pharmacy/sales" element={<PrivateRoute session={session}><Layout><WithdrawalsList /></Layout></PrivateRoute>} />
        <Route path="/pharmacy/sales/add" element={<PrivateRoute session={session}><Layout><WithdrawalForm /></Layout></PrivateRoute>} />
        <Route path="/pharmacy/sales/edit/:id" element={<PrivateRoute session={session}><Layout><WithdrawalForm /></Layout></PrivateRoute>} />

        {/* Phase 4: Billing & Insurance */}
        <Route path="/billing/insurance" element={<PrivateRoute session={session}><Layout><InsuranceProvidersList /></Layout></PrivateRoute>} />
        <Route path="/billing/insurance/add" element={<PrivateRoute session={session}><Layout><InsuranceProviderForm /></Layout></PrivateRoute>} />
        <Route path="/billing/insurance/edit/:id" element={<PrivateRoute session={session}><Layout><InsuranceProviderForm /></Layout></PrivateRoute>} />

        <Route path="/billing/records" element={<PrivateRoute session={session}><Layout><BillingList /></Layout></PrivateRoute>} />
        <Route path="/billing/records/add" element={<PrivateRoute session={session}><Layout><BillingForm /></Layout></PrivateRoute>} />
        <Route path="/billing/records/edit/:id" element={<PrivateRoute session={session}><Layout><BillingForm /></Layout></PrivateRoute>} />

      </Routes>
    </Router>
  );
}

export default App;
