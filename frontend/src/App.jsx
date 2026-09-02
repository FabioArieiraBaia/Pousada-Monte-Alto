import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppFloating from './components/WhatsAppFloating';

// Public Pages
import HomePage from './pages/public/HomePage';
import AccommodationsPage from './pages/public/AccommodationsPage';
import RoomDetailPage from './pages/public/RoomDetailPage';
import AboutLocationPage from './pages/public/AboutLocationPage';
import BlogPage from './pages/public/BlogPage';
import BlogPostPage from './pages/public/BlogPostPage';
import ContactPage from './pages/public/ContactPage';

// Admin Pages
import AdminLayout from './components/admin/AdminLayout';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminRoomsPage from './pages/admin/AdminRoomsPage';
import AdminReservationsPage from './pages/admin/AdminReservationsPage';
import AdminFinancePage from './pages/admin/AdminFinancePage';
import AdminBlogPage from './pages/admin/AdminBlogPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-sand-50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloating />
    </div>
  );
}

// Support both subfolder deployment (/montealto) and root
const getBasename = () => {
  return window.location.pathname.startsWith('/montealto') ? '/montealto' : '';
};

export default function App() {
  return (
    <Router basename={getBasename()}>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/acomodacoes" element={<AccommodationsPage />} />
          <Route path="/acomodacoes/:slug" element={<RoomDetailPage />} />
          <Route path="/sobre-localizacao" element={<AboutLocationPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/contato" element={<ContactPage />} />
        </Route>

        {/* Admin Login */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Admin Protected CMS */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="acomodacoes" element={<AdminRoomsPage />} />
          <Route path="reservas" element={<AdminReservationsPage />} />
          <Route path="financeiro" element={<AdminFinancePage />} />
          <Route path="blog" element={<AdminBlogPage />} />
          <Route path="configuracoes" element={<AdminSettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
