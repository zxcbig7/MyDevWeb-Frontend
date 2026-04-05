// ============================================================
// ProtectedRoute.tsx
// 未登入 → 導回 /login；loading 中顯示全螢幕載入
// ============================================================

import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

// ProtectedRoute：保護路由元件，根據驗證狀態決定渲染內容
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // 從 useAuth 拿到 user 和 loading 狀態
  const { user, loading } = useAuth();

  // 還在驗證 token（打 /auth/me）→ 先顯示全螢幕載入，避免畫面閃爍
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0d1117]">
        <span className="text-white/40 text-sm">載入中…</span>
      </div>
    );
  }

  // 驗證失敗（token 不存在或過期）→ 導回登入頁
  if (!user) return <Navigate to="/login" replace />;

  // 已登入 → 正常渲染子元件
  return <>{children}</>;
}
