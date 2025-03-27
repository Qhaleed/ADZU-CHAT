import React from "react";
import { Link } from "react-router-dom";
import "./NotFound.css"; // Custom styling

function NotFound() {
    return (
        <div className="not-found">
            <h1>404</h1>
            <p>Oops! The page you're looking for doesn't exist.</p>
            <Link to="/">
                <button className="home-button">Go Back Home</button>
            </Link>
        </div>
    );
}

export default NotFound;
