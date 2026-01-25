import { useState } from "react";
import { Layout, PageHeader, InputField } from "../../components";
import { apiFetch } from "../../utils/api";
import { ShieldCheck, ShieldAlert, Activity } from "lucide-react";

export function MedicalVisits() {
  const [form, setForm] = useState({ firstName: "", lastName: "", status: "APTE" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/api/medical-visits/send-visit", {
        method: "POST",
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setSent(true);
        setTimeout(() => setSent(false), 3000);
        setForm({ ...form, firstName: "", lastName: "" });
      }
    } catch (err) { alert("Erreur réseau"); }
    finally { setLoading(false); }
  };

  return (
    <Layout>
      <PageHeader title="Visite Médicale LSPD" subtitle="Transmission directe LSPD et Archives EMS" />
      
      <div className="max-w-md mx-auto">
        <div className="card p-6 border-t-4 border-blue-600">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Prénom de l'agent" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required />
              <InputField label="Nom de l'agent" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setForm({...form, status: "APTE"})}
                className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  form.status === "APTE" ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-inner" : "border-transparent bg-slate-50 text-slate-400 opacity-60"
                }`}
              >
                <ShieldCheck size={32} />
                <span className="font-black">APTE</span>
              </button>

              <button
                type="button"
                onClick={() => setForm({...form, status: "INAPTE"})}
                className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  form.status === "INAPTE" ? "border-red-500 bg-red-50 text-red-700 shadow-inner" : "border-transparent bg-slate-50 text-slate-400 opacity-60"
                }`}
              >
                <ShieldAlert size={32} />
                <span className="font-black">INAPTE</span>
              </button>
            </div>

            <button 
              disabled={loading || !form.firstName || !form.lastName}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
                sent ? "bg-emerald-500" : "bg-blue-600 hover:bg-blue-700"
              } disabled:opacity-30`}
            >
              {loading ? "Envoi..." : sent ? "✓ TRANSMIS (LSPD & EMS)" : "ENVOYER LA VISITE"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
