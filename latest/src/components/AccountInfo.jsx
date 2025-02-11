import React, { useEffect, useState } from "react";
import "./AccountInfo.css";

function AccountInfo({ userName, email }) {
    const [user, setUser] = useState({
        username: userName || "",
        email: email || "",
    });

    useEffect(() => {
        const updateUser = () => {
            setUser({
                username: localStorage.getItem("userName") || "",
                email: localStorage.getItem("email") || "",
            });
        };

        updateUser(); // Initial fetch

        window.addEventListener("storage", updateUser); // Listen for storage changes

        return () => {
            window.removeEventListener("storage", updateUser); // Cleanup
        };
    }, []);

    return (
        <div className="account-info">
            <div className="container">
                <div className="account-card">
                    <div className="account-header">Your Account Details</div>
                    <div className="account-info-item">
                        <strong>Username:</strong> {user.username || "Guest"}
                    </div>
                    <div className="account-info-item">
                        <strong>Email:</strong> {user.email || "Guest Email"}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AccountInfo;
