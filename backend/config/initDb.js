const pool = require("./database");

const initDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log("🔄 Vérification de la structure de la base de données...");

    // 1. CRÉATION DES TABLES (Si elles n'existent pas)
    await client.query(`
      CREATE TABLE IF NOT EXISTS grades (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(100),
        level INTEGER DEFAULT 1,
        color VARCHAR(20) DEFAULT '#4a90a4',
        permissions JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS specialties (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(10) DEFAULT '🏥',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS user_specialties (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, 
        specialty_id INTEGER REFERENCES specialties(id) ON DELETE CASCADE, 
        PRIMARY KEY (user_id, specialty_id)
      );

      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY, 
        first_name VARCHAR(100), 
        last_name VARCHAR(100), 
        date_of_birth DATE, 
        gender VARCHAR(20), 
        phone VARCHAR(20), 
        address TEXT, 
        blood_type VARCHAR(5), 
        allergies TEXT, 
        chronic_conditions TEXT, 
        emergency_contact_name VARCHAR(100), 
        emergency_contact_phone VARCHAR(20), 
        insurance_number VARCHAR(50), 
        notes TEXT, 
        photo VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS medical_reports (
        id SERIAL PRIMARY KEY, 
        patient_id INTEGER REFERENCES patients(id), 
        medic_id INTEGER REFERENCES users(id), 
        report_type VARCHAR(50), 
        chief_complaint TEXT, 
        symptoms TEXT[], 
        vital_signs JSONB, 
        diagnosis TEXT, 
        treatment TEXT, 
        medications_given TEXT, 
        transport_destination VARCHAR(100), 
        incident_location VARCHAR(255), 
        incident_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        notes TEXT, 
        status VARCHAR(20) DEFAULT 'completed', 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY, 
        patient_name VARCHAR(200), 
        patient_phone VARCHAR(20), 
        patient_discord VARCHAR(100), 
        appointment_type VARCHAR(50), 
        preferred_date DATE, 
        preferred_time TIME, 
        description TEXT, 
        status VARCHAR(20) DEFAULT 'pending', 
        assigned_medic_id INTEGER REFERENCES users(id), 
        completion_notes TEXT, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL PRIMARY KEY, 
        sess JSON NOT NULL, 
        expire TIMESTAMP(6) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_session_expire ON session(expire);
    `);

    // 2. MIGRATION INTELLIGENTE (Ajout des colonnes manquantes sans casser la DB)
    const addColumnIfNotExists = async (table, column, type) => {
      const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='${table}' AND column_name='${column}'`);
      if (res.rows.length === 0) {
        console.log(`🔧 Ajout de la colonne ${column} à la table ${table}`);
        await client.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
      }
    };

    // Colonnes Users
    await addColumnIfNotExists('users', 'username', 'VARCHAR(50) UNIQUE');
    await addColumnIfNotExists('users', 'password', 'VARCHAR(255)');
    await addColumnIfNotExists('users', 'first_name', 'VARCHAR(100)');
    await addColumnIfNotExists('users', 'last_name', 'VARCHAR(100)');
    await addColumnIfNotExists('users', 'phone', 'VARCHAR(20)');
    await addColumnIfNotExists('users', 'badge_number', 'VARCHAR(20)');
    await addColumnIfNotExists('users', 'grade_id', 'INTEGER REFERENCES grades(id)');
    await addColumnIfNotExists('users', 'profile_picture', 'VARCHAR(255)');
    await addColumnIfNotExists('users', 'hire_date', 'DATE DEFAULT CURRENT_DATE');
    await addColumnIfNotExists('users', 'is_admin', 'BOOLEAN DEFAULT FALSE');
    await addColumnIfNotExists('users', 'is_active', 'BOOLEAN DEFAULT TRUE');
    await addColumnIfNotExists('users', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    // Colonnes Patients
    await addColumnIfNotExists('patients', 'photo', 'VARCHAR(255)');

    // Nettoyage legacy
    try { await client.query("ALTER TABLE users ALTER COLUMN discord_id DROP NOT NULL"); } catch (e) {}

    // 3. INITIALISATION DONNÉES PAR DÉFAUT (Grades uniquement)
    const gradesExist = await client.query("SELECT COUNT(*) FROM grades");
    if (parseInt(gradesExist.rows[0].count) === 0) {
      console.log("🌱 Initialisation des grades par défaut...");
      const basicPerms = JSON.stringify({ access_dashboard: true, view_patients: true, create_reports: true });
      const midPerms = JSON.stringify({ access_dashboard: true, view_patients: true, create_patients: true, create_reports: true, manage_appointments: true });
      const highPerms = JSON.stringify({ access_dashboard: true, view_patients: true, create_patients: true, delete_patients: true, create_reports: true, manage_appointments: true, view_roster: true });
      const adminPerms = JSON.stringify({ access_dashboard: true, view_patients: true, create_patients: true, delete_patients: true, create_reports: true, delete_reports: true, manage_appointments: true, delete_appointments: true, view_roster: true, manage_users: true, delete_users: true, manage_grades: true, view_logs: true });
      
      await client.query(`
        INSERT INTO grades (name, category, level, color, permissions) VALUES
        ('Stagiaire', 'Paramedical', 1, '#64748b', '${basicPerms}'),
        ('Ambulancier EMT', 'Paramedical', 2, '#3b82f6', '${basicPerms}'),
        ('Ambulancier Paramedical', 'Paramedical', 3, '#3b82f6', '${midPerms}'),
        ('Interne', 'Medecine', 4, '#991b1b', '${midPerms}'),
        ('Medecin Junior', 'Medecine', 5, '#991b1b', '${highPerms}'),
        ('Medecin Senior', 'Medecine', 6, '#991b1b', '${highPerms}'),
        ('Chef des Consultations', 'Chef de service', 7, '#14532d', '${highPerms}'),
        ('Chef des Urgences', 'Chef de service', 8, '#14532d', '${highPerms}'),
        ('Directeur Adjoint', 'Direction M.R.S.A', 9, '#1e3a5f', '${adminPerms}'),
        ('Directeur MRSA', 'Direction M.R.S.A', 10, '#1e3a5f', '${adminPerms}')
      `);
    }

    // Assurer l'existence du grade DEV (Super Admin caché)
    const devGradeCheck = await client.query("SELECT * FROM grades WHERE name = 'Développeur'");
    if (devGradeCheck.rows.length === 0) {
      const allPerms = JSON.stringify({ access_dashboard: true, view_patients: true, create_patients: true, delete_patients: true, create_reports: true, delete_reports: true, manage_appointments: true, delete_appointments: true, view_roster: true, manage_users: true, delete_users: true, manage_grades: true, view_logs: true });
      await client.query(`INSERT INTO grades (name, category, level, color, permissions) VALUES ('Développeur', 'Système', 99, '#8b5cf6', '${allPerms}')`);
    }

    // Spécialités
    const specsExist = await client.query("SELECT COUNT(*) FROM specialties");
    if (parseInt(specsExist.rows[0].count) === 0) {
      await client.query(`INSERT INTO specialties (name, description, icon) VALUES ('Urgences', 'Service des urgences', '🚨'), ('Chirurgie', 'Service chirurgical', '🔪'), ('Cardiologie', 'Maladies cardiaques', '❤️'), ('Neurologie', 'Systeme nerveux', '🧠')`);
    }

    console.log("✅ Base de données prête et intègre !");

  } catch (e) {
    console.error("❌ ERREUR FATALE INIT DB:", e);
  } finally {
    client.release();
  }
};

module.exports = initDatabase;
