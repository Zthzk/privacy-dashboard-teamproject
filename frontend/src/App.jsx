import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_BASE_URL = "http://127.0.0.1:8000";

function App() {
    const [healthMessage, setHealthMessage] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [projects, setProjects] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        axios
            .get(`${API_BASE_URL}/api/health/`)
            .then((response) => {
                setHealthMessage(response.data.message);
            })
            .catch(() => {
                setHealthMessage("Could not connect to backend");
            });

        const savedToken = localStorage.getItem("accessToken");

        if (savedToken) {
            fetchCurrentUser(savedToken);
            fetchProjects(savedToken);
        }
    }, []);

    const fetchCurrentUser = async (token) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/auth/me/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setCurrentUser(response.data);
        } catch {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            setCurrentUser(null);
        }
    };

    const fetchProjects = async (token) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/projects/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setProjects(response.data);
        } catch {
            setProjects(null);
        }
    };

    const handleLogin = async (event) => {
        event.preventDefault();
        setError("");

        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/login/`, {
                username,
                password,
            });

            const { access, refresh } = response.data;

            localStorage.setItem("accessToken", access);
            localStorage.setItem("refreshToken", refresh);

            await fetchCurrentUser(access);
            await fetchProjects(access);
        } catch {
            setError("Invalid username or password. Please try again.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setCurrentUser(null);
        setProjects(null);
        setUsername("");
        setPassword("");
    };

    if (!currentUser) {
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

                                // If Arrowdown or enter is clicked
                                if (event.key === "ArrowDown" || event.key === "Enter") {

                                    // prevents normal behaviour
                                    event.preventDefault();

                                    // focus on password input
                                    document.getElementById("password").focus();
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

                                // ArrowUp → username'e dön
                                if (event.key === "ArrowUp") {
                                    event.preventDefault();
                                    document.getElementById("username").focus();
                                }

                                // Enter → login ol
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    handleLogin(event);
                                }
                            }}
                        />
                        <button type="submit">Sign in</button>
                        {error && <div className="error-message">{error}</div>}
                    </form>

                    </section>
            </main>
        );
    }

    return (
        <main className="dashboard-page">
            <section className="dashboard-card">
                <h1>Privacy Dashboard</h1>
                <p>Welcome, {currentUser.username}</p>

                <button onClick={handleLogout}>Logout</button>

                <div className="project-message">
                    Project data is only visible for authenticated users.
                </div>
            </section>
        </main>
    );
}

export default App;