import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Umami analytics conditional loading
function loadUmamiAnalytics() {
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;
  
  if (endpoint && websiteId) {
    const script = document.createElement("script");
    script.defer = true;
    script.src = `${endpoint}/umami`;
    script.dataset.websiteId = websiteId;
    document.body.appendChild(script);
    
    if (import.meta.env.DEV) {
      console.log("[analytics] Umami script loaded:", { endpoint, websiteId });
    }
  } else if (import.meta.env.DEV) {
    console.log("[analytics] Umami not configured - missing endpoint or website ID");
  }
}

if (import.meta.env.DEV) {
  console.log("[client] import.meta.env", {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_DEFAULT_SCENARIO_SLUG: import.meta.env.VITE_DEFAULT_SCENARIO_SLUG,
    VITE_ANALYTICS_ENDPOINT: import.meta.env.VITE_ANALYTICS_ENDPOINT,
    VITE_ANALYTICS_WEBSITE_ID: import.meta.env.VITE_ANALYTICS_WEBSITE_ID,
    MODE: import.meta.env.MODE,
  });
}

loadUmamiAnalytics();

createRoot(document.getElementById("root")!).render(<App />);
