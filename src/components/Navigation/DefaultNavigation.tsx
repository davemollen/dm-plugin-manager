import { NavLink } from "react-router-dom";

export function DefaultNavigation() {
  return (
    <nav className="sticky top-0 w-48 h-screen flex-col font-sans text-lg font-semibold text-blue-gray-700 border-r-2 border-foreground sm:flex hidden">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `relative py-3 px-6 hover:text-link ${isActive ? "bg-navItemBackground text-link before:absolute before:top-0 before:left-0 before:bottom-0 before:w-1 before:bg-link" : ""}`
        }
      >
        Plugin manager
      </NavLink>
      <NavLink
        to="/mod-plugin-manager"
        className={({ isActive }) =>
          `relative py-3 px-6 hover:text-link ${isActive ? "bg-navItemBackground text-link before:absolute before:top-0 before:left-0 before:bottom-0 before:w-1 before:bg-link" : ""}`
        }
      >
        MOD plugin manager
      </NavLink>
    </nav>
  );
}
