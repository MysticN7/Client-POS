import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Expenses from './pages/Expenses';
import JobCards from './pages/JobCards';
import InvoiceSettings from './pages/InvoiceSettings';
import SalesInvoices from './pages/SalesInvoices';
import BankBook from './pages/BankBook';
import CashBook from './pages/CashBook';
import ProfitLoss from './pages/ProfitLoss';
import Customers from './pages/Customers';
import Layout from './components/Layout';

import ProtectedRoute from './components/ProtectedRoute';
import Users from './pages/Users';

function LoginRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return isAuthenticated ? <Navigate to="/" /> : <Login />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<ProtectedRoute permission="DASHBOARD"><Dashboard /></ProtectedRoute>} />
            <Route path="pos" element={<ProtectedRoute permission="POS"><POS /></ProtectedRoute>} />
            <Route path="inventory" element={<ProtectedRoute permission="INVENTORY"><Inventory /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute permission="REPORTS"><Reports /></ProtectedRoute>} />
            <Route path="expenses" element={<ProtectedRoute permission="EXPENSES"><Expenses /></ProtectedRoute>} />
            <Route path="job-cards" element={<ProtectedRoute permission="JOBCARDS"><JobCards /></ProtectedRoute>} />
            <Route path="invoice-settings" element={<ProtectedRoute permission="SETTINGS"><InvoiceSettings /></ProtectedRoute>} />
            <Route path="sales-invoices" element={<ProtectedRoute permission="POS"><SalesInvoices /></ProtectedRoute>} />
            <Route path="customers" element={<ProtectedRoute permission="POS"><Customers /></ProtectedRoute>} />
            <Route path="bank-book" element={<ProtectedRoute permission="REPORTS"><BankBook /></ProtectedRoute>} />
            <Route path="cash-book" element={<ProtectedRoute permission="REPORTS"><CashBook /></ProtectedRoute>} />
            <Route path="profit-loss" element={<ProtectedRoute permission="REPORTS"><ProfitLoss /></ProtectedRoute>} />
            <Route path="users" element={<ProtectedRoute permission="USERS"><Users /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
