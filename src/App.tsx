import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import Dashboard from './pages/Dashboard';
import Contracts from './pages/Contracts';
import ContractDetails from './pages/ContractDetails';
import Finances from './pages/Finances';
import Employees from './pages/Employees';
import EmployeeDismissals from './pages/EmployeeDismissals';
import { EmployeeVacations } from './pages/EmployeeVacations';
import HRAttachments from './pages/HRAttachments';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="contracts" element={<Contracts />} />
            <Route path="contracts/:id" element={<ContractDetails />} />
            <Route path="finances" element={<Finances />} />
            <Route path="employees" element={<Employees />} />
            <Route path="employee-dismissals" element={<EmployeeDismissals />} />
            <Route path="employee-vacations" element={<EmployeeVacations />} />
            <Route path="hr-attachments" element={<HRAttachments />} />
          </Route>
          {/* Rotas de Administrador */}
          <Route element={<AdminRoute />}>
            <Route path="users" element={<UserManagement />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
