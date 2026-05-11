import React, { useEffect, useState } from "react";
import {
  createDataSource,
  deleteDataSource,
  getDataSources,
  updateDataSource,
} from "../api/dataSources.js";
import "../styles/data-sources-panel.css";

const SOURCE_TYPES = ["file", "database", "api", "url", "manual", "other"];
const DATA_FORMATS = ["text", "image", "csv", "json", "other"];

const emptyDataSource = {
  name: "",
  source_type: "file",
  data_format: "text",
  location: "",
  description: "",
  contains_personal_data: false,
};

function DataSourcesPanel({ project }) {
  const [dataSources, setDataSources] = useState([]);
  const [formData, setFormData] = useState(emptyDataSource);
  const [editingDataSourceId, setEditingDataSourceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = editingDataSourceId !== null;

  useEffect(() => {
    if (!project) {
      return;
    }

    let ignore = false;

    async function loadDataSources() {
      try {
        const loadedDataSources = await getDataSources(project.id);
        if (!ignore) {
          setDataSources(loadedDataSources);
          setError("");
        }
      } catch (err) {
        console.error("Failed to load data sources:", err);
        if (!ignore) {
          setError("Could not load data sources.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadDataSources();

    return () => {
      ignore = true;
    };
  }, [project]);

  if (!project) {
    return (
      <section className="data-sources-panel">
        <div className="panel-header">
          <h2>Data Sources</h2>
          <p className="panel-subtitle">Create or select a project first.</p>
        </div>
        <div className="data-source-empty">No project selected.</div>
      </section>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Please enter a data source name.");
      return;
    }

    setSaving(true);

    const payload = {
      ...formData,
      name: formData.name.trim(),
      location: formData.location.trim(),
      description: formData.description.trim(),
    };

    try {
      if (isEditing) {
        const updatedDataSource = await updateDataSource(
          project.id,
          editingDataSourceId,
          payload,
        );
        setDataSources((previousDataSources) =>
          previousDataSources.map((dataSource) =>
            dataSource.id === updatedDataSource.id ? updatedDataSource : dataSource,
          ),
        );
      } else {
        const createdDataSource = await createDataSource(project.id, payload);
        setDataSources((previousDataSources) => [
          createdDataSource,
          ...previousDataSources,
        ]);
      }

      resetForm();
    } catch (err) {
      console.error("Failed to save data source:", err);
      setError(readError(err));
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(dataSource) {
    setEditingDataSourceId(dataSource.id);
    setFormData({
      name: dataSource.name || "",
      source_type: dataSource.source_type || "file",
      data_format: dataSource.data_format || "text",
      location: dataSource.location || "",
      description: dataSource.description || "",
      contains_personal_data: Boolean(dataSource.contains_personal_data),
    });
    setError("");
  }

  async function handleDelete(dataSource) {
    const shouldDelete = window.confirm(`Delete data source "${dataSource.name}"?`);

    if (!shouldDelete) {
      return;
    }

    setError("");

    try {
      await deleteDataSource(project.id, dataSource.id);
      setDataSources((previousDataSources) =>
        previousDataSources.filter((currentDataSource) => currentDataSource.id !== dataSource.id),
      );

      if (editingDataSourceId === dataSource.id) {
        resetForm();
      }
    } catch (err) {
      console.error("Failed to delete data source:", err);
      setError(readError(err));
    }
  }

  function resetForm() {
    setEditingDataSourceId(null);
    setFormData(emptyDataSource);
  }

  return (
    <section className="data-sources-panel">
      <div className="panel-header data-sources-header">
        <div>
          <h2>Data Sources</h2>
          <p className="panel-subtitle">Selected project: {project.name}</p>
        </div>
        <span className="data-source-count">{dataSources.length}</span>
      </div>

      <div className="data-sources-body">
        <div className="data-source-list-wrap">
          {loading ? (
            <p className="data-source-muted">Loading data sources...</p>
          ) : dataSources.length === 0 ? (
            <div className="data-source-empty">No data sources for this project yet.</div>
          ) : (
            <ul className="data-source-list data-source-list--panel">
              {dataSources.map((dataSource) => (
                <li key={dataSource.id} className="data-source-item data-source-item--panel">
                  <div className="data-source-item-main">
                    <strong>{dataSource.name}</strong>
                    <small>{dataSource.source_type_display} / {dataSource.data_format_display}</small>
                  </div>
                  {dataSource.location && <small className="data-source-detail">{dataSource.location}</small>}
                  {dataSource.description && <small className="data-source-detail">{dataSource.description}</small>}
                  {dataSource.contains_personal_data && (
                    <small className="data-source-privacy">Contains personal data</small>
                  )}
                  <div className="data-source-actions">
                    <button type="button" onClick={() => handleEdit(dataSource)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="data-source-delete"
                      onClick={() => handleDelete(dataSource)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form className="data-source-form data-source-form--panel" onSubmit={handleSubmit}>
          <div className="data-source-form-title">
            {isEditing ? "Edit Data Source" : "Add Data Source"}
          </div>

          <label>
            Name
            <input
              type="text"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              placeholder="Customer CSV"
            />
          </label>

          <div className="data-source-row">
            <label>
              Source type
              <select
                value={formData.source_type}
                onChange={(event) => setFormData({ ...formData, source_type: event.target.value })}
              >
                {SOURCE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>

            <label>
              Data format
              <select
                value={formData.data_format}
                onChange={(event) => setFormData({ ...formData, data_format: event.target.value })}
              >
                {DATA_FORMATS.map((format) => (
                  <option key={format} value={format}>{format}</option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Location
            <input
              type="text"
              value={formData.location}
              onChange={(event) => setFormData({ ...formData, location: event.target.value })}
              placeholder="datasets/customers.csv"
            />
          </label>

          <label>
            Description
            <textarea
              value={formData.description}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              placeholder="Optional description"
              rows="3"
            />
          </label>

          <label className="data-source-checkbox">
            <input
              type="checkbox"
              checked={formData.contains_personal_data}
              onChange={(event) => setFormData({
                ...formData,
                contains_personal_data: event.target.checked,
              })}
            />
            Contains personal data
          </label>

          <div className="data-source-form-actions">
            <button type="submit" className="data-source-submit" disabled={saving}>
              {saving
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Add Data Source"}
            </button>
            {isEditing && (
              <button type="button" className="data-source-cancel" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {error && <p className="data-source-error">{error}</p>}
    </section>
  );
}

function readError(error) {
  if (error.name) {
    return error.name[0];
  }

  if (error.error) {
    return error.error;
  }

  return error.message || "Could not save data source.";
}

export default DataSourcesPanel;
