// Sessão da conta (token devolvido pelo servidor ao entrar).

import { read, write } from "./store";

export interface Session {
  token: string;
  user: { id: string; email: string; name: string };
}

export const getSession = (): Session | null => read<Session | null>("session", null);
export const setSession = (s: Session | null) => write("session", s);
