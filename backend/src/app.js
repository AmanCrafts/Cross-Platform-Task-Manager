import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import errorHandler from "./middlewares/error.middleware.js";
import profileRoutes from "./routes/profile.routes.js";
import taskRoutes from "./routes/task.routes.js";

const app = express();

app.use(
	cors({
		origin: "*",
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: [
			"Content-Type",
			"Authorization",
			"Accept",
			"X-Requested-With",
		],
		exposedHeaders: ["Content-Length"],
		maxAge: 86400,
	}),
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (_req, res) => {
	res.send("The Task Management API is working");
});

app.use("/api/profile", profileRoutes);
app.use("/api/tasks", taskRoutes);

app.use("/api", (_req, res) => {
	res.send("API is working");
});

app.use(errorHandler);

export default app;
