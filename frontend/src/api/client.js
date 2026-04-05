import axios from "axios";

const apiBaseURL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const client = axios.create({
  baseURL: apiBaseURL,
  timeout: 10000
});

export default client;
