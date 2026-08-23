import { createContext, useContext } from "react";

// Guarda o token, expõe login/logout para o app todo
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // TODO: gerenciar estado do token e expor login/logout
  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
