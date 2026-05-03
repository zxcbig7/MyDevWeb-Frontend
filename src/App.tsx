import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/layout/HomeLayout";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";

// Route-level code splitting — each page loads only when navigated to
const AuthPage              = lazy(() => import("./pages/auth/AuthPage"));
const AuthCallback          = lazy(() => import("./pages/auth/AuthCallback"));
const Homepage              = lazy(() => import("./pages/home/Homepage"));
const AboutPage             = lazy(() => import("./pages/home/AboutPage"));
const NotesList             = lazy(() => import("./pages/Notes/NotesList"));
const NoteArticle           = lazy(() => import("./pages/Notes/NoteArticle"));
const ErrorPage             = lazy(() => import("./pages/ErrorPage"));
const RuleViewer            = lazy(() => import("./components/RTDRuleViewer/RuleViewer"));
const SQLVisualizer         = lazy(() => import("./pages/tools/SQLVisualizer"));
const SudokuSolver          = lazy(() => import("./components/Sudoku/SudokuSolver"));
const TailwindCheatsheet    = lazy(() => import("./pages/tools/TailwindCheatsheet"));
const DevRuleView           = lazy(() => import("./pages/Dev/DevRuleView"));
const DevRuleDropdownSearch = lazy(() => import("./pages/Dev/DevRuleDropdownSearch"));
const DevRuleContentSearch  = lazy(() => import("./pages/Dev/DevRuleContentSearch"));
const DevBlockInspector     = lazy(() => import("./pages/Dev/DevBlockInspector"));
const DevBlockTooltip       = lazy(() => import("./pages/Dev/DevBlockTooltip"));
const DevCaseQuery          = lazy(() => import("./pages/Dev/DevCaseQuery"));
const DevTableInspector     = lazy(() => import("./pages/Dev/DevTableInspector"));

function App() {
  return (
    <AuthProvider>
      <Suspense>
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
            <Route path="about" element={<AboutPage />} />
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
            <Route path="sudoku"         element={<ProtectedRoute><SudokuSolver /></ProtectedRoute>} />
            <Route path="tailwind"       element={<ProtectedRoute><TailwindCheatsheet /></ProtectedRoute>} />

            {/* Error Pages */}
            <Route path="*" element={<ErrorPage statusCode={404} />} />
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
