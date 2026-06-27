import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import profileRoutes from "./routes/profile.routes.js";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (_req, res) => {
	res.send("The Task Management API is working");
});

app.use("/api/profile", profileRoutes);

app.use("/api", (_req, res) => {
	res.send("API is working");
});

export default app;
