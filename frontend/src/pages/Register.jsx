import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import './Login.css'
// Backend authentication API base URL
const API_BASE_URL = 'http://127.0.0.1:8000'

function Register() {
    // Provides programmatic navigation after successful registration
    const navigate = useNavigate()

    // Registration form state
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    // Stores validation or registration error messages
    const [error, setError] = useState('')

    // Handles account creation.
    // Sends the registration form data to the backend and if successful, stores the authentication data and redirects
    // the newly registered user to the dashboard.
    const handleRegister = async (event) => {
        event.preventDefault()

        // Clear any previous error before sending a new request
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

            // Display the first available field-specific validation error.
            // The order determines which error is shown when the backend returns validation errors for multiple fields.
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
                        // Keep the username state synchronized with the value entered in the input.
                        onChange={(event) => setEmail(event.target.value)}
                    />

                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        required
                        placeholder="Create a password"
                        value={password}
                        // Keep the email state synchronized with the value entered in the input.
                        onChange={(event) => setPassword(event.target.value)}
                    />

                    <button type="submit">Create account</button>

                    {error && <div className="error-message">{error}</div>}
                </form>

                {/* Navigation link for users who already have an account */}
                <p className="auth-link">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </section>
        </main>
    )
}

export default Register