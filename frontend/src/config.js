// Determine the base URL based on the environment
const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://adzu-chat.onrender.com' // Production URL
    : 'http://localhost:3001';        // Development URL (adjust port if needed)

// Export the configuration value
export const config = {
    apiBaseUrl: API_BASE_URL,
};
