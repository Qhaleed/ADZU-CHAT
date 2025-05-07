import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import './DarkModeToggle.css';

const DarkModeToggle = () => {
    const { isDarkMode, toggleDarkMode } = useContext(ThemeContext);

    return (
        <div className="dark-mode-toggle">
            <button
                onClick={toggleDarkMode}
                aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                className={`theme-toggle-button ${isDarkMode ? 'dark' : 'light'}`}
            >
                {isDarkMode ? (
                    <i className="fas fa-sun"></i>
                ) : (
                    <i className="fas fa-moon"></i>
                )}
            </button>
        </div>
    );
};

export default DarkModeToggle;