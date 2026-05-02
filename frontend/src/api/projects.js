export async function createProject(projectData) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!projectData.name || projectData.name.trim() === "") {
        reject({
          name: ["This field may not be blank."],
        });
        return;
      }

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

