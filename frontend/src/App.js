import "./App.css";
import "./global.css";
import ChatPage from "./pages/ChatPage.js";
import LandingPage from "./pages/Landing.js";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import NotFound from "./pages/NotFound.js";
import { inject } from '@vercel/analytics';
import FAQs from "./pages/FAQs.js";
import MaintenancePage from "./pages/MaintenancePage.js";
import { ThemeProvider } from "./context/ThemeContext";
import DarkModeToggle from "./components/DarkModeToggle";

inject();
function App() {
  return (
    <ThemeProvider>
      <div className="app-container">
        <DarkModeToggle />
        <Router>
          <Routes>
            <Route path="/maintenance" element={<LandingPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="/" element={<MaintenancePage />} />
            <Route path="*" element={<NotFound />} /> {/* 404 Page */}
          </Routes>
        </Router>
      </div>
    </ThemeProvider>
  );
}

export default App;