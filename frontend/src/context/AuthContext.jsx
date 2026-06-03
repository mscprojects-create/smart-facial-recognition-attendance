import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("ft_user");
    if (raw) setUser(JSON.parse(raw));
    setReady(true);
  }, []);

  function login({ token, user }) {
    localStorage.setItem("ft_token", token);
    localStorage.setItem("ft_user", JSON.stringify(user));
    setUser(user);
  }

  function logout() {
    localStorage.removeItem("ft_token");
    localStorage.removeItem("ft_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
