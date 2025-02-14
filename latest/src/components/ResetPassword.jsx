import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./ResetPassword.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const token = searchParams.get("token");

    const handleResetPassword = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`${BACKEND_URL}/password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(data.message);
            } else {
                setMessage(data.message || "Failed to reset password.");
            }
        } catch (error) {
            console.error("Error:", error.message);
            setMessage("Something went wrong. Please try again.");
        }
    };

    const togglePasswordVisibility = () => setShowPassword(!showPassword);

    return (
        <div className="reset-password-container">
            <h2>Reset Password</h2>
            <form onSubmit={handleResetPassword}>
                <div className="password-container">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <span className="eye-icon" onClick={togglePasswordVisibility}>
                        {showPassword ? "👁️" : "👁️‍🗨️"}
                    </span>
                </div>
                <button type="submit">Reset Password</button>
            </form>
            <br/>
            {message && <p>{message}</p>}
        </div>
    );
};

export default ResetPassword;
