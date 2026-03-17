import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./layout/HomePage";
import { RuleViewer } from "./components/RTDRuleViewer";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";

import AuthPage from "./pages/AuthPage";
import TailwindCheatsheet from "./pages/TailwindCheatsheet";
import SudokuSolver from "./components/Sudoku/SudokuSolver";
import ErrorPage from "./pages/defaultErrorPage";


const IS_DEV = import.meta.env.VITE_APP_ENV === "DEV";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* 獨立頁面：不含 sidebar 佈局 */}
        <Route path="/login" element={<AuthPage />} />

        {/* 受保護的主佈局 */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        >
          {/* 預設進來導到 dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />

          {/* Dashboard */}
          <Route path="dashboard" element={<div>Dashboard</div>} />

          {/* Rule Viewer Pages — 所有環境皆開放 */}
          <Route path="ruleviewer" element={<RuleViewer />} />

          {/* 以下只有 DEV 環境才掛載路由 */}
          {IS_DEV && <Route path="tailwind" element={<TailwindCheatsheet />} />}
          {IS_DEV && <Route path="sudoku" element={<SudokuSolver />} />}

          {/* Error Pages */}
          <Route path="*" element={<ErrorPage statusCode={404} />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
