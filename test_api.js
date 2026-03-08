const fs = require('fs');

async function testGeneration() {
  const providers = ['OPENAI', 'GROQ', 'CEREBRAS'];
  let currentApiIndex = 2; // Start from Cerebras, the one that supposedly failed

  async function generateBatch(provider) {
    console.log(`\nTesting ${provider}...`);
    try {
      const response = await fetch('http://localhost:80/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: provider,
          messages: [
            { role: "system", content: "Responde únicamente con JSON válido." },
            { role: "user", content: `Genera 5 preguntas DIFERENTES para el examen Google Cloud Associate Cloud Engineer.
            FORMATO EXACTO:
            { "questions": [ { "question": "Texto", "options": [ "A) op1", "B) op2", "C) op3", "D) op4" ], "answer": 0, "explicacion": "exp" } ] }` }
          ],
          temperature: 0.5,
          max_tokens: 2000
        })
      });
      const text = await response.text();
      console.log(`Response status: ${response.status}`);
      if (response.status !== 200) {
        console.error('Error response:', text);
      } else {
        const json = JSON.parse(text);
        let content = json.choices[0].message.content;
        console.log('Parsed content snippet:', content.substring(0, 100).replace(/\n/g, ' '));
      }
    } catch (err) {
      console.error('Caught error request:', err);
    }
  }

  await generateBatch('CEREBRAS');
  await generateBatch('OPENAI');
  await generateBatch('GROQ');
}

testGeneration();
