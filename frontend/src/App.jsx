import { BrowserRouter, Routes, Route, Navigate, useLocation, Link, useNavigate } from "react-router-dom"
import { createContext, useContext, useState, useEffect, useRef } from "react"
import { 
  Activity, Users, ClipboardList, Stethoscope, ShieldAlert, 
  LogOut, LayoutDashboard, FileText, Menu, X, 
  CheckCircle, HelpCircle, MessageSquare,
  Search, Plus, Clock, Edit2, Trash2, Check, Phone, User, FilePlus, ArrowLeft, Send, UserPlus, Eye, Camera, ChevronRight, ChevronDown,
  Moon, Sun, BarChart3, ScrollText, RefreshCw
} from "lucide-react"

// --- Theme Context ---
const ThemeContext = createContext(null)
export function useTheme() { return useContext(ThemeContext) }

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Vérifie localStorage ou préférence système
    if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
      return localStorage.getItem('theme')
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button 
      onClick={toggleTheme} 
      className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-yellow-400 hover:scale-105 transition-all shadow-sm border border-slate-300 dark:border-slate-600"
      title={theme === 'dark' ? "Passer en mode clair" : "Passer en mode sombre"}
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}

// --- Auth Context avec JWT ---
const AuthContext = createContext(null)
export function useAuth() { return useContext(AuthContext) }

// Helper pour les requêtes API avec token JWT
const TOKEN_KEY = "mrsa_auth_token";

export const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem(TOKEN_KEY);
  
  const headers = {
    ...options.headers,
  };
  
  // Ajouter le token si présent
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  // Ajouter Content-Type pour JSON si body présent et pas de FormData
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include" // Garde les cookies pour compatibilité
  });
  
  return response;
};

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fonction async pour récupérer l'utilisateur depuis le token
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setUser(null);
        setLoading(false);
        return null;
      }
      
      const r = await apiFetch("/api/auth/me");
      if (r.ok) {
        const d = await r.json();
        setUser(d.user);
        setLoading(false);
        return d.user;
      } else {
        // Token invalide, le supprimer
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setLoading(false);
        return null;
      }
    } catch (e) {
      console.error("[AUTH] fetchUser error:", e);
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setLoading(false);
      return null;
    }
  }

  useEffect(() => { fetchUser() }, [])

  const login = async (username, password) => {
    console.log("[AUTH] Début login JWT...")
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      
      console.log("[AUTH] Status HTTP:", res.status)
      
      if (!res.ok) {
        let text = "";
        try { text = await res.text(); } catch {}
        try {
          const errData = JSON.parse(text)
          return { success: false, error: errData.error || `Erreur HTTP ${res.status}` }
        } catch {
          return { success: false, error: `Erreur HTTP ${res.status}` }
        }
      }
      
      const data = await res.json();
      console.log("[AUTH] Réponse:", { success: data.success, hasToken: !!data.token, hasUser: !!data.user })
      
      if (data.success && data.token) {
        // Stocker le token JWT dans localStorage
        localStorage.setItem(TOKEN_KEY, data.token);
        console.log("[AUTH] ✅ Token JWT stocké")
        
        // Stocker l'user
        if (data.user) {
          setUser(data.user);
          setLoading(false);
          console.log("[AUTH] ✅ User:", data.user.username, "| Grade:", data.user.grade_level)
        }
        
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || "Identifiants incorrects" };
      }
    } catch (e) {
      console.error("[AUTH] Exception:", e)
      return { success: false, error: `Erreur: ${e.message || String(e)}` };
    }
  }

  const logout = async () => {
    localStorage.removeItem(TOKEN_KEY);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setUser(null)
    window.location.href = "/"
  }

  const isAdmin = user?.grade_level === 99 || user?.is_admin || user?.grade_level >= 10;
  const hasPerm = (perm) => {
    if (user?.grade_level === 99) return true;
    if (user?.is_admin) return true;
    return user?.grade_permissions?.[perm] === true;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, hasPerm, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// --- GLOBAL COMPONENTS ---
const InputField = ({ label, onKeyDown, className, ...props }) => (
  <div className={className}>
    {label && <label className="label">{label}</label>}
    <input 
      className="input-field"
      onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); if (onKeyDown) onKeyDown(e); }}
      {...props} 
    />
  </div>
)

const SelectField = ({ label, className, children, ...props }) => (
  <div className={className}>
    {label && <label className="label">{label}</label>}
    <select className="input-field appearance-none cursor-pointer" {...props}>{children}</select>
  </div>
)

const TextArea = ({ label, className, ...props }) => (
  <div className={className}>
    {label && <label className="label">{label}</label>}
    <textarea className="input-field min-h-[100px] resize-none" {...props} />
  </div>
)

// Logo Component
const Logo = ({ size = 40, className = "" }) => (
  <img 
    src="/logo.png" 
    alt="MRSA Logo" 
    className={`object-contain ${className}`}
    style={{ width: size, height: size }}
    onError={(e) => { e.target.style.display = 'none' }}
  />
)

// Watermark Component - Gros logo en bas à droite
const Watermark = () => (
  <div className="watermark">
    <img 
      src="/logo.png" 
      alt="" 
      className="w-full h-full object-contain"
      onError={(e) => { e.target.style.display = 'none' }}
    />
  </div>
)

// --- Layout ---
function SidebarItem({ icon: Icon, label, to, active }) {
  return (
    <Link to={to} className={`sidebar-item ${active ? "sidebar-item-active" : ""}`}>
      <Icon size={18} strokeWidth={1.75} />
      <span>{label}</span>
    </Link>
  )
}

