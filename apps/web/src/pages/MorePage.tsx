import { useState } from "react";
import { useAuth } from "../auth/auth-context";
import { RegisterStaffForm } from "../components/RegisterStaffForm";

export default function MorePage() {
  const { user, logout } = useAuth();
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold text-primary">More</h1>
      {user ? <p className="mt-2 text-sm text-black/70">{user.clinicName}</p> : null}

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
