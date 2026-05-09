import { useState, useEffect } from "react";
import { getProjects } from "../api/projects.js";
import Sidebar from "../components/Sidebar.jsx";
import CreateProjectPanel from "../components/CreateProjectPanel.jsx";
import ProjectPreview from "../components/ProjectPreview.jsx";
import "../styles/dashboard.css";

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    try {
      const projectList = await getProjects();
      setProjects(projectList);
      setError("");
    } catch (err) {
      console.error("Failed to load projects:", err);
      setError("Could not load projects. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }

  function handleProjectCreated(newProject) {
    setProjects((prev) => [newProject, ...prev]);
  }

  return (
    <div className="dashboard-container">
      <Sidebar projects={projects} />

      <main className="dashboard-main">
        <div className="dashboard-content">
          <CreateProjectPanel onProjectCreated={handleProjectCreated} />
          <ProjectPreview projects={projects} loading={loading} />
        </div>
      </main>

      {error && <div className="global-error">{error}</div>}
    </div>
  );
}

export default Dashboard;
