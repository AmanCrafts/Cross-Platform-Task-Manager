// TaskForm — shared form for create/edit screens.
// External API: form, setForm, disabled. Title, description, priority,
// due date, reminder, recurrence, and pinned toggle are all rendered here.
// The redundant "Recurring" Switch row is gone — `is_recurring` is derived
// from the recurrence value in the screen-side payload builder.

import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { colors, spacing, typography } from "../theme";
import Chip from "./ui/Chip";
import DatePickerField from "./ui/DatePickerField";
import InputField from "./ui/InputField";
import { RECURRENCE_OPTIONS } from "./ui/recurrence.options";
import SelectField from "./ui/SelectField";

const PRIORITIES = ["low", "medium", "high", "urgent"];

const PRIORITY_TONE = {
	low: "priority-low",
	medium: "priority-medium",
	high: "priority-high",
	urgent: "priority-urgent",
};

function updateField(setForm, field, value) {
	setForm((previous) => ({
		...previous,
		[field]: value,
	}));
}

function parseReminderMax(dueAt) {
	if (!dueAt) return undefined;
	const date = new Date(dueAt);
	if (Number.isNaN(date.getTime())) return undefined;
	return date;
}

function TaskForm({ form, setForm, disabled = false }) {
	const reminderMaxDate = parseReminderMax(form.due_at);

	return (
		<View style={styles.container}>
			<InputField
				label="Title"
				value={form.title ?? ""}
				onChangeText={(text) => updateField(setForm, "title", text)}
				placeholder="What needs to be done?"
				autoCapitalize="sentences"
				editable={!disabled}
			/>

			<InputField
				label="Description"
				value={form.description ?? ""}
				onChangeText={(text) => updateField(setForm, "description", text)}
				placeholder="Add a short description"
				multiline
				numberOfLines={4}
				editable={!disabled}
			/>

			<Text style={styles.sectionLabel}>Priority</Text>
			<View style={styles.chipRow}>
				{PRIORITIES.map((item) => (
					<Chip
						key={item}
						label={item.charAt(0).toUpperCase() + item.slice(1)}
						tone={PRIORITY_TONE[item]}
						selected={form.priority === item}
						onPress={() => updateField(setForm, "priority", item)}
						disabled={disabled}
					/>
				))}
			</View>

			<DatePickerField
				label="Due date"
				value={form.due_at || null}
				onChange={(iso) => updateField(setForm, "due_at", iso ?? "")}
				placeholder="Set a due date"
				minimumDate={new Date()}
				editable={!disabled}
			/>

			<DatePickerField
				label="Reminder"
				value={form.reminder_at || null}
				onChange={(iso) => updateField(setForm, "reminder_at", iso ?? "")}
				placeholder="Set a reminder"
				minimumDate={new Date()}
				maximumDate={reminderMaxDate}
				editable={!disabled}
				helper={reminderMaxDate ? `Cannot be after the due date.` : undefined}
			/>

			<SelectField
				label="Recurrence"
				value={form.recurrence_rule ?? ""}
				options={RECURRENCE_OPTIONS}
				onChange={(value) =>
					updateField(setForm, "recurrence_rule", value ?? "")
				}
				leftIcon={
					<Ionicons
						name="repeat-outline"
						size={18}
						color={colors.text.secondary}
					/>
				}
				placeholder="Choose how often"
				helper="Leave as None for one-off tasks."
				editable={!disabled}
			/>

			<View style={styles.switchRow}>
				<View style={styles.switchLabelBlock}>
					<Ionicons
						name="bookmark-outline"
						size={18}
						color={colors.text.secondary}
					/>
					<Text style={styles.switchLabel}>Pinned</Text>
				</View>
				<Switch
					value={!!form.is_pinned}
					onValueChange={(value) => updateField(setForm, "is_pinned", value)}
					disabled={disabled}
					trackColor={{
						false: colors.border.strong,
						true: colors.brand.primary,
					}}
					thumbColor={colors.surface.surface}
				/>
			</View>
		</View>
	);
}

export default memo(TaskForm);

const styles = StyleSheet.create({
	container: {
		paddingBottom: spacing.xl,
	},
	sectionLabel: {
		...typography.overline,
		color: colors.text.muted,
		marginBottom: spacing.sm,
	},
	chipRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: spacing.sm,
		marginBottom: spacing.lg,
	},
	switchRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.md,
		backgroundColor: colors.surface.surface,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: colors.border.subtle,
		marginBottom: spacing.md,
	},
	switchLabelBlock: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
	},
	switchLabel: {
		...typography.bodyLg,
		color: colors.text.primary,
		fontWeight: "500",
	},
});
