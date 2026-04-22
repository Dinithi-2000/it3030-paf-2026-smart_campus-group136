import { createContext, useContext, useMemo, useState, useEffect } from "react";
import AuthService from "../api/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedRoles = localStorage.getItem("roles");
    if (storedUser && storedRoles) {
      setUser(JSON.parse(storedUser));
      setRoles(JSON.parse(storedRoles));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const data = await AuthService.login(username, password);
      const userData = data.user || { username: data.username };
      const userRoles = data.roles || ["USER"];
      const redirectTo = userRoles.includes("ADMIN")
        ? "/admin-dashboard"
        : userRoles.includes("TECHNICIAN")
        ? "/tech-dashboard"
        : "/";
      
      setUser(userData);
      setRoles(userRoles);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("roles", JSON.stringify(userRoles));
      localStorage.setItem("authToken", btoa(`${username}:${password}`));
      
      return { success: true, user: userData, roles: userRoles, redirectTo };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || "Login failed" };
    }
  };

 const googleLogin = async (idToken) => {
    try {
      const data = await AuthService.googleLogin(idToken);
      const userData = data.user || { username: data.username };
      const userRoles = data.roles || ["USER"];
      const redirectTo = userRoles.includes("ADMIN")
        ? "/admin-dashboard"
        : userRoles.includes("TECHNICIAN")
        ? "/tech-dashboard"
        : "/";
      setUser(userData);
      setRoles(userRoles);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("roles", JSON.stringify(userRoles));
      localStorage.setItem("authToken", idToken);
      return { success: true, user: userData, roles: userRoles, redirectTo };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || "Google sign-in failed" };
    }
  };

  const register = async (username, displayName, email, role = "USER", password) => {
    try {
      await AuthService.register(username, displayName, email, role, password);
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        (error.code === "ECONNABORTED" ? "Request timed out. Backend or database may be unavailable." : null) ||
        "Registration failed";
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setUser(null);
    setRoles([]);
    AuthService.logout();
  };

  const hasRole = (role) => roles.includes(role);

  const value = useMemo(
    () => ({
      user,
      roles,
      loading,
      login,
      googleLogin,
      register,
      logout,
      hasRole,
      isAuthenticated: !!user
    }),
    [user, roles, loading,login, googleLogin, register, logout, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

