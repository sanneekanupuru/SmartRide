// src/context/AuthContext.jsx
import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export default function AuthProvider({ children }) {
  // Initialize user from localStorage
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  // Login function (Admin, Driver, Passenger)
  const login = async ({ username, email, password, roleHint }) => {
    let endpoint = roleHint === "ADMIN" ? "/admin/login" : "/auth/login";
    let payload;

    if (roleHint === "ADMIN") {
      payload = { username, password }; // ✅ match AdminLoginRequest.java
    } else {
      payload = { email, password }; // ✅ normal users
    }

    const { data } = await api.post(endpoint, payload);

    const token = data.token;
    const role = data.role || roleHint;
    const name = data.name || "";
    const mail = data.email || email || "";

    const userObj = { isLoggedIn: true, role, name, email: mail, token };
    localStorage.setItem("user", JSON.stringify(userObj));
    setUser(userObj);

    return { role };
  };


  // Register function
  const register = async (payload) => await api.post("/auth/register", payload);

  // Logout function
  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
