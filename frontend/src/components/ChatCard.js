import React, { useState } from 'react';
import './ChatCard.css';
import { Link } from 'react-router-dom';
import App from '../App';
function ChatCard() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { text: 'Hello, what is this app for?', sender: 'user' },
    { text: 'Is this really anonymous?', sender: 'user' },
    { text: 'Hi, this app is built to bring the Ateneo Community closer than ever before, whether you are looking for a friend, to meet someone, or to just find someone to chat with.', sender: 'other' },
    { text: 'And yes, this is completely anonymous, no user inputted data will be saved, meaning all chats will be visible only to you and your reciepient. Sadly, due to this we are not able to save chat history.', sender: 'other' },
    { text: 'Make every chat count!', sender: 'other' },
    { text: 'Alright love it!', sender: 'user' },

  ]);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      setMessages([...messages, { text: message, sender: 'user' }]);
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
      </div>

      <form className="chat-input" onSubmit={handleSubmit}>
        <button type="button" className="emoji-button">
          <span role="img" aria-label="emoji">😊</span>
        </button>
        <input
          type="text"
          value={message}
          onChange={handleInputChange}
          placeholder="Type here..."
        />
        <button type="submit" className="send-button">
          ➤
        </button>
      </form>
    </div>
  );
}

export default ChatCard;