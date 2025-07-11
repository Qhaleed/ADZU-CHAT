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
import GlobalChat from "./pages/GlobalChat.js";

inject();
function App() {
  return (
    <ThemeProvider>
      <div className="app-container">
        <DarkModeToggle />
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/c" element={<LandingPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/global" element={<GlobalChat />} />
            <Route path="*" element={<NotFound />} /> {/* 404 Page */}
          </Routes>
        </Router>
      </div>
    </ThemeProvider>
  );
}

export default App;
