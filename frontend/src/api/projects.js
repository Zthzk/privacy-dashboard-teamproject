import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
});

function normalizeError(error) {
  const data = error.response?.data;

  if (!data) {
    return error;
  }

  if (data.errors) {
    return {
      ...data,
      ...data.errors,
    };
  }

  return data;
}

/**
 * Create a new project
 * POST /api/projects/
 */
export async function createProject(projectData) {
  try {
    const response = await apiClient.post("/projects/", projectData);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

/**
 * Get all projects
 * GET /api/projects/
 */
export async function getProjects() {
  try {
    const response = await apiClient.get("/projects/");
    return response.data.projects ?? response.data;
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    throw normalizeError(error);
  }
}

/**
 * Update a project (rename or edit description)
 * PATCH /api/projects/<id>/
 */
export async function updateProject(projectId, updateData) {
  try {
    const response = await apiClient.patch(`/projects/${projectId}/`, updateData);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

/**
 * Delete a project
 * DELETE /api/projects/<id>/
 */
export async function deleteProject(projectId) {
  try {
    await apiClient.delete(`/projects/${projectId}/`);
  } catch (error) {
    console.error("Failed to delete project:", error);
    throw normalizeError(error);
  }
}
