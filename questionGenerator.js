// ===============================
// QuestionGenerator.js
// ===============================

class QuestionGenerator {
  constructor() {
    this.apiKey = CONFIG.OPENAI_API_KEY;
    this.apiUrl = CONFIG.OPENAI_API_URL;
    this.model = CONFIG.MODEL;
    this.topics = [];
    this.BATCH_SIZE = 5;
  }

  /* ===============================
   * CARGA DE TEMAS
   * =============================== */
  async loadTopics() {
    if (this.topics.length > 0) return this.topics;

    try {
      const response = await fetch("topics.json");
      if (!response.ok) throw new Error("No se pudo cargar topics.json");
      this.topics = await response.json();
      return this.topics;
    } catch (err) {
      console.error("❌ Error cargando temas:", err);
      // Fallback mínimo en caso de error
      this.topics = ["Google Cloud Basics"];
      return this.topics;
    }
  }

  /* ===============================
   * API PÚBLICA
   * =============================== */
  async generateMultipleQuestions(total) {
    await this.loadTopics();
    const allQuestions = [];
    const usedHashes = new Set();
    let topicIndex = 0;

    while (allQuestions.length < total) {
      const remaining = total - allQuestions.length;
      const batchSize = Math.min(this.BATCH_SIZE, remaining);

      const topicsForBatch = [];
      for (let i = 0; i < batchSize; i++) {
        topicsForBatch.push(this.topics[topicIndex % this.topics.length]);
        topicIndex++;
      }

      const batch = await this.generateBatch(batchSize, topicsForBatch);
      const unique = [];

      for (const q of batch) {
        const hash = this.hashQuestion(q.question);
        if (!usedHashes.has(hash)) {
          usedHashes.add(hash);
          unique.push(q);
        }
      }

      if (unique.length === 0) {
        console.warn("⚠️ Lote duplicado, regenerando...");
        continue;
      }

      allQuestions.push(...unique);
    }

    return allQuestions.slice(0, total);
  }

  /* ===============================
   * GENERACIÓN DE LOTE
   * =============================== */
  async generateBatch(count, topics) {
    const prompt = this.buildPrompt(count, topics);
    const raw = await this.callOpenAI(prompt);
    return this.parseResponse(raw);
  }

  /* ===============================
   * PROMPT
   * =============================== */
  buildPrompt(count, topics) {
    return `
Genera ${count} preguntas DIFERENTES para el examen Google Cloud Associate Cloud Engineer.

REGLAS OBLIGATORIAS:
- Cada pregunta debe usar UN tema distinto de esta lista:
${topics.map(t => `- ${t}`).join("\n")}

- No repitas preguntas ni escenarios
- Español
- 4 opciones
- 1 correcta
- Responde SOLO con JSON válido
- Sin markdown
- Sin texto adicional

FORMATO EXACTO:
{
  "questions": [
    {
      "question": "Texto de la pregunta",
      "options": [
        "A) Texto completo de la opción A",
        "B) Texto completo de la opción B",
        "C) Texto completo de la opción C",
        "D) Texto completo de la opción D"
      ],
      "answer": 0,
      "explicacion": "Explicación clara y detallada"
    }
  ]
}
`;
  }

  /* ===============================
   * OPENAI
   * =============================== */
  async callOpenAI(prompt) {
    const body = {
      model: this.model,
      messages: [
        { role: "system", content: "Responde únicamente con JSON válido." },
        { role: "user", content: prompt }
      ],
      temperature: CONFIG.TEMPERATURE,
      max_tokens: CONFIG.MAX_TOKENS
    };

    const res = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("❌ Error OpenAI:", err);
      throw new Error("Error al generar preguntas");
    }

    const data = await res.json();
    return data.choices[0].message.content;
  }

  /* ===============================
   * PARSEO ROBUSTO
   * =============================== */
  parseResponse(text) {
    let cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) cleaned = match[0];

    const parsed = JSON.parse(cleaned);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Respuesta sin questions[]");
    }

    const valid = parsed.questions.filter(q => this.validate(q));
    if (valid.length === 0) {
      throw new Error("Preguntas inválidas");
    }

    // Mezclar las opciones de cada pregunta para evitar sesgo
    valid.forEach(q => this.shuffleOptions(q));

    return valid;
  }

  /* ===============================
   * MEZCLAR OPCIONES
   * =============================== */
  shuffleOptions(question) {
    // Extraer solo el texto de las opciones (sin A), B), C), D))
    const optionTexts = question.options.map(opt => {
      const match = opt.match(/^[A-D]\)\s*(.+)$/);
      return match ? match[1] : opt;
    });

    // Guardar el texto de la respuesta correcta
    const correctAnswerText = optionTexts[question.answer];

    // Fisher-Yates shuffle algorithm para mezclar solo los textos
    for (let i = optionTexts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [optionTexts[i], optionTexts[j]] = [optionTexts[j], optionTexts[i]];
    }

    // Reasignar las opciones con el patrón A), B), C), D) preservado
    const prefixes = ['A)', 'B)', 'C)', 'D)'];
    question.options = optionTexts.map((text, index) => `${prefixes[index]} ${text}`);

    // Actualizar el índice de la respuesta correcta
    question.answer = optionTexts.indexOf(correctAnswerText);
  }

  /* ===============================
   * VALIDACIÓN + HASH
   * =============================== */
  validate(q) {
    return (
      typeof q.question === "string" &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      typeof q.answer === "number" &&
      q.answer >= 0 &&
      q.answer <= 3 &&
      typeof q.explicacion === "string"
    );
  }

  normalize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  hashQuestion(text) {
    return this.normalize(text);
  }
}

if (typeof module !== "undefined") {
  module.exports = QuestionGenerator;
}
