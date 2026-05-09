import { useState, useEffect } from "react";
import { getProjects, deleteProject, updateProject } from "../api/projects.js";
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

  async function handleDeleteProject(projectId) {
    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setError("");
    } catch (err) {
      console.error("Failed to delete project:", err);
      setError("Could not delete project. Please try again.");
    }
  }

  async function handleUpdateProject(projectId, updateData) {
    try {
      const updatedProject = await updateProject(projectId, updateData);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? updatedProject : p))
      );
      setError("");
    } catch (err) {
      console.error("Failed to update project:", err);
      setError("Could not update project. Please try again.");
    }
  }

  return (
    <div className="dashboard-container">
      <Sidebar projects={projects} />

      <main className="dashboard-main">
        <div className="dashboard-content">
          <CreateProjectPanel onProjectCreated={handleProjectCreated} />
          <ProjectPreview
            projects={projects}
            loading={loading}
            onDeleteProject={handleDeleteProject}
            onUpdateProject={handleUpdateProject}
          />
        </div>
      </main>

      {error && <div className="global-error">{error}</div>}
    </div>
  );
}

export default Dashboard;
