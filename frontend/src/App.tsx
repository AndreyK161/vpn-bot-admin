import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Dashboard } from "./pages/Dashboard";
import { Events } from "./pages/Events";
import { Login } from "./pages/Login";
import { Messages } from "./pages/Messages";
import { Templates } from "./pages/Templates";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="messages" element={<Messages />} />
          <Route path="templates" element={<Templates />} />
          <Route path="events" element={<Events />} />
        </Route>
      </Route>
    </Routes>
  );
}
