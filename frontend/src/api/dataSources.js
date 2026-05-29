import axios from "axios";

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
 * Sends GET request to the backend
 * RETURN all datasource array across projects
 */
export async function getAllDataSources() {
  try {
    const response = await apiClient.get("/datasources/");
    return response.data.data_sources;
  } catch (error) {
    throw normalizeError(error);
  }
}

/**
 * Sends GET request to the backend
 * RETURN Datasource array
 */
export async function getDataSources(projectId) {
  try {
    const response = await apiClient.get(`/projects/${projectId}/datasources/`);
    return response.data.data_sources;
  } catch (error) {
    throw normalizeError(error);
  }
}

/**
 * Sends GET request to the backend
 * RETURN one datasource object
 */
export async function getDataSource(projectId, dataSourceId) {
  try {
    const response = await apiClient.get(
      `/projects/${projectId}/datasources/${dataSourceId}/`,
    );
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

/**
 * Creates datasource object
 * Sends object to the backend
 * RETURN datasource object
 */
export async function createDataSource(projectId, dataSourceData) {
  try {
    const response = await apiClient.post(
      `/projects/${projectId}/datasources/`,
      dataSourceData,
    );
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

/**
 * Updates a datasource and allows to make changes on the datasource
 * RETURN updated datasource back to the frontend
 */
export async function updateDataSource(projectId, dataSourceId, dataSourceData) {
  try {
    const response = await apiClient.patch(
      `/projects/${projectId}/datasources/${dataSourceId}/`,
      dataSourceData,
    );
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}
/**
 * Returns privacy hints per data format.
 * Each entry contains a hint text, an art9_risk flag, and a list of suggested categories.
 * Used by the data source form to guide users when selecting a data format.
 */
export async function getDataFormatHints() {
  try {
    const response = await apiClient.get("/datasource-format-hints/");
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

/**
 * Delete a datasource
 */
export async function deleteDataSource(projectId, dataSourceId) {
  try {
    await apiClient.delete(`/projects/${projectId}/datasources/${dataSourceId}/`);
  } catch (error) {
    throw normalizeError(error);
  }
}
