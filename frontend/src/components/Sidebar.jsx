import { useState } from "react";
import "../styles/sidebar.css";

function Sidebar({ projects }) {
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">Privacy Dashboard</h1>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <button
            className="nav-item nav-main"
            onClick={() => setProjectsExpanded(!projectsExpanded)}
          >
            <span className="nav-icon">📁</span>
            <span className="nav-label">Projects</span>
            <span className={`expand-icon ${projectsExpanded ? "open" : ""}`}>
              ▼
            </span>
          </button>

          {projectsExpanded && (
            <div className="nav-submenu">
              {projects.length === 0 ? (
                <p className="submenu-empty">No projects yet</p>
              ) : (
                projects.map((project) => (
                  <div key={project.id} className="nav-subitem">
                    <span className="subitem-icon">📊</span>
                    <span className="subitem-label">{project.name}</span>
                  </div>
                ))
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
