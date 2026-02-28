// ===============================
// QuestionGenerator.js
// ===============================

const ACE_TOPICS = [

  /* ================================
     Section 1: Cloud Environment Setup
     ================================ */

  // Resource & Account Management
  "Resource Hierarchy (Organization, Folders, Projects)",
  "Organization Policies",
  "Standalone Projects vs Organization Projects",
  "Regions and Zones Concepts",
  "Product Availability by Region",

  // Identity & Access
  "IAM Concepts",
  "IAM Roles (Basic, Predefined, Custom)",
  "IAM Policies and Bindings",
  "Cloud Identity Users and Groups",
  "Service Accounts Basics",
  "IAM Best Practices (Least Privilege)",

  // Project Configuration
  "API and Service Enablement",
  "Quota Management and Quota Increases",
  "Cloud Asset Inventory",
  "Gemini Cloud Assist for Resource Analysis",

  // Observability & Billing
  "Google Cloud Observability Setup",
  "Billing Accounts",
  "Linking Projects to Billing Accounts",
  "Billing Budgets and Alerts",
  "Billing Exports (BigQuery, Cloud Storage)",

  /* =========================================
     Section 2: Planning and Implementing Solutions
     ========================================= */

  // Compute Services
  "Compute Engine VM Lifecycle",
  "Machine Types and Custom Machine Types",
  "Spot VMs",
  "Persistent Disk (Zonal and Regional)",
  "Hyperdisk",
  "OS Login",
  "VM Manager",
  "Managed Instance Groups",
  "Autoscaling Policies",

  // Kubernetes & Containers
  "Google Kubernetes Engine (GKE) Basics",
  "GKE Standard vs Autopilot",
  "Regional vs Zonal GKE Clusters",
  "Private GKE Clusters",
  "GKE Node Pools",
  "kubectl Usage",
  "Kubernetes Objects (Pods, Services, Deployments, StatefulSets)",
  "Deploying Applications to GKE",

  // Serverless
  "Cloud Run Architecture",
  "Cloud Run Revisions",
  "Cloud Run Traffic Splitting",
  "Cloud Run Autoscaling",
  "Cloud Functions",
  "Event-driven Architectures",
  "Pub/Sub Basics",
  "Eventarc",

  // Storage Services
  "Cloud Storage Buckets",
  "Cloud Storage Classes (Standard, Nearline, Coldline, Archive)",
  "Object Lifecycle Management",
  "Filestore",
  "NetApp Volumes",

  // Databases & Data Services
  "Cloud SQL",
  "AlloyDB",
  "BigQuery",
  "Firestore",
  "Spanner",
  "Bigtable",
  "Memorystore",

  // Data Movement
  "Data Ingestion Methods",
  "Storage Transfer Service",
  "Multi-region and High Availability Data Design",

  // Networking Core
  "VPC Networks",
  "Subnets and CIDR Ranges",
  "Subnet Expansion",
  "Shared VPC",
  "Routes and Custom Routes",
  "Static Internal and External IP Addresses",

  // Network Security
  "Cloud Next Generation Firewall (NGFW)",
  "Firewall Rules (Ingress and Egress)",
  "Network Tags",
  "Firewall Rules with Service Accounts",

  // Connectivity
  "Cloud VPN",
  "VPC Peering",
  "Cloud Interconnect",

  // Load Balancing
  "Load Balancer Types Overview",
  "HTTP(S) Load Balancer",
  "TCP Proxy Load Balancer",
  "Network Load Balancer",
  "Internal Load Balancer",

  // Network Optimization
  "Network Service Tiers",
  "Cloud NAT",
  "Cloud DNS",

  // Infrastructure as Code
  "Infrastructure as Code Concepts",
  "Terraform Basics",
  "State Management",
  "Versioned Infrastructure Deployments",
  "Helm Basics",
  "Config Connector",

  /* =====================================
     Section 3: Operations and Monitoring
     ===================================== */

  // Compute Operations
  "Connecting to Compute Engine Instances",
  "VM Inventory Management",
  "Snapshots and Images",
  "Scheduled Snapshots",

  // GKE Operations
  "GKE Cluster Inventory",
  "GKE Workload Management",
  "Horizontal Pod Autoscaler (HPA)",
  "Vertical Pod Autoscaler (VPA)",
  "GKE Autopilot Resource Requests",
  "Artifact Registry Integration with GKE",

  // Application Operations
  "Deploying New Versions of Cloud Run Applications",
  "Traffic Shifting Strategies",

  // Storage & Database Operations
  "Cloud Storage Security",
  "Database Backup and Restore",
  "Querying Managed Databases",
  "Database Cost Estimation",
  "Database Center",

  // Networking Operations
  "Subnet Management",
  "IP Address Management",

  // Monitoring & Logging
  "Cloud Monitoring Metrics",
  "Cloud Monitoring Alerts",
  "Custom Metrics",
  "Cloud Logging",
  "Log Buckets",
  "Log Routers",
  "Log Analytics",
  "Log Filtering",

  // Diagnostics & Optimization
  "Cloud Trace",
  "Cloud Profiler",
  "Query Insights",
  "Index Advisor",
  "Service Health Dashboard",
  "Ops Agent",
  "Managed Service for Prometheus",
  "Audit Logs",
  "Active Assist",
  "Gemini Cloud Assist for Monitoring",

  /* =====================================
     Section 4: Access and Security
     ===================================== */

  // IAM Management
  "Viewing and Modifying IAM Policies",
  "Custom IAM Role Creation",

  // Service Accounts
  "Creating Service Accounts",
  "Assigning Service Accounts to Resources",
  "Service Account IAM Permissions",
  "Service Account Impersonation",
  "Short-lived Credentials",
  "Service Accounts in GKE"
];

class QuestionGenerator {
  constructor() {
    this.apiKey = CONFIG.OPENAI_API_KEY;
    this.apiUrl = CONFIG.OPENAI_API_URL;
    this.model = CONFIG.MODEL;

    this.BATCH_SIZE = 5;
  }

  /* ===============================
   * API PÚBLICA
   * =============================== */
  async generateMultipleQuestions(total) {
    const allQuestions = [];
    const usedHashes = new Set();
    let topicIndex = 0;

    while (allQuestions.length < total) {
      const remaining = total - allQuestions.length;
      const batchSize = Math.min(this.BATCH_SIZE, remaining);

      const topicsForBatch = [];
      for (let i = 0; i < batchSize; i++) {
        topicsForBatch.push(ACE_TOPICS[topicIndex % ACE_TOPICS.length]);
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
