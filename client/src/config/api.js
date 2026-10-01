/**
 * Dynamic API Base URL Configuration
 * In local development, defaults to http://localhost:5000
 * In production / Vercel, uses VITE_API_BASE_URL environment variable
 */
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000'
).replace(/\/+$/, '');

export default API_BASE_URL;
