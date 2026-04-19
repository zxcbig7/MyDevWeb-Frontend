import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./layout/HomePage";
import { RuleViewer } from "./components/RTDRuleViewer";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";

import AuthPage from "./pages/AuthPage";
import AuthCallback from "./pages/AuthCallback";
import TailwindCheatsheet from "./pages/TailwindCheatsheet";
import SudokuSolver from "./components/Sudoku/SudokuSolver";
import ErrorPage from "./pages/defaultErrorPage";
import Homepage from "./pages/Homepage";
import NotesList from "./pages/Notes/NotesList";
import NoteArticle from "./pages/Notes/NoteArticle";
import DevRuleView from "./pages/Dev/DevRuleView";
import DevRuleDropdownSearch from "./pages/Dev/DevRuleDropdownSearch";
import DevRuleContentSearch from "./pages/Dev/DevRuleContentSearch";
import DevBlockInspector from "./pages/Dev/DevBlockInspector";
import DevBlockTooltip from "./pages/Dev/DevBlockTooltip";
import DevCaseQuery from "./pages/Dev/DevCaseQuery";
import DevTableInspector from "./pages/Dev/DevTableInspector";
import SQLVisualizer from "./pages/SQLVisualizer";


function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* 獨立頁面：不含 sidebar 佈局，不需登入 */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* 主佈局（含 sidebar）*/}
        <Route path="/" element={<HomePage />}>
          {/* 預設進來導到 homepage */}
          <Route index element={<Navigate to="homepage" replace />} />

          {/* 公開頁面：不需登入 */}
          <Route path="homepage" element={<Homepage />} />
          <Route path="notes" element={<NotesList />} />
          <Route path="notes/:slug" element={<NoteArticle />} />

          {/* 私人頁面：需要登入 */}
          <Route path="ruleviewer" element={<ProtectedRoute><RuleViewer /></ProtectedRoute>} />

          <Route path="dev/rule-view"       element={<ProtectedRoute><DevRuleView /></ProtectedRoute>} />
          <Route path="dev/dropdown-search" element={<ProtectedRoute><DevRuleDropdownSearch /></ProtectedRoute>} />
          <Route path="dev/content-search"  element={<ProtectedRoute><DevRuleContentSearch /></ProtectedRoute>} />
          <Route path="dev/block-inspector" element={<ProtectedRoute><DevBlockInspector /></ProtectedRoute>} />
          <Route path="dev/block-tooltip"   element={<ProtectedRoute><DevBlockTooltip /></ProtectedRoute>} />
          <Route path="dev/case-query"      element={<ProtectedRoute><DevCaseQuery /></ProtectedRoute>} />
          <Route path="dev/table-inspector" element={<ProtectedRoute><DevTableInspector /></ProtectedRoute>} />

          <Route path="sql-visualizer" element={<ProtectedRoute><SQLVisualizer /></ProtectedRoute>} />
          <Route path="sudoku"   element={<ProtectedRoute><SudokuSolver /></ProtectedRoute>} />
          <Route path="tailwind" element={<ProtectedRoute><TailwindCheatsheet /></ProtectedRoute>} />

          {/* Error Pages */}
          <Route path="*" element={<ErrorPage statusCode={404} />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
