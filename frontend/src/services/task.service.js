import client from "../api/client";
export const TaskService = {
	getAllTasks: async () => {
		const { data } = await client.get("/tasks");
		return data;
	},
	getTaskById: async (id) => {
		const { data } = await client.get(`/tasks/${id}`);
		return data;
	},
	createTask: async (payload) => {
		const { data } = await client.post("/tasks", payload);
		return data;
	},
	updateTask: async (id, payload) => {
		const { data } = await client.patch(`/tasks/${id}`, payload);
		return data;
	},
	deleteTask: async (id) => {
		const { data } = await client.delete(`/tasks/${id}`);
		return data;
	},
};
