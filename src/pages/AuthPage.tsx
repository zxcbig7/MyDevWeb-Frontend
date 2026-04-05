// ============================================================
// AuthPage.tsx
// 登入頁：點擊按鈕後跳轉後端 OIDC 端點，前端不處理任何 token
// ============================================================

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// AuthLayout：登入頁的版面配置，讓 AuthPage 專注在功能邏輯
function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // 使用全螢幕背景，並將內容置中
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0d1117] px-4 py-12">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </main>
  );
}

// AuthPage：登入頁元件，提供登入按鈕並處理導向邏輯
export default function AuthPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  // DEV 環境 user 已自動設定，直接跳過登入頁
  useEffect(() => {
    if (user) navigate("/homepage", { replace: true });
  }, [user]);

  return (
    <AuthLayout>
      {/* Logo / Brand */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <img src="/webicon.svg" alt="Logo" className="h-14 w-auto mb-1" />
        <h1 className="text-xl font-bold text-white tracking-tight">Vic Lai</h1>
        <p className="text-sm text-[#8b9ab8]">登入以繼續使用</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-white/8 bg-[#161b2e] p-8 shadow-2xl flex flex-col gap-4">
        <p className="text-sm text-[#8b9ab8] text-center">
          透過 Google 帳號登入
        </p>
        <button
          onClick={login}
          className="h-11 w-full rounded-lg bg-white text-sm font-semibold text-[#3c4043]
            transition-colors hover:bg-gray-100 cursor-pointer flex items-center justify-center gap-3
            border border-gray-200 shadow-sm"
        >
          {/* Google G 圖示 */}
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          使用 Google 帳號登入
        </button>
        <button
          onClick={() => navigate("/homepage")} // DEV 環境直接跳轉首頁，無需登入
          className="h-11 w-full rounded-lg text-sm text-[#8b9ab8] hover:text-white transition-colors cursor-pointer"
        >
          回首頁
        </button>
      </div>
    </AuthLayout>
  );
}
