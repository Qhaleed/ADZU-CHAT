import React, { useState, useEffect, useRef } from 'react';
import './ChatCard.css';
import { Link, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
function ChatCard() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isWaiting, setIsWaiting] = useState(true);
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
      // setMessages(prev => [
      //   ...prev,
      //   { text: 'Connected to server. Waiting for a partner...', sender: 'system' }
      // ]);
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
          <span role="img" aria-label="emoji">😊</span>
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
