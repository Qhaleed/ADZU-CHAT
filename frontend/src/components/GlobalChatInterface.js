import React, { useState, useEffect, useRef, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import './GlobalChatInterface.css';

const GlobalChatInterface = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [ws, setWs] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [userCount, setUserCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [wasFiltered, setWasFiltered] = useState(false);
    const messagesEndRef = useRef(null);
    const userIdRef = useRef(uuidv4());
    const { isDarkMode } = useContext(ThemeContext);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const connectWebSocket = () => {
            setIsLoading(true);

            // Use the same backend URL logic as your existing chat
            const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
            const websocket = new WebSocket(`${wsUrl}/ws/global/${userIdRef.current}`);

            websocket.onopen = () => {
                setIsConnected(true);
                setIsLoading(false);
                console.log('Connected to global chat');
            };

            websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'global_message') {
                        // Only add messages from other users (not our own)
                        if (data.user_id !== `Anon${userIdRef.current.slice(0, 6)}`) {
                            setMessages(prev => [...prev, {
                                text: data.message,
                                sender: 'user', // Other users' messages appear on the left
                                user_id: data.user_id,
                                timestamp: data.timestamp
                            }]);
                        }
                    } else if (data.type === 'user_count') {
                        setUserCount(data.count);
                    } else if (data.type === 'system') {
                        setMessages(prev => [...prev, {
                            text: data.message,
                            sender: 'system'
                        }]);

                        // Check if this is a filtered content notification
                        if (data.message.includes('inappropriate content') && data.message.includes('filtered')) {
                            setWasFiltered(true);
                            // Reset the flag after a short period
                            setTimeout(() => setWasFiltered(false), 3000);
                        }
                    }
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            };

            websocket.onclose = () => {
                setIsConnected(false);
                setIsLoading(false);
                console.log('Disconnected from global chat');
                setMessages(prev => [...prev, { text: 'Disconnected from server', sender: 'system' }]);
                // Attempt to reconnect after 3 seconds
                setTimeout(connectWebSocket, 3000);
            };

            websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                setIsLoading(false);
            };

            setWs(websocket);
        };

        connectWebSocket();

        // Cleanup on unmount
        return () => {
            // Access ws from the ref to avoid dependency issues
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Intentionally empty - we only want this to run once

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputMessage.trim() && ws && isConnected) {
            const messageData = {
                message: inputMessage.trim(),
                type: 'global_message'
            };

            // Immediately add the user's own message to the UI
            const userMessage = {
                text: inputMessage.trim(),
                sender: 'other', // User's own messages appear on the right
                user_id: `Anon${userIdRef.current.slice(0, 6)}`,
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, userMessage]);

            // Send to server (will be broadcast to other users)
            ws.send(JSON.stringify(messageData));
            setInputMessage('');
        }
    };

    const handleInputChange = (e) => {
        setInputMessage(e.target.value);
    };

    const handleDisconnect = () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="chat-card">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Connecting to Global Chat...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-card">
            <div className="chat-header">
                <div className="chat-header-left">
                    <h1>ADZU CHAT</h1>
                    <div className="chat-tags">
                        <span className="tag global-tag">Free</span>
                        <span className="tag">Beta</span>

                        <span className="tag users-tag">{userCount} users online</span>

                        <span className={`tag ${isConnected ? 'connected' : 'disconnected'}`}>
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </span>

                    </div>
                </div>
                <Link to="/">
                    <button className="chat-back" onClick={handleDisconnect}>
                        <i className="fas fa-arrow-left"></i>
                    </button>
                </Link>
            </div>

            {wasFiltered && (
                <div style={{
                    backgroundColor: isDarkMode ? 'rgba(245, 198, 203, 0.2)' : '#f8d7da',
                    borderLeft: `4px solid ${isDarkMode ? 'var(--tag-disconnected-bg)' : '#f5c6cb'}`,
                    padding: '10px 15px',
                    margin: '0px 0',
                    marginBottom: '5px',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '15px',
                    color: isDarkMode ? '#ff6b6b' : '#721c24'
                }}>
                    <div>
                        <i className="fas fa-exclamation-circle" style={{ marginRight: '8px', color: isDarkMode ? '#ff6b6b' : '#721c24' }}></i>
                        A message was filtered due to inappropriate content.
                    </div>
                </div>
            )}

            <div className="chat-body">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender}`}>
                        <div className="message-bubble">
                            {(msg.sender === 'user' || msg.sender === 'other') && msg.user_id && (
                                <div className="message-header">
                                    <span className="message-user">{msg.user_id}</span>
                                    {msg.timestamp && (
                                        <span className="message-time">{formatTime(msg.timestamp)}</span>
                                    )}
                                </div>
                            )}
                            <div className="message-content">{msg.text}</div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input" onSubmit={handleSubmit}>
                <button type="button" className="emoji-button">
                </button>
                <input
                    type="text"
                    value={inputMessage}
                    onChange={handleInputChange}
                    placeholder={isConnected ? "Type your message to everyone..." : "Connecting..."}
                    disabled={!isConnected}
                    maxLength={500}
                />
                <button type="submit" className="send-button" disabled={!isConnected}>
                    ➤
                </button>
            </form>
        </div>
    );
};

export default GlobalChatInterface;
