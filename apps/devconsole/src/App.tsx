import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import HomeLayout from "./pages/layout/HomeLayout";

const AuthPage              = () => <div>TODO: AuthPage (stub)</div>;
const AuthCallback          = () => <div>TODO: AuthCallback (stub)</div>;
const Homepage              = () => <div>TODO: Homepage (stub)</div>;
const AboutPage             = () => <div>TODO: AboutPage (stub)</div>;
const NotesList             = () => <div>TODO: NotesList (stub)</div>;
const NoteArticle           = () => <div>TODO: NoteArticle (stub)</div>;
const NoteGraph             = () => <div>TODO: NoteGraph (stub)</div>;
const ErrorPage             = () => <div>TODO: ErrorPage 404 (stub)</div>;
const RuleViewer            = () => <div>TODO: RuleViewer (stub)</div>;
const SQLVisualizer         = () => <div>TODO: SQLVisualizer (stub)</div>;
const SudokuSolver          = () => <div>TODO: SudokuSolver (stub)</div>;
const TailwindCheatsheet    = () => <div>TODO: TailwindCheatsheet (stub)</div>;
const DevRuleView           = () => <div>TODO: DevRuleView (stub)</div>;
const DevRuleDropdownSearch = () => <div>TODO: DevRuleDropdownSearch (stub)</div>;
const DevRuleContentSearch  = () => <div>TODO: DevRuleContentSearch (stub)</div>;
const DevBlockInspector     = () => <div>TODO: DevBlockInspector (stub)</div>;
const DevBlockTooltip       = () => <div>TODO: DevBlockTooltip (stub)</div>;
const DevCaseQuery          = () => <div>TODO: DevCaseQuery (stub)</div>;
const DevTableInspector     = () => <div>TODO: DevTableInspector (stub)</div>;

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route path="/" element={<HomeLayout />}>
          <Route index element={<Navigate to="homepage" replace />} />

          <Route path="homepage" element={<Homepage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="notes" element={<NotesList />} />
          <Route path="notes/graph" element={<NoteGraph />} />
          <Route path="notes/*" element={<NoteArticle />} />

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

          <Route path="*" element={<ErrorPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
