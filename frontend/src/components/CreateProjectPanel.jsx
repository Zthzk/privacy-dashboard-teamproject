import { useRef, useState } from "react";
import { createProject } from "../api/projects.js";
import "../styles/create-project-panel.css";

function CreateProjectPanel({ onProjectCreated }) {
  const nameInputRef = useRef(null);
  const descriptionRef = useRef(null);
  const submitButtonRef = useRef(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [nameError, setNameError] = useState("");

  const focusField = (ref) => {
    if (ref?.current) {
      ref.current.focus();
    }
  };

  const isTextareaAtStart = (textarea) => {
    return textarea.selectionStart === 0 && textarea.selectionEnd === 0;
  };

  const isTextareaAtEnd = (textarea) => {
    return (
      textarea.selectionStart === textarea.value.length &&
      textarea.selectionEnd === textarea.value.length
    );
  };

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

    if (event.key === "Enter" || event.key === "ArrowDown") {
      event.preventDefault();
      focusField(descriptionRef);
      return;
    }
  };

  const handleDescriptionKeyDown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      handleSubmit(event);
      return;
    }

    const textarea = event.target;
    if (!(textarea instanceof HTMLTextAreaElement)) {
      return;
    }

    if (event.key === "ArrowUp" && isTextareaAtStart(textarea)) {
      event.preventDefault();
      focusField(nameInputRef);
      return;
    }

    if (event.key === "ArrowDown" && isTextareaAtEnd(textarea)) {
      event.preventDefault();
      focusField(submitButtonRef);
      return;
    }
  };

  const handleSubmitButtonKeyDown = (event) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusField(descriptionRef);
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
            ref={nameInputRef}
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

        <button
          type="submit"
          ref={submitButtonRef}
          disabled={loading}
          className="submit-btn"
          onKeyDown={handleSubmitButtonKeyDown}
        >
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
