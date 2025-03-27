import React, { useState, useEffect, useRef } from 'react';
import './ChatCard.css';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

function ChatCard() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isWaiting, setIsWaiting] = useState(true);
  const wsRef = useRef(null);
  const userId = useRef(uuidv4());
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket(`ws://localhost:8000/ws/${userId.current}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setMessages(prev => [...prev, { text: 'Connected to server. Waiting for a partner...', sender: 'system' }]);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'system' && data.message === 'Connected to a chat partner!') {
        setIsWaiting(false);
        setMessages(prev => [...prev, { text: 'Connected to a chat partner!', sender: 'system' }]);
      } else if (data.type === 'message') {
        setMessages(prev => [...prev, { text: data.message, sender: 'user' }]);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsWaiting(true);
      setMessages(prev => [...prev, { text: 'Disconnected from server', sender: 'system' }]);
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && wsRef.current && !isWaiting) {
      wsRef.current.send(message);
      setMessages(prev => [...prev, { text: message, sender: 'other' }]);
      setMessage('');
    }
  };

  return (
    <div className="chat-card">
      <div className="chat-header">
        <div className="chat-header-left">
          <h1>ADZU CHAT</h1>
          <div className="chat-tags">
            <span className="tag">Main Campus</span>
            <span className="tag">BSN</span>
            <span className="tag">Beta</span>
            <span className={`tag ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? (isWaiting ? 'Waiting...' : 'Connected') : 'Disconnected'}
            </span>
          </div>
        </div>
        <Link to="/">
          <button className="chat-back">
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