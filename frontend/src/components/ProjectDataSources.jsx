import { useEffect, useState } from "react";
import {
  createDataSource,
  deleteDataSource,
  getDataSources,
  updateDataSource,
} from "../api/dataSources.js";

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

function ProjectDataSources({ projectId }) {
  const [dataSources, setDataSources] = useState([]);
  const [formData, setFormData] = useState(emptyDataSource);
  const [editingDataSourceId, setEditingDataSourceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = editingDataSourceId !== null;

  useEffect(() => {
    let ignore = false;

    async function loadDataSources() {
      try {
        const loadedDataSources = await getDataSources(projectId);
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
  }, [projectId]);

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
          projectId,
          editingDataSourceId,
          payload,
        );
        setDataSources((previousDataSources) =>
          previousDataSources.map((dataSource) =>
            dataSource.id === updatedDataSource.id ? updatedDataSource : dataSource,
          ),
        );
      } else {
        const createdDataSource = await createDataSource(projectId, payload);
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
      await deleteDataSource(projectId, dataSource.id);
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
    <div className="data-source-section">
      <div className="data-source-heading">
        <h4>Data Sources</h4>
        <span>{dataSources.length}</span>
      </div>

      {loading ? (
        <p className="data-source-muted">Loading data sources...</p>
      ) : dataSources.length === 0 ? (
        <p className="data-source-muted">No data sources yet.</p>
      ) : (
        <ul className="data-source-list">
          {dataSources.map((dataSource) => (
            <li key={dataSource.id} className="data-source-item">
              <div>
                <strong>{dataSource.name}</strong>
                <small>
                  {dataSource.source_type_display} / {dataSource.data_format_display}
                </small>
              </div>
              {dataSource.location && <small>{dataSource.location}</small>}
              {dataSource.description && <small>{dataSource.description}</small>}
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

      <form className="data-source-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={formData.name}
          onChange={(event) => setFormData({ ...formData, name: event.target.value })}
          placeholder="Data source name"
        />

        <div className="data-source-row">
          <select
            value={formData.source_type}
            onChange={(event) => setFormData({ ...formData, source_type: event.target.value })}
          >
            {SOURCE_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={formData.data_format}
            onChange={(event) => setFormData({ ...formData, data_format: event.target.value })}
          >
            {DATA_FORMATS.map((format) => (
              <option key={format} value={format}>{format}</option>
            ))}
          </select>
        </div>

        <input
          type="text"
          value={formData.location}
          onChange={(event) => setFormData({ ...formData, location: event.target.value })}
          placeholder="Location, e.g. datasets/customers.csv"
        />

        <textarea
          value={formData.description}
          onChange={(event) => setFormData({ ...formData, description: event.target.value })}
          placeholder="Optional description"
          rows="2"
        />

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

      {error && <p className="data-source-error">{error}</p>}
    </div>
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

export default ProjectDataSources;
