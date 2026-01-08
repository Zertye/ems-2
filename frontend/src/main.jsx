/**
 * main.jsx - Point d'entrée de l'application React
 */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Vérification des capacités du navigateur au démarrage
const checkBrowserSupport = () => {
  const issues = [];

  // Test localStorage
  try {
    localStorage.setItem("__test__", "1");
    localStorage.removeItem("__test__");
  } catch (e) {
    issues.push("localStorage non disponible");
  }

  // Test fetch
  if (typeof fetch !== "function") {
    issues.push("fetch API non supportée");
  }

  return issues;
};

// Vérifier le support du navigateur
const browserIssues = checkBrowserSupport();

if (browserIssues.length > 0) {
  console.error("❌ Problèmes de compatibilité navigateur:", browserIssues);
  // Afficher un message d'erreur
  document.getElementById("root").innerHTML = `
    <div style="
      min-height: 100vh; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      background: #0f172a; 
      color: white; 
      font-family: sans-serif;
      padding: 20px;
      text-align: center;
    ">
      <div>
        <h1 style="color: #ef4444; margin-bottom: 16px;">⚠️ Navigateur Non Compatible</h1>
        <p style="margin-bottom: 8px;">Votre navigateur ne supporte pas les fonctionnalités requises :</p>
        <ul style="list-style: none; padding: 0; color: #94a3b8;">
          ${browserIssues.map((issue) => `<li>• ${issue}</li>`).join("")}
        </ul>
        <p style="margin-top: 16px; color: #64748b;">
          Veuillez utiliser un navigateur moderne (Chrome, Firefox, Edge, Safari).
        </p>
      </div>
    </div>
  `;
} else {
  // Démarrer l'application normalement
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
