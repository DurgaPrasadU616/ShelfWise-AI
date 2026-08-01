import { lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from '../layouts/auth-layout';
import DashboardLayout from '../layouts/dashboard-layout';
import { RequireAuth, RequireRole } from './guards';
import { ROLES } from '../constants/roles';

const Login = lazy(() => import('../pages/login'));
const Register = lazy(() => import('../pages/register'));
const Dashboard = lazy(() => import('../pages/dashboard'));
const Products = lazy(() => import('../pages/products'));
const Inventory = lazy(() => import('../pages/inventory'));
const Suppliers = lazy(() => import('../pages/suppliers'));
const Sales = lazy(() => import('../pages/sales'));
const PurchaseOrders = lazy(() => import('../pages/purchase-orders'));
const Ocr = lazy(() => import('../pages/ocr'));
const Recommendations = lazy(() => import('../pages/recommendations'));
const Reports = lazy(() => import('../pages/reports'));
const Notifications = lazy(() => import('../pages/notifications'));
const Settings = lazy(() => import('../pages/settings'));
const Users = lazy(() => import('../pages/users'));
const NotFound = lazy(() => import('../pages/not-found'));

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route
          element={
            <RequireAuth>
              <DashboardLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/ocr" element={<Ocr />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route
            path="/users"
            element={
              <RequireRole roles={[ROLES.ADMIN]}>
                <Users />
              </RequireRole>
            }
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
