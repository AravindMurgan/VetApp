import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import TodayPage from "./pages/TodayPage";
import PatientsPage from "./pages/PatientsPage";
import FollowUpsPage from "./pages/FollowUpsPage";
import MorePage from "./pages/MorePage";
import NewCasePage from "./pages/NewCasePage";
import VaccineSchedulesPage from "./pages/VaccineSchedulesPage";
import PatientProfilePage from "./pages/PatientProfilePage";
import CasePrescriptionPage from "./pages/CasePrescriptionPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/today" element={<TodayPage />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/follow-ups" element={<FollowUpsPage />} />
        <Route path="/more" element={<MorePage />} />
        <Route path="/new-case" element={<NewCasePage />} />
        <Route path="/vaccine-schedules" element={<VaccineSchedulesPage />} />
        <Route path="/patients/:id" element={<PatientProfilePage />} />
        <Route path="/cases/:id/prescription" element={<CasePrescriptionPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
  );
}
