import { useAuth } from "../auth/auth-context";

export default function MorePage() {
  const { user, logout } = useAuth();

  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold text-primary">More</h1>
      {user ? <p className="mt-2 text-sm text-black/70">{user.clinicName}</p> : null}
      <button
        type="button"
        onClick={() => void logout()}
        className="mt-4 rounded-md bg-danger px-4 py-2 text-sm font-medium text-white"
      >
        Log out
      </button>
    </main>
  );
}
