// ============================================================
// AuthPage.tsx
// 登入頁：點擊按鈕後跳轉後端 OIDC 端點，前端不處理任何 token
// ============================================================

import { useAuth } from "../auth/AuthContext";

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0d1117] px-4 py-12">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </main>
  );
}

export default function AuthPage() {
  const { login } = useAuth();

  return (
    <AuthLayout>
      {/* Logo / Brand */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <img src="/icon-transparent.svg" alt="Logo" className="h-14 w-auto mb-1" />
        <h1 className="text-xl font-bold text-white tracking-tight">Vic Lai</h1>
        <p className="text-sm text-[#8b9ab8]">登入以繼續使用</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-white/8 bg-[#161b2e] p-8 shadow-2xl flex flex-col gap-4">
        <p className="text-sm text-[#8b9ab8] text-center">
          透過公司帳號 (tSSO) 登入
        </p>
        <button
          onClick={login}
          className="h-10 w-full rounded-lg bg-[#1677ff] text-sm font-semibold text-white
            transition-colors hover:bg-[#4096ff] cursor-pointer"
        >
          使用 SSO 登入
        </button>
      </div>
    </AuthLayout>
  );
}
