/**
 * Root component — defines the top-level routes of the application.
 */
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import CreateProjectPage from "./pages/CreateProjectPage";
import DataSourcesPage from "./features/data-sources/DataSourcesPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Projects</Link>
        <Link to="/datasources">Data Sources</Link>
      </nav>
      <Routes>
        <Route path="/" element={<CreateProjectPage />} />
        <Route path="/datasources" element={<DataSourcesPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
