import { BrowserRouter, Routes, Route, Navigate, useLocation, Link, useNavigate } from "react-router-dom"
import { createContext, useContext, useState, useEffect, useRef } from "react"
import { 
  Activity, Users, ClipboardList, Stethoscope, ShieldAlert, 
  LogOut, LayoutDashboard, FileText, Menu, X, 
  Thermometer, Heart, Wind, Gauge, AlertTriangle, CheckCircle, HelpCircle,
  Search, Plus, Filter, Calendar, Clock, Edit2, Trash2, Check, Phone, Save, Settings, User, FilePlus, DollarSign, ArrowLeft, Send, Lock, UserPlus, Eye, Camera, Upload
} from "lucide-react"

// --- Auth Context ---
const AuthContext = createContext(null)
export function useAuth() { return useContext(AuthContext) }

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = () => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => {
        if (r.ok) return r.json();
        throw new Error("Not logged in");
      })
      .then(d => { setUser(d.user); setLoading(false) })
      .catch(() => { setUser(null); setLoading(false) })
  }

  useEffect(() => { fetchUser() }, [])

  const login = async (username, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error || "Identifiants incorrects" };
      }
    } catch (e) {
      return { success: false, error: "Erreur serveur" };
    }
  }

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    setUser(null)
    window.location.href = "/"
  }

  const isAdmin = user?.is_admin || user?.grade_level >= 10;
  // Le niveau 99 (Dev) a toujours la permission
  const hasPerm = (perm) => (user?.grade_level === 99) || isAdmin || user?.grade_permissions?.[perm] === true;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, hasPerm, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// --- GLOBAL COMPONENTS ---
const InputField = ({ onKeyDown, className, ...props }) => (
  <input 
    className={`w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:border-ems-500 focus:ring-1 focus:ring-ems-500 outline-none transition-all ${className || ''}`}
    onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); if (onKeyDown) onKeyDown(e); }}
    {...props} 
  />
)

const SelectField = ({ className, ...props }) => (
  <select className={`w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-ems-500 focus:ring-1 focus:ring-ems-500 outline-none transition-all appearance-none ${className || ''}`} {...props} />
)

const DiagnosisInput = ({ onKeyDown, className, ...props }) => (
  <input 
    className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-4 pt-7 pb-2 text-white placeholder-slate-500 focus:border-ems-500 focus:ring-1 focus:ring-ems-500 outline-none transition-all text-lg font-mono h-16 ${className || ''}`}
    onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); if (onKeyDown) onKeyDown(e); }}
    {...props}
  />
)

// --- Layout & UI Components ---
function SidebarItem({ icon: Icon, label, to, active }) {
  return (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
      active 
        ? "bg-ems-500/20 text-ems-400 border border-ems-500/30 shadow-lg shadow-ems-500/10" 
        : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
    }`}>
      <Icon size={20} className={active ? "text-ems-400" : "text-slate-500 group-hover:text-slate-300"} />
      <span className="font-medium">{label}</span>
    </Link>
  )
}

