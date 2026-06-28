import { memo } from "react";
import {
	StyleSheet,
	Switch,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUSES = ["todo", "in_progress", "done", "archived"];

function Chip({ label, active, disabled, onPress }) {
	return (
		<TouchableOpacity
			onPress={disabled ? undefined : onPress}
			disabled={disabled}
			style={[
				styles.chip,
				active && styles.chipActive,
				disabled && styles.chipDisabled,
			]}
			activeOpacity={0.8}
		>
			<Text style={[styles.chipText, active && styles.chipTextActive]}>
				{label}
			</Text>
		</TouchableOpacity>
	);
}

function updateField(setForm, field, value) {
	setForm((previous) => ({
		...previous,
		[field]: value,
	}));
}

function TaskForm({ mode = "create", form, setForm, disabled = false }) {
	const heading = mode === "edit" ? "Task Details" : "Create Task";
	const subtitle =
		mode === "edit"
			? "Update the task details below."
			: "Fill in the details for your task.";

	return (
		<View>
			<Text style={styles.title}>{heading}</Text>
			<Text style={styles.subtitle}>{subtitle}</Text>

			<Text style={styles.label}>Title *</Text>
			<TextInput
				value={form.title ?? ""}
				onChangeText={(text) => updateField(setForm, "title", text)}
				placeholder="Enter task title"
				style={styles.input}
				autoCapitalize="sentences"
				editable={!disabled}
			/>

			<Text style={styles.label}>Description</Text>
			<TextInput
				value={form.description ?? ""}
				onChangeText={(text) => updateField(setForm, "description", text)}
				placeholder="Add a short description"
				style={[styles.input, styles.textArea]}
				multiline
				textAlignVertical="top"
				editable={!disabled}
			/>

			<Text style={styles.label}>Priority</Text>
			<View style={styles.chipRow}>
				{PRIORITIES.map((item) => (
					<Chip
						key={item}
						label={item}
						active={form.priority === item}
						disabled={disabled}
						onPress={() => updateField(setForm, "priority", item)}
					/>
				))}
			</View>

			<Text style={styles.label}>Status</Text>
			<View style={styles.chipRow}>
				{STATUSES.map((item) => (
					<Chip
						key={item}
						label={item}
						active={form.status === item}
						disabled={disabled}
						onPress={() => updateField(setForm, "status", item)}
					/>
				))}
			</View>

			<Text style={styles.label}>Due date</Text>
			<TextInput
				value={form.due_at ?? ""}
				onChangeText={(text) => updateField(setForm, "due_at", text)}
				placeholder="YYYY-MM-DD or ISO date"
				style={styles.input}
				autoCapitalize="none"
				editable={!disabled}
			/>

			<Text style={styles.label}>Reminder date</Text>
			<TextInput
				value={form.reminder_at ?? ""}
				onChangeText={(text) => updateField(setForm, "reminder_at", text)}
				placeholder="YYYY-MM-DD or ISO date"
				style={styles.input}
				autoCapitalize="none"
				editable={!disabled}
			/>

			<Text style={styles.label}>Recurrence rule</Text>
			<TextInput
				value={form.recurrence_rule ?? ""}
				onChangeText={(text) => updateField(setForm, "recurrence_rule", text)}
				placeholder="Optional recurrence rule"
				style={styles.input}
				autoCapitalize="none"
				editable={!disabled}
			/>

			<View style={styles.switchRow}>
				<Text style={styles.switchLabel}>Pinned</Text>
				<Switch
					value={!!form.is_pinned}
					onValueChange={(value) => updateField(setForm, "is_pinned", value)}
					disabled={disabled}
				/>
			</View>

			<View style={styles.switchRow}>
				<Text style={styles.switchLabel}>Recurring</Text>
				<Switch
					value={!!form.is_recurring}
					onValueChange={(value) => updateField(setForm, "is_recurring", value)}
					disabled={disabled}
				/>
			</View>
		</View>
	);
}

export default memo(TaskForm);

const styles = StyleSheet.create({
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
	chipDisabled: {
		opacity: 0.6,
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
});
