/**
 * Landing - Page d'accueil publique
 */
import { Link, useNavigate } from "react-router-dom";
import { Logo, Watermark, ThemeToggle } from "../../components/ui";

export function Landing() {
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
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
            Système de Gestion Médicale
          </p>
        </div>
        
        <div className="flex gap-4 justify-center pt-2">
          <Link to="/login" className="btn-primary px-8 py-3 text-base">
            Connexion Personnel
          </Link>
          <button 
            onClick={() => navigate("/book")} 
            className="btn-secondary px-8 py-3 text-base"
          >
            Prendre RDV
          </button>
        </div>
      </div>
      
      <p className="absolute bottom-6 text-slate-400 text-sm font-medium">
        © Propriété fictive — Usage RP
      </p>
    </div>
  );
}

export default Landing;
