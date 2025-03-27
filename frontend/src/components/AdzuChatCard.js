import { useState } from "react";
import "./AdzuChatCard.css";
import { Link } from "react-router-dom";

const AdzuChatCard = () => {
    const [reminderOpen, setReminderOpen] = useState(true);

    return (
        <div className="adzu-card">
            {/* Left side - Logo */}
            <div className="adzu-card-logo">
                <div className="adzu-logo-wrapper">
                    <img src="./ADZU-CHAT.jpg" alt="ADZU CHAT Logo" className="adzu-logo-image" />
                </div>
            </div>

            {/* Right side - Content */}
            <div className="adzu-card-content">
                <div className="adzu-title-wrapper">
                    <h1 className="adzu-title">ADZU CHAT</h1>
                    <div className="adzu-beta-badge">Beta</div>
                </div>

                <p className="adzu-description">
                    An open source local anonymous chat made for students of the Ateneo de Zamboanga University. All chat within
                    this webapp will be keep confidential and secured.
                </p>

                <div className="adzu-form-grid">
                    <div className="adzu-form-group">
                        <label className="adzu-form-label">Campus</label>
                        <div className="adzu-select-wrapper">
                            <select className="adzu-form-select">
                                <option>Main Campus</option>
                                <option>Lantaka Campus</option>
                                <option>Tetuan Campus</option>
                            </select>

                        </div>
                    </div>

                    <div className="adzu-form-group">
                        <label className="adzu-form-label">Preference (course,year-level)</label>
                        <div className="adzu-select-wrapper">
                            <select className="adzu-form-select">
                                <option>BSN</option>
                                <option>SITEAO</option>
                                <option>AAO</option>
                                <option>LAAO</option>
                                <option>COL</option>
                                <option>SOM</option>
                                <option>EAO</option>
                                <option>MAO</option>
                                <option>ALUMNI</option>
                            </select>

                        </div>
                    </div>
                </div>
                <Link to="/chat">
                    <button className="adzu-chat-button">Chat now</button>
                </Link>
                <div className="adzu-reminder-container">
                    <p>Note: This is a beta version of the chat. Some features may not work as expected.</p>
                </div>
            </div>
        </div>
    );
};

export default AdzuChatCard;