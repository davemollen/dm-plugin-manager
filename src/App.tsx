import { attachConsole } from "@tauri-apps/plugin-log";
import { ToastContextProvider } from "./contexts/ToastContextProvider";
import { PluginManager } from "./pages/PluginManager";
import { ModPluginManager } from "./pages/ModPluginManager";
import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";

function App() {
  useEffect(() => {
    const promise = attachConsole();

    return () => {
      promise.then((f) => f());
    };
  }, []);

  return (
    <ToastContextProvider>
      <Router>
        <Navigation>
          <main className="flex flex-1 w-full min-h-screen flex-col p-6">
            <Routes>
              <Route path="/" element={<PluginManager />} />
              <Route
                path="/mod-plugin-manager"
                element={<ModPluginManager />}
              />
            </Routes>
          </main>
        </Navigation>
      </Router>
    </ToastContextProvider>
  );
}

export default App;
