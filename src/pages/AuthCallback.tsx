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

// AuthCallback：Google OAuth 回調頁元件，負責處理 Google 跳回後的驗證流程
export default function AuthCallback() {
  const navigate = useNavigate();
  const called = useRef(false);

  useEffect(() => {
    // React StrictMode 會執行兩次，用 ref 防止重複打 API
    if (called.current) return;
    called.current = true;

    // 從 URL 拿到 Google 跳回的授權碼（code），如果沒有就導回登入頁
    const params = new URLSearchParams(window.location.search);
    const code   = params.get("code");

    // 沒有 code（非正常從 Google 跳回）→ 導回登入頁
    if (!code) {
      console.error("未提供授權碼，無法完成登入流程");
      navigate("/login", { replace: true });
      return;
    }
    
    // 生成 redirectUri，必須與 Google OAuth 設定的完全一致（包含 http/https 和尾斜線）
    console.info("收到授權碼，開始驗證流程", { code });
    const redirectUri = `${window.location.origin}/auth/callback`;
    console.info("生成 redirectUri", { redirectUri });

    // 送 code 給後端換 JWT，成功就存 token 並跳首頁，失敗就回登入頁
    axios.post<{ token: string }>(`${AUTH_BASE}/api/auth/google/exchange`, {
        code,
        redirectUri,
      })
      .then((res) => {
        // 成功拿到 token，存 localStorage 並跳首頁
        // res.data.token 是後端回傳的 JWT，存到 localStorage 以供後續 API 認證使用
        localStorage.setItem(TOKEN_KEY, res.data.token);
        navigate("/homepage", { replace: true });
      })
      .catch(() => {
        // 驗證失敗，清除 token（以防萬一）並回登入頁
        localStorage.removeItem(TOKEN_KEY);
        navigate("/login", { replace: true });
      });
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-[#0d1117]">
      <span className="text-white/40 text-sm">驗證中…</span>
    </div>
  );
}