function Layout({ children }) {
  const { user, logout, isAdmin, refreshUser } = useAuth()
  const location = useLocation()
  const [mobileMenu, setMobileMenu] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileForm, setProfileForm] = useState({ first_name: "", last_name: "", phone: "", password: "", profile_picture: null })
  
  const fileInputRef = useRef(null)

  const openProfile = () => {
    setProfileForm({ 
        first_name: user.first_name || "", 
        last_name: user.last_name || "", 
        phone: user.phone || "",
        password: "", // Reset password field
        profile_picture: null
    })
    setShowProfileModal(true)
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append("first_name", profileForm.first_name)
    formData.append("last_name", profileForm.last_name)
    formData.append("phone", profileForm.phone)
    if (profileForm.password) {
        formData.append("password", profileForm.password)
    }
    if (profileForm.profile_picture instanceof File) {
        formData.append("profile_picture", profileForm.profile_picture)
    }
    await apiFetch("/api/users/me", { method: "PUT", body: formData })
    await refreshUser()
    setShowProfileModal(false)
  }

  const navs = [
    { icon: LayoutDashboard, label: "Tableau de bord", to: "/dashboard" },
    { icon: ClipboardList, label: "Rendez-vous", to: "/appointments" },
    { icon: Users, label: "Patients", to: "/patients" },
    { icon: Stethoscope, label: "Diagnostic", to: "/diagnosis" },
    { icon: FileText, label: "Rapports", to: "/reports" },
    { icon: Activity, label: "Effectifs", to: "/roster" },
  ]
  if (isAdmin || user?.grade_permissions?.manage_users) navs.push({ icon: ShieldAlert, label: "Administration", to: "/admin" })

  return (
    <div className="min-h-screen flex relative">
      {/* Watermark */}
      <Watermark />

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar fixed h-full z-30 shadow-2xl">
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

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="section-title mt-1">Navigation</p>
          {navs.map(n => <SidebarItem key={n.to} {...n} active={location.pathname === n.to} />)}
        </nav>

        <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
          <button onClick={openProfile} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-sidebar-hover transition-all text-left group">
            <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden ring-2 ring-slate-500 group-hover:ring-blue-500 transition-all">
                {user?.profile_picture ? (
                    <img src={user.profile_picture} className="w-full h-full object-cover" />
                ) : (
                    user?.username?.[0].toUpperCase()
                )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.grade_name}</p>
            </div>
          </button>
          <button onClick={logout} className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg text-sm font-semibold transition-all">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col lg:ml-64 transition-all duration-300">
        <header className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-300 dark:border-slate-700 px-4 py-3 flex justify-between items-center sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 p-1 shadow">
               <Logo size={32} />
             </div>
             <span className="font-bold text-slate-800 dark:text-white">MRSA</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => setMobileMenu(!mobileMenu)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg dark:text-white"><Menu size={22} /></button>
          </div>
        </header>
        
        {mobileMenu && (
          <div className="lg:hidden fixed inset-0 bg-white dark:bg-slate-900 z-50 p-4">
            <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-slate-700">
              <h2 className="text-lg font-bold dark:text-white">Menu</h2>
              <button onClick={() => setMobileMenu(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-white rounded-lg"><X size={22} /></button>
            </div>
            <nav className="space-y-1">
              {navs.map(n => (
                <Link key={n.to} to={n.to} onClick={() => setMobileMenu(false)} className="flex items-center gap-3 p-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium">
                  <n.icon size={20} /> {n.label}
                </Link>
              ))}
              <div className="border-t dark:border-slate-700 my-4" />
              <button onClick={logout} className="w-full flex items-center gap-3 p-3 text-red-600 font-semibold">
                <LogOut size={20} /> Déconnexion
              </button>
            </nav>
          </div>
        )}

        <main className="flex-1 p-4 lg:p-6 relative z-10">
          {/* Desktop Theme Toggle: Positionné en absolu en haut à droite */}
          <div className="hidden lg:block absolute top-6 right-6 z-50">
             <ThemeToggle />
          </div>
          <div className="max-w-7xl mx-auto animate-in">{children}</div>
        </main>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md shadow-2xl animate-in border dark:border-slate-700">
            <div className="flex justify-between items-center p-5 border-b dark:border-slate-700">
              <h2 className="font-bold text-lg text-slate-800 dark:text-white">Mon Profil</h2>
              <button onClick={() => setShowProfileModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-white rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={saveProfile} className="p-5 space-y-4">
              <div className="flex justify-center">
                  <div 
                      className="w-24 h-24 rounded-full bg-slate-200 border-4 border-slate-300 flex items-center justify-center relative overflow-hidden group cursor-pointer shadow-lg"
                      onClick={() => fileInputRef.current.click()}
                  >
                      {profileForm.profile_picture ? (
                          <img src={URL.createObjectURL(profileForm.profile_picture)} className="w-full h-full object-cover" />
                      ) : user?.profile_picture ? (
                          <img src={user.profile_picture} className="w-full h-full object-cover" />
                      ) : (
                          <User size={40} className="text-slate-400" />
                      )}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="text-white" size={24} />
                      </div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => setProfileForm({...profileForm, profile_picture: e.target.files[0]})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <InputField label="Prénom" value={profileForm.first_name} onChange={e => setProfileForm({...profileForm, first_name: e.target.value})} required />
                 <InputField label="Nom" value={profileForm.last_name} onChange={e => setProfileForm({...profileForm, last_name: e.target.value})} required />
              </div>
              <InputField label="Téléphone" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
              <div className="border-t dark:border-slate-700 pt-3 mt-1">
                 <p className="label mb-2 text-blue-600 dark:text-blue-400">Sécurité</p>
                 <InputField label="Nouveau mot de passe" type="password" placeholder="Laisser vide pour ne pas changer" value={profileForm.password} onChange={e => setProfileForm({...profileForm, password: e.target.value})} />
              </div>
              
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowProfileModal(false)} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" className="btn-primary flex-1">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color = "blue" }) {
  const colors = {
    // Ajout des variantes dark pour les fonds et bordures
    blue: { icon: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800" },
    green: { icon: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800" },
    yellow: { icon: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800" },
    red: { icon: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800" },
  }
  const c = colors[color]
  return (
    <div className={`card p-5 border-l-4 ${c.border}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
          <p className="stat-value text-slate-800 dark:text-slate-100">{value}</p>
        </div>
        {Icon && <div className={`p-3 rounded-xl ${c.bg}`}><Icon size={24} strokeWidth={1.75} className={c.icon} /></div>}
      </div>
    </div>
  )
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{title}</h1>
        {subtitle && <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

function PublicBooking() {
  const [form, setForm] = useState({ 
    patient_name: "", patient_phone: "", patient_discord: "", 
    appointment_type: "Consultation", preferred_date: "", preferred_time: "", description: "" 
  })
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/appointments/public", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      if(res.ok) setSubmitted(true)
    } catch(err) {
      console.error(err)
    }
  }

  if(submitted) return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <Watermark />
      <div className="card p-8 max-w-md w-full text-center relative z-10">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
          <CheckCircle size={40} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Demande envoyée</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Votre demande a été transmise. Un membre de l'équipe médicale vous contactera.</p>
        <button onClick={() => navigate('/')} className="btn-secondary w-full">Retour à l'accueil</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen p-4 lg:p-8 flex flex-col items-center justify-center relative">
      <Watermark />
      <div className="w-full max-w-lg relative z-10">
        <div className="flex justify-between items-center mb-4">
             <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white text-sm font-medium">   
             </button>
             <ThemeToggle />
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6 pb-5 border-b dark:border-slate-700">
            <div className="w-14 h-14 bg-white rounded-xl border-2 border-slate-200 p-2 flex items-center justify-center shadow">
              <Logo size={44} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">Demande de rendez-vous</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Services Médicaux MRSA</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <InputField label="Nom & Prénom" placeholder="Maurice Latoue" value={form.patient_name} onChange={e => setForm({...form, patient_name: e.target.value})} required />
              <InputField label="Téléphone" placeholder="9387 6735" value={form.patient_phone} onChange={e => setForm({...form, patient_phone: e.target.value})} required />
            </div>
            <InputField label="Discord (pour contact)" placeholder="zertye._" value={form.patient_discord} onChange={e => setForm({...form, patient_discord: e.target.value})} />
            
            <SelectField label="Type de rendez-vous" value={form.appointment_type} onChange={e => setForm({...form, appointment_type: e.target.value})}>
              <option value="Consultation">Consultation Générale</option>
              <option value="Check-up">Check-up Complet</option>
              <option value="Certificat">Certificat Médical / PPA</option>
              <option value="Suivi">Suivi Psychologique</option>
              <option value="Urgence">Urgence Relative</option>
            </SelectField>
            
            <div className="grid md:grid-cols-2 gap-3">
              <InputField label="Date souhaitée" type="date" value={form.preferred_date} onChange={e => setForm({...form, preferred_date: e.target.value})} required />
              <InputField label="Heure souhaitée" type="time" value={form.preferred_time} onChange={e => setForm({...form, preferred_time: e.target.value})} required />
            </div>
            
            <TextArea label="Motif" placeholder="Décrivez brièvement le motif de votre demande..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />

            <button type="submit" className="btn-primary w-full py-3 text-base">
              <Send size={18} className="mr-2" /> Envoyer la demande
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function Patients() {
  const { hasPerm } = useAuth()
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const navigate = useNavigate();
  
  const initialForm = { first_name: "", last_name: "", phone: "", gender: "M", insurance_number: "", chronic_conditions: "", photo: null }
  const [form, setForm] = useState(initialForm)
  const fileInputRef = useRef(null)

  const load = () => {
    if (!hasPerm('view_patients')) return
    apiFetch(`/api/patients?search=${search}`)
      .then(r => r.json())
      .then(d => setPatients(Array.isArray(d?.patients) ? d.patients : []))
      .catch(() => setPatients([]))
  }

  useEffect(() => { load() }, [search])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append("first_name", form.first_name)
    formData.append("last_name", form.last_name)
    formData.append("date_of_birth", form.date_of_birth)
    formData.append("gender", form.gender)
    formData.append("phone", form.phone)
    formData.append("insurance_number", form.insurance_number)
    formData.append("chronic_conditions", form.chronic_conditions)
    if (form.photo instanceof File) {
        formData.append("photo", form.photo)
    }
    const url = editingId ? `/api/patients/${editingId}` : "/api/patients"
    const method = editingId ? "PUT" : "POST"
    await apiFetch(url, { method, body: formData })
    setShowModal(false)
    setEditingId(null)
    setForm(initialForm)
    load()
  }

  const handleEdit = (p) => {
    setEditingId(p.id)
    setForm({...p, photo: p.photo}) 
    setShowModal(true)
  }

  const handleDelete = async (id, force = false) => {
    if (!force && !window.confirm("Supprimer ce dossier patient ?")) return
    
    const url = force ? `/api/patients/${id}?force=true` : `/api/patients/${id}`;
    const res = await apiFetch(url, { method: "DELETE" })
    
    if (res.ok) {
        load();
    } else {
        const data = await res.json();
        if (res.status === 409 && data.requireForce) {
            if (window.confirm(`ATTENTION : Ce patient possède ${data.count} rapports médicaux.\nVoulez-vous supprimer le patient ET tous ses rapports ?\nCette action est irréversible.`)) {
                handleDelete(id, true);
            }
        } else {
            alert(data.error || "Erreur lors de la suppression");
        }
    }
  }

  return (
    <Layout>
      <PageHeader 
        title="Dossiers Patients" 
        subtitle="Gestion des dossiers médicaux"
        action={hasPerm('create_patients') && (
          <button onClick={() => { setEditingId(null); setForm(initialForm); setShowModal(true) }} className="btn-primary">
            <Plus size={18} className="mr-2" /> Nouveau patient
          </button>
        )}
      />

      <div className="card">
        <div className="p-4 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-t-xl">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              className="input-field pl-10"
              placeholder="Rechercher un patient..."
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Patient</th>
                <th className="table-header">N° Identité</th>
                <th className="table-header">Contact</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 ring-2 ring-slate-300">
                          {p.photo ? <img src={p.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={20}/></div>}
                      </div>
                      <div>
                          <div className="font-semibold text-slate-800 dark:text-white">{p.last_name} {p.first_name}</div>
                          <div className="text-xs text-slate-500">{p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString('fr-FR') : "Date inconnue"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">{p.insurance_number || "—"}</td>
                  <td className="table-cell">
                    <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">{p.phone || "N/A"}</div>
                    <div className="text-xs text-slate-400">{p.gender === 'M' ? 'Homme' : p.gender === 'F' ? 'Femme' : 'Autre'}</div>
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => navigate(`/reports?patient_id=${p.id}`)} title="Voir Rapports" className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Eye size={18} /></button>
                      {hasPerm('create_patients') && <button onClick={() => handleEdit(p)} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"><Edit2 size={18} /></button>}
                      {hasPerm('delete_patients') && <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={18} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr><td colSpan="4" className="p-10 text-center text-slate-400 font-medium">Aucun patient trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg shadow-2xl animate-in border dark:border-slate-700">
            <div className="p-5 border-b dark:border-slate-700 flex justify-between items-center">
              <h2 className="font-bold text-lg text-slate-800 dark:text-white">{editingId ? "Modifier le patient" : "Nouveau patient"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-white rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
               <div className="flex justify-center">
                  <div 
                      className="w-24 h-24 rounded-full bg-slate-200 border-4 border-slate-300 flex items-center justify-center relative overflow-hidden group cursor-pointer shadow-lg"
                      onClick={() => fileInputRef.current.click()}
                  >
                      {form.photo instanceof File ? (
                          <img src={URL.createObjectURL(form.photo)} className="w-full h-full object-cover" />
                      ) : form.photo ? (
                          <img src={form.photo} className="w-full h-full object-cover" />
                      ) : (
                          <User size={40} className="text-slate-400" />
                      )}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="text-white" size={24} />
                      </div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => setForm({...form, photo: e.target.files[0]})} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InputField label="Prénom" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} required />
                <InputField label="Nom" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Date de naissance" type="date" value={form.date_of_birth?.split('T')[0]} onChange={e => setForm({...form, date_of_birth: e.target.value})} />
                <SelectField label="Genre" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                  <option value="M">Homme</option>
                  <option value="F">Femme</option>
                  <option value="X">Autre</option>
                </SelectField>
              </div>
              <InputField label="N° Identité" value={form.insurance_number} onChange={e => setForm({...form, insurance_number: e.target.value})} required />
              <InputField label="Téléphone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <TextArea label="Antécédents / Notes" value={form.chronic_conditions} onChange={e => setForm({...form, chronic_conditions: e.target.value})} />
              
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" className="btn-primary flex-1">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

function Appointments() {
  const { user, hasPerm, isAdmin } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [filter, setFilter] = useState("all") 

  const load = () => {
    apiFetch("/api/appointments")
      .then(r => r.json())
      .then(data => setAppointments(Array.isArray(data) ? data : []))
      .catch(() => setAppointments([]))
  }

  useEffect(() => { load() }, [])

  const handleStatus = async (id, action, note = "") => {
    let url = `/api/appointments/${id}/${action}`
    const opts = { method: action === 'delete' ? 'DELETE' : 'POST' };
    if (action === "complete") {
        opts.body = JSON.stringify({ completion_notes: note });
    }
    if (action === 'delete') url = `/api/appointments/${id}`;
    await apiFetch(url, opts)
    load()
  }
  
  const handleDelete = (id) => {
      if(window.confirm("Supprimer définitivement ce rendez-vous ?")) {
          handleStatus(id, 'delete');
      }
  }

  const filtered = (appointments || []).filter(a => {
    if (filter === "pending") return a.status === "pending"
    if (filter === "my") return a.assigned_medic_id === user.id
    return true
  })

  const statusBadge = (status) => {
    if (status === 'pending') return <span className="badge badge-yellow">En attente</span>
    if (status === 'assigned') return <span className="badge badge-blue">Assigné</span>
    if (status === 'completed') return <span className="badge badge-green">Terminé</span>
    return <span className="badge badge-red">Annulé</span>
  }

  return (
    <Layout>
      <PageHeader title="Rendez-vous" subtitle="Planning des consultations" />

      <div className="flex gap-1 mb-5 card p-1.5 w-fit">
        {[
          { id: "all", label: "Tous" },
          { id: "pending", label: "En attente" },
          { id: "my", label: "Mes RDV" }
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} 
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${filter === f.id ? "bg-blue-600 text-white shadow-md" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(a => (
          <div key={a.id} className="card p-5 relative group hover:shadow-lg transition-shadow">
            {isAdmin && (
                <button onClick={() => handleDelete(a.id)} className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={16} />
                </button>
            )}
            <div className="mb-4">
                 {statusBadge(a.status)}
                 <h3 className="text-slate-800 dark:text-white font-bold text-lg mt-2">{a.patient_name}</h3>
                 <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                       <Phone size={14} /> {a.patient_phone || "N/A"}
                    </div>
                    {a.patient_discord && (
                       <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium">
                          <MessageSquare size={14} /> {a.patient_discord}
                       </div>
                    )}
                 </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 text-sm text-slate-600 dark:text-slate-300 mb-4 border dark:border-slate-700">
              <p className="text-xs text-slate-400 uppercase font-bold mb-1">{a.appointment_type}</p>
              {a.description || "Pas de description"}
            </div>

            {a.assigned_medic_id && (
               <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">{a.medic_first_name?.[0]}</div>
                  {a.medic_first_name} {a.medic_last_name}
               </div>
            )}

            <div className="flex gap-2 pt-3 border-t dark:border-slate-700">
               {a.status === 'pending' && hasPerm('manage_appointments') && (
                 <button onClick={() => handleStatus(a.id, 'assign')} className="btn-primary flex-1 text-sm">Prendre en charge</button>
               )}
               {a.status === 'assigned' && a.assigned_medic_id === user.id && (
                 <button onClick={() => handleStatus(a.id, 'complete', 'Terminé')} className="btn-success flex-1 text-sm">Terminer</button>
               )}
               {a.status !== 'completed' && a.status !== 'cancelled' && (
                 <button onClick={() => handleStatus(a.id, 'cancel')} className="btn-danger flex-1 text-sm">Annuler</button>
               )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-slate-400 col-span-3 text-center py-12 font-medium">Aucun rendez-vous</p>}
      </div>
    </Layout>
  )
}

function Reports() {
  const { user, hasPerm } = useAuth()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const initialPatientId = queryParams.get("patient_id")
  
  const [reports, setReports] = useState([])
  const [patients, setPatients] = useState([])
  const [diseases, setDiseases] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [filterPatientId, setFilterPatientId] = useState(initialPatientId || "")
  
  const [form, setForm] = useState({ patient_id: "", disease: "", context_notes: "", medications: [], total_cost: 0 })

  const servicesList = [
    { cat: "Pharmacie", items: [{ n: "Big Heal", p: 150 }, { n: "Small Heal", p: 100 }] },
    { cat: "Officine", items: [{ n: "Acide Tranexamique", p: 50 }, { n: "Céfotaxime", p: 50 }, { n: "Dexaméthasone", p: 75 }, { n: "Ribavirine", p: 100 }] },
    { cat: "Soins & Équipements", items: [{ n: "Bandage", p: 15 }, { n: "Bandage à la tête", p: 20 }, { n: "Bandage au bras", p: 15 }, { n: "Bandage corporel", p: 25 }, { n: "Diagnostic (T° / Pouls)", p: 150 }, { n: "Kit médical", p: 400 }, { n: "Plâtre à la jambe", p: 50 }, { n: "Réanimation", p: 400 }, { n: "Scanner", p: 250 }] },
    { cat: "Divers", items: [{ n: "Chambre VIP", p: 500 }] }
  ]

  const loadData = async () => {
    let url = "/api/reports"
    if (filterPatientId) url += `?patient_id=${filterPatientId}`
    apiFetch(url)
      .then(r => r.json())
      .then(data => setReports(Array.isArray(data) ? data : []))
      .catch(() => setReports([]))
    apiFetch("/api/patients")
      .then(r => r.json())
      .then(d => setPatients(Array.isArray(d?.patients) ? d.patients : []))
      .catch(() => setPatients([]))
    apiFetch("/api/reports/diseases")
      .then(r => r.json())
      .then(data => setDiseases(Array.isArray(data) ? data : []))
      .catch(() => setDiseases([]))
  }

  useEffect(() => { loadData() }, [filterPatientId])

  const toggleService = (item) => {
    const exists = form.medications.find(m => m === item.n)
    let newMeds = exists ? form.medications.filter(m => m !== item.n) : [...form.medications, item.n]
    let cost = 0
    servicesList.forEach(c => c.items.forEach(i => { if (newMeds.includes(i.n)) cost += i.p }))
    setForm({...form, medications: newMeds, total_cost: cost})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await apiFetch("/api/reports", {
      method: "POST",
      body: JSON.stringify(form)
    })
    setShowModal(false)
    setForm({ patient_id: "", disease: "", context_notes: "", medications: [], total_cost: 0 })
    loadData()
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce rapport ?")) return
    await apiFetch(`/api/reports/${id}`, { method: "DELETE" })
    loadData()
  }

  return (
    <Layout>
      <PageHeader 
        title="Rapports Médicaux" 
        subtitle="Historique des interventions"
        action={
          <div className="flex gap-2">
             {filterPatientId && <button onClick={() => setFilterPatientId("")} className="btn-secondary">Voir tout</button>}
             {hasPerm('create_reports') && <button onClick={() => setShowModal(true)} className="btn-primary"><FilePlus size={18} className="mr-2" /> Nouveau rapport</button>}
          </div>
        }
      />

      <div className="space-y-4">
        {reports.map(r => (
          <div key={r.id} className="card p-5 relative group hover:shadow-lg transition-shadow">
             {hasPerm('delete_reports') && (
                <button onClick={() => handleDelete(r.id)} className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={16} />
                </button>
             )}
             <div className="flex justify-between items-start mb-4">
                <div>
                   <h3 className="text-slate-800 dark:text-white font-bold text-lg">{r.patient_last_name} {r.patient_first_name}</h3>
                   <div className="text-slate-500 text-sm">ID: <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{r.patient_identity_id}</span> · Dr. {r.medic_first_name} {r.medic_last_name}</div>
                </div>
                <div className="text-right">
                   <div className="text-blue-600 dark:text-blue-400 font-bold">{r.diagnosis}</div>
                   <div className="text-slate-400 text-sm">{new Date(r.incident_date).toLocaleDateString('fr-FR')}</div>
                </div>
             </div>
             
             <div className="grid md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border dark:border-slate-700">
                <div>
                   <span className="label">Contexte</span>
                   <p className="text-slate-600 dark:text-slate-300">{r.notes || "Non précisé"}</p>
                </div>
                <div>
                   <span className="label">Soins & Facture</span>
                   <p className="text-slate-800 dark:text-slate-200 font-medium mb-1">{r.medications_given || "Aucun"}</p>
                   <p className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-lg">{r.treatment}</p>
                </div>
             </div>
          </div>
        ))}
        {reports.length === 0 && <p className="text-center text-slate-400 py-12 font-medium">Aucun rapport</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col animate-in border dark:border-slate-700">
            <div className="p-5 border-b dark:border-slate-700 flex justify-between items-center flex-shrink-0">
              <h2 className="font-bold text-lg text-slate-800 dark:text-white">Nouveau rapport</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-white rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-5 grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                   <SelectField label="Patient" value={form.patient_id} onChange={e => setForm({...form, patient_id: e.target.value})} required>
                      <option value="">-- Sélectionner --</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.last_name} {p.first_name} ({p.insurance_number})</option>)}
                   </SelectField>
                   <SelectField label="Diagnostic" value={form.disease} onChange={e => setForm({...form, disease: e.target.value})} required>
                      <option value="">-- Sélectionner --</option>
                      {diseases.map(d => <option key={d} value={d}>{d}</option>)}
                   </SelectField>
                   <TextArea label="Contexte / Notes" placeholder="Circonstances, observations..." value={form.context_notes} onChange={e => setForm({...form, context_notes: e.target.value})} />
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border dark:border-slate-700">
                   <div className="flex justify-between items-center mb-4 pb-4 border-b dark:border-slate-700">
                      <span className="label mb-0">Soins & Services</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-xl">{form.total_cost} €</span>
                   </div>
                   <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                      {servicesList.map(cat => (
                         <div key={cat.cat}>
                            <h4 className="text-slate-500 text-xs font-bold uppercase mb-2">{cat.cat}</h4>
                            <div className="grid grid-cols-2 gap-2">
                               {cat.items.map(item => (
                                  <div key={item.n} onClick={() => toggleService(item)} 
                                     className={`p-3 rounded-lg cursor-pointer border-2 text-sm flex justify-between items-center transition-all ${form.medications.includes(item.n) ? "bg-blue-50 dark:bg-blue-900/20 border-blue-400 text-blue-700 dark:text-blue-300 font-medium" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500"}`}>
                                     <span className="truncate">{item.n}</span>
                                     <span className="font-mono text-xs font-bold">{item.p}€</span>
                                  </div>
                               ))}
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
              </div>
              <div className="p-5 border-t dark:border-slate-700 flex gap-3 flex-shrink-0 bg-slate-50 dark:bg-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" className="btn-primary flex-1">Enregistrer ({form.total_cost}€)</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

function Admin() {
  const { user, isAdmin, hasPerm } = useAuth()
  const [activeTab, setActiveTab] = useState("users")
  const [usersList, setUsersList] = useState([])
  const [grades, setGrades] = useState([])
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsLimit, setLogsLimit] = useState(50)
  const [performance, setPerformance] = useState([])
  const [performanceLoading, setPerformanceLoading] = useState(false)
  
  const [showUserModal, setShowUserModal] = useState(false)
  const [userForm, setUserForm] = useState({ id: null, username: "", password: "", first_name: "", last_name: "", badge_number: "", grade_id: "", visible_grade_id: "" })

  const loadAdminData = () => {
    apiFetch("/api/admin/stats")
      .then(r => r.ok ? r.json() : null)
      .then(setStats)
      .catch(() => setStats(null))
    apiFetch("/api/admin/users")
      .then(r => r.json())
      .then(data => setUsersList(Array.isArray(data) ? data : []))
      .catch(() => setUsersList([]))
    apiFetch("/api/admin/grades")
      .then(r => r.json())
      .then(data => setGrades(Array.isArray(data) ? data : []))
      .catch(() => setGrades([]))
  }

  const loadLogs = async () => {
    setLogsLoading(true)
    try {
      const res = await apiFetch(`/api/admin/logs?limit=${logsLimit}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(Array.isArray(data) ? data : [])
      } else {
        setLogs([])
      }
    } catch (err) {
      console.error("Erreur chargement logs:", err)
      setLogs([])
    }
    setLogsLoading(false)
  }

  const loadPerformance = async () => {
    setPerformanceLoading(true)
    try {
      const res = await apiFetch("/api/admin/performance")
      if (res.ok) {
        const data = await res.json()
        setPerformance(Array.isArray(data) ? data : [])
      } else {
        setPerformance([])
      }
    } catch (err) {
      console.error("Erreur chargement performance:", err)
      setPerformance([])
    }
    setPerformanceLoading(false)
  }

  useEffect(() => { if (isAdmin) loadAdminData() }, [isAdmin])
  
  useEffect(() => {
    if (activeTab === "logs" && hasPerm('view_logs')) {
      loadLogs()
    }
  }, [activeTab, logsLimit])

  useEffect(() => {
    if (activeTab === "performance" && hasPerm('view_logs')) {
      loadPerformance()
    }
  }, [activeTab])

  const togglePermission = async (grade, perm) => {
    const newPerms = { ...grade.permissions, [perm]: !grade.permissions?.[perm] }
    const updatedGrades = grades.map(g => g.id === grade.id ? { ...g, permissions: newPerms } : g)
    setGrades(updatedGrades)
    await apiFetch(`/api/admin/grades/${grade.id}`, { method: "PUT", body: JSON.stringify({ ...grade, permissions: newPerms }) })
  }

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const url = userForm.id ? `/api/admin/users/${userForm.id}` : "/api/admin/users";
    const method = userForm.id ? "PUT" : "POST";
    const res = await apiFetch(url, { method, body: JSON.stringify(userForm) });
    if(res.ok) { setShowUserModal(false); loadAdminData(); }
    else alert("Erreur lors de l'enregistrement");
  }
  
  const deleteUser = async (id) => {
      if(!window.confirm("Supprimer définitivement cet utilisateur ?")) return;
      const res = await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if(res.ok) loadAdminData();
      else { const d = await res.json(); alert(d.error || "Erreur"); }
  }

  const editUser = (u) => { 
      setUserForm({ 
          id: u.id, 
          username: u.username, 
          password: "", 
          first_name: u.first_name, 
          last_name: u.last_name, 
          badge_number: u.badge_number, 
          grade_id: u.grade_id,
          visible_grade_id: u.visible_grade_id || "" 
      }); 
      setShowUserModal(true); 
  }
  
  const newUser = () => { 
      setUserForm({ 
          id: null, 
          username: "", 
          password: "", 
          first_name: "", 
          last_name: "", 
          badge_number: "", 
          grade_id: "",
          visible_grade_id: "" 
      }); 
      setShowUserModal(true); 
  }

  // Fonction pour formater l'action en badge coloré
  const getActionBadge = (action) => {
    const actionColors = {
      'CREATE_USER': 'badge-green',
      'UPDATE_USER': 'badge-blue',
      'DELETE_USER': 'badge-red',
      'CREATE_REPORT': 'badge-green',
      'DELETE_REPORT': 'badge-red',
      'CREATE_GRADE': 'badge-green',
      'UPDATE_GRADE': 'badge-blue',
      'DELETE_GRADE': 'badge-red',
      'CREATE_PATIENT': 'badge-green',
      'DELETE_PATIENT': 'badge-red',
    }
    return actionColors[action] || 'badge-yellow'
  }

  // Fonction pour formater l'action en texte lisible
  const formatAction = (action) => {
    const actionLabels = {
      'CREATE_USER': 'Création utilisateur',
      'UPDATE_USER': 'Modification utilisateur',
      'DELETE_USER': 'Suppression utilisateur',
      'CREATE_REPORT': 'Création rapport',
      'DELETE_REPORT': 'Suppression rapport',
      'CREATE_GRADE': 'Création grade',
      'UPDATE_GRADE': 'Modification grade',
      'DELETE_GRADE': 'Suppression grade',
      'CREATE_PATIENT': 'Création patient',
      'DELETE_PATIENT': 'Suppression patient',
    }
    return actionLabels[action] || action
  }

  if (!isAdmin) return <Navigate to="/dashboard" />

  const permissionsList = [
    { key: "access_dashboard", label: "Accès MDT" },
    { key: "view_patients", label: "Voir Patients" },
    { key: "create_patients", label: "Créer/Modif Patients" },
    { key: "delete_patients", label: "Supprimer Patients" },
    { key: "create_reports", label: "Créer Rapports" },
    { key: "delete_reports", label: "Supprimer Rapports" },
    { key: "manage_appointments", label: "Gérer RDV" },
    { key: "view_roster", label: "Voir Effectifs" },
    { key: "manage_users", label: "Gérer Utilisateurs" },
    { key: "delete_users", label: "Supprimer Utilisateurs" },
    { key: "view_logs", label: "Voir Logs/Stats" },
  ]

  const tabs = [
    { id: "users", label: "Utilisateurs", icon: Users },
    { id: "grades", label: "Grades", icon: ShieldAlert },
    { id: "stats", label: "Statistiques", icon: Activity },
  ]
  
  // Ajouter les onglets conditionnellement si l'utilisateur a la permission
  if (hasPerm('view_logs')) {
    tabs.push({ id: "performance", label: "Performance", icon: BarChart3 })
    tabs.push({ id: "logs", label: "Logs", icon: ScrollText })
  }

  return (
    <Layout>
      <PageHeader title="Administration" subtitle="Gestion du système" />
      
      <div className="card mb-6">
        <div className="flex border-b dark:border-slate-700 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-4 text-sm font-bold border-b-2 -mb-px transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "users" && (
        <div className="card">
          <div className="p-4 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end rounded-t-xl">
             <button onClick={newUser} className="btn-primary"><UserPlus size={18} className="mr-2" /> Créer</button>
          </div>
          <table className="w-full">
            <thead><tr><th className="table-header">Utilisateur</th><th className="table-header">Badge</th><th className="table-header">Grade (Réel)</th><th className="table-header">Actions</th></tr></thead>
            <tbody>
               {usersList.map(u => (
                 <tr key={u.id} className="table-row">
                   <td className="table-cell">
                      <div className="font-semibold text-slate-800 dark:text-white">{u.first_name} {u.last_name}</div>
                      <div className="text-xs text-slate-400 font-mono">@{u.username}</div>
                   </td>
                   <td className="table-cell text-slate-600 dark:text-slate-300 font-mono text-sm font-semibold">{u.badge_number}</td>
                   <td className="table-cell">
                       <span className="badge" style={{ backgroundColor: u.grade_color + '25', color: u.grade_color, borderColor: u.grade_color }}>{u.grade_name || "—"}</span>
                       {u.visible_grade_id && <span className="ml-2 text-xs text-slate-400 italic">(Masqué)</span>}
                   </td>
                   <td className="table-cell">
                     <div className="flex items-center gap-1">
                       <button onClick={() => editUser(u)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"><Edit2 size={16}/></button>
                       {hasPerm('delete_users') && u.id !== user.id && (
                           <button onClick={() => deleteUser(u.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={16}/></button>
                       )}
                     </div>
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "grades" && (
        <div className="space-y-4">
          {grades.map(g => (
            <div key={g.id} className="card p-5">
              <div className="flex items-center gap-4 mb-5 pb-5 border-b dark:border-slate-700">
                 <div className="w-5 h-5 rounded-full shadow-inner" style={{ backgroundColor: g.color }} />
                 <div>
                   <h3 className="font-bold text-lg text-slate-800 dark:text-white">{g.name}</h3>
                   <p className="text-slate-500 text-sm">{g.category} · Niveau {g.level}</p>
                 </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {permissionsList.map(p => (
                  <label key={p.key} className="flex items-center gap-2.5 cursor-pointer group p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${g.permissions?.[p.key] ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600 group-hover:border-slate-400'}`}>{g.permissions?.[p.key] && <Check size={14} className="text-white" strokeWidth={3} />}</div>
                    <input type="checkbox" className="hidden" checked={!!g.permissions?.[p.key]} onChange={() => togglePermission(g, p.key)} />
                    <span className={`text-sm font-medium ${g.permissions?.[p.key] ? 'text-slate-800 dark:text-white' : 'text-slate-500'}`}>{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "stats" && (
         <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats ? (
                  <>
                      <StatCard label="Patients" value={stats.patients?.total || 0} icon={Users} color="blue" />
                      <StatCard label="Rapports" value={stats.reports?.total || 0} icon={FileText} color="green" />
                      <StatCard label="RDV en attente" value={stats.appointments?.pending || 0} icon={Clock} color="yellow" />
                      <StatCard label="Effectif" value={stats.users?.total || 0} icon={Activity} color="blue" />
                  </>
              ) : (
                  <div className="col-span-4 text-center text-slate-400 py-12 font-medium">Chargement...</div>
              )}
            </div>

            {/* Distribution des grades */}
            {stats?.gradeDistribution && Array.isArray(stats.gradeDistribution) && stats.gradeDistribution.length > 0 && (
              <div className="card p-5">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Répartition par grade</h3>
                <div className="space-y-3">
                  {stats.gradeDistribution.map((g, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{g.name}</div>
                      <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-6 overflow-hidden">
                        <div 
                          className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                          style={{ 
                            width: `${Math.max((parseInt(g.count) / Math.max(...stats.gradeDistribution.map(x => parseInt(x.count)), 1)) * 100, 10)}%`,
                            backgroundColor: g.color || '#3b82f6'
                          }}
                        >
                          <span className="text-white text-xs font-bold">{g.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
         </div>
      )}

      {activeTab === "performance" && hasPerm('view_logs') && (
        <div className="card">
          <div className="p-4 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-t-xl flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-600" />
                Performance du personnel
              </h3>
              <p className="text-sm text-slate-500 mt-1">Statistiques d'activité par membre</p>
            </div>
            <button onClick={loadPerformance} className="btn-secondary">
              <RefreshCw size={16} className={`mr-2 ${performanceLoading ? 'animate-spin' : ''}`} /> Actualiser
            </button>
          </div>
          
          {performanceLoading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
              Chargement...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">Membre</th>
                    <th className="table-header text-center">Rapports</th>
                    <th className="table-header text-center">Patients créés</th>
                    <th className="table-header text-center">RDV terminés</th>
                    <th className="table-header text-center">Actions totales</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.map((p, i) => (
                    <tr key={p.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: p.grade_color || '#64748b' }}>
                            {i + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-white">{p.first_name} {p.last_name}</div>
                            <div className="text-xs" style={{ color: p.grade_color }}>{p.grade_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell text-center">
                        <span className={`font-mono font-bold text-lg ${parseInt(p.reports_count) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                          {p.reports_count}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <span className={`font-mono font-bold text-lg ${parseInt(p.patients_created) > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                          {p.patients_created}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <span className={`font-mono font-bold text-lg ${parseInt(p.appointments_completed) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                          {p.appointments_completed}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">
                          {p.total_actions}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {performance.length === 0 && (
                    <tr><td colSpan="5" className="p-10 text-center text-slate-400 font-medium">Aucune donnée de performance</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "logs" && hasPerm('view_logs') && (
        <div className="card">
          <div className="p-4 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-t-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <ScrollText size={20} className="text-amber-600" />
                Journal d'activité
              </h3>
              <p className="text-sm text-slate-500 mt-1">Historique des actions système</p>
            </div>
            <div className="flex items-center gap-3">
              <SelectField 
                value={logsLimit} 
                onChange={e => setLogsLimit(parseInt(e.target.value))}
                className="w-auto"
              >
                <option value="25">25 derniers</option>
                <option value="50">50 derniers</option>
                <option value="100">100 derniers</option>
                <option value="200">200 derniers</option>
              </SelectField>
              <button onClick={loadLogs} className="btn-secondary">
                <RefreshCw size={16} className={`mr-2 ${logsLoading ? 'animate-spin' : ''}`} /> Actualiser
              </button>
            </div>
          </div>
          
          {logsLoading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
              Chargement...
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-white dark:bg-slate-800 z-10">
                  <tr>
                    <th className="table-header">Date</th>
                    <th className="table-header">Utilisateur</th>
                    <th className="table-header">Action</th>
                    <th className="table-header">Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={log.id || i} className="table-row">
                      <td className="table-cell whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {new Date(log.created_at).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="table-cell">
                        {log.first_name ? (
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-white">{log.first_name} {log.last_name}</div>
                            <div className="text-xs text-slate-400 font-mono">{log.badge_number}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Système</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${getActionBadge(log.action)}`}>
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-slate-600 dark:text-slate-300 max-w-md truncate" title={log.details}>
                          {log.details}
                        </div>
                        {log.target_id && (
                          <div className="text-xs text-slate-400 font-mono">ID: {log.target_id}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan="4" className="p-10 text-center text-slate-400 font-medium">Aucun log enregistré</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
           <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg shadow-2xl animate-in border dark:border-slate-700">
              <div className="p-5 border-b dark:border-slate-700">
                <h2 className="font-bold text-lg text-slate-800 dark:text-white">{userForm.id ? "Modifier" : "Créer"} utilisateur</h2>
              </div>
              <form onSubmit={handleUserSubmit} className="p-5 space-y-4">
                 <div className="grid grid-cols-2 gap-3">
                    <InputField label="Prénom" value={userForm.first_name} onChange={e => setUserForm({...userForm, first_name: e.target.value})} required />
                    <InputField label="Nom" value={userForm.last_name} onChange={e => setUserForm({...userForm, last_name: e.target.value})} required />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <InputField label="Identifiant" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} required />
                    <InputField label="Matricule" value={userForm.badge_number} onChange={e => setUserForm({...userForm, badge_number: e.target.value})} />
                 </div>
                 <InputField label="Mot de passe" type="password" placeholder={userForm.id ? "Laisser vide si inchangé" : ""} value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} required={!userForm.id} />
                 
                 <SelectField label="Grade (Permissions)" value={userForm.grade_id} onChange={e => setUserForm({...userForm, grade_id: e.target.value})} required>
                    <option value="">-- Sélectionner --</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                 </SelectField>

                 <div className="border-t dark:border-slate-700 pt-3 mt-1">
                     <p className="label text-blue-600 dark:text-blue-400 mb-2">Options Avancées (RP)</p>
                     <SelectField label="Grade Visible (Masquer le vrai grade)" value={userForm.visible_grade_id} onChange={e => setUserForm({...userForm, visible_grade_id: e.target.value})}>
                        <option value="">-- Aucun (Afficher le vrai grade) --</option>
                        {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                     </SelectField>
                     <p className="text-xs text-slate-500 mt-1">Si sélectionné, ce grade sera affiché partout à la place du grade réel. Les permissions restent celles du grade réel.</p>
                 </div>

                 <div className="flex gap-3 pt-3">
                    <button type="button" onClick={() => setShowUserModal(false)} className="btn-secondary flex-1">Annuler</button>
                    <button type="submit" className="btn-primary flex-1">Enregistrer</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </Layout>
  )
}

function Diagnosis() {
  const [symptoms, setSymptoms] = useState([])
  const [selectedSymptom, setSelectedSymptom] = useState("")
  const [vitals, setVitals] = useState({ temp: "", hr: "", o2: "", bp: "" })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiFetch("/api/diagnosis/symptoms")
      .then(r => r.json())
      .then(data => setSymptoms(Array.isArray(data) ? data : []))
      .catch(() => setSymptoms([]))
  }, [])

  const handleAnalyze = async (e) => {
    e.preventDefault()
    setLoading(true)
    const res = await apiFetch("/api/diagnosis/analyze", {
      method: "POST",
      body: JSON.stringify({ visibleSymptom: selectedSymptom, vitals })
    })
    setResult(await res.json())
    setLoading(false)
  }

  const reset = () => { setResult(null); setVitals({ temp: "", hr: "", o2: "", bp: "" }); setSelectedSymptom("") }

  return (
    <Layout>
      <PageHeader title="Outil de Diagnostic" subtitle="Aide au diagnostic médical" />
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="card p-6">
          <form onSubmit={handleAnalyze} className="space-y-5">
            <SelectField label="Symptôme principal" value={selectedSymptom} onChange={e => setSelectedSymptom(e.target.value)} required>
              <option value="">-- Sélectionner --</option>
              {symptoms.map(s => <option key={s} value={s}>{s}</option>)}
            </SelectField>

            <div>
              <p className="label">Constantes vitales</p>
              <div className="grid grid-cols-2 gap-3">
                <InputField placeholder="Température (°C)" type="number" step="0.1" value={vitals.temp} onChange={e => setVitals({...vitals, temp: e.target.value})} required />
                <InputField placeholder="Pouls (BPM)" type="number" value={vitals.hr} onChange={e => setVitals({...vitals, hr: e.target.value})} required />
                <InputField placeholder="SpO2 (%)" type="number" value={vitals.o2} onChange={e => setVitals({...vitals, o2: e.target.value})} required />
                <InputField placeholder="Tension (Sys)" type="number" value={vitals.bp} onChange={e => setVitals({...vitals, bp: e.target.value})} required />
              </div>
            </div>
            
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? "Analyse en cours..." : "Analyser"}
            </button>
          </form>
        </div>

        <div>
          {result && result.status !== "unknown" ? (
             <div className={`card p-6 border-l-4 ${result.status === 'confirmed' ? 'border-emerald-500' : 'border-amber-500'}`}>
                <div className="flex items-center gap-3 mb-5 pb-5 border-b dark:border-slate-700">
                  <div className={`w-4 h-4 rounded-full ${result.status === 'confirmed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <h2 className="font-bold text-lg text-slate-800 dark:text-white">
                      {result.status === 'confirmed' ? "Diagnostic confirmé" : "Diagnostics possibles"}
                  </h2>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-5">{result.message}</p>
                
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                   {(result.results || []).map((r, i) => (
                      <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border dark:border-slate-700">
                         <div className="flex justify-between items-center mb-3">
                            <span className="font-bold text-slate-800 dark:text-white text-lg">{r.name}</span>
                            <span className={`badge ${r.confidence > 80 ? 'badge-green' : 'badge-yellow'}`}>{r.confidence}%</span>
                         </div>
                         <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t dark:border-slate-700">
                            <div><span className="text-slate-400 text-xs font-bold uppercase">Traitement</span><p className="text-blue-600 dark:text-blue-400 font-semibold mt-1">{r.med}</p></div>
                            <div><span className="text-slate-400 text-xs font-bold uppercase">Organe cible</span><p className="text-slate-700 dark:text-slate-300 font-medium mt-1">{r.organ}</p></div>
                         </div>
                      </div>
                   ))}
                </div>
                <button onClick={reset} className="btn-secondary w-full mt-5">Nouveau diagnostic</button>
             </div>
          ) : result ? (
            <div className="card p-10 text-center">
               <HelpCircle size={48} className="mx-auto text-slate-300 mb-4" />
               <h3 className="font-bold text-xl text-slate-800 dark:text-white">Aucun résultat</h3>
               <p className="text-slate-500 mt-2 mb-6">Les constantes ne correspondent à aucune pathologie connue.</p>
               <button onClick={reset} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold">Réessayer</button>
            </div>
          ) : (
            <div className="card border-dashed border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-14 text-center text-slate-400 flex flex-col items-center">
               <Stethoscope className="mb-4 opacity-40" size={40} />
               <span className="font-medium">Renseignez les constantes vitales</span>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

function Dashboard() {
  const { user, isAdmin } = useAuth()
  const [adminStats, setAdminStats] = useState(null)
  const [myStats, setMyStats] = useState(null)

  useEffect(() => {
    // Si Admin, charger les stats globales
    if (isAdmin) {
        apiFetch("/api/admin/stats")
            .then(r => r.ok ? r.json() : null)
            .then(setAdminStats)
            .catch(console.error)
    }

    // TOUJOURS charger les stats personnelles
    apiFetch("/api/users/me/stats")
        .then(r => r.ok ? r.json() : null)
        .then(setMyStats)
        .catch(console.error)
  }, [isAdmin])

  return (
    <Layout>
      <PageHeader title={`Bonjour, ${user?.first_name || user?.username}`} subtitle={`${user?.grade_name || "Personnel médical"} · Badge ${user?.badge_number || "N/A"}`} />
      
      {/* SECTION 1: Statistiques Personnelles (Prioritaire) */}
      <div className="mb-8">
         <h2 className="section-title text-slate-500 mb-4 uppercase tracking-wider text-xs font-bold pl-1">Ma Performance</h2>
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Mes Rapports" value={myStats?.my_reports ?? "..."} icon={FileText} color="blue" />
            <StatCard label="Patients Créés" value={myStats?.my_patients ?? "..."} icon={UserPlus} color="green" />
            <StatCard label="RDV Terminés" value={myStats?.my_appointments ?? "..."} icon={CheckCircle} color="yellow" />
            {/* Carte placeholder ou score de performance future */}
            <div className="card p-5 border-l-4 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-center">
                 <p className="text-slate-500 text-sm font-medium mb-1">Status Actuel</p>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">En Service</span>
                 </div>
            </div>
         </div>
      </div>

      {/* SECTION 2: Stats Globales (Admin Uniquement) */}
      {isAdmin && adminStats && (
        <div className="mb-8">
            <h2 className="section-title text-slate-500 mb-4 uppercase tracking-wider text-xs font-bold pl-1">Vue Globale (Admin)</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Patients" value={adminStats?.patients?.total ?? "—"} icon={Users} color="blue" />
                <StatCard label="Total Rapports" value={adminStats?.reports?.total ?? "—"} icon={Activity} color="green" />
                <StatCard label="RDV Attente" value={adminStats?.appointments?.pending ?? "—"} icon={Clock} color="yellow" />
                <StatCard label="Effectif Total" value={adminStats?.users?.total ?? "—"} icon={ShieldAlert} color="red" />
            </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
          {/* Colonne Gauche : Accès Rapide */}
          <div className="lg:col-span-2">
            <h2 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Accès rapide</h2>
            <div className="grid md:grid-cols-2 gap-4">
                <Link to="/reports" className="card p-6 hover:shadow-xl transition-all group border-l-4 border-emerald-500 flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                    <FilePlus size={24} />
                  </div>
                  <div>
                      <h3 className="font-bold text-slate-800 dark:text-white mb-1">Nouveau Rapport</h3>
                      <p className="text-slate-500 text-sm">Créer un rapport d'intervention</p>
                  </div>
                  <ChevronRight size={20} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />
                </Link>

                <Link to="/patients" className="card p-6 hover:shadow-xl transition-all group border-l-4 border-blue-500 flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <UserPlus size={24} />
                  </div>
                  <div>
                      <h3 className="font-bold text-slate-800 dark:text-white mb-1">Nouveau Patient</h3>
                      <p className="text-slate-500 text-sm">Enregistrer un civil</p>
                  </div>
                  <ChevronRight size={20} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                </Link>

                <Link to="/diagnosis" className="card p-6 hover:shadow-xl transition-all group border-l-4 border-amber-500 flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                    <Stethoscope size={24} />
                  </div>
                  <div>
                      <h3 className="font-bold text-slate-800 dark:text-white mb-1">Diagnostic</h3>
                      <p className="text-slate-500 text-sm">Assistant médical IA</p>
                  </div>
                  <ChevronRight size={20} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-amber-500" />
                </Link>
                
                <Link to="/appointments" className="card p-6 hover:shadow-xl transition-all group border-l-4 border-slate-400 dark:border-slate-500 flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:scale-110 transition-transform">
                    <ClipboardList size={24} />
                  </div>
                  <div>
                      <h3 className="font-bold text-slate-800 dark:text-white mb-1">Rendez-vous</h3>
                      <p className="text-slate-500 text-sm">Gérer le planning</p>
                  </div>
                  <ChevronRight size={20} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
                </Link>
            </div>
          </div>

          {/* Colonne Droite : Activité Récente */}
          <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg text-slate-800 dark:text-white">Derniers Rapports</h2>
                <Link to="/reports" className="text-xs font-bold text-blue-600 hover:underline">TOUT VOIR</Link>
            </div>
            <div className="space-y-3">
                {myStats?.recent_activity?.length > 0 ? (
                    (myStats.recent_activity || []).map(r => (
                        <div key={r.id} className="card p-4 flex flex-col gap-1 text-sm border-l-4 border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-default">
                            <div className="font-bold text-slate-800 dark:text-white text-base">{r.first_name} {r.last_name}</div>
                            <div className="text-slate-500 font-medium">{r.diagnosis}</div>
                            <div className="text-xs text-slate-400 text-right mt-1 border-t dark:border-slate-700 pt-2">
                                {new Date(r.incident_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit' })}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="card p-6 text-center text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 border-dashed">
                        Aucune activité récente.
                    </div>
                )}
            </div>
          </div>
      </div>
    </Layout>
  )
}

function Roster() {
  const [members, setMembers] = useState([])

  useEffect(() => { 
    apiFetch("/api/users/roster")
      .then(r => r.json())
      .then(data => setMembers(Array.isArray(data) ? data : []))
      .catch(() => setMembers([]))
  }, [])

  // --- LOGIQUE HIERARCHIQUE ---
  const grouped = (members || []).reduce((acc, m) => {
      const cat = m.grade_category || "Autres";
      if(!acc[cat]) acc[cat] = [];
      acc[cat].push(m);
      return acc;
  }, {});

  const categoryOrder = ["Direction M.R.S.A", "Chef de service", "Medecine", "Paramedical", "Système", "Autres"];
  const sortedCategories = Object.keys(grouped).sort((a,b) => {
      const idxA = categoryOrder.indexOf(a);
      const idxB = categoryOrder.indexOf(b);
      if(idxA !== -1 && idxB !== -1) return idxA - idxB;
      if(idxA !== -1) return -1;
      if(idxB !== -1) return 1;
      return a.localeCompare(b);
  });

  return (
    <Layout>
      <PageHeader title="Effectifs" subtitle="Hiérarchie du personnel" />
      
      <div className="space-y-8">
        {sortedCategories.map(cat => {
            const usersInCat = grouped[cat];
            usersInCat.sort((a, b) => b.grade_level - a.grade_level);

            return (
                <div key={cat}>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 border-b dark:border-slate-700 pb-2 flex items-center gap-2">
                        {cat === 'Direction M.R.S.A' ? <ShieldAlert size={16}/> : <Users size={16}/>}
                        {cat}
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {usersInCat.map(m => (
                          <div key={m.id} className="card p-5 flex items-center gap-4 hover:shadow-lg transition-shadow border-l-4" style={{ borderLeftColor: m.grade_color }}>
                             <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm overflow-hidden ring-2 ring-slate-300">
                                {m.profile_picture ? <img src={m.profile_picture} className="w-full h-full object-cover" /> : m.username?.[0].toUpperCase()}
                             </div>
                             <div className="flex-1 min-w-0">
                                <h4 className="text-slate-800 dark:text-white font-semibold truncate">{m.first_name || m.username} {m.last_name}</h4>
                                <div className="text-sm font-bold" style={{ color: m.grade_color }}>{m.grade_name}</div>
                             </div>
                             <div className="text-right flex-shrink-0">
                                <div className="text-slate-500 dark:text-slate-400 font-mono text-xs font-semibold">{m.badge_number}</div>
                                <div className="text-slate-400 text-xs">{m.phone || "—"}</div>
                             </div>
                          </div>
                        ))}
                    </div>
                </div>
            )
        })}
      </div>
    </Layout>
  )
}

function Landing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <Watermark />
      <div className="flex absolute top-4 right-4">
          <ThemeToggle />
      </div>
      <div className="text-center space-y-8 relative z-10">
          <div className="w-28 h-28 bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto shadow-2xl p-3">
            <Logo size={88} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-white">MRSA</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Système de Gestion Médicale</p>
          </div>
          <div className="flex gap-4 justify-center pt-2">
            <Link to="/login" className="btn-primary px-8 py-3 text-base">Connexion Personnel</Link>
            <button onClick={() => navigate('/book')} className="btn-secondary px-8 py-3 text-base">Prendre RDV</button>
          </div>
       </div>
       <p className="absolute bottom-6 text-slate-400 text-sm font-medium">© Propriété fictive — Usage RP</p>
    </div>
  )
}

function Login() {
  const { user, login } = useAuth()
  const [form, setForm] = useState({ username: "", password: "" })
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState("") // Pour afficher l'étape en cours
  const [debugInfo, setDebugInfo] = useState("")
  
  // Test des capacités du navigateur au chargement
  useEffect(() => {
    const tests = []
    
    // Test cookies
    try {
      document.cookie = "testcookie=1"
      const hasCookies = document.cookie.includes("testcookie")
      tests.push(`Cookies: ${hasCookies ? '✅' : '❌'}`)
    } catch (e) {
      tests.push(`Cookies: ❌ (${e.message})`)
    }
    
    // Test localStorage
    try {
      localStorage.setItem('test', '1')
      localStorage.removeItem('test')
      tests.push('localStorage: ✅')
    } catch (e) {
      tests.push(`localStorage: ❌`)
    }
    
    // Test fetch
    tests.push(`fetch: ${typeof fetch === 'function' ? '✅' : '❌'}`)
    
    setDebugInfo(tests.join(' | '))
  }, [])
  
  if (user) return <Navigate to="/dashboard" />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    setStatus("Connexion au serveur...")
    
    try {
      console.log("[LOGIN] Tentative de connexion pour:", form.username)
      const res = await login(form.username, form.password)
      console.log("[LOGIN] Résultat:", res)
      
      if(res.success) {
        setStatus("✅ Connecté ! Redirection...")
        // Forcer la redirection avec window.location (plus compatible que Navigate)
        setTimeout(() => {
          window.location.href = "/dashboard"
        }, 500)
      } else {
        setError(res.error || "Erreur inconnue")
        setStatus("")
        setIsLoading(false)
      }
    } catch (err) {
      console.error("[LOGIN] Exception:", err)
      setError(`Exception: ${err.message || String(err)}`)
      setStatus("")
      setIsLoading(false)
    }
    // Note: on ne met pas finally car si succès, on redirige
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <Watermark />
      <div className="flex absolute top-4 right-4">
          <ThemeToggle />
      </div>
       <div className="w-full max-w-sm relative z-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-5 shadow-xl p-3">
              <Logo size={56} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Connexion</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Système de Gestion Médicale MRSA</p>
          </div>
          
          <div className="card p-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm font-medium max-h-32 overflow-y-auto">
                <p className="font-bold mb-1">❌ Erreur de connexion</p>
                <p className="break-words whitespace-pre-wrap">{error}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
               <InputField label="Identifiant" placeholder="nom.prenom" value={form.username} onChange={e => setForm({...form, username: e.target.value})} disabled={isLoading} />
               <InputField label="Mot de passe" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} disabled={isLoading} />
               <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                 {isLoading ? (
                   <>
                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                     {status || "Chargement..."}
                   </>
                 ) : (
                   "Se connecter"
                 )}
               </button>
               {isLoading && (
                 <p className="text-center text-xs text-slate-400 mt-2">
                   Si ça prend plus de 15s, une erreur s'affichera
                 </p>
               )}
            </form>
            
            {/* Debug info pour diagnostiquer les problèmes */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-400 text-center font-mono">{debugInfo}</p>
            </div>
          </div>
          
          <p className="text-center text-slate-400 text-sm mt-6 font-medium">
            <Link to="/" className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors">← Retour à l'accueil</Link>
          </p>
       </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/book" element={<PublicBooking />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
            <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
            <Route path="/diagnosis" element={<ProtectedRoute><Diagnosis /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/roster" element={<ProtectedRoute><Roster /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center relative">
      <Watermark />
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 font-medium">Chargement...</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" />
  return children
}
