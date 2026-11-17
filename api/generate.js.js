// Fichier : api/generate.js (à placer dans un sous-dossier nommé "api")
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { promptText, language } = req.body;

  if (!promptText) {
    return res.status(400).json({ error: 'Le texte source est manquant.' });
  }

  // Récupération de votre clé API configurée sur Vercel
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Clé API non configurée sur Vercel.' });
  }

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{
        parts: [{ text: promptText }]
      }],
      systemInstruction: {
        parts: [{
          text: `Tu es un ghostwriter LinkedIn d'élite spécialisé dans le B2B. Rédige en ${language || 'Français'}. Accroches percutantes sur les 2 premières lignes, sauts de ligne fréquents, et appel à l'action à la fin. Réponds impérativement en JSON valide sous forme de tableau d'objets avec les clés "angleTitle" et "content".`
        }]
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              angleTitle: { type: "STRING" },
              content: { type: "STRING" }
            },
            required: ["angleTitle", "content"]
          }
        }
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la communication avec Gemini');
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsedPosts = JSON.parse(resultText);

    return res.status(200).json({ posts: parsedPosts });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de la génération IA' });
  }
}