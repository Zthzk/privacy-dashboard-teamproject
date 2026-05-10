import { useEffect, useRef, useState } from "react";
import "../styles/project-preview.css";

function ProjectCard({ project, selected, onSelect, onDelete, onUpdate }) {
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

  function handleRenameStart(event) {
    event.stopPropagation();
    setIsRenaming(true);
    setMenuOpen(false);
  }

  async function handleRenameSave() {
    if (newName.trim() && newName !== project.name) {
      await onUpdate(project.id, { name: newName.trim() });
    }
    setIsRenaming(false);
  }

  function handleRenameCancel() {
    setNewName(project.name);
    setIsRenaming(false);
  }

  function handleRenameKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleRenameSave();
    } else if (event.key === "Escape") {
      handleRenameCancel();
    }
  }

  async function handleDelete(event) {
    event.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      await onDelete(project.id);
      setMenuOpen(false);
    }
  }

  function handleMenuClick(event) {
    event.stopPropagation();
    setMenuOpen((value) => !value);
  }

  return (
    <button
      type="button"
      className={`project-item ${selected ? "project-item--selected" : ""} ${menuOpen ? "project-item--open" : ""}`}
      onClick={() => onSelect(project.id)}
      ref={cardRef}
    >
      <div className="project-item-top">
        <div className="project-header">
          {isRenaming ? (
            <input
              ref={renameInputRef}
              type="text"
              value={newName}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => setNewName(event.target.value)}
              onBlur={handleRenameSave}
              onKeyDown={handleRenameKeyDown}
              className="rename-input"
            />
          ) : (
            <h3>{project.name}</h3>
          )}
        </div>
        <div className="project-item-actions">
          <span className="selected-badge">{selected ? "Selected" : "Open"}</span>
          <button
            type="button"
            className="project-menu-button"
            onClick={handleMenuClick}
            aria-label="Open project actions"
          >
            ...
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
          Created {new Date(project.created_at).toLocaleDateString()}
        </span>
      </div>
    </button>
  );
}

function ProjectPreview({
  projects,
  selectedProjectId,
  loading,
  onSelectProject,
  onDeleteProject,
  onUpdateProject,
}) {
  if (loading) {
    return (
      <div className="project-preview-panel">
        <div className="panel-header">
          <h2>Project Overview</h2>
        </div>
        <p className="loading">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="project-preview-panel">
      <div className="panel-header">
        <h2>Project Overview</h2>
        <p className="panel-subtitle">
          Select a project to manage its data sources.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <p className="empty-text">No projects created yet.</p>
          <p className="empty-hint">Start by creating your first project.</p>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              selected={project.id === selectedProjectId}
              onSelect={onSelectProject}
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
