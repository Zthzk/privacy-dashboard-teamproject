import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import './Login.css'
// Backend authentication API base URL
const API_BASE_URL = 'http://127.0.0.1:8000'

function Register() {
    // Handles user registration
    const navigate = useNavigate()

    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleRegister = async (event) => {
        event.preventDefault()
        setError('')

        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/register/`, {
                username,
                email,
                password,
            })

            // Store JWT tokens after successful registration
            localStorage.setItem('accessToken', response.data.access)
            localStorage.setItem('refreshToken', response.data.refresh)
            // Store the registered user so the dashboard header can display the correct account name.
            localStorage.setItem('currentUser', JSON.stringify(response.data.user))

            // Redirect newly registered user to dashboard
            navigate('/dashboard')
        } catch (error) {
            const data = error.response?.data

            if (data?.password) {
                setError(`Password: ${data.password[0]}`)
            } else if (data?.username) {
                setError(`Username: ${data.username[0]}`)
            } else if (data?.email) {
                setError(`Email: ${data.email[0]}`)
            } else {
                // Show validation or registration errors
                setError('Registration failed.')
            }

        }
    }

    return (
        <main className="login-page">
            <section className="login-card">
                <div className="login-header">
                    <h1>Create Account</h1>
                    <p>Register to access the Privacy Dashboard</p>
                </div>

                <form className="login-form" onSubmit={handleRegister}>
                    <label htmlFor="username">Username</label>
                    <input
                        id="username"
                        type="text"
                        required
                        placeholder="Choose a username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                    />

                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        required
                        placeholder="Enter your email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />

                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        required
                        placeholder="Create a password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />

                    <button type="submit">Create account</button>

                    {error && <div className="error-message">{error}</div>}
                </form>

                <p className="auth-link">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </section>
        </main>
    )
}

export default Register