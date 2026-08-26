import { Route, Routes } from "react-router-dom";
import { Boxes, Layers, PanelsTopLeft } from "lucide-react";
import { AppLayout } from "./layouts/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { SectionPlaceholder } from "./pages/SectionPlaceholder";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route
            path="section-1"
            element={<SectionPlaceholder title="Раздел 1" icon={Boxes} />}
          />
          <Route
            path="section-2"
            element={<SectionPlaceholder title="Раздел 2" icon={Layers} />}
          />
          <Route
            path="section-3"
            element={<SectionPlaceholder title="Раздел 3" icon={PanelsTopLeft} />}
          />
        </Route>
      </Route>
    </Routes>
  );
}
