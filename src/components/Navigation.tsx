import { NavLink } from "react-router-dom";

export function Navigation() {
  return (
    <nav className="sticky top-0 flex w-48 flex-col font-sans text-xl font-semibold text-blue-gray-700 border-r-2 border-gray-600">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `relative py-3 px-6 hover:text-blue-400 ${isActive ? "text-blue-400 before:absolute before:top-0 before:left-0 before:bottom-0 before:w-1 before:bg-blue-400" : "text-white"}`
        }
      >
        Plugins
      </NavLink>
      <NavLink
        to="/mod-plugin-manager"
        className={({ isActive }) =>
          `relative py-3 px-6 hover:text-blue-400 ${isActive ? "text-blue-400 before:absolute before:top-0 before:left-0 before:bottom-0 before:w-1 before:bg-blue-400" : "text-white"}`
        }
      >
        MOD plugins
      </NavLink>
    </nav>
  );
}
