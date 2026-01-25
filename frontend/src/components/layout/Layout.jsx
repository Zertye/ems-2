/**
 * Layout - Composant de mise en page principale avec sidebar
 */
import { useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  Users,
  ClipboardList,
  Stethoscope,
  ShieldAlert,
  LogOut,
  LayoutDashboard,
  FileText,
  Menu,
  X,
  User,
  Camera,
  ShieldCheck, // Import de l'icône pour la visite médicale
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { apiFetch } from "../../utils/api";
import { Logo, Watermark, InputField } from "../ui/FormElements";
import { ThemeToggle } from "../ui/ThemeToggle";

/**
 * Item de la sidebar
 */
function SidebarItem({ icon: Icon, label, to, active }) {
  return (
    <Link to={to} className={`sidebar-item ${active ? "sidebar-item-active" : ""}`}>
      <Icon size={18} strokeWidth={1.75} />
      <span>{label}</span>
    </Link>
  );
}

/**
 * Modal de profil utilisateur
 */
function ProfileModal({ user, onClose, onSave }) {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    phone: user?.phone || "",
    password: "",
    profile_picture: null,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const formData = new FormData();
    formData.append("first_name", form.first_name);
    formData.append("last_name", form.last_name);
    formData.append("phone", form.phone);
    
    if (form.password) {
      formData.append("password", form.password);
    }
    
    if (form.profile_picture instanceof File) {
      formData.append("profile_picture", form.profile_picture);
    }
    
    try {
      await apiFetch("/api/users/me", { method: "PUT", body: formData });
      await onSave();
      onClose();
    } catch (error) {
      console.error("Erreur sauvegarde profil:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md shadow-2xl animate-in border dark:border-slate-700">
        <div className="flex justify-between items-center p-5 border-b dark:border-slate-700">
          <h2 className="font-bold text-lg text-slate-800 dark:text-white">Mon Profil</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-white rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Photo de profil */}
          <div className="flex justify-center">
            <div
              className="w-24 h-24 rounded-full bg-slate-200 border-4 border-slate-300 flex items-center justify-center relative overflow-hidden group cursor-pointer shadow-lg"
              onClick={() => fileInputRef.current?.click()}
            >
              {form.profile_picture ? (
                <img src={URL.createObjectURL(form.profile_picture)} className="w-full h-full object-cover" alt="" />
              ) : user?.profile_picture ? (
                <img src={user.profile_picture} className="w-full h-full object-cover" alt="" />
              ) : (
                <User size={40} className="text-slate-400" />
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={24} />
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => setForm({ ...form, profile_picture: e.target.files[0] })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Prénom"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              required
            />
            <InputField
              label="Nom"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              required
            />
          </div>
          
          <InputField
            label="Téléphone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          
          <div className="border-t dark:border-slate-700 pt-3 mt-1">
            <p className="label mb-2 text-red-600 dark:text-red-400">Sécurité</p>
            <InputField
              label="Nouveau mot de passe"
              type="password"
              placeholder="Laisser vide pour ne pas changer"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Composant Layout principal
 */
export function Layout({ children }) {
  const { user, logout, isAdmin, canAccessAdmin, refreshUser } = useAuth();
  const location = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Configuration de la navigation
  const navItems = [
    { icon: LayoutDashboard, label: "Tableau de bord", to: "/dashboard" },
    { icon: ClipboardList, label: "Rendez-vous", to: "/appointments" },
    { icon: Users, label: "Patients", to: "/patients" },
    { icon: Stethoscope, label: "Diagnostic", to: "/diagnosis" },
    { icon: FileText, label: "Rapports", to: "/reports" },
    { icon: ShieldCheck, label: "Visite Médicale", to: "/medical-visits" }, // Ajout de l'onglet Visite Médicale
    { icon: Activity, label: "Effectifs", to: "/roster" },
  ];

  // Ajouter l'admin si l'utilisateur y a accès
  if (canAccessAdmin) {
    navItems.push({ icon: ShieldAlert, label: "Administration", to: "/admin" });
  }

  return (
    <div className="min-h-screen flex relative">
      {/* Watermark */}
      <Watermark />

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar fixed h-full z-30 shadow-2xl">
        {/* Header Sidebar */}
        <div className="p-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-lg">
              <Logo size={36} />
            </div>
            <div>
              <h1 className="text-white font-bold text-base">MRSA</h1>
              <p className="text-slate-400 text-xs font-medium">Gestion Médicale</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="section-title mt-1">Navigation</p>
          {navItems.map((item) => (
            <SidebarItem
              key={item.to}
              icon={item.icon}
              label={item.label}
              to={item.to}
              active={location.pathname === item.to}
            />
          ))}
        </nav>

        {/* Footer Sidebar - Profil */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
          <button
            onClick={() => setShowProfileModal(true)}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-sidebar-hover transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden ring-2 ring-slate-500 group-hover:ring-red-500 transition-all">
              {user?.profile_picture ? (
                <img src={user.profile_picture} className="w-full h-full object-cover" alt="" />
              ) : (
                user?.username?.[0]?.toUpperCase() || "?"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-slate-400 truncate">{user?.grade_name}</p>
            </div>
          </button>
          
          <button
            onClick={logout}
            className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg text-sm font-semibold transition-all"
          >
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col lg:ml-64 transition-all duration-300">
        {/* Header Mobile */}
        <header className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-300 dark:border-slate-700 px-4 py-3 flex justify-between items-center sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 p-1 shadow">
              <Logo size={32} />
            </div>
            <span className="font-bold text-slate-800 dark:text-white">MRSA</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg dark:text-white"
            >
              <Menu size={22} />
            </button>
          </div>
        </header>

        {/* Menu Mobile */}
        {mobileMenu && (
          <div className="lg:hidden fixed inset-0 bg-white dark:bg-slate-900 z-50 p-4">
            <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-slate-700">
              <h2 className="text-lg font-bold dark:text-white">Menu</h2>
              <button
                onClick={() => setMobileMenu(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-white rounded-lg"
              >
                <X size={22} />
              </button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenu(false)}
                  className="flex items-center gap-3 p-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                >
                  <item.icon size={20} /> {item.label}
                </Link>
              ))}
              <div className="border-t dark:border-slate-700 my-4" />
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 p-3 text-red-600 font-semibold"
              >
                <LogOut size={20} /> Déconnexion
              </button>
            </nav>
          </div>
        )}

        {/* Contenu de la page */}
        <main className="flex-1 p-4 lg:p-6 relative z-10">
          {/* Theme Toggle Desktop */}
          <div className="hidden lg:block absolute top-6 right-6 z-50">
            <ThemeToggle />
          </div>
          <div className="max-w-7xl mx-auto animate-in">{children}</div>
        </main>
      </div>

      {/* Modal Profil */}
      {showProfileModal && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onSave={refreshUser}
        />
      )}
    </div>
  );
}

export default Layout;
