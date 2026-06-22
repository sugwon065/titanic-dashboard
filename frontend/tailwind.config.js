/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dashboard: {
          bg: "#041222",
          card: "#142230",
          "card-kpi": "#17212e",
          section: "#17212e",
          border: "#23303f",
          blue: "#1d94f2",
          grey: "#9aa5b1",
          muted: "#aab4c0",
          green: "#2ecc71",
          danger: "#ff5c7a",
          "shap-low": "#3b4cca",
          "shap-high": "#e84393",
          map: "#1a1c20",
        },
      },
      borderRadius: {
        card: "8px",
      },
      gap: {
        card: "10px",
      },
      fontSize: {
        "dashboard-title": ["17px", { lineHeight: "1.2", letterSpacing: "0.04em" }],
        "dashboard-section": ["11px", { lineHeight: "1.3" }],
        "dashboard-label": ["10px", { lineHeight: "1.4" }],
        "dashboard-kpi": ["26px", { lineHeight: "1.1" }],
      },
    },
  },
  plugins: [],
};
