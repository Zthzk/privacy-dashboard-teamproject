import "../styles/project-preview.css";

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
            <div key={project.id} className="project-item">
              <div className="project-header">
                <h3>{project.name}</h3>
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
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectPreview;
