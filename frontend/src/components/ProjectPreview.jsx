import { useEffect, useRef, useState } from "react";
import "../styles/project-preview.css";

function ProjectCard({ project, onDelete, onUpdate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(project.name);
  const cardRef = useRef(null);
  const renameInputRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (menuOpen && cardRef.current && !cardRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [menuOpen]);

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  const handleRenameStart = () => {
    setIsRenaming(true);
    setMenuOpen(false);
  };

  const handleRenameSave = async () => {
    if (newName.trim() && newName !== project.name) {
      await onUpdate(project.id, { name: newName.trim() });
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = () => {
    setNewName(project.name);
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRenameSave();
    } else if (e.key === "Escape") {
      handleRenameCancel();
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      await onDelete(project.id);
      setMenuOpen(false);
    }
  };

  return (
    <div className={`project-item ${menuOpen ? "project-item--open" : ""}`} ref={cardRef}>
      <div className="project-item-top">
        <div className="project-header">
          {isRenaming ? (
            <input
              ref={renameInputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRenameSave}
              onKeyDown={handleRenameKeyDown}
              className="rename-input"
            />
          ) : (
            <h3>{project.name}</h3>
          )}
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
              <button type="button" className="project-menu-item" onClick={handleRenameStart}>
                Rename
              </button>
              <button type="button" className="project-menu-item project-menu-item-danger" onClick={handleDelete}>
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

function ProjectPreview({ projects, loading, onDeleteProject, onUpdateProject }) {
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
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={onDeleteProject}
              onUpdate={onUpdateProject}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectPreview;
