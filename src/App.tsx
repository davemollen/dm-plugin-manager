import { attachConsole } from "@tauri-apps/plugin-log";
import { ToastContextProvider } from "./contexts/ToastContextProvider";
import { HomePage } from "./pages/HomePage";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    const promise = attachConsole();

    return () => {
      promise.then((f) => f());
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-2 md:p-4 lg:p-8 xl:p-16">
      <div className="w-full max-w-screen-2xl items-center justify-between font-mono text-base">
        <ToastContextProvider>
          <HomePage />
        </ToastContextProvider>
      </div>
    </main>
  );
}

export default App;
