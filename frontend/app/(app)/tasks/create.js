import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { TaskService } from "../../../src/services/task.service";

const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUSES = ["todo", "in_progress", "done", "archived"];

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

function Chip({ label, active, onPress }) {
	return (
		<TouchableOpacity
			onPress={onPress}
			style={[styles.chip, active && styles.chipActive]}
			activeOpacity={0.8}
		>
			<Text style={[styles.chipText, active && styles.chipTextActive]}>
				{label}
			</Text>
		</TouchableOpacity>
	);
}

export default function CreateTaskScreen() {
	const router = useRouter();

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [status, setStatus] = useState("todo");
	const [priority, setPriority] = useState("medium");
	const [dueAt, setDueAt] = useState("");
	const [reminderAt, setReminderAt] = useState("");
	const [recurrenceRule, setRecurrenceRule] = useState("");

	const [isPinned, setIsPinned] = useState(false);
	const [isRecurring, setIsRecurring] = useState(false);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const canSave = useMemo(
		() => title.trim().length > 0 && !loading,
		[title, loading],
	);

	const handleSave = async () => {
		setError("");

		if (!title.trim()) {
			setError("Title is required.");
			return;
		}

		if (!isValidDate(dueAt)) {
			setError("Enter a valid due date.");
			return;
		}

		if (!isValidDate(reminderAt)) {
			setError("Enter a valid reminder date.");
			return;
		}

		try {
			setLoading(true);

			const result = await TaskService.create({
				title: title.trim(),
				description: description.trim(),
				status,
				priority,
				due_at: toIsoOrUndefined(dueAt),
				reminder_at: toIsoOrUndefined(reminderAt),
				is_pinned: isPinned,
				is_recurring: isRecurring,
				recurrence_rule: recurrenceRule.trim() || undefined,
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
			router.back();
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
			<Text style={styles.title}>Create Task</Text>
			<Text style={styles.subtitle}>
				Add a new task and save it to your account.
			</Text>

			{error ? <Text style={styles.error}>{error}</Text> : null}

			<Text style={styles.label}>Title *</Text>
			<TextInput
				value={title}
				onChangeText={setTitle}
				placeholder="Enter task title"
				style={styles.input}
				autoCapitalize="sentences"
			/>

			<Text style={styles.label}>Description</Text>
			<TextInput
				value={description}
				onChangeText={setDescription}
				placeholder="Add a short description"
				style={[styles.input, styles.textArea]}
				multiline
				textAlignVertical="top"
			/>

			<Text style={styles.label}>Priority</Text>
			<View style={styles.chipRow}>
				{PRIORITIES.map((item) => (
					<Chip
						key={item}
						label={item}
						active={priority === item}
						onPress={() => setPriority(item)}
					/>
				))}
			</View>

			<Text style={styles.label}>Status</Text>
			<View style={styles.chipRow}>
				{STATUSES.map((item) => (
					<Chip
						key={item}
						label={item}
						active={status === item}
						onPress={() => setStatus(item)}
					/>
				))}
			</View>

			<Text style={styles.label}>Due date</Text>
			<TextInput
				value={dueAt}
				onChangeText={setDueAt}
				placeholder="YYYY-MM-DD or ISO date"
				style={styles.input}
				autoCapitalize="none"
			/>

			<Text style={styles.label}>Reminder date</Text>
			<TextInput
				value={reminderAt}
				onChangeText={setReminderAt}
				placeholder="YYYY-MM-DD or ISO date"
				style={styles.input}
				autoCapitalize="none"
			/>

			<Text style={styles.label}>Recurrence rule</Text>
			<TextInput
				value={recurrenceRule}
				onChangeText={setRecurrenceRule}
				placeholder="Optional recurrence rule"
				style={styles.input}
				autoCapitalize="none"
			/>

			<View style={styles.switchRow}>
				<Text style={styles.switchLabel}>Pinned</Text>
				<Switch value={isPinned} onValueChange={setIsPinned} />
			</View>

			<View style={styles.switchRow}>
				<Text style={styles.switchLabel}>Recurring</Text>
				<Switch value={isRecurring} onValueChange={setIsRecurring} />
			</View>

			<TouchableOpacity
				style={[styles.button, !canSave && styles.buttonDisabled]}
				onPress={handleSave}
				disabled={!canSave}
				activeOpacity={0.85}
			>
				{loading ? (
					<ActivityIndicator color="#fff" />
				) : (
					<Text style={styles.buttonText}>Save Task</Text>
				)}
			</TouchableOpacity>

			<TouchableOpacity
				style={styles.secondaryButton}
				onPress={() => router.back()}
				disabled={loading}
			>
				<Text style={styles.secondaryButtonText}>Cancel</Text>
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
	title: {
		fontSize: 28,
		fontWeight: "700",
		color: "#111",
	},
	subtitle: {
		marginTop: 6,
		marginBottom: 20,
		color: "#666",
	},
	error: {
		color: "crimson",
		marginBottom: 12,
		fontWeight: "600",
	},
	label: {
		marginBottom: 8,
		fontSize: 14,
		fontWeight: "600",
		color: "#222",
	},
	input: {
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 12,
		marginBottom: 16,
		backgroundColor: "#fafafa",
		color: "#111",
	},
	textArea: {
		minHeight: 110,
	},
	chipRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
		marginBottom: 16,
	},
	chip: {
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 999,
		paddingHorizontal: 14,
		paddingVertical: 10,
		backgroundColor: "#fff",
	},
	chipActive: {
		backgroundColor: "#111",
		borderColor: "#111",
	},
	chipText: {
		color: "#333",
		textTransform: "capitalize",
	},
	chipTextActive: {
		color: "#fff",
	},
	switchRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 14,
		paddingVertical: 4,
	},
	switchLabel: {
		fontSize: 15,
		fontWeight: "600",
		color: "#222",
	},
	button: {
		marginTop: 10,
		backgroundColor: "#111",
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: "center",
	},
	buttonDisabled: {
		opacity: 0.5,
	},
	buttonText: {
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
});
