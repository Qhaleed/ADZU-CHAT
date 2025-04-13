import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import './ChatCard.css';
import { Link, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const StyledAlert = ({ message, onConfirm }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      padding: '20px',
      zIndex: 1000,
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      color: '#343a40',
      width: '90%', // Make it responsive
      maxWidth: '400px', // Limit the maximum width
    }}>
      <p style={{ marginBottom: '20px', fontSize: '16px' }}>{message}</p>
      <button
        onClick={onConfirm}
        style={{
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          padding: '10px 20px',
          cursor: 'pointer',
          fontSize: '14px',
          width: '100%', // Make button responsive
          maxWidth: '200px', // Limit button width
        }}
      >
        Confirm
      </button>
    </div>
  );
};

function ChatCard() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isWaiting, setIsWaiting] = useState(true);
  const [noMatchTimeout, setNoMatchTimeout] = useState(null);
  const wsRef = useRef(null);
  const userId = useRef(uuidv4());
  const messagesEndRef = useRef(null);
  const location = useLocation();

  // Extract campus and preference from URL parameters
  const params = new URLSearchParams(location.search);
  const campus = params.get("campus") || "Main Campus";
  const preference = params.get("preference") || "BSN";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Create the WebSocket connection using campus and preference in the path
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000'; // Default to localhost for local development
    const ws = new WebSocket(`${wsUrl}/ws/${userId.current}/${encodeURIComponent(campus)}/${encodeURIComponent(preference)}`);

    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'system') {
          setMessages(prev => [...prev, { text: data.message, sender: 'system' }]);
          if (data.message === 'Your chat partner has disconnected.') {
            setIsWaiting(true);
          } else if (data.message === 'Connected to a chat partner!') {
            setIsWaiting(false);
            clearTimeout(noMatchTimeout); // Clear timeout if matched
          }
        } else if (data.type === 'message') {
          setMessages(prev => [...prev, { text: data.message, sender: 'user' }]);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsWaiting(true);
      setMessages(prev => [...prev, { text: 'Disconnected from server', sender: 'system' }]);
    };

    // Set a timeout to prompt the user to change preference after 15 seconds
    const timeout = setTimeout(() => {
      if (isWaiting && preference !== 'None') {
        const userConfirmed = new Promise((resolve) => {
          const alertContainer = document.createElement('div');
          document.body.appendChild(alertContainer);

          const handleConfirm = () => {
            resolve(true);
            document.body.removeChild(alertContainer);
          };

          const root = ReactDOM.createRoot(alertContainer);
          root.render(
            <StyledAlert
              message="No match found. Would you like to change your preference to 'None' to make pairing faster?"
              onConfirm={handleConfirm}
            />
          );
        });

        userConfirmed.then((confirmed) => {
          if (confirmed) {
            const params = new URLSearchParams(location.search);
            params.set("preference", "None");
            window.location.search = params.toString();
          }
        });
      }
    }, 15000);

    setNoMatchTimeout(timeout);

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      clearTimeout(timeout); // Cleanup timeout on unmount
    };
  }, [campus, preference]);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !isWaiting) {
      wsRef.current.send(JSON.stringify({ type: 'message', message }));
      setMessages(prev => [...prev, { text: message, sender: 'other' }]);
      setMessage('');
    }
  };

  const handleDisconnect = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
  };

  return (
    <div className="chat-card">
      <div className="chat-header">
        <div className="chat-header-left">
          <h1>ADZU CHAT</h1>
          <div className="chat-tags">
            <span className="tag">{campus}</span>
            <span className="tag">{preference}</span>
            <span className="tag">Beta</span>
            <span className={`tag ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? (isWaiting ? 'Waiting...' : 'Connected') : 'Disconnected'}
            </span>
          </div>
        </div>
        <Link to="/">
          <button className="chat-back" onClick={handleDisconnect}>
            <i className="fas fa-arrow-left"></i>
          </button>
        </Link>
      </div>

      <div className="chat-body">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <div className="message-bubble">{msg.text}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input" onSubmit={handleSubmit}>
        <button type="button" className="emoji-button">
        </button>
        <input
          type="text"
          value={message}
          onChange={handleInputChange}
          placeholder={isWaiting ? "Waiting for a partner..." : "Type here..."}
          disabled={isWaiting}
        />
        <button type="submit" className="send-button" disabled={isWaiting}>
          ➤
        </button>
      </form>
    </div>
  );
}

export default ChatCard;