function Layout({ children }) {
  const { user, logout, isAdmin, refreshUser } = useAuth()
  const location = useLocation()
  const [mobileMenu, setMobileMenu] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileForm, setProfileForm] = useState({ first_name: "", last_name: "", phone: "", profile_picture: null })
  
  const fileInputRef = useRef(null)

  const openProfile = () => {
    setProfileForm({ 
        first_name: user.first_name || "", 
        last_name: user.last_name || "", 
        phone: user.phone || "",
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
    if (profileForm.profile_picture instanceof File) {
        formData.append("profile_picture", profileForm.profile_picture)
    }
    await fetch("/api/users/me", { method: "PUT", body: formData })
    await refreshUser()
    setShowProfileModal(false)
  }

  const navs = [
    { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
    { icon: ClipboardList, label: "Rendez-vous", to: "/appointments" },
    { icon: Users, label: "Patients", to: "/patients" },
    { icon: Stethoscope, label: "Diagnostic", to: "/diagnosis" },
    { icon: FileText, label: "Rapports", to: "/reports" },
    { icon: Activity, label: "Effectifs", to: "/roster" },
  ]
  if (isAdmin || user?.grade_permissions?.manage_users) navs.push({ icon: ShieldAlert, label: "Admin", to: "/admin" })

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 font-sans flex overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-[#0F172A] border-r border-slate-800/50 p-4 h-screen sticky top-0 z-30">
        <div className="flex items-center gap-3 px-4 py-6 mb-4">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg shadow-ems-500/20 p-1 overflow-hidden">
             <img src="/logo.png" alt="EMS Logo" className="w-full h-full object-contain" onError={(e) => {e.target.onerror = null; e.target.src="https://via.placeholder.com/40?text=EMS"}} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">EMS - RMB</h1>
            <p className="text-xs text-ems-400 font-medium tracking-wide">MEDICAL TERMINAL</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {navs.map(n => <SidebarItem key={n.to} {...n} active={location.pathname === n.to} />)}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <button onClick={openProfile} className="flex items-center gap-3 px-4 mb-4 hover:bg-slate-800 p-2 rounded-lg transition-colors w-full text-left">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold border-2 border-slate-600 overflow-hidden">
                {user?.profile_picture ? (
                    <img src={user.profile_picture} className="w-full h-full object-cover" />
                ) : (
                    user?.username?.[0].toUpperCase()
                )}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.first_name} {user?.last_name}</p>
              <div className="flex items-center justify-between">
                 <p className="text-xs text-slate-400 truncate">@{user?.username}</p>
                 <Settings size={12} className="text-slate-500" />
              </div>
            </div>
          </button>
          <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm font-medium">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="lg:hidden bg-[#0F172A] border-b border-slate-800 p-4 flex justify-between items-center z-20">
          <div className="flex items-center gap-3">
             <img src="/logo.png" alt="EMS RMB Logo" className="w-8 h-8 object-contain bg-white rounded-md p-0.5" />
             <span className="font-bold text-white">EMS - RMB Mobile</span>
          </div>
          <button onClick={() => setMobileMenu(!mobileMenu)}><Menu /></button>
        </header>
        
        {mobileMenu && (
          <div className="lg:hidden absolute inset-0 bg-slate-900 z-50 p-4">
            <div className="flex justify-between mb-8">
              <h2 className="text-xl font-bold text-white">Menu</h2>
              <button onClick={() => setMobileMenu(false)}><X /></button>
            </div>
            <nav className="space-y-2">
              {navs.map(n => (
                <Link key={n.to} to={n.to} onClick={() => setMobileMenu(false)} className="block p-4 bg-slate-800 rounded-xl text-white font-medium">
                  <div className="flex items-center gap-3">
                    <n.icon size={20} className="text-ems-400" /> {n.label}
                  </div>
                </Link>
              ))}
              <button onClick={logout} className="w-full p-4 text-left text-red-400 font-medium">Déconnexion</button>
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative scroll-smooth">
          <div className="fixed top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-ems-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Mon Profil</h2>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-white"><X /></button>
            </div>
            <form onSubmit={saveProfile} className="space-y-4">
              
              <div className="flex justify-center mb-4">
                  <div 
                      className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center relative overflow-hidden group cursor-pointer"
                      onClick={() => fileInputRef.current.click()}
                  >
                      {profileForm.profile_picture ? (
                          <img src={URL.createObjectURL(profileForm.profile_picture)} className="w-full h-full object-cover" />
                      ) : user?.profile_picture ? (
                          <img src={user.profile_picture} className="w-full h-full object-cover" />
                      ) : (
                          <User size={40} className="text-slate-500" />
                      )}
                      
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="text-white" />
                      </div>
                  </div>
                  <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={e => setProfileForm({...profileForm, profile_picture: e.target.files[0]})}
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Prénom (RP)</label>
                    <InputField value={profileForm.first_name} onChange={e => setProfileForm({...profileForm, first_name: e.target.value})} required />
                 </div>
                 <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Nom (RP)</label>
                    <InputField value={profileForm.last_name} onChange={e => setProfileForm({...profileForm, last_name: e.target.value})} required />
                 </div>
              </div>
              <div>
                 <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Téléphone</label>
                 <InputField value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowProfileModal(false)} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium">Annuler</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-ems-600 text-white hover:bg-ems-500 font-bold shadow-lg shadow-ems-500/20">Sauvegarder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, colorClass, icon: Icon }) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 p-6 rounded-2xl shadow-sm flex items-center justify-between group hover:border-slate-600 transition-all h-full">
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
        <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
      </div>
      {Icon && <div className={`p-3 rounded-xl bg-slate-800 ${colorClass.replace('text-', 'bg-').replace('400', '500')}/10`}><Icon size={24} className={colorClass} /></div>}
    </div>
  )
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-slate-400 mt-1">{subtitle}</p>}
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
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-green-500/30 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl shadow-green-900/20">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Rendez-vous Confirmé</h2>
        <p className="text-slate-400 mb-8">Votre demande a été transmise aux services de secours. Un médecin prendra contact avec vous.</p>
        <button onClick={() => navigate('/')} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all">Retour à l'accueil</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0B1120] p-4 lg:p-8 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="w-[500px] h-[500px] bg-ems-600/10 rounded-full blur-[100px] absolute top-[-100px] left-[-100px] pointer-events-none"></div>
      
      <div className="w-full max-w-2xl relative z-10">
        <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-medium">
          <ArrowLeft size={20} /> Retour
        </button>
        
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-ems-500/20 p-2">
              <img src="/logo.png" alt="EMS Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Prendre Rendez-vous</h1>
              <p className="text-slate-400">Services Médicaux d'Urgence - RMB</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-ems-400 font-bold uppercase text-xs tracking-wider border-b border-slate-800 pb-2">Vos Coordonnées</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <InputField placeholder="Nom & Prénom (RP)" value={form.patient_name} onChange={e => setForm({...form, patient_name: e.target.value})} required />
                <InputField placeholder="Numéro de Téléphone" value={form.patient_phone} onChange={e => setForm({...form, patient_phone: e.target.value})} required />
              </div>
              <InputField placeholder="Identifiant Discord (Pour notification)" value={form.patient_discord} onChange={e => setForm({...form, patient_discord: e.target.value})} />
            </div>

            <div className="space-y-4">
              <h3 className="text-ems-400 font-bold uppercase text-xs tracking-wider border-b border-slate-800 pb-2">Détails du Rendez-vous</h3>
              <SelectField value={form.appointment_type} onChange={e => setForm({...form, appointment_type: e.target.value})}>
                <option value="Consultation">Consultation Générale</option>
                <option value="Check-up">Check-up Complet</option>
                <option value="Certificat">Certificat Médical / PPA</option>
                <option value="Suivi">Suivi Psychologique</option>
                <option value="Urgence">Urgence Relative</option>
              </SelectField>
              <div className="grid md:grid-cols-2 gap-4">
                <InputField type="date" value={form.preferred_date} onChange={e => setForm({...form, preferred_date: e.target.value})} required />
                <InputField type="time" value={form.preferred_time} onChange={e => setForm({...form, preferred_time: e.target.value})} required />
              </div>
              <textarea 
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:border-ems-500 focus:ring-1 focus:ring-ems-500 outline-none transition-all min-h-[100px]"
                placeholder="Motif du rendez-vous (douleurs, symptômes, demande spécifique...)"
                value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              />
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-ems-600 to-indigo-600 hover:from-ems-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-ems-500/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2">
              <Send size={20} /> Confirmer la Demande
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
    fetch(`/api/patients?search=${search}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setPatients(d.patients || []))
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
    await fetch(url, { method, body: formData, credentials: "include" })
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

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce dossier patient ?")) return
    await fetch(`/api/patients/${id}`, { method: "DELETE", credentials: "include" })
    load()
  }

  return (
    <Layout>
      <PageHeader 
        title="Dossiers Patients" 
        subtitle="Base de données civile"
        action={hasPerm('create_patients') && (
          <button onClick={() => { setEditingId(null); setForm(initialForm); setShowModal(true) }} 
            className="bg-ems-600 hover:bg-ems-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-ems-500/20 transition-all">
            <Plus size={18} /> Nouveau Patient
          </button>
        )}
      />

      <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-slate-500" size={18} />
            <InputField 
              className="pl-10"
              placeholder="Rechercher par Nom, Prénom ou ID Identité..."
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4">Identité</th>
                <th className="p-4">ID Identité</th>
                <th className="p-4">Infos</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {patients.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                        {p.photo ? <img src={p.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-500"><User size={20}/></div>}
                    </div>
                    <div>
                        <div className="font-bold text-white text-lg">{p.last_name} {p.first_name}</div>
                        <div className="text-xs text-slate-400">Né(e) le: {p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : "Inconnu"}</div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-ems-400 text-base">{p.insurance_number || "Non Défini"}</td>
                  <td className="p-4">
                    <div className="text-sm text-slate-300 flex items-center gap-1"><Phone size={12} /> {p.phone || "N/A"}</div>
                    <div className="text-xs text-slate-500">{p.gender === 'M' ? 'Homme' : p.gender === 'F' ? 'Femme' : 'Autre'}</div>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => navigate(`/reports?patient_id=${p.id}`)} title="Voir Rapports" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"><Eye size={16} /></button>
                    {hasPerm('create_patients') && <button onClick={() => handleEdit(p)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"><Edit2 size={16} /></button>}
                    {hasPerm('delete_patients') && <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg"><Trash2 size={16} /></button>}
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500">Aucun patient trouvé.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-y-auto">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h2 className="text-xl font-bold text-white">{editingId ? "Modifier Patient" : "Nouveau Patient"}</h2>
              <button onClick={() => setShowModal(false)}><X className="text-slate-400 hover:text-white" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
               <div className="flex justify-center mb-4">
                  <div 
                      className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center relative overflow-hidden group cursor-pointer"
                      onClick={() => fileInputRef.current.click()}
                  >
                      {form.photo instanceof File ? (
                          <img src={URL.createObjectURL(form.photo)} className="w-full h-full object-cover" />
                      ) : form.photo ? (
                          <img src={form.photo} className="w-full h-full object-cover" />
                      ) : (
                          <User size={40} className="text-slate-500" />
                      )}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="text-white" />
                      </div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => setForm({...form, photo: e.target.files[0]})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputField placeholder="Prénom" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} required />
                <InputField placeholder="Nom" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField type="date" value={form.date_of_birth?.split('T')[0]} onChange={e => setForm({...form, date_of_birth: e.target.value})} />
                <SelectField value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                  <option value="M">Homme</option>
                  <option value="F">Femme</option>
                  <option value="X">Autre</option>
                </SelectField>
              </div>
              <InputField placeholder="ID Identité (Carte d'identité)" value={form.insurance_number} onChange={e => setForm({...form, insurance_number: e.target.value})} required />
              <InputField placeholder="Téléphone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <textarea 
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:border-ems-500 focus:ring-1 focus:ring-ems-500 outline-none transition-all min-h-[100px]" 
                placeholder="Notes médicales / Antécédents..." 
                value={form.chronic_conditions} 
                onChange={e => setForm({...form, chronic_conditions: e.target.value})} 
              />
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors">Annuler</button>
                <button type="submit" className="flex-1 py-3 bg-ems-600 hover:bg-ems-500 text-white rounded-xl font-bold transition-colors">Sauvegarder</button>
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
    fetch("/api/appointments", { credentials: "include" })
      .then(r => r.json())
      .then(setAppointments)
  }

  useEffect(() => { load() }, [])

  const handleStatus = async (id, action, note = "") => {
    let url = `/api/appointments/${id}/${action}`
    const opts = { method: action === 'delete' ? 'DELETE' : 'POST', credentials: "include" };
    if (action === "complete") {
        opts.headers = { "Content-Type": "application/json" };
        opts.body = JSON.stringify({ completion_notes: note });
    }
    if (action === 'delete') url = `/api/appointments/${id}`;

    await fetch(url, opts)
    load()
  }
  
  const handleDelete = (id) => {
      if(window.confirm("Supprimer DÉFINITIVEMENT ce rendez-vous ?")) {
          handleStatus(id, 'delete');
      }
  }

  const filtered = appointments.filter(a => {
    if (filter === "pending") return a.status === "pending"
    if (filter === "my") return a.assigned_medic_id === user.id
    return true
  })

  return (
    <Layout>
      <PageHeader title="Rendez-vous" subtitle="Gestion du planning médical" />

      <div className="flex gap-2 mb-6 bg-slate-800/50 p-1.5 rounded-xl w-fit border border-slate-700">
        {[
          { id: "all", label: "Tous" },
          { id: "pending", label: "En attente" },
          { id: "my", label: "Mes RDV" }
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} 
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === f.id ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(a => (
          <div key={a.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 flex flex-col gap-4 shadow-sm hover:border-slate-600 transition-colors relative group">
            
            {isAdmin && (
                <button onClick={() => handleDelete(a.id)} className="absolute top-4 right-4 text-slate-600 hover:text-red-500 transition-colors bg-slate-900/50 p-1 rounded-full">
                    <Trash2 size={16} />
                </button>
            )}

            <div className="pr-8">
                 <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide 
                   ${a.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 
                     a.status === 'assigned' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                     'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                   {a.status === 'pending' ? 'En attente' : a.status === 'assigned' ? 'Assigné' : 'Terminé'}
                 </span>
                 <h3 className="text-white font-bold mt-2 text-lg">{a.patient_name}</h3>
                 <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                    <Phone size={14} /> {a.patient_phone || "N/A"}
                 </div>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-3 text-sm text-slate-300">
              <p className="font-medium text-slate-400 text-xs uppercase mb-1">{a.appointment_type}</p>
              {a.description || "Pas de description"}
            </div>

            {a.assigned_medic_id && (
               <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">{a.medic_first_name?.[0]}</div>
                  Assigné à {a.medic_first_name} {a.medic_last_name}
               </div>
            )}

            <div className="mt-auto pt-2 flex gap-2">
               {a.status === 'pending' && hasPerm('manage_appointments') && (
                 <button onClick={() => handleStatus(a.id, 'assign')} className="btn-primary w-full text-sm">Prendre en charge</button>
               )}
               {a.status === 'assigned' && a.assigned_medic_id === user.id && (
                 <button onClick={() => handleStatus(a.id, 'complete', 'Terminé via MDT')} className="btn-success w-full text-sm">Terminer</button>
               )}
               {a.status !== 'completed' && a.status !== 'cancelled' && (
                 <button onClick={() => handleStatus(a.id, 'cancel')} className="btn-danger w-full text-sm">Annuler</button>
               )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-slate-500 col-span-3 text-center py-10">Aucun rendez-vous trouvé.</p>}
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
    fetch(url, { credentials: "include" }).then(r => r.json()).then(setReports)
    fetch("/api/patients", { credentials: "include" }).then(r => r.json()).then(d => setPatients(d.patients || []))
    fetch("/api/reports/diseases", { credentials: "include" }).then(r => r.json()).then(setDiseases)
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
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
      credentials: "include"
    })
    setShowModal(false)
    setForm({ patient_id: "", disease: "", context_notes: "", medications: [], total_cost: 0 })
    loadData()
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce rapport ?")) return
    await fetch(`/api/reports/${id}`, { method: "DELETE", credentials: "include" })
    loadData()
  }

  return (
    <Layout>
      <PageHeader 
        title="Rapports Médicaux" 
        subtitle="Historique des interventions et traitements"
        action={
          <div className="flex gap-2">
             {filterPatientId && <button onClick={() => setFilterPatientId("")} className="btn-secondary text-sm px-4 py-2 bg-slate-800 rounded-xl hover:bg-slate-700 text-white">Voir tout</button>}
             {hasPerm('create_reports') && <button onClick={() => setShowModal(true)} className="bg-ems-600 hover:bg-ems-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-ems-500/20"><FilePlus size={18} /> Nouveau Rapport</button>}
          </div>
        }
      />

      <div className="space-y-4">
        {reports.map(r => (
          <div key={r.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-all relative">
             {hasPerm('delete_reports') && (
                <button onClick={() => handleDelete(r.id)} className="absolute top-4 right-4 text-slate-600 hover:text-red-500 transition-colors bg-slate-900/50 p-1 rounded-full">
                    <Trash2 size={16} />
                </button>
             )}
             <div className="flex justify-between items-start mb-3 pr-8">
                <div>
                   <h3 className="text-white font-bold text-lg">{r.patient_last_name} {r.patient_first_name}</h3>
                   <div className="text-slate-400 text-sm">ID: {r.patient_identity_id} | Traité par: {r.medic_first_name} {r.medic_last_name}</div>
                </div>
                <div className="text-right">
                   <div className="text-ems-400 font-bold">{r.diagnosis}</div>
                   <div className="text-slate-500 text-xs">{new Date(r.incident_date).toLocaleDateString()}</div>
                </div>
             </div>
             
             <div className="grid md:grid-cols-2 gap-4 bg-slate-900/50 p-4 rounded-lg text-sm">
                <div>
                   <span className="text-slate-500 uppercase text-xs font-bold block mb-1">Contexte</span>
                   <p className="text-slate-300">{r.notes || "Non précisé"}</p>
                </div>
                <div>
                   <span className="text-slate-500 uppercase text-xs font-bold block mb-1">Soins & Facture</span>
                   <p className="text-white font-medium mb-1">{r.medications_given || "Aucun"}</p>
                   <p className="text-green-400 font-bold">{r.treatment}</p>
                </div>
             </div>
          </div>
        ))}
        {reports.length === 0 && <p className="text-center text-slate-500 py-10">Aucun rapport enregistré.</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 sticky top-0 z-10">
              <h2 className="text-xl font-bold text-white">Nouveau Rapport</h2>
              <button onClick={() => setShowModal(false)}><X className="text-slate-400 hover:text-white" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">1. Patient</label>
                    <SelectField value={form.patient_id} onChange={e => setForm({...form, patient_id: e.target.value})} required>
                       <option value="">-- Choisir Patient --</option>
                       {patients.map(p => <option key={p.id} value={p.id}>{p.last_name} {p.first_name} (ID: {p.insurance_number})</option>)}
                    </SelectField>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">2. Diagnostic / Maladie</label>
                    <SelectField value={form.disease} onChange={e => setForm({...form, disease: e.target.value})} required>
                       <option value="">-- Choisir Maladie --</option>
                       {diseases.map(d => <option key={d} value={d}>{d}</option>)}
                    </SelectField>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">3. Contexte</label>
                    <textarea 
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-ems-500 focus:ring-1 focus:ring-ems-500 outline-none transition-all min-h-[150px]" 
                      placeholder="Accident, fusillade, chute..." 
                      value={form.context_notes} onChange={e => setForm({...form, context_notes: e.target.value})} 
                    />
                 </div>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                    <label className="text-xs font-bold text-slate-400 uppercase">4. Soins & Services</label>
                    <span className="text-green-400 font-bold text-lg">{form.total_cost}$</span>
                 </div>
                 <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                    {servicesList.map(cat => (
                       <div key={cat.cat}>
                          <h4 className="text-ems-400 text-sm font-bold mb-2 border-b border-slate-700 pb-1">{cat.cat}</h4>
                          <div className="grid grid-cols-2 gap-2">
                             {cat.items.map(item => (
                                <div key={item.n} onClick={() => toggleService(item)} 
                                   className={`p-2 rounded-lg cursor-pointer border transition-all text-sm flex justify-between items-center ${form.medications.includes(item.n) ? "bg-ems-600/20 border-ems-500 text-white" : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"}`}>
                                   <span>{item.n}</span>
                                   <span className="font-mono text-xs opacity-70">{item.p}$</span>
                                </div>
                             ))}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
              <div className="col-span-full pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium">Annuler</button>
                <button type="submit" className="flex-1 py-3 bg-ems-600 hover:bg-ems-500 text-white rounded-xl font-bold">Enregistrer Rapport ({form.total_cost}$)</button>
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
  
  const [showUserModal, setShowUserModal] = useState(false)
  const [userForm, setUserForm] = useState({ id: null, username: "", password: "", first_name: "", last_name: "", badge_number: "", grade_id: "" })

  const loadAdminData = () => {
    fetch("/api/admin/stats", { credentials: "include" })
      .then(r => {
          if(!r.ok) throw new Error("Erreur chargement stats");
          return r.json();
      })
      .then(setStats)
      .catch(e => { console.error(e); setStats(null); }); // Gestion d'erreur silencieuse pour ne pas crasher l'UI

    fetch("/api/admin/users", { credentials: "include" }).then(r => r.json()).then(setUsersList)
    fetch("/api/admin/grades", { credentials: "include" }).then(r => r.json()).then(setGrades)
  }

  useEffect(() => { if (isAdmin) loadAdminData() }, [isAdmin])

  const togglePermission = async (grade, perm) => {
    const newPerms = { ...grade.permissions, [perm]: !grade.permissions?.[perm] }
    const updatedGrades = grades.map(g => g.id === grade.id ? { ...g, permissions: newPerms } : g)
    setGrades(updatedGrades)
    await fetch(`/api/admin/grades/${grade.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...grade, permissions: newPerms }), credentials: "include" })
  }

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const url = userForm.id ? `/api/admin/users/${userForm.id}` : "/api/admin/users";
    const method = userForm.id ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(userForm), credentials: "include" });
    if(res.ok) { setShowUserModal(false); loadAdminData(); }
    else alert("Erreur lors de l'enregistrement (Vérifiez les grades)");
  }
  
  // Fonction de suppression (Admin)
  const deleteUser = async (id) => {
      if(!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur DÉFINITIVEMENT ?")) return;
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE", credentials: "include" });
      if(res.ok) loadAdminData();
      else {
          const d = await res.json();
          alert(d.error || "Erreur suppression");
      }
  }

  const editUser = (u) => { setUserForm({ id: u.id, username: u.username, password: "", first_name: u.first_name, last_name: u.last_name, badge_number: u.badge_number, grade_id: u.grade_id }); setShowUserModal(true); }
  const newUser = () => { setUserForm({ id: null, username: "", password: "", first_name: "", last_name: "", badge_number: "", grade_id: "" }); setShowUserModal(true); }

  if (!isAdmin) return <Navigate to="/dashboard" />

  const permissionsList = [
    { key: "access_dashboard", label: "Accès MDT" },
    { key: "view_patients", label: "Voir Patients" },
    { key: "create_patients", label: "Créer/Modif Patients" },
    { key: "delete_patients", label: "Supprimer Patients" },
    { key: "create_reports", label: "Créer Rapports" },
    { key: "delete_reports", label: "Supprimer Rapports" },
    { key: "manage_appointments", label: "Gérer RDV" },
    { key: "delete_appointments", label: "Supprimer RDV" },
    { key: "view_roster", label: "Voir Effectifs" },
    { key: "manage_users", label: "Gérer Utilisateurs" },
    { key: "delete_users", label: "Supprimer Utilisateurs" },
    { key: "manage_grades", label: "Gérer Grades" },
    { key: "view_logs", label: "Voir Logs" }
  ]

  return (
    <Layout>
      <PageHeader title="Administration" subtitle="Gestion globale du service" />
      <div className="flex border-b border-slate-700 mb-8">
        <button onClick={() => setActiveTab("users")} className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === "users" ? "border-ems-500 text-white" : "border-transparent text-slate-400 hover:text-white"}`}>Utilisateurs</button>
        <button onClick={() => setActiveTab("grades")} className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === "grades" ? "border-ems-500 text-white" : "border-transparent text-slate-400 hover:text-white"}`}>Grades & Permissions</button>
        <button onClick={() => setActiveTab("stats")} className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === "stats" ? "border-ems-500 text-white" : "border-transparent text-slate-400 hover:text-white"}`}>Statistiques</button>
      </div>

      {activeTab === "users" && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex justify-end">
             <button onClick={newUser} className="bg-ems-600 hover:bg-ems-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><UserPlus size={18} /> Créer Utilisateur</button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase"><tr><th className="p-4">Utilisateur</th><th className="p-4">Badge</th><th className="p-4">Grade</th><th className="p-4">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
               {usersList.map(u => (
                 <tr key={u.id}>
                   <td className="p-4">
                      <div className="font-bold text-white">{u.first_name} {u.last_name}</div>
                      <div className="text-xs text-slate-400">@{u.username}</div>
                   </td>
                   <td className="p-4 text-slate-400 font-mono text-sm">{u.badge_number}</td>
                   <td className="p-4"><span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: u.grade_color + '20', color: u.grade_color }}>{u.grade_name || "Aucun"}</span></td>
                   <td className="p-4 space-x-2">
                       <button onClick={() => editUser(u)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white"><Edit2 size={16}/></button>
                       {/* Bouton Delete Protégé */}
                       {hasPerm('delete_users') && u.id !== user.id && (
                           <button onClick={() => deleteUser(u.id)} className="p-2 bg-red-900/50 hover:bg-red-900 text-red-400 hover:text-white rounded transition-colors"><Trash2 size={16}/></button>
                       )}
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "grades" && (
        <div className="space-y-6">
          {grades.map(g => (
            <div key={g.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-4">
                 <div><h3 className="text-xl font-bold text-white flex items-center gap-3"><div className="w-4 h-4 rounded-full" style={{ backgroundColor: g.color }} />{g.name}</h3><p className="text-slate-400 text-sm">{g.category} • Niveau {g.level}</p></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {permissionsList.map(p => (
                  <label key={p.key} className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${g.permissions?.[p.key] ? 'bg-green-500 border-green-500' : 'border-slate-600 bg-slate-900 group-hover:border-slate-500'}`}>{g.permissions?.[p.key] && <Check size={14} className="text-white" />}</div>
                    <input type="checkbox" className="hidden" checked={!!g.permissions?.[p.key]} onChange={() => togglePermission(g, p.key)} />
                    <span className={`text-sm ${g.permissions?.[p.key] ? 'text-white font-medium' : 'text-slate-500'}`}>{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECURISATION DE L'AFFICHAGE STATS */}
      {activeTab === "stats" && (
         <div className="grid grid-cols-4 gap-4">
            {stats && stats.patients ? (
                <>
                    <StatCard label="Total Dossiers" value={stats.patients.total} colorClass="text-blue-400" icon={Users} />
                    <StatCard label="Rapports Émis" value={stats.reports.total} colorClass="text-green-400" icon={FileText} />
                    <StatCard label="RDV En Attente" value={stats.appointments.pending} colorClass="text-yellow-400" icon={Clock} />
                    <StatCard label="Effectif Total" value={stats.users.total} colorClass="text-ems-400" icon={Activity} />
                </>
            ) : (
                <div className="col-span-4 text-center text-slate-500 py-10">Chargement des statistiques... (ou erreur)</div>
            )}
         </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">{userForm.id ? "Modifier" : "Créer"} Utilisateur</h2>
              <form onSubmit={handleUserSubmit} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <InputField placeholder="Prénom" value={userForm.first_name} onChange={e => setUserForm({...userForm, first_name: e.target.value})} required />
                    <InputField placeholder="Nom" value={userForm.last_name} onChange={e => setUserForm({...userForm, last_name: e.target.value})} required />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <InputField placeholder="Identifiant" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} required />
                    <InputField placeholder="Matricule" value={userForm.badge_number} onChange={e => setUserForm({...userForm, badge_number: e.target.value})} />
                 </div>
                 <InputField type="password" placeholder={userForm.id ? "Nouveau mot de passe (laisser vide si inchangé)" : "Mot de passe"} value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} required={!userForm.id} />
                 <SelectField value={userForm.grade_id} onChange={e => setUserForm({...userForm, grade_id: e.target.value})} required>
                    <option value="">-- Grade --</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                 </SelectField>
                 <div className="flex gap-3 mt-6">
                    <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-2 bg-slate-800 text-white rounded-lg">Annuler</button>
                    <button type="submit" className="flex-1 py-2 bg-ems-600 text-white font-bold rounded-lg">Sauvegarder</button>
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
    fetch("/api/diagnosis/symptoms", { credentials: "include" }).then(r => r.json()).then(setSymptoms)
  }, [])

  const handleAnalyze = async (e) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch("/api/diagnosis/analyze", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibleSymptom: selectedSymptom, vitals })
    })
    setResult(await res.json())
    setLoading(false)
  }

  const reset = () => { setResult(null); setVitals({ temp: "", hr: "", o2: "", bp: "" }); setSelectedSymptom("") }

  return (
    <Layout>
      <PageHeader title="Calculatrice Médicale" subtitle="Diagnostic assisté par IA" />
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleAnalyze} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">1. Symptôme Principal</label>
              <div className="relative">
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white appearance-none focus:border-ems-500 focus:ring-1 focus:ring-ems-500 outline-none text-lg"
                  value={selectedSymptom} 
                  onChange={e => setSelectedSymptom(e.target.value)} 
                  required
                >
                  <option value="">-- Sélectionner le symptôme --</option>
                  {symptoms.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-300 uppercase tracking-wide">2. Constantes Vitales</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                   <span className="absolute left-4 top-3 text-slate-500 text-xs font-bold uppercase z-10">Temp (°C)</span>
                   <DiagnosisInput type="number" step="0.1" value={vitals.temp} onChange={e => setVitals({...vitals, temp: e.target.value})} required />
                </div>
                <div className="relative">
                   <span className="absolute left-4 top-3 text-slate-500 text-xs font-bold uppercase z-10">BPM (Cœur)</span>
                   <DiagnosisInput type="number" value={vitals.hr} onChange={e => setVitals({...vitals, hr: e.target.value})} required />
                </div>
                <div className="relative">
                   <span className="absolute left-4 top-3 text-slate-500 text-xs font-bold uppercase z-10">SpO2 (%)</span>
                   <DiagnosisInput type="number" value={vitals.o2} onChange={e => setVitals({...vitals, o2: e.target.value})} required />
                </div>
                <div className="relative">
                   <span className="absolute left-4 top-3 text-slate-500 text-xs font-bold uppercase z-10">Tension (Sys)</span>
                   <DiagnosisInput type="number" value={vitals.bp} onChange={e => setVitals({...vitals, bp: e.target.value})} required />
                </div>
              </div>
            </div>
            
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-ems-600 to-indigo-600 hover:from-ems-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-ems-500/20 transition-all text-lg flex items-center justify-center gap-2">
              {loading ? "Analyse..." : <><Stethoscope /> Lancer Diagnostic</>}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          {result && result.status !== "unknown" ? (
             <div className={`rounded-2xl overflow-hidden shadow-2xl p-6 border ${result.status === 'confirmed' ? 'bg-green-500/10 border-green-500/50' : 'bg-orange-500/10 border-orange-500/50'}`}>
                <h2 className="text-2xl font-bold text-white mb-2">
                    {result.status === 'confirmed' ? "Diagnostic Confirmé" : "Plusieurs Possibilités"}
                </h2>
                <p className="text-slate-300 mb-4 font-medium border-b border-white/10 pb-4">{result.message}</p>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                   {result.results.map((r, i) => (
                      <div key={i} className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 hover:border-ems-500 transition-colors">
                         <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-xl text-white">{r.name}</span>
                            <span className={`text-sm font-bold px-2 py-1 rounded ${r.confidence > 80 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                Probabilité: {r.confidence}%
                            </span>
                         </div>
                         <div className="grid grid-cols-2 gap-2 text-sm mt-3 pt-3 border-t border-slate-800">
                            <div><span className="text-slate-500 block text-xs uppercase">Traitement</span> <b className="text-ems-400">{r.med}</b></div>
                            <div><span className="text-slate-500 block text-xs uppercase">Cible</span> <b className="text-slate-300">{r.organ}</b></div>
                         </div>
                      </div>
                   ))}
                </div>
                <button onClick={reset} className="mt-6 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium">Nouveau Patient</button>
             </div>
          ) : result ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center">
               <HelpCircle size={48} className="mx-auto text-slate-500 mb-4" />
               <h3 className="text-xl font-bold text-white">Aucun Résultat</h3>
               <p className="text-slate-400 mt-2 mb-6">Les constantes ne correspondent à aucune pathologie connue dans ces fourchettes.</p>
               <button onClick={reset} className="text-ems-400 hover:text-white">Réessayer</button>
            </div>
          ) : (
            <div className="bg-slate-800/30 border border-slate-800 border-dashed rounded-2xl p-12 text-center text-slate-500 flex flex-col items-center">
               <Activity className="mb-4 opacity-50" size={40} />
               En attente des données vitales...
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

function Dashboard() {
  const { user, isAdmin } = useAuth()
  const [stats, setStats] = useState(null)

  // Fetch REAL stats for Dashboard
  useEffect(() => {
    fetch("/api/admin/stats", { credentials: "include" })
      .then(r => {
          if(r.ok) return r.json();
          return null; // Fallback or mock if not allowed
      })
      .then(setStats)
      .catch(() => {})
  }, [])

  return (
    <Layout>
      <PageHeader title={`Bienvenue, ${user?.first_name || user?.username}`} subtitle={`Badge: ${user?.badge_number} | Grade: ${user?.grade_name || "En service"}`} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Patients" value={stats?.patients?.total || "-"} colorClass="text-blue-400" icon={Users} />
        <StatCard label="Rapports Émis" value={stats?.reports?.total || "-"} colorClass="text-green-400" icon={FileText} />
        <StatCard label="RDV En Attente" value={stats?.appointments?.pending || "-"} colorClass="text-yellow-400" icon={Clock} />
        <StatCard label="Effectif Total" value={stats?.users?.total || "-"} colorClass="text-ems-400" icon={Activity} />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Link to="/diagnosis" className="group bg-gradient-to-br from-indigo-900/50 to-slate-900 border border-indigo-500/30 p-6 rounded-2xl hover:border-indigo-500 transition-all">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 mb-4 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
            <Stethoscope size={24} />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Démarrer Diagnostic</h3>
          <p className="text-slate-400 text-sm">Assistant IA urgences</p>
        </Link>
        <Link to="/patients" className="group bg-slate-800/50 border border-slate-700 p-6 rounded-2xl hover:border-ems-500 transition-all">
          <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 mb-4 group-hover:bg-ems-500 group-hover:text-white transition-colors">
            <Users size={24} />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Gestion Patients</h3>
          <p className="text-slate-400 text-sm">Créer ou modifier dossiers</p>
        </Link>
        <Link to="/reports" className="group bg-slate-800/50 border border-slate-700 p-6 rounded-2xl hover:border-ems-500 transition-all">
          <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 mb-4 group-hover:bg-ems-500 group-hover:text-white transition-colors">
            <FilePlus size={24} />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Rapports</h3>
          <p className="text-slate-400 text-sm">Historique des interventions</p>
        </Link>
      </div>
    </Layout>
  )
}

function Roster() {
  const [members, setMembers] = useState([])
  useEffect(() => { fetch("/api/users/roster", { credentials: "include" }).then(r => r.json()).then(setMembers) }, [])
  return (
    <Layout>
      <PageHeader title="Effectifs en Service" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map(m => (
          <div key={m.id} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold border-2 border-slate-500 overflow-hidden">
                {m.profile_picture ? (
                    <img src={m.profile_picture} className="w-full h-full object-cover" />
                ) : (
                    m.username?.[0]
                )}
             </div>
             <div>
                <h4 className="text-white font-bold">{m.first_name || m.username} {m.last_name}</h4>
                <div className="text-xs font-bold uppercase mt-0.5" style={{ color: m.grade_color }}>{m.grade_name}</div>
                <div className="text-xs text-slate-500 mt-1">Tel: {m.phone || "?"}</div>
             </div>
             <div className="ml-auto text-slate-600 font-mono text-xs">{m.badge_number}</div>
          </div>
        ))}
      </div>
    </Layout>
  )
}

function Landing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center relative overflow-hidden">
       <div className="relative z-10 text-center space-y-6">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl p-2"><img src="/logo.png" className="w-full h-full object-contain"/></div>
          <h1 className="text-5xl font-extrabold text-white">EMS - RMB</h1>
          <div className="flex gap-4 justify-center"><Link to="/login" className="px-8 py-3 bg-white text-black font-bold rounded-xl">Personnel</Link><button onClick={() => navigate('/book')} className="px-8 py-3 bg-slate-800 text-white border border-slate-700 rounded-xl">Prendre RDV</button></div>
       </div>
    </div>
  )
}

function Login() {
  const { user, login } = useAuth()
  const [form, setForm] = useState({ username: "", password: "" })
  const [error, setError] = useState(null)
  
  if (user) return <Navigate to="/dashboard" />

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await login(form.username, form.password)
    if(!res.success) setError(res.error)
  }

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4">
       <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 p-2"><img src="/logo.png" className="w-full h-full object-contain"/></div>
          <h1 className="text-2xl font-bold text-white text-center mb-6">Connexion EMS</h1>
          {error && <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-sm text-center">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
             <InputField placeholder="Identifiant" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
             <InputField type="password" placeholder="Mot de passe" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
             <button type="submit" className="w-full py-3 bg-ems-600 text-white font-bold rounded-xl hover:bg-ems-500">Se connecter</button>
          </form>
       </div>
    </div>
  )
}

const Placeholder = ({ title }) => <Layout><PageHeader title={title} /><div className="bg-slate-800/50 p-8 rounded-2xl text-center text-slate-500">Module en construction...</div></Layout>

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-[#0B1120] flex items-center justify-center text-ems-400 animate-pulse">Chargement EMS...</div>
  if (!user) return <Navigate to="/login" />
  return children
}
