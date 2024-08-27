import { NavLink } from "react-router-dom";

export function DefaultNavigation() {
  return (
    <nav className="sticky top-0 w-48 h-screen flex-col font-sans text-lg font-semibold text-blue-gray-700 border-r-2 border-gray-600 sm:flex hidden">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `relative py-3 px-6 hover:text-blue-400 ${isActive ? "text-blue-400 before:absolute before:top-0 before:left-0 before:bottom-0 before:w-1 before:bg-blue-400" : "text-white"}`
        }
      >
        Plugin manager
      </NavLink>
      <NavLink
        to="/mod-plugin-manager"
        className={({ isActive }) =>
          `relative py-3 px-6 hover:text-blue-400 ${isActive ? "text-blue-400 before:absolute before:top-0 before:left-0 before:bottom-0 before:w-1 before:bg-blue-400" : "text-white"}`
        }
      >
        MOD plugin manager
      </NavLink>
    </nav>
  );
}
