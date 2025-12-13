const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth");

// Base de données des maladies avec fourchettes strictes
// Format: [min, max]
const diseases = [
    { name: "Virus Respiratoire", symptoms: ["Toux", "Eternuement"], temp: [38.0, 39.2], hr: [95, 110], o2: [82, 90], bp: [110, 125], organ: "Poumons", med: "Ribavirine", desc: "Infection virale causant toux et fièvre." },
    { name: "Pneumonie Bactérienne", symptoms: ["Courte respiration", "Toux"], temp: [38.5, 39.8], hr: [111, 130], o2: [75, 85], bp: [90, 105], organ: "Poumons", med: "Céfotaxime", desc: "Infection pulmonaire sévère avec forte fièvre." },
    { name: "Hémorragie Interne", symptoms: ["Vomissement"], temp: [35.5, 36.8], hr: [120, 150], o2: [75, 88], bp: [60, 85], organ: "Foie ou estomac", med: "Acide Tranexamique", desc: "Hémorragie interne grave suite à un traumatisme." },
    { name: "Jambe Cassée", symptoms: ["Boiter (Limping)"], temp: [36.0, 37.0], hr: [100, 120], o2: [95, 98], bp: [110, 125], organ: "Jambe", med: "Acide Tranexamique", desc: "Fracture suite à un traumatisme à fort impact." },
    { name: "Pneumonie Virale", symptoms: ["Courte respiration", "Toux"], temp: [38.5, 39.5], hr: [100, 120], o2: [78, 88], bp: [100, 115], organ: "Poumons", med: "Ribavirine", desc: "Inflammation pulmonaire sévère virale." },
    { name: "Méningite Virale", symptoms: ["Titubement"], temp: [38.0, 39.0], hr: [105, 130], o2: [85, 92], bp: [120, 135], organ: "Cerveau", med: "Ribavirine", desc: "Infection des membranes cérébrales." },
    { name: "Hépatite Virale", symptoms: ["Douleur estomac"], temp: [37.8, 38.8], hr: [90, 110], o2: [88, 94], bp: [105, 120], organ: "Foie", med: "Ribavirine", desc: "Infection virale causant une inflammation du foie." },
    { name: "Gastro-entérite Virale", symptoms: ["Vomissement", "Douleur estomac"], temp: [37.5, 38.5], hr: [95, 105], o2: [90, 95], bp: [105, 115], organ: "Estomac", med: "Ribavirine", desc: "Infection virale estomac/intestins." },
    { name: "Septicémie", symptoms: ["Titubement"], temp: [39.0, 40.0], hr: [120, 140], o2: [80, 90], bp: [70, 85], organ: "Foie ou reins", med: "Céfotaxime", desc: "Infection du sang généralisée." },
    { name: "Méningite Bactérienne", symptoms: ["Titubement", "Courte respiration"], temp: [38.8, 39.8], hr: [100, 120], o2: [88, 92], bp: [110, 125], organ: "Cerveau", med: "Céfotaxime", desc: "Infection cérébrale grave bactérienne." },
    { name: "Gastro-entérite Bactérienne", symptoms: ["Vomissement"], temp: [38.0, 38.8], hr: [95, 110], o2: [90, 95], bp: [100, 115], organ: "Estomac", med: "Céfotaxime", desc: "Infection bactérienne estomac." },
    { name: "Arthrite", symptoms: ["Boiter (Limping)"], temp: [37.5, 38.5], hr: [80, 95], o2: [95, 98], bp: [115, 130], organ: "Jambe", med: "Dexaméthasone", desc: "Inflammation articulaire sévère." },
    { name: "Péritonite", symptoms: ["Douleur estomac"], temp: [38.5, 39.2], hr: [95, 110], o2: [90, 95], bp: [105, 120], organ: "Estomac ou reins", med: "Dexaméthasone", desc: "Inflammation sévère de la paroi abdominale." },
    { name: "Gastrite", symptoms: ["Vomissement"], temp: [37.5, 38.5], hr: [90, 100], o2: [93, 97], bp: [110, 125], organ: "Estomac", med: "Dexaméthasone", desc: "Inflammation de la muqueuse de l'estomac." },
    { name: "Blessure par Balle", symptoms: ["Injury (Blessure)"], temp: [36.0, 37.0], hr: [115, 135], o2: [85, 92], bp: [75, 90], organ: "Estomac ou foie", med: "Acide Tranexamique", desc: "Traumatisme balistique avec hémorragie." },
    { name: "Blessure par Arme Blanche", symptoms: ["Injury (Blessure)"], temp: [36.5, 37.2], hr: [120, 140], o2: [70, 85], bp: [80, 95], organ: "Estomac ou foie", med: "Acide Tranexamique", desc: "Traumatisme pénétrant thorax/abdomen." }
];

