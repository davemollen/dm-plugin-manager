import { useBreakPoint } from "@/hooks/useBreakPoint";
import { faClose, faNavicon } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { NavLink } from "react-router-dom";

export function SmallNavigation({
  activeBreakPoint,
}: {
  activeBreakPoint: ReturnType<typeof useBreakPoint>;
}) {
  const [smallMenuIsOpen, setSmallMenuIsOpen] = useState<boolean>();

  function toggleSmallMenu() {
    setSmallMenuIsOpen(!smallMenuIsOpen);
  }

  function closeSmallMenu() {
    setSmallMenuIsOpen(false);
  }

  return (
    <>
      <button
        className={`mr-4 mt-4 self-end ${activeBreakPoint === undefined ? "flex" : "hidden"}`}
        onClick={toggleSmallMenu}
      >
        {smallMenuIsOpen ? (
          <FontAwesomeIcon icon={faClose} size="xl" />
        ) : (
          <FontAwesomeIcon icon={faNavicon} size="xl" />
        )}
      </button>
      <nav
        id="small-nav"
        className={`mt-4 h-screen w-full flex-col font-sans text-xl font-semibold ${smallMenuIsOpen && activeBreakPoint === undefined ? "flex" : "hidden"}`}
      >
        <NavLink
          to="/"
          onClick={closeSmallMenu}
          className={() => {
            const isActive =
              location.pathname === "/" ||
              location.pathname === "/plugin-manager-page-2";
            return `relative px-6 py-3 hover:text-link ${isActive ? "bg-onBackground text-link before:absolute before:bottom-0 before:left-0 before:top-0 before:w-1 before:bg-blue-400" : ""}`;
          }}
        >
          Plugin manager
        </NavLink>
        <NavLink
          to="/mod-plugin-manager"
          onClick={closeSmallMenu}
          className={({ isActive }) =>
            `relative px-6 py-3 hover:text-link ${isActive ? "bg-onBackground text-link before:absolute before:bottom-0 before:left-0 before:top-0 before:w-1 before:bg-blue-400" : ""}`
          }
        >
          MOD plugin manager
        </NavLink>
      </nav>
    </>
  );
}
