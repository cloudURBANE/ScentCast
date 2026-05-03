import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import { Toaster } from "sonner";
import App from "./App";
import "./index.css";

const apiOrigin =
  typeof import.meta.env.VITE_API_ORIGIN === "string"
    ? import.meta.env.VITE_API_ORIGIN.trim().replace(/\/+$/, "")
    : "";
setBaseUrl(apiOrigin || null);

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Toaster richColors closeButton position="top-center" theme="dark" />
  </>,
);
