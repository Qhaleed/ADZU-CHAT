import React from "react";
import AdzuChatCard from "../components/AdzuChatCard";
import AdzuSnBanner from "../components/AdzuSnBanner";
import "./Landing.css"

function LandingPage() {
  return (
    <div className="landing-stack">
      <AdzuSnBanner />
      <AdzuChatCard />
    </div>
  );
}

export default LandingPage;
