const multer = require("multer");

// Utilisation de la mémoire (RAM) au lieu du disque dur.
// Cela nous permet de récupérer le fichier sous forme de Buffer
// pour l'enregistrer directement dans la base de données.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(file.originalname.toLowerCase()); // Correction bug path.extname inutile ici si on check la fin du string ou mimetype
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Format invalide. Seules les images (jpg, png, webp) sont autorisées."));
  }
};

// Limite de taille : 3MB (Augmenté légèrement car Base64 prend plus de place)
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: fileFilter
});

module.exports = upload;
