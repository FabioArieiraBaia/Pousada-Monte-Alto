import React, { useEffect, useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppFloating from './components/WhatsAppFloating';
import InteractiveVideoBackground from './components/InteractiveVideoBackground';

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
import AdminGalleryPage from './pages/admin/AdminGalleryPage';
import AdminReservationsPage from './pages/admin/AdminReservationsPage';
import AdminFinancePage from './pages/admin/AdminFinancePage';
import AdminBlogPage from './pages/admin/AdminBlogPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

// Background Video Mode Context
export const VideoBackgroundContext = createContext({
  heroMode: 'sea',
  setHeroMode: () => {}
});

export const useVideoBackground = () => useContext(VideoBackgroundContext);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PublicLayout() {
  const { heroMode } = useVideoBackground();

  return (
    <div className="relative min-h-screen flex flex-col bg-stone-950 text-stone-100">
      {/* 🎬 Global Seamless 60FPS Video Background for ALL Public Pages */}
      <InteractiveVideoBackground mode={heroMode} />

      <Navbar />
      <main className="relative z-10 flex-1">
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
  const [heroMode, setHeroMode] = useState('sea');

  return (
    <VideoBackgroundContext.Provider value={{ heroMode, setHeroMode }}>
      <Router basename={getBasename()}>
        <ScrollToTop />
        <Routes>
          {/* Public Routes with Global Video Background */}
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
            <Route path="galeria" element={<AdminGalleryPage />} />
            <Route path="reservas" element={<AdminReservationsPage />} />
            <Route path="financeiro" element={<AdminFinancePage />} />
            <Route path="blog" element={<AdminBlogPage />} />
            <Route path="configuracoes" element={<AdminSettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </VideoBackgroundContext.Provider>
  );
}
