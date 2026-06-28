import { useState } from "react";
import {
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
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

function toIsoOrUndefined(value) {
	if (!value) return undefined;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export default function CreateTaskScreen() {
	const [form, setForm] = useState(INITIAL_FORM);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

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
			setLoading(true);

			const result = await TaskService.create({
				title: form.title.trim(),
				description: form.description.trim(),
				status: form.status,
				priority: form.priority,
				due_at: toIsoOrUndefined(form.due_at),
				reminder_at: toIsoOrUndefined(form.reminder_at),
				is_pinned: form.is_pinned,
				is_recurring: form.is_recurring,
				recurrence_rule: form.recurrence_rule.trim() || undefined,
				metadata: {
					source: "mobile",
				},
				client_timestamp: new Date().toISOString(),
			});

			if (!result.success) {
				setError(result.message || "Failed to create task.");
				return;
			}

			Alert.alert("Success", "Task created successfully.");
			setForm(INITIAL_FORM);
		} catch (err) {
			setError(err?.message || "Something went wrong.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<ScrollView
			contentContainerStyle={styles.container}
			keyboardShouldPersistTaps="handled"
		>
			{error ? <Text style={styles.error}>{error}</Text> : null}

			<TaskForm form={form} setForm={setForm} mode="create" />

			<TouchableOpacity
				style={[styles.button, loading && styles.buttonDisabled]}
				onPress={handleSave}
				disabled={loading}
				activeOpacity={0.85}
			>
				<Text style={styles.buttonText}>
					{loading ? "Saving..." : "Save Task"}
				</Text>
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
	error: {
		color: "crimson",
		marginBottom: 12,
		fontWeight: "600",
	},
	button: {
		marginTop: 16,
		backgroundColor: "#111",
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: "center",
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	buttonText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 15,
	},
});
