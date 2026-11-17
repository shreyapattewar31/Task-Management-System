const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Task Management System API",
      version: "2.0.0",
      description:
        "REST API for the Task Management System. Supports user authentication, task CRUD, admin controls, Google Sign-In, and reporting.",
      contact: { name: "Task Management System" },
    },
    servers: [
      { url: "https://task-management-system-v5mx.onrender.com", description: "Production" },
      { url: "http://localhost:5000", description: "Local development" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Task: {
          type: "object",
          properties: {
            _id: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            status: { type: "string", enum: ["Pending", "In Progress", "Done", "On Hold"] },
            priority: { type: "string", enum: ["Low", "Medium", "High"] },
            dueDate: { type: "string", format: "date-time", nullable: true },
            userId: { type: "string" },
            assignedBy: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            role: { type: "string", enum: ["User", "Admin"] },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: { message: { type: "string" } },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Tasks", description: "User task management" },
      { name: "Admin", description: "Admin-only endpoints" },
      { name: "Reports", description: "Analytics and reporting" },
    ],
  },
  apis: ["./routes/*.js", "./server.js"],
};

module.exports = swaggerJsdoc(options);
