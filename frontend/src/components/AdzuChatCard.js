import { useState } from "react"
import "./AdzuChatCard.css"

const AdzuChatCard = () => {
    const [reminderOpen, setReminderOpen] = useState(true)

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
                <h1 className="adzu-title">ADZU CHAT</h1>

                <div className="adzu-beta-badge">Beta</div>

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
                            </select>
                            <div className="adzu-select-arrow">
                                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M1 1L6 6L11 1"
                                        stroke="#757575"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="adzu-form-group">
                        <label className="adzu-form-label">Preference (course,year-level)</label>
                        <div className="adzu-select-wrapper">
                            <select className="adzu-form-select">
                                <option>BSN</option>
                            </select>
                            <div className="adzu-select-arrow">
                                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M1 1L6 6L11 1"
                                        stroke="#757575"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <button className="adzu-chat-button">Chat now</button>

                <div className="adzu-reminder-container">
                    <div className="adzu-reminder-header" onClick={() => setReminderOpen(!reminderOpen)}>
                        <h3 className="adzu-reminder-title">Reminder</h3>
                        <div className="adzu-reminder-icon">
                            {reminderOpen ? (
                                <svg width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M15 9L8 2L1 9"
                                        stroke="#1E1E1E"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            ) : (
                                <svg width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M1 1L8 8L15 1"
                                        stroke="#1E1E1E"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            )}
                        </div>
                    </div>
                    {reminderOpen && (
                        <div className="adzu-reminder-content" style={{ transition: "500ms" }}>
                            <p className="adzu-reminder-text">Remember to keep the environment safe and friendly</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AdzuChatCard

