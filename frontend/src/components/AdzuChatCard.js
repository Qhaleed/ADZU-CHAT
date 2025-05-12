import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaGithub } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid'; // We'll need to install this package
import "./AdzuChatCard.css";

const AdzuChatCard = () => {
    const [campus, setCampus] = useState("Main Campus");
    const [preference, setPreference] = useState("None");
    const [matchingCode, setMatchingCode] = useState("");
    const [useMatchingCode, setUseMatchingCode] = useState(false);
    const [activeUsers, setActiveUsers] = useState(0);
    const [waitingUsers, setWaitingUsers] = useState(0);
    const [chattingUsers, setChattingUsers] = useState(0);
    const [standbyUsers, setStandbyUsers] = useState(0);
    const [showHiddenNote, setShowHiddenNote] = useState(false);
    const [userId] = useState(() => {
        // Check if we already have a UUID stored in localStorage
        const storedId = localStorage.getItem('adzu-chat-user-id');
        if (storedId) {
            return storedId;
        }

        // Generate a new unique ID and store it
        const newId = uuidv4();
        localStorage.setItem('adzu-chat-user-id', newId);
        return newId;
    });

    // Fetch user stats every 5 seconds and manage standby status
    useEffect(() => {
        const backendURL = process.env.REACT_APP_URL || "http://localhost:8000";

        const fetchUserStats = async () => {
            try {
                const response = await fetch(`${backendURL}/user-stats`);
                const data = await response.json();
                setActiveUsers(data.active_users);
                setWaitingUsers(data.waiting_users);
                setChattingUsers(data.chatting_users);
                setStandbyUsers(data.standby_users);
            } catch (error) {
                console.error("Error fetching user stats:", error);
            }
        };

        // Register this user as standby
        const registerStandby = async () => {
            try {
                await fetch(`${backendURL}/standby/${userId}`, {
                    method: 'POST',
                });
                // console.log("User registered as standby:", userId);
            } catch (error) {
                // console.error("Error registering standby user:", error);
            }
        };

        // Unregister standby user when component unmounts
        const unregisterStandby = async () => {
            try {
                await fetch(`${backendURL}/standby/${userId}`, {
                    method: 'DELETE',
                });
                // console.log("User unregistered from standby:", userId);
            } catch (error) {
                // console.error("Error unregistering standby user:", error);
            }
        };

        // Send heartbeat to keep the standby session active
        const sendHeartbeat = async () => {
            try {
                await fetch(`${backendURL}/standby/heartbeat/${userId}`, {
                    method: 'POST',
                });
                // console.log("Heartbeat sent for user:", userId);
            } catch (error) {
                // console.error("Error sending heartbeat:", error);
            }
        };

        // Handle browser close/refresh events
        const handleBeforeUnload = (event) => {
            // This sync call will run before the browser closes
            const xhr = new XMLHttpRequest();
            xhr.open("DELETE", `${backendURL}/standby/${userId}`, false);  // false makes it synchronous
            try {
                xhr.send();
                console.log("User unregistered on page close:", userId);
            } catch (e) {
                console.error("Failed to unregister on page close:", e);
            }

            // Standard for modern browsers
            event.preventDefault();
            event.returnValue = '';
        };

        // Register immediately on mount
        registerStandby();

        // Fetch immediately on mount
        fetchUserStats();

        // Add event listener for beforeunload
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Set an interval to fetch user stats every 5 seconds
        const statsIntervalId = setInterval(fetchUserStats, 5000);

        // Set an interval to send heartbeat every 20 seconds
        const heartbeatIntervalId = setInterval(sendHeartbeat, 20000);

        // Cleanup interval and unregister standby on component unmount
        return () => {
            clearInterval(statsIntervalId);
            clearInterval(heartbeatIntervalId);
            unregisterStandby();
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };

    }, [userId]);  // Add userId to dependency array

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
                    <div className="adzu-beta-badge">Beta 0.3</div>
                </div>


                <p className="adzu-description">
                    An open source local anonymous chat made for students of the Ateneo de Zamboanga University.
                    <span> Peak hours: <br />10:00 pm - 3:00 am</span>
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
                                {/* Temporary remove Tumaga Campus */}
                                <option disabled>Tumaga Campus</option>
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
                                <option>NAO</option>
                                <option>SITEAO</option>
                                <option>AAO</option>
                                <option>SHS</option>
                                <option>LAAO</option>
                                <option>COL</option>
                                <option>SOM</option>
                                <option>EAO</option>
                                <option>MAO</option>
                                <option>ALUMNI</option>
                            </select>
                        </div>
                    </div>

                    {/* Matching Code */}
                    <div className="adzu-form-group">
                        <label className="adzu-form-label">Matching Code</label>
                        <div className="adzu-select-wrapper">
                            <input
                                type="text"
                                className="adzu-form-input"
                                value={matchingCode}
                                onChange={(e) => setMatchingCode(e.target.value)}
                                placeholder="Enter matching code"
                                disabled={!useMatchingCode}
                            />
                        </div>
                        <div className="adzu-checkbox-wrapper">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={useMatchingCode}
                                    onChange={(e) => setUseMatchingCode(e.target.checked)}
                                />
                                Use Matching Code
                            </label>
                        </div>
                    </div>
                </div>

                {/* Pass selected preferences as URL parameters */}
                <Link to={`/chat?campus=${encodeURIComponent(campus)}&preference=${encodeURIComponent(preference)}&matchingCode=${encodeURIComponent(matchingCode)}`}>
                    <button className="adzu-chat-button">Chat now</button>
                </Link>

                <div className="adzu-user-status">
                    <p><strong>Active Users:</strong> {activeUsers}</p>
                    <p><strong>Waiting Users:</strong> {waitingUsers}</p>
                    <p><strong>Chatting:</strong> {chattingUsers}</p>
                    <p><strong>Chilling here:</strong> {standbyUsers}</p>
                </div>


                <div className="adzu-reminder-container">
                    <p>Notes: Good luck sa finals everyone! Updates will be more frequent after finals week. If you may encounter any bugs, please report them on our Facebook page. Thanks!</p>
                    <div className="adzu-hidden-note">
                        <button onClick={() => setShowHiddenNote(!showHiddenNote)}>
                            {showHiddenNote ? 'Hide Details' : 'Show Disclaimer'}
                        </button>
                        {showHiddenNote && (
                            <p>
                                This application is designed for educational and community-building purposes within the Ateneo de Zamboanga University. <br></br>
                                The developer/s are not responsible for any misuse, issues, or consequences arising from its use. Please note that "ADZU" is a reference to the Ateneo de Zamboanga University, and this application is not officially affiliated with or endorsed by the university.
                            </p>
                        )}
                    </div>
                </div>
                {/* Temporarily removed github link */}
                {/* Hello if you reach this, and want to contribute, you know what to do! */}
                {/* <div className="adzu-github-link">
                    <a href="https://github.com/Qhaleed/ADZU-CHAT" target="_blank" rel="noopener noreferrer">
                        <FaGithub />
                    </a>
                </div> */}
                <Link to="/faqs" className="faqs-link">Frequently Asked Questions</Link>
            </div>
        </div >
    );
};

export default AdzuChatCard;
