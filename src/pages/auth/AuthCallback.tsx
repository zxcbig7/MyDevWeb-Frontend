// Flow A callback：後端把 JWT 帶在 ?token= 跳回來
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { AuthService } from "../../auth/authService";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    loginWithToken(token)
      .then(() => navigate("/homepage", { replace: true }))
      .catch(() => {
        AuthService.clearToken();
        navigate("/login", { replace: true });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-screen items-center justify-center bg-[#0d1117]">
      <span className="text-white/40 text-sm">驗證中…</span>
    </div>
  );
}
