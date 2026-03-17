import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./layout/HomePage";
import { RuleViewer } from "./components/RTDRuleViewer";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";

import AuthPage from "./pages/AuthPage";
import TailwindCheatsheet from "./pages/TailwindCheatsheet";
import SudokuSolver from "./components/Sudoku/SudokuSolver";
import ErrorPage from "./pages/defaultErrorPage";


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

          <Route path="dashboard" element={<div>Dashboard</div>} />

          {/* Rule Viewer Pages */}
          <Route path="ruleviewer" element={<RuleViewer />} />

          {/* Tailwind Cheatsheet */}
          <Route path="tailwind" element={<TailwindCheatsheet />} />

          {/* Sudoku Pages */}
          <Route path="sudoku" element={<SudokuSolver />} />

          {/* Error Pages */}
          <Route path="*" element={<ErrorPage statusCode={404} />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
