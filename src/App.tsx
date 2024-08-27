import { attachConsole } from "@tauri-apps/plugin-log";
import { ToastContextProvider } from "./contexts/ToastContextProvider";
import { ModPluginManager } from "./pages/ModPluginManager";
import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
} from "react-router-dom";

function App() {
  useEffect(() => {
    const promise = attachConsole();

    return () => {
      promise.then((f) => f());
    };
  }, []);

  return (
    <div className="relative flex w-full font-mono text-base">
      <ToastContextProvider>
        <Router>
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

          <main className="flex flex-1 w-full min-h-screen flex-col p-6">
            <Routes>
              <Route path="/" element={<ModPluginManager />} />
              <Route
                path="/mod-plugin-manager"
                element={<ModPluginManager />}
              />
            </Routes>
          </main>
        </Router>
      </ToastContextProvider>
    </div>
  );
}

export default App;
