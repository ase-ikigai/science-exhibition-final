import axios from "axios";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

if (!process.env.REACT_APP_BACKEND_URL) {
  console.warn(
    "[IKIGAI] REACT_APP_BACKEND_URL is not set. " +
    "API calls will fail. Set this environment variable to your backend URL " +
    "(e.g. https://ikigai-backend.onrender.com) before building."
  );
}

export const API = `${BACKEND_URL}/api`;

const client = axios.create({ baseURL: API });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("ikigai_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
