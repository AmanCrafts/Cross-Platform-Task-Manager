import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import TaskForm from "../../../src/components/TaskForm";
import { TaskService } from "../../../src/services/task.service";

export default function EditTaskScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams();

	const taskId = Array.isArray(id) ? id[0] : id;

	const [task, setTask] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const loadTask = useCallback(async () => {
		if (!taskId) {
			setError("Task not found.");
			setLoading(false);
			return;
		}

		setError("");
		setLoading(true);

		const result = await TaskService.getById(taskId);

		if (!result.success) {
			setError(result.message || "Failed to load task.");
			setTask(null);
			setLoading(false);
			return;
		}

		setTask(result.data);
		setLoading(false);
	}, [taskId]);

	useEffect(() => {
		loadTask();
	}, [loadTask]);

	const handleNavigateBack = () => {
		router.back();
	};

	if (loading) {
		return (
			<View style={styles.center}>
				<ActivityIndicator />
				<Text style={styles.loadingText}>Loading task...</Text>
			</View>
		);
	}

	if (error || !task) {
		return (
			<View style={styles.center}>
				<Text style={styles.errorTitle}>Unable to load task</Text>
				<Text style={styles.errorText}>
					{error || "This task may have been deleted or does not exist."}
				</Text>
				<TouchableOpacity
					style={styles.backButton}
					onPress={handleNavigateBack}
				>
					<Text style={styles.backButtonText}>Go Back</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<TaskForm
			mode="edit"
			task={task}
			onSaved={() => router.back()}
			onDeleted={() => router.back()}
		/>
	);
}

const styles = StyleSheet.create({
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 24,
		backgroundColor: "#fff",
	},
	loadingText: {
		marginTop: 10,
		color: "#666",
	},
	errorTitle: {
		fontSize: 20,
		fontWeight: "700",
		color: "#111",
		marginBottom: 8,
		textAlign: "center",
	},
	errorText: {
		color: "#666",
		textAlign: "center",
		marginBottom: 20,
		lineHeight: 22,
	},
	backButton: {
		backgroundColor: "#111",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 10,
	},
	backButtonText: {
		color: "#fff",
		fontWeight: "600",
	},
});
