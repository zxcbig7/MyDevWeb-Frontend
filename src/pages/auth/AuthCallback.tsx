// Flow A callback：後端已設好 HttpOnly cookie，直接呼叫 /me 確認身份
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { loginWithCookie } = useAuth();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    loginWithCookie()
      .then(() => navigate("/homepage", { replace: true }))
      .catch(() => navigate("/login", { replace: true }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-screen items-center justify-center bg-[#0d1117]">
      <span className="text-white/40 text-sm">驗證中…</span>
    </div>
  );
}
