import React, { useState, useEffect, useRef, useContext } from 'react';
import ReactDOM from 'react-dom/client';
import './ChatCard.css';
import { Link, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { ThemeContext } from '../context/ThemeContext';

const StyledAlert = ({ message, onConfirm }) => {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: isDarkMode ? 'var(--card-background)' : '#f8f9fa',
      border: `1px solid ${isDarkMode ? 'var(--card-border)' : '#dee2e6'}`,
      borderRadius: '8px',
      boxShadow: `0 4px 6px ${isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'}`,
      padding: '20px',
      zIndex: 1000,
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      color: isDarkMode ? 'var(--text-color)' : '#343a40',
      width: '90%', // Make it responsive
      maxWidth: '400px', // Limit the maximum width
    }}>
      <p style={{ marginBottom: '20px', fontSize: '16px' }}>{message}</p>
      <button
        onClick={onConfirm}
        style={{
          backgroundColor: isDarkMode ? 'var(--button-background)' : '#007bff',
          color: isDarkMode ? 'var(--button-text)' : '#fff',
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
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const [wasFiltered, setWasFiltered] = useState(false);

  const [shouldShowAlert, setShouldShowAlert] = useState(true); //showed alert tracker

  const { isDarkMode } = useContext(ThemeContext);

  // Extract URL parameters including matching code
  const params = new URLSearchParams(location.search);
  const campus = params.get("campus") || "Main Campus";
  const preference = params.get("preference") || "None";
  const matchingCode = params.get("matchingCode") || "";

  // Determine if we should use code matching based on whether a code was provided
  const useCodeMatching = matchingCode.trim() !== "";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Create the WebSocket connection
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000'; // Default to localhost for development

    let wsEndpoint = "";
    // Use the code-based endpoint if a code was provided, otherwise use the regular endpoint
    if (useCodeMatching) {
      wsEndpoint = `/ws/code/${userId}/${encodeURIComponent(campus)}/${encodeURIComponent(preference)}/${encodeURIComponent(matchingCode)}`;
    } else {
      wsEndpoint = `/ws/${userId}/${encodeURIComponent(campus)}/${encodeURIComponent(preference)}`;
    }

    const ws = new WebSocket(`${wsUrl}${wsEndpoint}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // if (useCodeMatching) {
      //   setMessages(prev => [...prev, {
      //     text: `Using matching code: "${matchingCode}". Waiting for someone with the same code...`,
      //     sender: 'system'
      //   }]);
      // }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'system') {
          setMessages(prev => [...prev, { text: data.message, sender: 'system' }]);

          // Check if this is a filtered content notification
          if (data.message.includes('inappropriate content') && data.message.includes('filtered')) {
            setWasFiltered(true);
            // Reset the flag after a short period
            setTimeout(() => setWasFiltered(false), 3000);
          }

          // Update waiting state based on messages
          if (data.message === 'Your chat partner has disconnected.') {
            setIsWaiting(true);
          } else if (
            data.message === 'Connected to a chat partner!' ||
            data.message === 'Connected to your chat partner via matching code!' ||
            data.message.includes('Connected to a chat partner based on preferences')
          ) {
            setIsWaiting(false);
            setShouldShowAlert(false);
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

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [campus, preference, userId, matchingCode, useCodeMatching]);  // Added userId, matchingCode, and useCodeMatching to dependency array

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

      {isWaiting && preference !== 'None' && (
        <div style={{
          backgroundColor: isDarkMode ? 'var(--card-background)' : '#f8f9fa',
          borderLeft: `4px solid ${isDarkMode ? 'var(--user-message-bg)' : '#4285f4'}`,
          padding: '10px 15px',
          margin: '0px 0',
          marginBottom: '5px',
          borderRadius: '4px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '15px',
          color: isDarkMode ? 'var(--text-color)' : 'inherit'
        }}>
          <div>
            <i className="fas fa-info-circle" style={{ marginRight: '8px', color: '#0000' }}></i>
            Can't find a match? Try setting your preference to "None" for faster matching.
          </div>
          <button
            onClick={() => {
              const newParams = new URLSearchParams(location.search);
              newParams.set("preference", "None");
              window.location.search = newParams.toString();
            }}
            style={{
              backgroundColor: isDarkMode ? 'var(--user-message-bg)' : '#4285f4',
              color: isDarkMode ? 'var(--user-message-color)' : 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '5px 10px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Change Now
          </button>
        </div>
      )}

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
