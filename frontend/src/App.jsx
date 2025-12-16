import { BrowserRouter, Routes, Route, Navigate, useLocation, Link, useNavigate } from "react-router-dom"
import { createContext, useContext, useState, useEffect, useRef } from "react"
import { 
  Activity, Users, ClipboardList, Stethoscope, ShieldAlert, 
  LogOut, LayoutDashboard, FileText, Menu, X, 
  CheckCircle, HelpCircle, MessageSquare,
  Search, Plus, Clock, Edit2, Trash2, Check, Phone, User, FilePlus, ArrowLeft, Send, UserPlus, Eye, Camera, ChevronRight, ChevronDown
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
  // Ajout du champ password
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
    await fetch("/api/users/me", { method: "PUT", body: formData })
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
      <div className="flex-1 flex flex-col lg:ml-64">
        <header className="lg:hidden bg-white border-b border-slate-300 px-4 py-3 flex justify-between items-center sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 p-1 shadow">
               <Logo size={32} />
             </div>
             <span className="font-bold text-slate-800">MRSA</span>
          </div>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="p-2 hover:bg-slate-100 rounded-lg"><Menu size={22} /></button>
        </header>
        
        {mobileMenu && (
          <div className="lg:hidden fixed inset-0 bg-white z-50 p-4">
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
              <h2 className="text-lg font-bold">Menu</h2>
              <button onClick={() => setMobileMenu(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={22} /></button>
            </div>
            <nav className="space-y-1">
              {navs.map(n => (
                <Link key={n.to} to={n.to} onClick={() => setMobileMenu(false)} className="flex items-center gap-3 p-3 rounded-lg text-slate-700 hover:bg-slate-100 font-medium">
                  <n.icon size={20} /> {n.label}
                </Link>
              ))}
              <div className="border-t my-4" />
              <button onClick={logout} className="w-full flex items-center gap-3 p-3 text-red-600 font-semibold">
                <LogOut size={20} /> Déconnexion
              </button>
            </nav>
          </div>
        )}

        <main className="flex-1 p-4 lg:p-6 relative z-10">
          <div className="max-w-7xl mx-auto animate-in">{children}</div>
        </main>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-in">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="font-bold text-lg text-slate-800">Mon Profil</h2>
              <button onClick={() => setShowProfileModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
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
              <div className="border-t pt-3 mt-1">
                 <p className="label mb-2 text-blue-600">Sécurité</p>
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
    blue: { icon: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
    green: { icon: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
    yellow: { icon: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
    red: { icon: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  }
  const c = colors[color]
  return (
    <div className={`card p-5 border-l-4 ${c.border}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
          <p className="stat-value text-slate-800">{value}</p>
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
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
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
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
          <CheckCircle size={40} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Demande envoyée</h2>
        <p className="text-slate-500 mb-6">Votre demande a été transmise. Un membre de l'équipe médicale vous contactera.</p>
        <button onClick={() => navigate('/')} className="btn-secondary w-full">Retour à l'accueil</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen p-4 lg:p-8 flex flex-col items-center justify-center relative">
      <Watermark />
      <div className="w-full max-w-lg relative z-10">
        <button onClick={() => navigate('/')} className="mb-4 flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium">
          <ArrowLeft size={16} /> Retour
        </button>
        
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6 pb-5 border-b">
            <div className="w-14 h-14 bg-white rounded-xl border-2 border-slate-200 p-2 flex items-center justify-center shadow">
              <Logo size={44} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Demande de rendez-vous</h1>
              <p className="text-slate-500 text-sm">Services Médicaux MRSA</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <InputField label="Nom & Prénom" placeholder="Jean Dupont" value={form.patient_name} onChange={e => setForm({...form, patient_name: e.target.value})} required />
              <InputField label="Téléphone" placeholder="06 12 34 56 78" value={form.patient_phone} onChange={e => setForm({...form, patient_phone: e.target.value})} required />
            </div>
            <InputField label="Discord (pour contact)" placeholder="username#0000" value={form.patient_discord} onChange={e => setForm({...form, patient_discord: e.target.value})} />
            
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

  // --- NOUVELLE LOGIQUE DE SUPPRESSION ---
  const handleDelete = async (id, force = false) => {
    if (!force && !window.confirm("Supprimer ce dossier patient ?")) return
    
    const url = force ? `/api/patients/${id}?force=true` : `/api/patients/${id}`;
    const res = await fetch(url, { method: "DELETE", credentials: "include" })
    
    if (res.ok) {
        load();
    } else {
        const data = await res.json();
        // Si erreur 409 Conflict (Rapports existants)
        if (res.status === 409 && data.requireForce) {
            if (window.confirm(`ATTENTION : Ce patient possède ${data.count} rapports médicaux.\nVoulez-vous supprimer le patient ET tous ses rapports ?\nCette action est irréversible.`)) {
                // Tenter de supprimer avec force=true
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
        <div className="p-4 border-b bg-slate-50/50 rounded-t-xl">
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
                          <div className="font-semibold text-slate-800">{p.last_name} {p.first_name}</div>
                          <div className="text-xs text-slate-500">{p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString('fr-FR') : "Date inconnue"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell font-mono text-sm font-semibold text-blue-600">{p.insurance_number || "—"}</td>
                  <td className="table-cell">
                    <div className="text-sm text-slate-700 font-medium">{p.phone || "N/A"}</div>
                    <div className="text-xs text-slate-400">{p.gender === 'M' ? 'Homme' : p.gender === 'F' ? 'Femme' : 'Autre'}</div>
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => navigate(`/reports?patient_id=${p.id}`)} title="Voir Rapports" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye size={18} /></button>
                      {hasPerm('create_patients') && <button onClick={() => handleEdit(p)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"><Edit2 size={18} /></button>}
                      {hasPerm('delete_patients') && <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>}
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
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl animate-in">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="font-bold text-lg text-slate-800">{editingId ? "Modifier le patient" : "Nouveau patient"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
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
      if(window.confirm("Supprimer définitivement ce rendez-vous ?")) {
          handleStatus(id, 'delete');
      }
  }

  const filtered = appointments.filter(a => {
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
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${filter === f.id ? "bg-blue-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(a => (
          <div key={a.id} className="card p-5 relative group hover:shadow-lg transition-shadow">
            {isAdmin && (
                <button onClick={() => handleDelete(a.id)} className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={16} />
                </button>
            )}
            <div className="mb-4">
                 {statusBadge(a.status)}
                 <h3 className="text-slate-800 font-bold text-lg mt-2">{a.patient_name}</h3>
                 {/* AJOUT DE L'AFFICHAGE DU DISCORD */}
                 <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                       <Phone size={14} /> {a.patient_phone || "N/A"}
                    </div>
                    {a.patient_discord && (
                       <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                          <MessageSquare size={14} /> {a.patient_discord}
                       </div>
                    )}
                 </div>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600 mb-4 border">
              <p className="text-xs text-slate-400 uppercase font-bold mb-1">{a.appointment_type}</p>
              {a.description || "Pas de description"}
            </div>

            {a.assigned_medic_id && (
               <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">{a.medic_first_name?.[0]}</div>
                  {a.medic_first_name} {a.medic_last_name}
               </div>
            )}

            <div className="flex gap-2 pt-3 border-t">
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
                <button onClick={() => handleDelete(r.id)} className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={16} />
                </button>
             )}
             <div className="flex justify-between items-start mb-4">
                <div>
                   <h3 className="text-slate-800 font-bold text-lg">{r.patient_last_name} {r.patient_first_name}</h3>
                   <div className="text-slate-500 text-sm">ID: <span className="font-mono font-semibold text-blue-600">{r.patient_identity_id}</span> · Dr. {r.medic_first_name} {r.medic_last_name}</div>
                </div>
                <div className="text-right">
                   <div className="text-blue-600 font-bold">{r.diagnosis}</div>
                   <div className="text-slate-400 text-sm">{new Date(r.incident_date).toLocaleDateString('fr-FR')}</div>
                </div>
             </div>
             
             <div className="grid md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border">
                <div>
                   <span className="label">Contexte</span>
                   <p className="text-slate-600">{r.notes || "Non précisé"}</p>
                </div>
                <div>
                   <span className="label">Soins & Facture</span>
                   <p className="text-slate-800 font-medium mb-1">{r.medications_given || "Aucun"}</p>
                   <p className="text-emerald-600 font-bold font-mono text-lg">{r.treatment}</p>
                </div>
             </div>
          </div>
        ))}
        {reports.length === 0 && <p className="text-center text-slate-400 py-12 font-medium">Aucun rapport</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col animate-in">
            <div className="p-5 border-b flex justify-between items-center flex-shrink-0">
              <h2 className="font-bold text-lg text-slate-800">Nouveau rapport</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
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

                <div className="bg-slate-50 rounded-xl p-5 border">
                   <div className="flex justify-between items-center mb-4 pb-4 border-b">
                      <span className="label mb-0">Soins & Services</span>
                      <span className="text-emerald-600 font-bold font-mono text-xl">{form.total_cost} €</span>
                   </div>
                   <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                      {servicesList.map(cat => (
                         <div key={cat.cat}>
                            <h4 className="text-slate-500 text-xs font-bold uppercase mb-2">{cat.cat}</h4>
                            <div className="grid grid-cols-2 gap-2">
                               {cat.items.map(item => (
                                  <div key={item.n} onClick={() => toggleService(item)} 
                                     className={`p-3 rounded-lg cursor-pointer border-2 text-sm flex justify-between items-center transition-all ${form.medications.includes(item.n) ? "bg-blue-50 border-blue-400 text-blue-700 font-medium" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}>
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
              <div className="p-5 border-t flex gap-3 flex-shrink-0 bg-slate-50">
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
  
  const [showUserModal, setShowUserModal] = useState(false)
  const [userForm, setUserForm] = useState({ id: null, username: "", password: "", first_name: "", last_name: "", badge_number: "", grade_id: "" })

  const loadAdminData = () => {
    fetch("/api/admin/stats", { credentials: "include" }).then(r => r.ok ? r.json() : null).then(setStats).catch(() => setStats(null))
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
    else alert("Erreur lors de l'enregistrement");
  }
  
  const deleteUser = async (id) => {
      if(!window.confirm("Supprimer définitivement cet utilisateur ?")) return;
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE", credentials: "include" });
      if(res.ok) loadAdminData();
      else { const d = await res.json(); alert(d.error || "Erreur"); }
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
    { key: "view_roster", label: "Voir Effectifs" },
    { key: "manage_users", label: "Gérer Utilisateurs" },
    { key: "delete_users", label: "Supprimer Utilisateurs" },
  ]

  return (
    <Layout>
      <PageHeader title="Administration" subtitle="Gestion du système" />
      
      <div className="card mb-6">
        <div className="flex border-b">
          {["users", "grades", "stats"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-4 text-sm font-bold border-b-2 -mb-px transition-all ${activeTab === tab ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
              {tab === "users" ? "Utilisateurs" : tab === "grades" ? "Grades" : "Statistiques"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "users" && (
        <div className="card">
          <div className="p-4 border-b bg-slate-50/50 flex justify-end rounded-t-xl">
             <button onClick={newUser} className="btn-primary"><UserPlus size={18} className="mr-2" /> Créer</button>
          </div>
          <table className="w-full">
            <thead><tr><th className="table-header">Utilisateur</th><th className="table-header">Badge</th><th className="table-header">Grade</th><th className="table-header">Actions</th></tr></thead>
            <tbody>
               {usersList.map(u => (
                 <tr key={u.id} className="table-row">
                   <td className="table-cell">
                      <div className="font-semibold text-slate-800">{u.first_name} {u.last_name}</div>
                      <div className="text-xs text-slate-400 font-mono">@{u.username}</div>
                   </td>
                   <td className="table-cell text-slate-600 font-mono text-sm font-semibold">{u.badge_number}</td>
                   <td className="table-cell"><span className="badge" style={{ backgroundColor: u.grade_color + '25', color: u.grade_color, borderColor: u.grade_color }}>{u.grade_name || "—"}</span></td>
                   <td className="table-cell">
                     <div className="flex items-center gap-1">
                       <button onClick={() => editUser(u)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"><Edit2 size={16}/></button>
                       {hasPerm('delete_users') && u.id !== user.id && (
                           <button onClick={() => deleteUser(u.id)} className="p-2 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={16}/></button>
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
              <div className="flex items-center gap-4 mb-5 pb-5 border-b">
                 <div className="w-5 h-5 rounded-full shadow-inner" style={{ backgroundColor: g.color }} />
                 <div>
                   <h3 className="font-bold text-lg text-slate-800">{g.name}</h3>
                   <p className="text-slate-500 text-sm">{g.category} · Niveau {g.level}</p>
                 </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {permissionsList.map(p => (
                  <label key={p.key} className="flex items-center gap-2.5 cursor-pointer group p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${g.permissions?.[p.key] ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-slate-400'}`}>{g.permissions?.[p.key] && <Check size={14} className="text-white" strokeWidth={3} />}</div>
                    <input type="checkbox" className="hidden" checked={!!g.permissions?.[p.key]} onChange={() => togglePermission(g, p.key)} />
                    <span className={`text-sm font-medium ${g.permissions?.[p.key] ? 'text-slate-800' : 'text-slate-500'}`}>{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "stats" && (
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
      )}

      {showUserModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl animate-in">
              <div className="p-5 border-b">
                <h2 className="font-bold text-lg text-slate-800">{userForm.id ? "Modifier" : "Créer"} utilisateur</h2>
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
                 <SelectField label="Grade" value={userForm.grade_id} onChange={e => setUserForm({...userForm, grade_id: e.target.value})} required>
                    <option value="">-- Sélectionner --</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                 </SelectField>
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
                <div className="flex items-center gap-3 mb-5 pb-5 border-b">
                  <div className={`w-4 h-4 rounded-full ${result.status === 'confirmed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <h2 className="font-bold text-lg text-slate-800">
                      {result.status === 'confirmed' ? "Diagnostic confirmé" : "Diagnostics possibles"}
                  </h2>
                </div>
                <p className="text-slate-600 mb-5">{result.message}</p>
                
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                   {result.results.map((r, i) => (
                      <div key={i} className="bg-slate-50 p-4 rounded-xl border">
                         <div className="flex justify-between items-center mb-3">
                            <span className="font-bold text-slate-800 text-lg">{r.name}</span>
                            <span className={`badge ${r.confidence > 80 ? 'badge-green' : 'badge-yellow'}`}>{r.confidence}%</span>
                         </div>
                         <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t">
                            <div><span className="text-slate-400 text-xs font-bold uppercase">Traitement</span><p className="text-blue-600 font-semibold mt-1">{r.med}</p></div>
                            <div><span className="text-slate-400 text-xs font-bold uppercase">Organe cible</span><p className="text-slate-700 font-medium mt-1">{r.organ}</p></div>
                         </div>
                      </div>
                   ))}
                </div>
                <button onClick={reset} className="btn-secondary w-full mt-5">Nouveau diagnostic</button>
             </div>
          ) : result ? (
            <div className="card p-10 text-center">
               <HelpCircle size={48} className="mx-auto text-slate-300 mb-4" />
               <h3 className="font-bold text-xl text-slate-800">Aucun résultat</h3>
               <p className="text-slate-500 mt-2 mb-6">Les constantes ne correspondent à aucune pathologie connue.</p>
               <button onClick={reset} className="text-blue-600 hover:text-blue-700 font-semibold">Réessayer</button>
            </div>
          ) : (
            <div className="card border-dashed border-2 border-slate-300 bg-slate-50 p-14 text-center text-slate-400 flex flex-col items-center">
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
  const { user } = useAuth()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetch("/api/admin/stats", { credentials: "include" }).then(r => r.ok ? r.json() : null).then(setStats).catch(() => {})
  }, [])

  return (
    <Layout>
      <PageHeader title={`Bonjour, ${user?.first_name || user?.username}`} subtitle={`${user?.grade_name || "Personnel médical"} · Badge ${user?.badge_number || "N/A"}`} />
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Patients" value={stats?.patients?.total ?? "—"} icon={Users} color="blue" />
        <StatCard label="Rapports" value={stats?.reports?.total ?? "—"} icon={FileText} color="green" />
        <StatCard label="RDV en attente" value={stats?.appointments?.pending ?? "—"} icon={Clock} color="yellow" />
        <StatCard label="Effectif" value={stats?.users?.total ?? "—"} icon={Activity} color="blue" />
      </div>

      <h2 className="font-bold text-lg text-slate-800 mb-4">Accès rapide</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/diagnosis" className="card p-6 hover:shadow-xl transition-all group border-l-4 border-blue-500">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
            <Stethoscope size={24} />
          </div>
          <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">Diagnostic <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" /></h3>
          <p className="text-slate-500 text-sm">Outil d'aide au diagnostic</p>
        </Link>
        <Link to="/patients" className="card p-6 hover:shadow-xl transition-all group border-l-4 border-slate-400">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 mb-4 group-hover:scale-110 transition-transform">
            <Users size={24} />
          </div>
          <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">Patients <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" /></h3>
          <p className="text-slate-500 text-sm">Gestion des dossiers</p>
        </Link>
        <Link to="/reports" className="card p-6 hover:shadow-xl transition-all group border-l-4 border-emerald-500">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
            <FilePlus size={24} />
          </div>
          <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">Rapports <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" /></h3>
          <p className="text-slate-500 text-sm">Interventions médicales</p>
        </Link>
      </div>
    </Layout>
  )
}

function Roster() {
  const [members, setMembers] = useState([])

  useEffect(() => { fetch("/api/users/roster", { credentials: "include" }).then(r => r.json()).then(setMembers) }, [])

  // --- LOGIQUE HIERARCHIQUE ---
  // On regroupe par catégorie, puis on affiche les grades par ordre décroissant de niveau
  const grouped = members.reduce((acc, m) => {
      const cat = m.grade_category || "Autres";
      if(!acc[cat]) acc[cat] = [];
      acc[cat].push(m);
      return acc;
  }, {});

  // Définir un ordre d'affichage des catégories si nécessaire
  const categoryOrder = ["Direction M.R.S.A", "Chef de service", "Medecine", "Paramedical", "Système", "Autres"];
  const sortedCategories = Object.keys(grouped).sort((a,b) => {
      const idxA = categoryOrder.indexOf(a);
      const idxB = categoryOrder.indexOf(b);
      // Si les deux sont dans la liste, on trie selon l'ordre. Sinon, on met à la fin.
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
            // Trier les utilisateurs par grade level DESC
            usersInCat.sort((a, b) => b.grade_level - a.grade_level);

            return (
                <div key={cat}>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 border-b pb-2 flex items-center gap-2">
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
                                <h4 className="text-slate-800 font-semibold truncate">{m.first_name || m.username} {m.last_name}</h4>
                                <div className="text-sm font-bold" style={{ color: m.grade_color }}>{m.grade_name}</div>
                             </div>
                             <div className="text-right flex-shrink-0">
                                <div className="text-slate-500 font-mono text-xs font-semibold">{m.badge_number}</div>
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
      <div className="text-center space-y-8 relative z-10">
          <div className="w-28 h-28 bg-white rounded-3xl border-2 border-slate-200 flex items-center justify-center mx-auto shadow-2xl p-3">
            <Logo size={88} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-800">MRSA</h1>
            <p className="text-slate-500 mt-2 text-lg">Système de Gestion Médicale</p>
          </div>
          <div className="flex gap-4 justify-center pt-2">
            <Link to="/login" className="btn-primary px-8 py-3 text-base">Connexion Personnel</Link>
            <button onClick={() => navigate('/book')} className="btn-secondary px-8 py-3 text-base">Prendre RDV</button>
          </div>
       </div>
       <p className="absolute bottom-6 text-slate-400 text-sm font-medium">© 2024 MRSA · Tous droits réservés</p>
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
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <Watermark />
       <div className="w-full max-w-sm relative z-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white rounded-2xl border-2 border-slate-200 flex items-center justify-center mx-auto mb-5 shadow-xl p-3">
              <Logo size={56} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Connexion</h1>
            <p className="text-slate-500 mt-1">Système de Gestion Médicale MRSA</p>
          </div>
          
          <div className="card p-6">
            {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm text-center font-medium">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
               <InputField label="Identifiant" placeholder="nom.prenom" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
               <InputField label="Mot de passe" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
               <button type="submit" className="btn-primary w-full py-3 text-base">Se connecter</button>
            </form>
          </div>
          
          <p className="text-center text-slate-400 text-sm mt-6 font-medium">
            <Link to="/" className="hover:text-slate-600 transition-colors">← Retour à l'accueil</Link>
          </p>
       </div>
    </div>
  )
}

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
