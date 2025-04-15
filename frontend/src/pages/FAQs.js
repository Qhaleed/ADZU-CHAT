import React from 'react';
import { Link } from 'react-router-dom';
import './FAQs.css';

const FAQs = () => {
    return (
        <div className="faqs-container">
            <h1>Frequently Asked Questions</h1>
            <div className="faq-item">
                <h2>What is ADZU CHAT?</h2>
                <p>ADZU CHAT is an open-source local anonymous chat platform designed for students of the Ateneo de Zamboanga University.</p>
            </div>
            <div className="faq-item">
                <h2>Who can use ADZU CHAT?</h2>
                <p>Currently, it is intended for students of the Ateneo de Zamboanga University.</p>
            </div>
            <div className="faq-item">
                <h2>Is my data secure?</h2>
                <p>Yes, your data is secure because we do not collect any data. ADZU CHAT is completely anonymous, and the connection is peer-to-peer, ensuring that your conversations remain private and secure.</p>
            </div>
            <div className="faq-item">
                <h2>How can I report an issue?</h2>
                <p>You can report issues or provide feedback by visiting our <a href="https://github.com/" target="_blank" rel="noopener noreferrer">GitHub repository</a>.</p>
            </div>
            <div className="faq-item">
                <h2>How can I contribute?</h2>
                <p>You can contribute to ADZU CHAT by visiting our <a href="https://github.com/" target="_blank" rel="noopener noreferrer">GitHub repository</a>. Feel free to report issues, suggest features, or submit pull requests to improve the platform.</p>
            </div>
            <Link to="/" className="back-to-landing-button">Back to Landing Page</Link>
        </div>
    );
};

export default FAQs;