import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
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

export async function getDataSources(projectId) {
  try {
    const response = await apiClient.get(`/projects/${projectId}/datasources/`);
    return response.data.data_sources;
  } catch (error) {
    throw normalizeError(error);
  }
}

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

export async function deleteDataSource(projectId, dataSourceId) {
  try {
    await apiClient.delete(`/projects/${projectId}/datasources/${dataSourceId}/`);
  } catch (error) {
    throw normalizeError(error);
  }
}
