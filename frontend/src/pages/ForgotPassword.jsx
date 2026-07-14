import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import './Login.css'

// Backend authentication API base URL
// All password reset requests are sent to this server.
const API_BASE_URL = 'http://127.0.0.1:8000'

function ForgotPassword() {
    // Form input state
    const [email, setEmail] = useState('')

    // User feedback messages
        const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    // Password reset credentials returned by the backend.
    // These are displayed only for development/testing purposes.
    const [uid, setUid] = useState('')
    const [token, setToken] = useState('')

    // Handles the password reset request.
    // Sends the entered email to the backend and retrieves a reset UID and token if the request is successful.
    const handlePasswordReset = async (event) => {
        event.preventDefault()

        // Clear previous results before sending a new request
        setMessage('')
        setError('')
        setUid('')
        setToken('')

        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/auth/password-reset/`,
                {
                    email,
                },
            )

            // Save the generated credentials returned by the backend.
            // These values are required on the Reset Password page.
            setUid(response.data.uid || '')
            setToken(response.data.token || '')

            // Inform user that reset credentials were generated
            setMessage(
                'Reset token created successfully. Use the UID and token below to reset your password.',
            )
        } catch (error) {
            const data = error.response?.data

            // Display backend validation errors for the email field
            if (data?.email) {
                setError(`Email: ${data.email[0]}`)
            } else {
                // Display reset request errors
                setError('Password reset request failed.')
            }
        }
    }

    return (
        <main className="login-page">
            <section className="login-card">
                <div className="login-header">
                    <h1>Forgot Password</h1>
                    <p>Enter your email to generate a password reset token</p>
                </div>

                <form className="login-form" onSubmit={handlePasswordReset}>
                    <label htmlFor="email">Email</label>

                    <input
                        id="email"
                        type="email"
                        required
                        placeholder="Enter your account email"
                        value={email}
                        // Keep the email state synchronized with the input field
                        onChange={(event) => setEmail(event.target.value)}
                    />

                    <button type="submit">Create Reset Token</button>

                    {/* Display a success message after the reset request completes */}
                    {message && (
                        <div className="success-message">
                            {message}
                        </div>
                    )}

                    {uid && token && (
                        <div className="success-message">
                            <p>
                                <strong>UID:</strong> {uid}
                            </p>

                            <p>
                                <strong>Token:</strong> {token}
                            </p>

                            <div className="auth-links">
                                <p>
                                    <Link to="/reset-password">
                                        Go to Reset Password
                                    </Link>
                                </p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    {/* Navigation back to the login page */}
                    <div className="auth-links">
                        <p>
                            Remember your password?{' '}
                            <Link to="/login">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </form>
            </section>
        </main>
    )
}

export default ForgotPassword