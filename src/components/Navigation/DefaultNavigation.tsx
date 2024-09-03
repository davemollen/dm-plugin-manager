import { NavLink, useLocation } from "react-router-dom";

export function DefaultNavigation() {
  const location = useLocation();

  return (
    <nav className="w-54 text-blue-gray-700 sticky top-0 hidden h-screen flex-col border-r-2 border-foreground font-sans text-lg font-semibold sm:flex">
      <NavLink
        to="/"
        className={() => {
          const isActive =
            location.pathname === "/" ||
            location.pathname === "/plugin-manager-page-2";
          return `relative px-6 py-3 hover:text-link ${isActive ? "bg-onBackground text-link before:absolute before:bottom-0 before:left-0 before:top-0 before:w-1 before:bg-link" : ""}`;
        }}
      >
        Plugin manager
      </NavLink>
      <NavLink
        to="/mod-plugin-manager"
        className={({ isActive }) =>
          `relative px-6 py-3 hover:text-link ${isActive ? "bg-onBackground text-link before:absolute before:bottom-0 before:left-0 before:top-0 before:w-1 before:bg-link" : ""}`
        }
      >
        MOD plugin manager
      </NavLink>
    </nav>
  );
}
