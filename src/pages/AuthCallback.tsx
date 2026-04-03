// ============================================================
// AuthCallback.tsx
// Google OAuth 回調頁：從 query string 取 JWT → 存 localStorage → 跳首頁
// 後端 redirect 格式：/auth/callback?token=<JWT>
// ============================================================

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TOKEN_KEY } from "../auth/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // 讀 token 
  
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    // 存進 localStorage["ruleviewer_token"]，跳轉 /homepage
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      navigate("/homepage", { replace: true });
    } else {
      // token 不存在（不正常的跳轉）→ 回登入頁
      navigate("/login", { replace: true });
    }
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-[#0d1117]">
      <span className="text-white/40 text-sm">驗證中…</span>
    </div>
  );
}
