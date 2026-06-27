import { createRoot } from "react-dom/client";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Configure API client to use localStorage token
setAuthTokenGetter(() => {
  return localStorage.getItem("auth_token");
});

createRoot(document.getElementById("root")!).render(<App />);
