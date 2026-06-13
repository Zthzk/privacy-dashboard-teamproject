import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import './Login.css'

// Backend authentication API base URL
const API_BASE_URL = 'http://127.0.0.1:8000'

function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [uid, setUid] = useState('')
    const [token, setToken] = useState('')

    // Requests a password reset token for the provided email
    const handlePasswordReset = async (event) => {
        event.preventDefault()

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

            // Store generated UID and token for password reset
            setUid(response.data.uid || '')
            setToken(response.data.token || '')

            // Inform user that reset credentials were generated
            setMessage(
                'Reset token created successfully. Use the UID and token below to reset your password.',
            )
        } catch (error) {
            const data = error.response?.data

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
                        onChange={(event) => setEmail(event.target.value)}
                    />

                    <button type="submit">Create Reset Token</button>

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