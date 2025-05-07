import React from "react";
import { Link } from "react-router-dom";
import "./MaintenancePage.css";

function MaintenancePage() {
    return (
        <div className="maintenance-page">
            <div className="maintenance-logo">
                <img src="/LOGO-1.jpg" alt="ADZU CHAT Logo" />
            </div>
            <h1>Under Maintenance</h1>
            <p>We're currently performing scheduled maintenance on ADZU Chat.</p>
            <p className="maintenance-message">We'll be back online shortly. Thank you for your patience!</p>
            {/* <p className="maintenance-time">Expected completion: <span>May 8, 2025, 3:00 PM</span></p> */}
            {/* <Link to="/">
                <button className="maintenance-button">Try Again</button>
            </Link> */}
        </div>
    );
}

export default MaintenancePage;