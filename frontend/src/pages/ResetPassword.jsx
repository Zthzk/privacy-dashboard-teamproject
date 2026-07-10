import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import './Login.css'

// Backend authentication API base URL
const API_BASE_URL = 'http://127.0.0.1:8000'

function ResetPassword() {
    // Password reset credentials provided by the backend
    const [uid, setUid] = useState('')
    const [token, setToken] = useState('')

    // Stores the new password entered by the user
    const [newPassword, setNewPassword] = useState('')

    // User feedback states for successful and failed requests
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    // Submits UID, token and new password to reset the account password
    const handleResetPassword = async (event) => {
        event.preventDefault()

        // Clear previous feedback before submitting a new request
        setMessage('')
        setError('')

        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/auth/password-reset-confirm/`,
                {
                    uid,
                    token,
                    new_password: newPassword,
                },
            )
            // Display the success message returned by the backend.
            // A fallback message is used if the response does not include a custom message.
            setMessage(response.data.message || 'Password has been reset successfully.')
        } catch (error) {
            // Handle backend validation errors
            const data = error.response?.data

            // Display the first available field-specific validation error.
            // These errors may occur when the UID, token, or password  does not meet the backend validation requirements.
            if (data?.uid) {
                setError(`UID: ${data.uid[0]}`)
            } else if (data?.token) {
                setError(`Token: ${data.token[0]}`)
            } else if (data?.new_password) {
                setError(`Password: ${data.new_password[0]}`)
            } else {
                // Display a generic message when no detailed backend validation error is available.
                setError('Password reset failed. Please check your details.')
            }
        }
    }

    return (
        <main className="login-page">
            <section className="login-card">
                <div className="login-header">
                    <h1>Reset Password</h1>
                    <p>Enter your reset UID, token, and new password</p>
                </div>

                <form className="login-form" onSubmit={handleResetPassword}>
                    <label htmlFor="uid">UID</label>
                    <input
                        id="uid"
                        type="text"
                        required
                        placeholder="Enter UID"
                        value={uid}
                        onChange={(event) => setUid(event.target.value)}
                    />

                    <label htmlFor="token">Token</label>
                    <input
                        id="token"
                        type="text"
                        required
                        placeholder="Enter reset token"
                        value={token}
                        onChange={(event) => setToken(event.target.value)}
                    />

                    <label htmlFor="newPassword">New Password</label>
                    <input
                        id="newPassword"
                        type="password"
                        required
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                    />

                    <button type="submit">Reset password</button>

                    {message && <div className="success-message">{message}</div>}
                    {error && <div className="error-message">{error}</div>}

                    <div className="auth-links">
                        <p>
                            Remember your password? <Link to="/login">Sign in</Link>
                        </p>
                    </div>
                </form>
            </section>
        </main>
    )
}

export default ResetPassword