import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/health/")
      .then((response) => {
        setMessage(response.data.message);
      })
      .catch(() => {
        setMessage("Could not connect to backend");
      });
  }, []);

  return (
    <main>
      <h1>Privacy Dashboard</h1>
      <p>{message}</p>
    </main>
  );
}

export default App;

