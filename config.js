// Application Configuration
const CONFIG = {
  // Local API Proxy Endpoint
  OPENAI_API_URL: '/api/generate',
  
  // Available Providers in the Backend Proxy
  PROVIDERS: ['OPENAI', 'GROQ', 'CEREBRAS'],
  
  // Generation Parameters
  TEMPERATURE: 0.5, // Lower temperature for more consistent JSON formatting
  MAX_TOKENS: 2000, // Increased to allow proper JSON completion
  
  // Question Generation Settings
  DEFAULT_QUESTION_COUNT: 1,
  MAX_QUESTION_COUNT: 5, // Reduced to prevent overly long responses
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
