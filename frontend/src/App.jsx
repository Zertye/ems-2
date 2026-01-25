/**
 * App.jsx - Composant racine de l'application
 * Gère le routing et les providers de contexte
 */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Contexts
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

// Routes protégées
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from "./components/auth/ProtectedRoute";

// Pages publiques
import { Landing } from "./pages/public/Landing";
import { Login } from "./pages/public/Login";
import { PublicBooking } from "./pages/public/PublicBooking";

// Pages privées
import { Dashboard } from "./pages/private/Dashboard";
import { Patients } from "./pages/private/Patients";
import { Appointments } from "./pages/private/Appointments";
import { Diagnosis } from "./pages/private/Diagnosis";
import { Reports } from "./pages/private/Reports";
import { Roster } from "./pages/private/Roster";
import { Admin } from "./pages/private/Admin";
import { MedicalVisits } from "./pages/private/MedicalVisits"; // Import de la nouvelle page

/**
 * Composant App principal
 */
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<Landing />} />
            <Route path="/book" element={<PublicBooking />} />
            
            {/* Login - Redirige vers dashboard si déjà connecté */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />

            {/* Routes protégées (authentification requise) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/patients"
              element={
                <ProtectedRoute>
                  <Patients />
                </ProtectedRoute>
              }
            />

            <Route
              path="/appointments"
              element={
                <ProtectedRoute>
                  <Appointments />
                </ProtectedRoute>
              }
            />

            <Route
              path="/diagnosis"
              element={
                <ProtectedRoute>
                  <Diagnosis />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />

            {/* Nouvelle Route : Visite Médicale LSPD */}
            <Route
              path="/medical-visits"
              element={
                <ProtectedRoute>
                  <MedicalVisits />
                </ProtectedRoute>
              }
            />

            <Route
              path="/roster"
              element={
                <ProtectedRoute>
                  <Roster />
                </ProtectedRoute>
              }
            />

            {/* Admin - Utilise AdminRoute qui vérifie canAccessAdmin */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              }
            />

            {/* Catch-all - Redirige vers l'accueil */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
