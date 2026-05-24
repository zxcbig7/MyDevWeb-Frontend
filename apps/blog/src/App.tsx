import { Routes, Route, Navigate } from "react-router-dom";
import HomeLayout from "./pages/layout/HomeLayout";
import Homepage from "./pages/home/Homepage";
import AboutPage from "./pages/home/AboutPage";
import NotesList from "./pages/Notes/NotesList";
import NoteGraph from "./pages/Notes/NoteGraph";
import NoteArticle from "./pages/Notes/NoteArticle";
import ErrorPage from "./pages/ErrorPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeLayout />}>
        <Route index element={<Navigate to="homepage" replace />} />
        <Route path="homepage" element={<Homepage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="notes" element={<NotesList />} />
        <Route path="notes/graph" element={<NoteGraph />} />
        <Route path="notes/*" element={<NoteArticle />} />
        <Route path="*" element={<ErrorPage />} />
      </Route>
    </Routes>
  );
}

export default App;
