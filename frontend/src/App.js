import "./App.css";
import ChatPage from "./pages/ChatPage.js";
import LandingPage from "./pages/Landing.js";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import NotFound from "./pages/NotFound.js";
import { inject } from '@vercel/analytics';
import FAQs from "./pages/FAQs.js";
import MaintenancePage from "./pages/MaintenancePage.js";

inject();
function App() {
  return (
    <div className="app-container">
      <Router>
        <Routes>
          <Route path="/maintentance" element={<LandingPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/" element={<MaintenancePage />} />
          <Route path="*" element={<NotFound />} /> {/* 404 Page */}

        </Routes>
      </Router>
    </div>
  );
}

export default App;