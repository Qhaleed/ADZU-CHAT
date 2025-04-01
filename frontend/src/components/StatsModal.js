import { useState, useEffect } from "react";
import "./StatsModal.css";
const StatsModal = () => {
    const [stats, setStats] = useState({
        total_online: 0,
        total_waiting: 0,
        total_active_chats: 0
    });

    // Function to fetch stats
    const fetchStats = async () => {
        try {
            const response = await fetch("http://localhost:8000/stats");
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch chat stats", error);
        }
    };

    // Fetch stats every 5 seconds
    useEffect(() => {
        fetchStats(); // Fetch initially
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval); // Cleanup interval
    }, []);

    return (
        <div className="stats-modal">
            <p>Active Users: <span>{stats.total_online}</span></p>
            <p>Waiting Queue: <span>{stats.total_waiting}</span></p>
            <p>Active Chats: <span>{stats.total_active_chats}</span></p>
        </div>
    );
};

export default StatsModal;
