import { Link } from "react-router-dom";

export default function TodayPage() {
  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold text-primary">Today</h1>
      <Link
        to="/new-case"
        className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
      >
        + New Case
      </Link>
    </main>
  );
}
