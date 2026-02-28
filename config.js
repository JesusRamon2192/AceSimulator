// OpenAI API Configuration
// Load environment variables from env.js (for browser) or .env (for Node.js)
const getEnvVariable = (key, defaultValue = '') => {
  // For browser environment - reads from window.ENV (loaded from env.js)
  if (typeof window !== 'undefined' && window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }
  // For Node.js environment
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return defaultValue;
};

const CONFIG = {
  // OpenAI API Key - loaded from .env file
  // IMPORTANT: For browser usage, you need to manually set this or use a backend server
  OPENAI_API_KEY: getEnvVariable('OPENAI_API_KEY', ''),
  
  // API Endpoint
  OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',
  
  // Model Configuration
  MODEL: 'gpt-4o-mini', // Most economical model
  // Alternative models: 'gpt-4o', 'gpt-4-turbo'
  
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
