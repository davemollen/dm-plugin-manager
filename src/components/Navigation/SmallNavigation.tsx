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
        className={`mt-4 mr-4 self-end ${activeBreakPoint === undefined ? "flex" : "hidden"}`}
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
        className={`font-sans text-lg font-semibold w-full h-screen flex-col ${smallMenuIsOpen && activeBreakPoint === undefined ? "flex" : "hidden"}`}
      >
        <NavLink
          to="/"
          onClick={closeSmallMenu}
          className={({ isActive }) =>
            `relative py-3 px-6 hover:text-blue-400 ${isActive ? "text-blue-400 before:absolute before:top-0 before:left-0 before:bottom-0 before:w-1 before:bg-blue-400" : "text-white"}`
          }
        >
          Plugin manager
        </NavLink>
        <NavLink
          to="/mod-plugin-manager"
          onClick={closeSmallMenu}
          className={({ isActive }) =>
            `relative py-3 px-6 hover:text-blue-400 ${isActive ? "text-blue-400 before:absolute before:top-0 before:left-0 before:bottom-0 before:w-1 before:bg-blue-400" : "text-white"}`
          }
        >
          MOD plugin manager
        </NavLink>
      </nav>
    </>
  );
}
