import { useRef, useState } from "react";
import { createProject } from "../api/projects.js";
import "../styles/create-project-panel.css";

function CreateProjectPanel({ onProjectCreated }) {
  const descriptionRef = useRef(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [nameError, setNameError] = useState("");

  async function handleSubmit(event) {
    if (event) {
      event.preventDefault();
    }

    setSuccessMessage("");
    setErrorMessage("");
    setNameError("");

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

      setName("");
      setDescription("");

      if (onProjectCreated) {
        onProjectCreated(createdProject);
      }

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Create project failed:", error);

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

  const handleNameKeyDown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      handleSubmit(event);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (descriptionRef.current) {
        descriptionRef.current.focus();
      }
    }
  };

  const handleDescriptionKeyDown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  return (
    <div className="create-project-panel">
      <div className="panel-header">
        <h2>✨ Create New Project</h2>
        <p className="panel-subtitle">
          Start a new privacy dashboard project
        </p>
      </div>

      <form onSubmit={handleSubmit} className="create-form">
        <div className="form-group">
          <label htmlFor="project-name">Project Name *</label>
          <input
            id="project-name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setNameError("");
            }}
            onKeyDown={handleNameKeyDown}
            placeholder="e.g., GDPR Compliance Dashboard"
            className={nameError ? "input-error" : ""}
          />
          {nameError && <p className="field-error">{nameError}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="project-description">Description</label>
          <textarea
            id="project-description"
            ref={descriptionRef}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            onKeyDown={handleDescriptionKeyDown}
            placeholder="Describe your project's purpose and scope..."
            rows="4"
          />
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? "Creating..." : "Create Project"}
        </button>
      </form>

      {successMessage && (
        <div className="alert alert-success">{successMessage}</div>
      )}
      {errorMessage && <div className="alert alert-error">{errorMessage}</div>}
    </div>
  );
}

export default CreateProjectPanel;
