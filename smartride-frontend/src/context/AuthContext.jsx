import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");
    const email = localStorage.getItem("email");
    return token ? { isLoggedIn: true, role, name, email } : null;
  });

  const login = async ({ email, password, roleHint }) => {
    const { data } = await api.post("/auth/login", { email, password });
    const token = data.token;
    const role = data.user?.role || roleHint;
    const name = data.user?.name || "";
    const mail = data.user?.email || email;
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("name", name);
    localStorage.setItem("email", mail);
    setUser({ isLoggedIn: true, role, name, email: mail });
    return { role };
  };

  const register = async (payload) => await api.post("/auth/register", payload);
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
