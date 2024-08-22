import { ToastContextProvider } from "./contexts/ToastContextProvider";
import { HomePage } from "./pages/HomePage";

function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-2 md:p-8 lg:p-16 xl:p-24">
      <div className="w-full max-w-screen-2xl items-center justify-between font-mono text-base">
        <ToastContextProvider>
          <HomePage />
        </ToastContextProvider>
      </div>
    </main>
  );
}

export default App;
