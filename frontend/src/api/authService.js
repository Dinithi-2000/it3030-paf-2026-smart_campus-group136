import client from "./client";

const AuthService = {
  login: async (username, password) => {
    const response = await client.post("/users/login", { username, password }, {
      auth: { username, password }
    });
    return response.data;
  },

  register: async (username, displayName, email, role = "USER", password) => {
    const response = await client.post("/users/register", {
      username,
      displayName,
      email,
      role,
      password
    });
    return response.data;
  },

  getCurrentUser: async () => {
    try {
      const response = await client.get("/users/me");
      return response.data;
    } catch {
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("roles");
  }
};

export default AuthService;
