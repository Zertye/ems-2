/**
 * Diagnosis - Outil de diagnostic médical
 */
import { useState, useEffect } from "react";
import { Stethoscope, HelpCircle } from "lucide-react";
import { apiFetch } from "../../utils/api";
import { Layout, PageHeader, InputField, SelectField } from "../../components";

export function Diagnosis() {
  const [symptoms, setSymptoms] = useState([]);
  const [selectedSymptom, setSelectedSymptom] = useState("");
  const [vitals, setVitals] = useState({ temp: "", hr: "", o2: "", bp: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Charger les symptômes disponibles
  useEffect(() => {
    const loadSymptoms = async () => {
      try {
        const response = await apiFetch("/api/diagnosis/symptoms");
        if (response.ok) {
          const data = await response.json();
          setSymptoms(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Erreur chargement symptômes:", error);
      }
    };
    loadSymptoms();
  }, []);

  // Analyser les symptômes
  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiFetch("/api/diagnosis/analyze", {
        method: "POST",
        body: JSON.stringify({
          visibleSymptom: selectedSymptom,
          vitals,
        }),
      });

      if (response.ok) {
        setResult(await response.json());
      }
    } catch (error) {
      console.error("Erreur analyse:", error);
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser
  const reset = () => {
    setResult(null);
    setVitals({ temp: "", hr: "", o2: "", bp: "" });
    setSelectedSymptom("");
  };

  return (
    <Layout>
      <PageHeader title="Outil de Diagnostic" subtitle="Aide au diagnostic médical" />

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Formulaire */}
        <div className="card p-6">
          <form onSubmit={handleAnalyze} className="space-y-5">
            <SelectField
              label="Symptôme principal"
              value={selectedSymptom}
              onChange={(e) => setSelectedSymptom(e.target.value)}
              required
            >
              <option value="">-- Sélectionner --</option>
              {symptoms.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </SelectField>

            <div>
              <p className="label">Constantes vitales</p>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  placeholder="Température (°C)"
                  type="number"
                  step="0.1"
                  value={vitals.temp}
                  onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                  required
                />
                <InputField
                  placeholder="Pouls (BPM)"
                  type="number"
                  value={vitals.hr}
                  onChange={(e) => setVitals({ ...vitals, hr: e.target.value })}
                  required
                />
                <InputField
                  placeholder="SpO2 (%)"
                  type="number"
                  value={vitals.o2}
                  onChange={(e) => setVitals({ ...vitals, o2: e.target.value })}
                  required
                />
                <InputField
                  placeholder="Tension (Sys)"
                  type="number"
                  value={vitals.bp}
                  onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base disabled:opacity-50"
            >
              {loading ? "Analyse en cours..." : "Analyser"}
            </button>
          </form>
        </div>

        {/* Résultats */}
        <div>
          {result && result.status !== "unknown" ? (
            <div
              className={`card p-6 border-l-4 ${
                result.status === "confirmed" ? "border-emerald-500" : "border-amber-500"
              }`}
            >
              <div className="flex items-center gap-3 mb-5 pb-5 border-b dark:border-slate-700">
                <div
                  className={`w-4 h-4 rounded-full ${
                    result.status === "confirmed" ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                <h2 className="font-bold text-lg text-slate-800 dark:text-white">
                  {result.status === "confirmed" ? "Diagnostic confirmé" : "Diagnostics possibles"}
                </h2>
              </div>

              <p className="text-slate-600 dark:text-slate-300 mb-5">{result.message}</p>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                {(result.results || []).map((r, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border dark:border-slate-700"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-slate-800 dark:text-white text-lg">
                        {r.name}
                      </span>
                      <span className={`badge ${r.confidence > 80 ? "badge-green" : "badge-yellow"}`}>
                        {r.confidence}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t dark:border-slate-700">
                      <div>
                        <span className="text-slate-400 text-xs font-bold uppercase">Traitement</span>
                        <p className="text-red-600 dark:text-red-400 font-semibold mt-1">{r.med}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs font-bold uppercase">Organe cible</span>
                        <p className="text-slate-700 dark:text-slate-300 font-medium mt-1">{r.organ}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={reset} className="btn-secondary w-full mt-5">
                Nouveau diagnostic
              </button>
            </div>
          ) : result ? (
            <div className="card p-10 text-center">
              <HelpCircle size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="font-bold text-xl text-slate-800 dark:text-white">Aucun résultat</h3>
              <p className="text-slate-500 mt-2 mb-6">
                Les constantes ne correspondent à aucune pathologie connue.
              </p>
              <button onClick={reset} className="text-red-600 dark:text-red-400 hover:text-red-700 font-semibold">
                Réessayer
              </button>
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
  );
}

export default Diagnosis;
