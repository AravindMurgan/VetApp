import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/auth-context";
import { RegisterStaffForm } from "../components/RegisterStaffForm";
import { ClinicDetailsForm } from "../components/ClinicDetailsForm";

export default function MorePage() {
  const { user, logout } = useAuth();
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showClinicDetailsForm, setShowClinicDetailsForm] = useState(false);

  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold text-primary">More</h1>
      {user ? <p className="mt-2 text-sm text-black/70">{user.clinicName}</p> : null}

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-black/70">Clinic settings</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            to="/vaccine-schedules"
            className="inline-block rounded-md border border-black/20 px-4 py-2 text-sm font-medium"
          >
            Vaccine schedules
          </Link>
          <button
            type="button"
            onClick={() => setShowClinicDetailsForm((open) => !open)}
            className="rounded-md border border-black/20 px-4 py-2 text-sm font-medium"
          >
            {showClinicDetailsForm ? "Cancel" : "Clinic details"}
          </button>
        </div>
        {showClinicDetailsForm ? <ClinicDetailsForm /> : null}
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-black/70">Staff accounts</h2>
        <button
          type="button"
          onClick={() => setShowRegisterForm((open) => !open)}
          className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          {showRegisterForm ? "Cancel" : "+ Add staff account"}
        </button>
        {showRegisterForm ? <RegisterStaffForm /> : null}
      </section>

      <button
        type="button"
        onClick={() => void logout()}
        className="mt-6 rounded-md bg-danger px-4 py-2 text-sm font-medium text-white"
      >
        Log out
      </button>
    </main>
  );
}
