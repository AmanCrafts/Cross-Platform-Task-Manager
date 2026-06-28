import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import TaskForm from "../../../src/components/TaskForm";
import { TaskService } from "../../../src/services/task.service";

const INITIAL_FORM = {
	title: "",
	description: "",
	status: "todo",
	priority: "medium",
	due_at: "",
	reminder_at: "",
	recurrence_rule: "",
	is_pinned: false,
	is_recurring: false,
};

function isValidDate(value) {
	if (!value) return true;
	const date = new Date(value);
	return !Number.isNaN(date.getTime());
}

function toForm(task) {
	return {
		title: task?.title ?? "",
		description: task?.description ?? "",
		status: task?.status ?? "todo",
		priority: task?.priority ?? "medium",
		due_at: task?.due_at ? String(task.due_at) : "",
		reminder_at: task?.reminder_at ? String(task.reminder_at) : "",
		recurrence_rule: task?.recurrence_rule ?? "",
		is_pinned: !!task?.is_pinned,
		is_recurring: !!task?.is_recurring,
	};
}

function toIsoOrUndefined(value) {
	if (!value) return undefined;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function buildUpdatePayload(form) {
	return {
		title: form.title.trim(),
		description: form.description.trim(),
		status: form.status,
		priority: form.priority,
		due_at: toIsoOrUndefined(form.due_at),
		reminder_at: toIsoOrUndefined(form.reminder_at),
		is_pinned: form.is_pinned,
		is_recurring: form.is_recurring,
		recurrence_rule: form.recurrence_rule.trim() || undefined,
		client_timestamp: new Date().toISOString(),
	};
}

export default function TaskDetailsScreen() {
	const router = useRouter();
	const params = useLocalSearchParams();

	const taskId = useMemo(() => {
		if (Array.isArray(params.id)) return params.id[0];
		return params.id;
	}, [params.id]);

	const [task, setTask] = useState(null);
	const [form, setForm] = useState(INITIAL_FORM);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [restoring, setRestoring] = useState(false);
	const [error, setError] = useState("");

	const isDeleted = !!task?.deleted_at;

	const loadTask = useCallback(async () => {
		if (!taskId) {
			setError("Missing task id.");
			setLoading(false);
			return;
		}

		setError("");
		setLoading(true);

		const result = await TaskService.getById(taskId);

		if (!result.success) {
			setTask(null);
			setError(result.message || "Failed to load task.");
			setLoading(false);
			return;
		}

		const loadedTask = result.data;
		setTask(loadedTask);
		setForm(toForm(loadedTask));
		setLoading(false);
	}, [taskId]);

	useEffect(() => {
		loadTask();
	}, [loadTask]);

	const handleSave = async () => {
		setError("");

		if (!form.title.trim()) {
			setError("Title is required.");
			return;
		}

		if (!isValidDate(form.due_at)) {
			setError("Enter a valid due date.");
			return;
		}

		if (!isValidDate(form.reminder_at)) {
			setError("Enter a valid reminder date.");
			return;
		}

		try {
			setSaving(true);

			const result = await TaskService.update(taskId, buildUpdatePayload(form));

			if (!result.success) {
				setError(result.message || "Failed to update task.");
				return;
			}

			setTask(result.data);
			setForm(toForm(result.data));

			Alert.alert("Success", "Task updated successfully.");
			router.back();
		} catch (err) {
			setError(err?.message || "Something went wrong.");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = () => {
		Alert.alert(
			"Delete task",
			"This task will be moved to deleted state. You can restore it later.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							setDeleting(true);
							const result = await TaskService.remove(taskId);

							if (!result.success) {
								setError(result.message || "Failed to delete task.");
								return;
							}

							setTask(result.data);
							setForm(toForm(result.data));

							Alert.alert("Deleted", "Task deleted successfully.");
						} catch (err) {
							setError(err?.message || "Something went wrong.");
						} finally {
							setDeleting(false);
						}
					},
				},
			],
		);
	};

	const handleRestore = async () => {
		try {
			setRestoring(true);
			const result = await TaskService.restore(taskId);

			if (!result.success) {
				setError(result.message || "Failed to restore task.");
				return;
			}

			setTask(result.data);
			setForm(toForm(result.data));

			Alert.alert("Restored", "Task restored successfully.");
		} catch (err) {
			setError(err?.message || "Something went wrong.");
		} finally {
			setRestoring(false);
		}
	};

	if (loading) {
		return (
			<View style={styles.center}>
				<ActivityIndicator />
				<Text style={styles.loadingText}>Loading task...</Text>
			</View>
		);
	}

	if (!task) {
		return (
			<View style={styles.center}>
				<Text style={styles.errorTitle}>Task not found</Text>
				{error ? <Text style={styles.errorText}>{error}</Text> : null}
				<TouchableOpacity
					style={styles.backButton}
					onPress={() => router.back()}
				>
					<Text style={styles.backButtonText}>Go Back</Text>
				</TouchableOpacity>
			</View>
		);
	}

	const formDisabled = isDeleted || saving || deleting || restoring;

	return (
		<ScrollView
			contentContainerStyle={styles.container}
			keyboardShouldPersistTaps="handled"
		>
			<View style={styles.header}>
				<Text style={styles.pageTitle}>Task Details</Text>
				<Text style={styles.pageSubtitle}>
					{isDeleted ? "Deleted task" : "Active task"}
				</Text>
			</View>

			{error ? <Text style={styles.errorText}>{error}</Text> : null}

			{isDeleted ? (
				<View style={styles.deletedBanner}>
					<Text style={styles.deletedBannerText}>
						This task is deleted and currently read-only.
					</Text>
				</View>
			) : null}

			<TaskForm
				mode="edit"
				form={form}
				setForm={setForm}
				disabled={formDisabled}
			/>

			{!isDeleted ? (
				<>
					<TouchableOpacity
						style={[styles.primaryButton, saving && styles.buttonDisabled]}
						onPress={handleSave}
						disabled={saving || deleting || restoring}
						activeOpacity={0.85}
					>
						{saving ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={styles.primaryButtonText}>Save Changes</Text>
						)}
					</TouchableOpacity>

					<TouchableOpacity
						style={[styles.deleteButton, deleting && styles.buttonDisabled]}
						onPress={handleDelete}
						disabled={saving || deleting || restoring}
						activeOpacity={0.85}
					>
						{deleting ? (
							<ActivityIndicator color="#b00020" />
						) : (
							<Text style={styles.deleteButtonText}>Delete Task</Text>
						)}
					</TouchableOpacity>
				</>
			) : (
				<TouchableOpacity
					style={[styles.restoreButton, restoring && styles.buttonDisabled]}
					onPress={handleRestore}
					disabled={saving || deleting || restoring}
					activeOpacity={0.85}
				>
					{restoring ? (
						<ActivityIndicator color="#fff" />
					) : (
						<Text style={styles.restoreButtonText}>Restore Task</Text>
					)}
				</TouchableOpacity>
			)}

			<TouchableOpacity
				style={styles.secondaryButton}
				onPress={() => router.back()}
				disabled={saving || deleting || restoring}
			>
				<Text style={styles.secondaryButtonText}>Back</Text>
			</TouchableOpacity>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 20,
		paddingBottom: 32,
		backgroundColor: "#fff",
	},
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 20,
	},
	loadingText: {
		marginTop: 10,
		color: "#666",
	},
	header: {
		marginBottom: 16,
	},
	pageTitle: {
		fontSize: 28,
		fontWeight: "700",
		color: "#111",
	},
	pageSubtitle: {
		marginTop: 6,
		color: "#666",
	},
	errorText: {
		color: "crimson",
		marginBottom: 12,
		fontWeight: "600",
	},
	errorTitle: {
		fontSize: 22,
		fontWeight: "700",
		marginBottom: 8,
		color: "#111",
	},
	deletedBanner: {
		backgroundColor: "#fff3cd",
		borderWidth: 1,
		borderColor: "#ffe08a",
		padding: 12,
		borderRadius: 12,
		marginBottom: 16,
	},
	deletedBannerText: {
		color: "#7a5a00",
		fontWeight: "600",
	},
	primaryButton: {
		marginTop: 16,
		backgroundColor: "#111",
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: "center",
	},
	primaryButtonText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 15,
	},
	deleteButton: {
		marginTop: 12,
		backgroundColor: "#fff5f5",
		borderWidth: 1,
		borderColor: "#ffd6d6",
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: "center",
	},
	deleteButtonText: {
		color: "#b00020",
		fontWeight: "700",
		fontSize: 15,
	},
	restoreButton: {
		marginTop: 16,
		backgroundColor: "#111",
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: "center",
	},
	restoreButtonText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 15,
	},
	secondaryButton: {
		marginTop: 12,
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#ddd",
	},
	secondaryButtonText: {
		color: "#111",
		fontWeight: "700",
		fontSize: 15,
	},
	backButton: {
		marginTop: 12,
		paddingVertical: 12,
		paddingHorizontal: 18,
		borderRadius: 12,
		backgroundColor: "#111",
	},
	backButtonText: {
		color: "#fff",
		fontWeight: "700",
	},
	buttonDisabled: {
		opacity: 0.6,
	},
});
