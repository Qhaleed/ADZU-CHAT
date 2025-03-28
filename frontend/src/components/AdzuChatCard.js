import { useState } from "react";
import { Link } from "react-router-dom";
import "./AdzuChatCard.css";

const AdzuChatCard = () => {
    const [campus, setCampus] = useState("Main Campus");
    const [preference, setPreference] = useState("BSN");

    return (
        <div className="adzu-card">
            <div className="adzu-card-logo">
                <div className="adzu-logo-wrapper">
                    <img src="./ADZU-CHAT.jpg" alt="ADZU CHAT Logo" className="adzu-logo-image" />
                </div>
            </div>

            <div className="adzu-card-content">
                <div className="adzu-title-wrapper">
                    <h1 className="adzu-title">ADZU CHAT</h1>
                    <div className="adzu-beta-badge">Beta</div>
                </div>

                <p className="adzu-description">
                    An open source local anonymous chat made for students of the Ateneo de Zamboanga University.
                </p>

                <div className="adzu-form-grid">
                    {/* Campus Selection */}
                    <div className="adzu-form-group">
                        <label className="adzu-form-label">Campus</label>
                        <div className="adzu-select-wrapper">
                            <select
                                className="adzu-form-select"
                                value={campus}
                                onChange={(e) => setCampus(e.target.value)}
                            >
                                <option>Main Campus</option>
                                <option>Lantaka Campus</option>
                                <option>Tetuan Campus</option>
                            </select>
                        </div>
                    </div>

                    {/* Preference Selection */}
                    <div className="adzu-form-group">
                        <label className="adzu-form-label">Preference (course)</label>
                        <div className="adzu-select-wrapper">
                            <select
                                className="adzu-form-select"
                                value={preference}
                                onChange={(e) => setPreference(e.target.value)}
                            >
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

                {/* Pass selected preferences as URL parameters */}
                <Link to={`/chat?campus=${encodeURIComponent(campus)}&preference=${encodeURIComponent(preference)}`}>
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
