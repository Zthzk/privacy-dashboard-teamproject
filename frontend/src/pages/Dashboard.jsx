import { useEffect, useMemo, useState } from "react";
import { getProjects, deleteProject, updateProject } from "../api/projects.js";
import Sidebar from "../components/Sidebar.jsx";
import CreateProjectPanel from "../components/CreateProjectPanel.jsx";
import ProjectPreview from "../components/ProjectPreview.jsx";
import DataSourcesPanel from "../components/DataSourcesPanel.jsx";
import "../styles/dashboard.css";

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [navigationActive, setNavigationActive] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId],
  );

  useEffect(() => {
    let ignore = false;

    async function loadInitialProjects() {
      try {
        const projectList = await getProjects();
        if (!ignore) {
          setProjects(projectList);
          setSelectedProjectId(projectList[0]?.id || null);
          setError("");
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
        if (!ignore) {
          setError("Could not load projects. Please refresh the page.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadInitialProjects();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (!navigationActive || projects.length === 0) return;
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      event.preventDefault();
      const currentIndex = projects.findIndex((project) => project.id === selectedProjectId);
      if (event.key === "ArrowDown") {
        const nextIndex = Math.min(currentIndex + 1, projects.length - 1);
        setSelectedProjectId(projects[nextIndex].id);
      } else {
        const prevIndex = Math.max(currentIndex - 1, 0);
        setSelectedProjectId(projects[prevIndex].id);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [navigationActive, projects, selectedProjectId]);

  useEffect(() => {
    function handleMouseDown(event) {
      setNavigationActive(!!event.target.closest("[data-project-nav]"));
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  function handleProjectCreated(newProject) {
    setProjects((prev) => [newProject, ...prev]);
    setSelectedProjectId(newProject.id);
  }

  async function handleDeleteProject(projectId) {
    try {
      await deleteProject(projectId);
      setProjects((prev) => {
        const remainingProjects = prev.filter((project) => project.id !== projectId);
        if (selectedProjectId === projectId) {
          setSelectedProjectId(remainingProjects[0]?.id || null);
        }
        return remainingProjects;
      });
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
        prev.map((project) => (project.id === projectId ? updatedProject : project)),
      );
      setError("");
    } catch (err) {
      console.error("Failed to update project:", err);
      setError("Could not update project. Please try again.");
    }
  }

  return (
    <div className="dashboard-container">
      <Sidebar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
      />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Privacy Dashboard</h1>
            <p>Manage projects, settings, and your profile from one place.</p>
          </div>
          <div className="dashboard-header-actions">
            <button
              type="button"
              className="header-action-btn"
              onClick={() => alert("View account profile")}
            >
              Profile
            </button>
            <button
              type="button"
              className="header-action-btn"
              onClick={() => alert("Open dashboard settings")}
            >
              Dashboard Settings
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <CreateProjectPanel onProjectCreated={handleProjectCreated} />
          <ProjectPreview
            projects={projects}
            selectedProjectId={selectedProjectId}
            loading={loading}
            onSelectProject={setSelectedProjectId}
            onDeleteProject={handleDeleteProject}
            onUpdateProject={handleUpdateProject}
          />
          <DataSourcesPanel key={selectedProject?.id || "empty"} project={selectedProject} />
        </div>
      </main>

      {error && <div className="global-error">{error}</div>}
    </div>
  );
}

export default Dashboard;
