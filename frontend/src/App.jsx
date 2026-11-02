
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState([]);

  // Add task form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Pending");

  // Edit task form states
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("Pending");

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Fetch tasks from backend
  
  const fetchTasks = async () => {
    try {
      setFetchError("");

      const response = await fetch("http://localhost:5000/api/tasks");

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setFetchError(
        "Could not load tasks. Please check your backend connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch tasks when the page loads
  useEffect(() => {
    fetchTasks();
  }, []);

  // Create a new task
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      alert("Please enter a task title");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      setTitle("");
      setDescription("");
      setStatus("Pending");

      await fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Could not create task. Please check the backend.");
    }
  };

  // Open the edit form
  const handleEdit = (task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditStatus(task.status);
  };

  // Update an existing task
  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!editTitle.trim()) {
      alert("Please enter a task title");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/tasks/${editingTask._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: editTitle.trim(),
            description: editDescription,
            status: editStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      setEditingTask(null);
      await fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Could not update task.");
    }
  };
   
  // Delete a task
  const handleDelete = async (taskId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/tasks/${taskId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      await fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Could not delete task.");
    }
  };
  // Cancel editing
  const handleCancelEdit = () => {
    setEditingTask(null);
  };

  return (
    <div className="app">
      <h1>Task Management System</h1>

      {/* Create Task Form */}
      <form onSubmit={handleSubmit}>
        <h2>Add New Task</h2>

        <label>Task Title *</label>
        <input
          type="text"
          placeholder="Enter task title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />

        <label>Description</label>
        <textarea
          placeholder="Enter task description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />

        <label>Status</label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>

        <button type="submit">Add Task</button>
      </form>

      {/* Edit Task Form */}
      {editingTask && (
        <form onSubmit={handleUpdate}>
          <h2>Edit Task</h2>

          <label>Task Title *</label>
          <input
            type="text"
            value={editTitle}
            onChange={(event) => setEditTitle(event.target.value)}
            required
          />

          <label>Description</label>
          <textarea
            value={editDescription}
            onChange={(event) => setEditDescription(event.target.value)}
          />

          <label>Status</label>
          <select
            value={editStatus}
            onChange={(event) => setEditStatus(event.target.value)}
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>

          <button type="submit">Save Changes</button>

          <button type="button" onClick={handleCancelEdit}>
            Cancel
          </button>
        </form>
      )}

      {/* Task List */}
      <h2>Tasks</h2>

      {loading ? (
          <p>Loading tasks...</p>
        ) : fetchError ? (
          <div>
            <p role="alert">{fetchError}</p>
            <button type="button" onClick={fetchTasks}>
              Retry
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <p>No tasks found. Add your first task!</p>
        ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task._id}>
              <strong>{task.title}</strong>

              <p>{task.description || "No description provided"}</p>

              <p>Status: {task.status}</p>

              <p>
                Created Date:{" "}
                {task.createdAt
                  ? new Date(task.createdAt).toLocaleDateString()
                  : "Date unavailable"}
              </p>

              <button
                type="button"
                 onClick={() => handleEdit(task)}
              >
              Edit
              </button>

              <button
                type="button"
                onClick={() => handleDelete(task._id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
