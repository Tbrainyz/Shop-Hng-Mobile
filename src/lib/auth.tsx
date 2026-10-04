import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { api, ApiError, setUnauthorizedHandler, TOKEN_KEY } from "./api";
import { API_URL } from "./config";
import type { User } from "./types";

WebBrowser.maybeCompleteAuthSession();

type Status = "loading" | "signedOut" | "signedIn";
interface AuthValue { status: Status; user: User | null; signIn: () => Promise<boolean>; signOut: () => Promise<void> }
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<User | null>(null);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setUser(null);
    setStatus("signedOut");
  }, []);

  useEffect(() => { setUnauthorizedHandler(() => { void signOut(); }); return () => setUnauthorizedHandler(null); }, [signOut]);

  // On app start: if we have a saved token, ask the server who it belongs to (also proves it's still valid).
  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) return setStatus("signedOut");
      try {
        setUser(await api<User>("/api/me"));
        setStatus("signedIn");
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) await signOut();
        else setStatus("signedOut"); // offline etc: keep the token, let them retry
      }
    })();
  }, [signOut]);

  /**
   * Opens the website's Google login in an in-app browser. When it finishes, the server redirects to
   * <redirectUrl>?token=..., which openAuthSessionAsync hands back to us. In Expo Go redirectUrl looks like
   * exp://192.168.x.x:8081/--/auth; in a real build it's shopmobile://auth (the scheme in app.json).
   */
  const signIn = useCallback(async () => {
    const redirectUrl = Linking.createURL("auth");
    const result = await WebBrowser.openAuthSessionAsync(`${API_URL}/mobile-login?redirect=${encodeURIComponent(redirectUrl)}`, redirectUrl);
    if (result.type !== "success") return false;
    const token = Linking.parse(result.url).queryParams?.token;
    if (typeof token !== "string" || !token) return false;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setUser(await api<User>("/api/me"));
    setStatus("signedIn");
    return true;
  }, []);

  const value = useMemo(() => ({ status, user, signIn, signOut }), [status, user, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
