require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 80;

app.use(cors());
app.use(express.json());

// Serve static files from the current directory (since this server sits next to index.html)
app.use(express.static(__dirname));

// Endpoint to append usage logs
app.post('/api/log', (req, res) => {
  const { apiName, status, errorMsg } = req.body;
  if (!apiName) {
    return res.status(400).json({ error: 'Falta la propiedad apiName' });
  }

  const date = new Date().toISOString();
  const logFilePath = path.join(__dirname, 'api-usage.log');
  
  let logContent;
  if (status === 'error') {
    logContent = `[${date}] ERROR: Falla al intentar usar la API: ${apiName}. Detalle: ${errorMsg}\n`;
  } else {
    logContent = `[${date}] INFO: Examen generado exitosamente usando el proveedor de la API de IA: ${apiName}\n`;
  }

  fs.appendFile(logFilePath, logContent, (err) => {
    if (err) {
      console.error('Error al guardar el log al servidor:', err);
      return res.status(500).json({ error: 'Error al escribir el archivo de log' });
    }
    res.json({ success: true, message: 'Log guardado correctamente en el servidor.' });
  });
});


const API_CONFIGS = {
  OPENAI: {
    url: 'https://api.openai.com/v1/chat/completions',
    key: process.env.OPENAI_API_KEY,
    model: 'gpt-4o-mini'
  },
  GROQ: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: process.env.GROQ_API_KEY,
    model: 'llama-3.1-8b-instant'
  },
  CEREBRAS: {
    url: 'https://api.cerebras.ai/v1/chat/completions',
    key: process.env.CEREBRAS_API_KEY,
    model: 'llama3.1-8b'
  }
};

// Proxy endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const providerReq = req.body.provider || 'OPENAI';
    const config = API_CONFIGS[providerReq];

    if (!config || !config.key) {
      console.error(`Missing configuration or API Key for provider: ${providerReq}`);
      return res.status(500).json({ error: `Provider ${providerReq} is not configured on the server.` });
    }

    // Override the model requested by the client to ensure we use the right model for the specific provider
    const bodyPayload = { ...req.body };
    delete bodyPayload.provider; // The upstream APIs don't expect this field
    bodyPayload.model = config.model;

    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.key}`
      },
      body: JSON.stringify(bodyPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${providerReq} API Error:`, errorText);
      return res.status(response.status).json({ error: `Failed to generate from ${providerReq}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Internal server error while connecting to the AI provider.' });
  }
});

// For any other route, send index.html (SPA support if needed)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
