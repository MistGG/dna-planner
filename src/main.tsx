import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { CollectorProvider } from "./context/CollectorContext";
import { SavedGuidesProvider } from "./context/SavedGuidesContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || undefined}>
      <CollectorProvider>
        <SavedGuidesProvider>
          <App />
        </SavedGuidesProvider>
      </CollectorProvider>
    </BrowserRouter>
  </StrictMode>
);
