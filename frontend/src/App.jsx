import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ChatbotDrawer } from './components/ChatbotDrawer';
import { HomePage } from './pages/HomePage';
import { SchemeListPage } from './pages/SchemeListPage';
import { SchemeDetailPage } from './pages/SchemeDetailPage';
import { EligibilityCheckerPage } from './pages/EligibilityCheckerPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { VerifyCertificatePage } from './pages/VerifyCertificatePage';

export function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/schemes" element={<SchemeListPage />} />
              <Route path="/schemes/:schemeId" element={<SchemeDetailPage />} />
              <Route path="/eligibility-checker" element={<EligibilityCheckerPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin-panel" element={<AdminPanelPage />} />
              <Route path="/verify-certificate/:verificationId" element={<VerifyCertificatePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Routes>
          </main>
          <ChatbotDrawer />
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
