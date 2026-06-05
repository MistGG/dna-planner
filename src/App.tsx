import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { CollectorPage } from "./pages/CollectorPage";
import { CharactersPage } from "./pages/CharactersPage";
import { WeaponsPage } from "./pages/WeaponsPage";
import { WedgesPage } from "./pages/WedgesPage";
import { GuideImportPage } from "./pages/GuideImportPage";
import { BoardPage } from "./pages/BoardPage";
import { GuidesPage } from "./pages/GuidesPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<CollectorPage />} />
        <Route path="board" element={<BoardPage />} />
        <Route path="guides" element={<GuidesPage />} />
        <Route path="characters" element={<CharactersPage />} />
        <Route path="weapons" element={<WeaponsPage />} />
        <Route path="wedges" element={<WedgesPage />} />
        <Route path="import" element={<GuideImportPage />} />
      </Route>
    </Routes>
  );
}
