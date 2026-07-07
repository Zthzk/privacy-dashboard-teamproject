import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

import './Login.css'

// Backend authentication API base URL
const API_BASE_URL = 'http://127.0.0.1:8000'

function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    // Handles user authentication and stores JWT tokens
    const handleLogin = async (event) => {
        event.preventDefault()
        setError('')

        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/login/`, {
                username,
                password,
            })

            const { access, refresh } = response.data

            // Save tokens for authenticated requests
            localStorage.setItem('accessToken', access)
            localStorage.setItem('refreshToken', refresh)

            // Load the authenticated user so the dashboard header can show the real account name.
        try {
            const userResponse = await axios.get(`${API_BASE_URL}/api/auth/me/`, {
                headers: {
                Authorization: `Bearer ${access}`,
            },
        })

            localStorage.setItem('currentUser', JSON.stringify(userResponse.data))
        } catch {
        // Fallback to the submitted username if the profile endpoint is unavailable.
            localStorage.setItem('currentUser', JSON.stringify({ username }))
        }

            // Redirect authenticated user to dashboard
            navigate('/dashboard')
        } catch {
            // Display error message for invalid credentials
            setError('Invalid username or password. Please try again.')
        }
    }

    return (
        <main className="login-page">
            <section className="login-card">
                <div className="login-header">
                    <h1>Privacy Dashboard</h1>
                    <p>Sign in to access your project data</p>
                </div>

                <form className="login-form" onSubmit={handleLogin}>
                    <label htmlFor="username">Username</label>
                    <input
                        id="username"
                        type="text"
                        required
                        placeholder="Enter username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'ArrowDown' || event.key === 'Enter') {
                                event.preventDefault()
                                document.getElementById('password')?.focus()
                            }
                        }}
                    />

                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        required
                        placeholder="Enter password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'ArrowUp') {
                                event.preventDefault()
                                document.getElementById('username')?.focus()
                            }
                        }}
                    />

                <button type="submit">Sign in</button>

                {error && <div className="error-message">{error}</div>}

                <div className="auth-links">
                    <p>
                        Don't have an account? <a href="/register">Register</a>
                    </p>

                    <p>
                            <a href="/forgot-password">Forgot Password?</a>
                        </p>
                    </div>
                </form>
            </section>
        </main>
    )
}

export default Login