// Liste unique des symptômes
const uniqueSymptoms = [...new Set(diseases.flatMap(d => d.symptoms))].sort();

router.get("/symptoms", isAuthenticated, (req, res) => {
  res.json(uniqueSymptoms);
});

router.post("/analyze", isAuthenticated, (req, res) => {
  try {
    const { visibleSymptom, vitals } = req.body;
    
    if (!visibleSymptom || !vitals) {
      return res.status(400).json({ error: "Données incomplètes" });
    }

    // Conversion en nombres
    const input = {
      temp: parseFloat(vitals.temp),
      hr: parseFloat(vitals.hr),
      o2: parseFloat(vitals.o2),
      bp: parseFloat(vitals.bp)
    };

    // 1. Filtrer par symptôme visible
    let candidates = diseases.filter(d => d.symptoms.includes(visibleSymptom));

    // 2. ÉLIMINATION STRICTE
    // Si UNE SEULE constante est en dehors des fourchettes, la maladie est éliminée.
    candidates = candidates.filter(d => {
      if (input.temp < d.temp[0] || input.temp > d.temp[1]) return false;
      if (input.hr < d.hr[0] || input.hr > d.hr[1]) return false;
      if (input.o2 < d.o2[0] || input.o2 > d.o2[1]) return false;
      if (input.bp < d.bp[0] || input.bp > d.bp[1]) return false;
      return true;
    });

    // 3. Calcul de Probabilité sur les survivants (Proximité de la moyenne)
    const results = candidates.map(d => {
      let totalDeviation = 0;
      const metrics = ['temp', 'hr', 'o2', 'bp'];
      
      metrics.forEach(m => {
        const [min, max] = d[m];
        const val = input[m];
        const targetAvg = (min + max) / 2;
        const range = max - min;
        
        // Calcul de l'écart par rapport à la moyenne parfaite
        // Normalized Deviation : 0 = parfait (sur la moyenne), 1 = aux limites
        // Deviation = |val - avg| / (range / 2)
        let deviation = Math.abs(val - targetAvg) / (range / 2);
        
        // On inverse pour avoir un score de précision (1 = parfait, 0 = aux limites)
        let metricScore = Math.max(0, 1 - deviation);
        
        totalDeviation += metricScore;
      });

      // Score sur 100 basé sur la somme des précisions (max 4.0)
      const percentage = Math.round((totalDeviation / 4.0) * 100);

      return { ...d, confidence: percentage };
    });

    // 4. Trier par probabilité décroissante
    results.sort((a, b) => b.confidence - a.confidence);

    // 5. Construction de la réponse
    let status = "unknown";
    let message = "Aucune maladie ne correspond à ces constantes précises.";
    
    if (results.length === 1) {
        status = "confirmed";
        message = "Correspondance unique trouvée.";
    } else if (results.length > 1) {
        status = "multiple";
        message = `Plusieurs maladies correspondent aux critères (${results.length}).`;
    }

    res.json({
      status,
      message,
      results: results
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur analyse" });
  }
});

module.exports = router;
