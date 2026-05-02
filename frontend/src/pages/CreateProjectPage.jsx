import { useState } from "react";
import { createProject } from "../api/projects.js";

function CreateProjectPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
  event.preventDefault();

  console.log("Submitting project:", { name, description });

  setSuccessMessage("");
  setErrorMessage("");

  if (!name.trim()) {
    setErrorMessage("Project name is required.");
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
  } catch (error) {
    console.error("Create project failed:", error);

    if (error.name) {
      setErrorMessage(error.name[0]);
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
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter project name"
              required
            />
            <p className="input-hint">Please enter a clear project name.</p>
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
      </div>
    </div>
  );
}

export default CreateProjectPage;
