import axios from "axios";

// API base URL pointing to the Django backend
const API_BASE_URL = "http://localhost:8000/api";

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

/**
 * Create a new project
 * POST /api/projects/
 */
export async function createProject(projectData) {
  try {
    const response = await apiClient.post("/projects/", projectData);
    return response.data;
  } catch (error) {
    // Handle backend validation errors
    if (error.response && error.response.status === 400) {
      throw error.response.data;
    }
    throw error;
  }
}

/**
 * Get all projects
 * GET /api/projects/
 */
export async function getProjects() {
  try {
    const response = await apiClient.get("/projects/");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    throw error;
  }
}