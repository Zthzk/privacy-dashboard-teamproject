import { useEffect, useRef, useState } from "react";
import "../styles/project-preview.css";

function ProjectCard({ project }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (menuOpen && cardRef.current && !cardRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [menuOpen]);

  return (
    <div className={`project-item ${menuOpen ? "project-item--open" : ""}`} ref={cardRef}>
      <div className="project-item-top">
        <div className="project-header">
          <h3>{project.name}</h3>
        </div>
        <div className="project-item-actions">
          <button
            type="button"
            className="project-menu-button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Open project actions"
          >
            ⋮
          </button>
          {menuOpen && (
            <div className="project-menu">
              <button type="button" className="project-menu-item">
                Edit
              </button>
              <button type="button" className="project-menu-item">
                Rename
              </button>
              <button type="button" className="project-menu-item project-menu-item-danger">
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="project-description">
        {project.description || "No description provided."}
      </p>
      <div className="project-meta">
        <span className="date">
          📅 {new Date(project.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

function ProjectPreview({ projects, loading }) {
  if (loading) {
    return (
      <div className="project-preview-panel">
        <div className="panel-header">
          <h2>📋 Project Overview</h2>
        </div>
        <p className="loading">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="project-preview-panel">
      <div className="panel-header">
        <h2>📋 Project Overview</h2>
        <p className="panel-subtitle">
          {projects.length} project{projects.length !== 1 ? "s" : ""} created
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">📭</p>
          <p className="empty-text">No projects created yet.</p>
          <p className="empty-hint">Start by creating your first project above.</p>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectPreview;
