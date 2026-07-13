import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/today", label: "Today", icon: "🏠" },
  { to: "/patients", label: "Patients", icon: "🐾" },
  { to: "/follow-ups", label: "Follow-ups", icon: "🔔" },
  { to: "/more", label: "More", icon: "☰" },
];

export function BottomTabBar() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 flex border-t border-black/10 bg-white"
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium ${
              isActive ? "text-primary" : "text-black/50"
            }`
          }
        >
          <span aria-hidden="true" className="text-lg leading-none">
            {tab.icon}
          </span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
