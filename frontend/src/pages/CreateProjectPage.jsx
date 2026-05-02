import { useEffect, useState } from "react";
import { createProject, getProjects } from "../api/projects.js";

function CreateProjectPage() {
  // Form input states for the create project form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Stores the list of projects shown in the preview section
  const [projects, setProjects] = useState([]);

  // UI feedback states
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [nameError, setNameError] = useState("");

  // Load existing projects when the page is opened
  useEffect(() => {
    async function loadProjects() {
      try {
        const projectList = await getProjects();
        setProjects(projectList);
      } catch (error) {
        console.error("Loading projects failed:", error);
        setErrorMessage("Could not load projects.");
      }
    }

    loadProjects();
  }, []);

  // Handles form submission and creates a new project
  async function handleSubmit(event) {
    event.preventDefault();

    console.log("Submitting project:", { name, description });

    setSuccessMessage("");
    setErrorMessage("");
    setNameError("");

    // Frontend validation before calling the API
    if (!name.trim()) {
      setNameError("Please enter a project name.");
      return;
    }

    setLoading(true);

    try {
      const createdProject = await createProject({
        name: name.trim(),
        description: description,
      });

      setSuccessMessage(
        `Project "${createdProject.name}" was created successfully.`
      );

      // Add the newly created project to the preview list
      setProjects((previousProjects) => [createdProject, ...previousProjects]);

      setName("");
      setDescription("");
    } catch (error) {
      console.error("Create project failed:", error);

      // Show errors 
      if (error.name) {
        setNameError(error.name[0]);
      } else if (error.error) {
        setErrorMessage(error.error);
      } else {
        setErrorMessage("Something went wrong while creating the project.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <div className="card">
        <h1>Create New Project</h1>
        <p className="subtitle">
          Create a new privacy dashboard project with a name and description.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="project-name">Project Name</label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setNameError("");
              }}
              placeholder="Enter project name"
              className={nameError ? "input-error" : ""}
            />

            {nameError && <p className="field-error">{nameError}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="project-description">Description</label>
            <textarea
              id="project-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Enter project description"
              rows="4"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Project"}
          </button>
        </form>

        {successMessage && <p className="success">{successMessage}</p>}
        {errorMessage && <p className="error">{errorMessage}</p>}

        {/* Preview section for already created projects */}
        <div className="project-preview-section">
          <h2>Created Projects</h2>

          {projects.length === 0 ? (
            <p className="empty-state">No projects created yet.</p>
          ) : (
            <div className="project-list">
              {projects.map((project) => (
                <div key={project.id} className="project-card">
                  <h3>{project.name}</h3>
                  <p>{project.description || "No description provided."}</p>
                  <small>Created at: {project.created_at}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateProjectPage;