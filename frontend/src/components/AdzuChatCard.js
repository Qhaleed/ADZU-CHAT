import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./AdzuChatCard.css"
import BACKEND_URL from "../config";
const AdzuChatCard = () => {
    const [campus, setCampus] = useState("Main Campus");
    const [preference, setPreference] = useState("None");
    const [activeUsers, setActiveUsers] = useState(0);
    const [waitingUsers, setWaitingUsers] = useState(0);
    const [chattingUsers, setChattingUsers] = useState(0);

    // Fetch user stats on component mount
    useEffect(() => {
        const fetchUserStats = async () => {
            try {
                const response = await fetch(`http://${BACKEND_URL}/user-stats`); // Adjust with correct backend URL
                const data = await response.json();
                setActiveUsers(data.active_users);
                setWaitingUsers(data.waiting_users);
                setChattingUsers(data.chatting_users);
            } catch (error) {
                console.error("Error fetching user stats:", error);
            }
        };

        fetchUserStats();
    }, []);

    return (
        <div className="adzu-card">
            <div className="adzu-card-logo">
                <div className="adzu-logo-wrapper">
                    <img src="./LOGO-1.jpg" alt="ADZU CHAT Logo" className="adzu-logo-image" />
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
                                <option>None</option>
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

                <div className="adzu-user-status">
                    <p><strong>Active Users:</strong> {activeUsers}</p>
                    <p><strong>Waiting Users:</strong> {waitingUsers}</p>
                    <p><strong>Chatting:</strong> {chattingUsers}</p>
                </div>

                <div className="adzu-reminder-container">
                    <p>Note: This is a beta version of the chat. Some features may not work as expected.</p>
                </div>
            </div>
        </div>
    );
};

export default AdzuChatCard;
