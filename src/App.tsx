import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import HomePage from "./pages/layout/HomeLayout";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";

// antd 間距 / 圓角的單一控制點 —— antd 元件走自己的 token，與 Tailwind 脫鉤是「父子間距疊加」主因。
// sizeUnit/sizeStep = 4 即 antd 預設（此處不改視覺），但從此 antd 的 padding/margin 派生值都從這裡長出來。
// 要讓 antd 間距對齊 Tailwind 4px grid（src/lib/spacing.ts）或圓角對齊 radius.ts，改這裡即可，逐步驗證視覺。
const ANTD_THEME = {
  token: {
    sizeUnit: 4,
    sizeStep: 4,
  },
};

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
    <ConfigProvider theme={ANTD_THEME}>
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
    </ConfigProvider>
  );
}

export default App;
