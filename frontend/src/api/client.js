import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8090/api",
  timeout: 10000
});

client.interceptors.request.use((config) => {
  const userId = localStorage.getItem("smartcampus.userId") || "admin123";
  const userName = localStorage.getItem("smartcampus.userName") || "Admin User";
  const userRole = localStorage.getItem("smartcampus.userRole") || "ADMIN";

  config.headers["X-User-Id"] = userId;
  config.headers["X-User-Name"] = userName;
  config.headers["X-User-Role"] = userRole;
  return config;
});

export default client;
