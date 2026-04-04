// ============================================================
// AuthCallback.tsx
// Google OAuth 前端主導流程的回調頁
// Google 跳回：/auth/callback?code=xxx
// 前端把 code 送後端換 JWT → 存 localStorage → 跳首頁
// ============================================================

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { TOKEN_KEY } from "../auth/AuthContext";

const AUTH_BASE = import.meta.env.VITE_AUTH_BASE ?? "";

export default function AuthCallback() {
  const navigate = useNavigate();
  const called = useRef(false);

  useEffect(() => {
    // React StrictMode 會執行兩次，用 ref 防止重複打 API
    if (called.current) return;
    called.current = true;

    const params = new URLSearchParams(window.location.search);
    const code   = params.get("code");

    if (!code) {
      navigate("/login", { replace: true });
      return;
    }

    const redirectUri = `${window.location.origin}/auth/callback`;

    axios
      .post<{ token: string }>(`${AUTH_BASE}/api/auth/google/exchange`, {
        code,
        redirectUri,
      })
      .then((res) => {
        localStorage.setItem(TOKEN_KEY, res.data.token);
        navigate("/homepage", { replace: true });
      })
      .catch(() => {
        navigate("/login", { replace: true });
      });
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-[#0d1117]">
      <span className="text-white/40 text-sm">驗證中…</span>
    </div>
  );
}
