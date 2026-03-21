import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./layout/HomePage";
import { RuleViewer } from "./components/RTDRuleViewer";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";

import AuthPage from "./pages/AuthPage";
import TailwindCheatsheet from "./pages/TailwindCheatsheet";
import SudokuSolver from "./components/Sudoku/SudokuSolver";
import ErrorPage from "./pages/defaultErrorPage";
import Homepage from "./pages/Homepage";
import NotesList from "./pages/Notes/NotesList";
import NoteArticle from "./pages/Notes/NoteArticle";


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
          {/* 預設進來導到 homepage */}
          <Route index element={<Navigate to="homepage" replace />} />

          {/* Homepage */}
          <Route path="homepage" element={<Homepage />} />

          {/* Notes */}
          <Route path="notes" element={<NotesList />} />
          <Route path="notes/:slug" element={<NoteArticle />} />

          {/* Rule Viewer */}
          <Route path="ruleviewer" element={<RuleViewer />} />

          {/* 以下只有 DEV 環境才掛載路由 */}
          {<Route path="sudoku" element={<SudokuSolver />} />}
          
          {<Route path="tailwind" element={<TailwindCheatsheet />} />}

          {/* Error Pages */}
          <Route path="*" element={<ErrorPage statusCode={404} />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
