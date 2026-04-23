import axios from "axios";

const apiBaseURL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const client = axios.create({
  baseURL: apiBaseURL,
  timeout: 10000
});

client.interceptors.request.use((config) => {
  const authToken = localStorage.getItem("authToken");
  if (authToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = authToken;
  }

  return config;
});

export default client;
