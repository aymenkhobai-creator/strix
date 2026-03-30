import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Storefront from './pages/Storefront';
import ProductDetailPage from './pages/ProductDetailPage';
import DashboardLayout from './components/admin/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import ProductsPage from './pages/ProductsPage';
import OrdersManager from './pages/OrdersManager';
import WorkersManager from './pages/WorkersManager';
import SettingsManager from './pages/SettingsManager';
import ShippingSettings from './pages/ShippingSettings';

export default function App() {
  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Public Storefront */}
        <Route path="/" element={<Storefront />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />

        {/* Admin Dashboard with Shell */}
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="orders" element={<OrdersManager />} />
          <Route path="workers" element={<WorkersManager />} />
          <Route path="shipping" element={<ShippingSettings />} />
          <Route path="settings" element={<SettingsManager />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
