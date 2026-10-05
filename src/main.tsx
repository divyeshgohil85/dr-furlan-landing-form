import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ToastContainer } from "react-toastify";

// Extend window type
declare global {
  interface Window {
    initReactApp: () => void;
  }
}

const rootElement = document.getElementById("bookingRoot")!;
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <ToastContainer />
    <App />
  </StrictMode>
);

window.initReactApp = () => {
  root.unmount();
  root.render(
    <StrictMode>
      <ToastContainer />
      <App />
    </StrictMode>
  );
};
