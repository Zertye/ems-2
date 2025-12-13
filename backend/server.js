require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === "production";

console.log("🚀 Démarrage du serveur MRSA MDT...");
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

// Health check pour Railway
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Uploads folder (Attention: Ephemeral sur Railway sans Volume)
const uploadsDir = path.join(__dirname, "../uploads/profiles");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middlewares
app.use(cors({ 
  origin: IS_PROD ? process.env.PUBLIC_URL : true, 
  credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Database & Auth Setup
const startServer = async () => {
  try {
    const pool = require("./config/database");
    const passport = require("./config/passport");
    const initDatabase = require("./config/initDb");

    // Routes imports
    const authRoutes = require("./routes/auth");
    const usersRoutes = require("./routes/users");
    const appointmentsRoutes = require("./routes/appointments");
    const patientsRoutes = require("./routes/patients");
    const diagnosisRoutes = require("./routes/diagnosis");
    const adminRoutes = require("./routes/admin");
    const reportsRoutes = require("./routes/reports");

    // Init DB
    await initDatabase();
    console.log("✅ Base de données connectée et initialisée.");

    // Session Setup
    app.use(session({
      store: new PgSession({ 
        pool: pool, 
        tableName: "session", 
        createTableIfMissing: true 
      }),
      secret: process.env.SESSION_SECRET || "ems-secret-key-change-me",
      resave: false,
      saveUninitialized: false,
      proxy: true, // Important pour Railway/Nginx
      cookie: { 
        secure: IS_PROD, // Secure en prod (HTTPS)
        httpOnly: true, 
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax'
      }
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    // API Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/users", usersRoutes);
    app.use("/api/appointments", appointmentsRoutes);
    app.use("/api/patients", patientsRoutes);
    app.use("/api/diagnosis", diagnosisRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/reports", reportsRoutes);

    // Serving Frontend (Critical Part)
    // On résout le chemin de manière absolue pour éviter les erreurs de dossier
    const distPath = path.resolve(__dirname, "../frontend/dist");
    const indexPath = path.join(distPath, "index.html");

    console.log(`📁 Dossier Frontend statique: ${distPath}`);

    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      
      // Catch-all pour React Router
      app.get("*", (req, res) => {
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          console.error("❌ index.html manquant dans le build !");
          res.status(500).send("Erreur: Frontend build manquant (index.html introuvable)");
        }
      });
      console.log("✅ Frontend servi avec succès.");
    } else {
      console.warn("⚠️ Dossier 'frontend/dist' introuvable. Avez-vous lancé 'npm run build' ?");
      app.get("*", (req, res) => res.send("API Running. Frontend not found."));
    }

    app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));

  } catch (error) {
    console.error("❌ Erreur fatale au démarrage:", error);
    // On ne crash pas complètement pour laisser les logs accessibles
    app.get("*", (req, res) => res.status(500).json({ error: "Server Failed to Start", details: error.message }));
    app.listen(PORT, () => console.log("⚠️ Server running in degraded mode"));
  }
};

startServer();
