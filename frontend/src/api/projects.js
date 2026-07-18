import axios from "axios";

import { requestNotificationsRefresh } from "api/notifications";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
});

function normalizeError(error) {
  const data = error.response?.data;
  const status = error.response?.status;

  if (!data) {
    return error;
  }

  if (data.errors) {
    return {
      status,
      ...data,
      ...data.errors,
    };
  }

  if (typeof data === "object") {
    return {
      status,
      ...data,
    };
  }

  return {
    status,
    error: data,
  };
}

/**
 * Create a new project
 * POST /api/projects/
 */
export async function createProject(projectData) {
  try {
    const response = await apiClient.post("/projects/", projectData);
    requestNotificationsRefresh();
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
 * Get one project
 * GET /api/projects/<id>/
 */
export async function getProject(projectId) {
  try {
    const response = await apiClient.get(`/projects/${projectId}/`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch project:", error);
    throw normalizeError(error);
  }
}

/**
 * Get all data needed by the project detail overview page
 * GET /api/projects/<id>/overview/
 */
export async function getProjectOverview(projectId) {
  try {
    const response = await apiClient.get(`/projects/${projectId}/overview/`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch project overview:", error);
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
    requestNotificationsRefresh();
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
    requestNotificationsRefresh();
  } catch (error) {
    console.error("Failed to delete project:", error);
    throw normalizeError(error);
  }
}
