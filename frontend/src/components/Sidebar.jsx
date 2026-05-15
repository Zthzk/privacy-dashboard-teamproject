import { useState } from "react";
import "../styles/sidebar.css";

function Sidebar({ projects, selectedProjectId, onSelectProject }) {
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">Privacy Dashboard</h1>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <button
            type="button"
            className="nav-item nav-main"
            onClick={() => setProjectsExpanded(!projectsExpanded)}
          >
            <span className="nav-label">Projects</span>
            <span className={`expand-icon ${projectsExpanded ? "open" : ""}`}>
              v
            </span>
          </button>

          {projectsExpanded && (
            <div className="nav-submenu">
              {projects.length === 0 ? (
                <p className="submenu-empty">No projects yet</p>
              ) : (
                projects.slice(0, 8).map((project) => (
                  <button
                    type="button"
                    data-project-nav
                    key={project.id}
                    className={`nav-subitem ${project.id === selectedProjectId ? "nav-subitem--active" : ""}`}
                    onClick={() => onSelectProject(project.id)}
                  >
                    <span className="subitem-label">{project.name}</span>
                  </button>
                ))
              )}
              {projects.length > 8 && (
                <p className="submenu-more">+{projects.length - 8} more...</p>
              )}
            </div>
          )}
        </div>
      </nav>

      <div className="sidebar-footer">
        <p className="footer-text">Privacy Dashboard v1.0</p>
      </div>
    </aside>
  );
}

export default Sidebar;
