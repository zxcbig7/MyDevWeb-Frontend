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
const NoteGraph             = lazy(() => import("./pages/Notes/NoteGraph"));
const ErrorPage             = lazy(() => import("./pages/ErrorPage"));
const RuleViewer            = lazy(() => import("./components/RTDRuleViewer/RuleViewer"));
const SQLVisualizer         = lazy(() => import("./pages/tools/SQLVisualizer"));
const SudokuSolver          = lazy(() => import("./components/Sudoku/SudokuSolver"));
const TailwindCheatsheet    = lazy(() => import("./pages/tools/TailwindCheatsheet"));

// Dev harness 頁（吃 mock）—— 僅 dev build 納入；production 此整段為 dead code，
// 連同 mock chunk 都不會被 Rollup 產出（import.meta.env.DEV → false）。
const devPages = import.meta.env.DEV
  ? {
      DevRuleView:           lazy(() => import("./pages/Dev/DevRuleView")),
      DevRuleDropdownSearch: lazy(() => import("./pages/Dev/DevRuleDropdownSearch")),
      DevRuleContentSearch:  lazy(() => import("./pages/Dev/DevRuleContentSearch")),
      DevBlockInspector:     lazy(() => import("./pages/Dev/DevBlockInspector")),
      DevBlockTooltip:       lazy(() => import("./pages/Dev/DevBlockTooltip")),
      DevCaseQuery:          lazy(() => import("./pages/Dev/DevCaseQuery")),
      DevTableInspector:     lazy(() => import("./pages/Dev/DevTableInspector")),
    }
  : null;

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
            <Route path="notes/graph" element={<NoteGraph />} />
            <Route path="notes/*" element={<NoteArticle />} />

            {/* 私人頁面：需要登入 */}
            <Route path="ruleviewer" element={<ProtectedRoute><RuleViewer /></ProtectedRoute>} />

            {/* Dev harness 路由 —— dev-only，production 不掛載 */}
            {devPages && (
              <>
                <Route path="dev/rule-view"       element={<ProtectedRoute><devPages.DevRuleView /></ProtectedRoute>} />
                <Route path="dev/dropdown-search" element={<ProtectedRoute><devPages.DevRuleDropdownSearch /></ProtectedRoute>} />
                <Route path="dev/content-search"  element={<ProtectedRoute><devPages.DevRuleContentSearch /></ProtectedRoute>} />
                <Route path="dev/block-inspector" element={<ProtectedRoute><devPages.DevBlockInspector /></ProtectedRoute>} />
                <Route path="dev/block-tooltip"   element={<ProtectedRoute><devPages.DevBlockTooltip /></ProtectedRoute>} />
                <Route path="dev/case-query"      element={<ProtectedRoute><devPages.DevCaseQuery /></ProtectedRoute>} />
                <Route path="dev/table-inspector" element={<ProtectedRoute><devPages.DevTableInspector /></ProtectedRoute>} />
              </>
            )}

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
