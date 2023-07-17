import { AppLayout } from "./pages/layout";
import { Toaster } from "solid-toast";

function App() {
  return (
    <div class="h-screen">
      <Toaster />
      <AppLayout />
    </div>
  );
}

export default App;
