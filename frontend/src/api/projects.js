// Mock API for US01.
// These functions simulate the backend endpoints until the real backend is available.

// Simulates POST /api/projects/
export async function createProject(projectData) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate backend validation: project name is required
      if (!projectData.name || projectData.name.trim() === "") {
        reject({
          name: ["This field may not be blank."],
        });
        return;
      }

      // Simulate a successful backend response
      resolve({
        id: 1,
        name: projectData.name,
        description: projectData.description,
        created_at: "2026-05-02T21:30:00Z",
        updated_at: "2026-05-02T21:30:00Z",
      });
    }, 500);
  });
}

// Simulates GET /api/projects/
export async function getProjects() {
  return [
    {
      id: 1,
      name: "Demo Project",
      description: "Short project description",
      created_at: "2026-05-02T21:30:00Z",
      updated_at: "2026-05-02T21:30:00Z",
    },
  ];
}