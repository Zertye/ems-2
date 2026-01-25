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

// Health check pour Railway
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Middlewares
app.use(cors({ 
  origin: IS_PROD ? process.env.PUBLIC_URL : true, 
  credentials: true 
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database & Auth Setup
const startServer = async () => {
  try {
    const pool = require("./config/database");
    const passport = require("./config/passport");
    const initDatabase = require("./config/initDb");
    const { extractUser } = require("./middleware/auth");

    // Routes imports
    const authRoutes = require("./routes/auth");
    const usersRoutes = require("./routes/users");
    const appointmentsRoutes = require("./routes/appointments");
    const patientsRoutes = require("./routes/patients");
    const diagnosisRoutes = require("./routes/diagnosis");
    const adminRoutes = require("./routes/admin");
    const reportsRoutes = require("./routes/reports");
    const medicalVisitsRoutes = require("./routes/medicalVisits"); // Import manquant ajouté

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
      proxy: true,
      cookie: { 
        secure: IS_PROD,
        httpOnly: true, 
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax'
      }
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    app.use("/api", extractUser);

    // API Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/users", usersRoutes);
    app.use("/api/appointments", appointmentsRoutes);
    app.use("/api/patients", patientsRoutes);
    app.use("/api/diagnosis", diagnosisRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/reports", reportsRoutes);
    app.use("/api/medical-visits", medicalVisitsRoutes); // Utilisation de la route

    // Serving Frontend
    const distPath = path.resolve(__dirname, "../frontend/dist");
    const indexPath = path.join(distPath, "index.html");

    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(500).send("Erreur: index.html introuvable");
        }
      });
    }

    app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));

  } catch (error) {
    console.error("❌ Erreur fatale au démarrage:", error);
    app.listen(PORT, () => console.log("⚠️ Server running in degraded mode"));
  }
};

startServer();
