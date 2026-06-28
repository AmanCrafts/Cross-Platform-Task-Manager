// Create task — AppHeader with back arrow + trailing Save TextButton.
// KeyboardAvoidingView with scroll, TaskForm in create mode, full-width
// PrimaryButton at the bottom for the primary action. Preserves the
// existing metadata payload (source: "mobile") and client_timestamp.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
	KeyboardAvoidingView,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import TaskForm from "../../../src/components/TaskForm";
import AppHeader from "../../../src/components/ui/AppHeader";
import KeyboardAvoidingWrap from "../../../src/components/ui/KeyboardAvoidingWrap";
import PrimaryButton from "../../../src/components/ui/PrimaryButton";
import { isRecurrenceSet } from "../../../src/components/ui/recurrence.options";
import ScreenContainer from "../../../src/components/ui/ScreenContainer";
import TextButton from "../../../src/components/ui/TextButton";
import { useToast } from "../../../src/hooks/useToast";
import { TaskService } from "../../../src/services/task.service";
import { colors, spacing, typography } from "../../../src/theme";

const INITIAL_FORM = {
	title: "",
	description: "",
	status: "todo",
	priority: "medium",
	due_at: "",
	reminder_at: "",
	recurrence_rule: "",
	is_pinned: false,
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
	const router = useRouter();
	const { show } = useToast();

	const [form, setForm] = useState(INITIAL_FORM);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const canSave = form.title.trim().length > 0 && !loading;

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

		setLoading(true);
		const result = await TaskService.create({
			title: form.title.trim(),
			description: form.description?.trim() || null,
			status: form.status,
			priority: form.priority,
			due_at: toIsoOrUndefined(form.due_at) ?? null,
			reminder_at: toIsoOrUndefined(form.reminder_at) ?? null,
			is_pinned: form.is_pinned,
			is_recurring: isRecurrenceSet(form.recurrence_rule),
			recurrence_rule: form.recurrence_rule?.trim() || null,
			metadata: {
				source: "mobile",
			},
			client_timestamp: new Date().toISOString(),
		});
		setLoading(false);

		if (!result.success) {
			setError(result.message || "Failed to create task.");
			return;
		}

		show({ message: "Task created", tone: "success" });
		router.back();
	};

	return (
		<ScreenContainer padded={false} background="background">
			<View style={styles.headerWrap}>
				<AppHeader
					title="New task"
					leading={
						<Pressable
							onPress={() => router.back()}
							accessibilityRole="button"
							accessibilityLabel="Cancel"
							hitSlop={8}
							style={({ pressed }) => [
								styles.backButton,
								pressed ? styles.backPressed : null,
							]}
						>
							<Ionicons
								name="chevron-back"
								size={22}
								color={colors.text.primary}
							/>
						</Pressable>
					}
					trailing={
						<TextButton
							label={loading ? "Saving..." : "Save"}
							tone="brand"
							disabled={!canSave}
							onPress={handleSave}
						/>
					}
				/>
			</View>

			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={styles.flex}
				keyboardVerticalOffset={Platform.OS === "ios" ? spacing.lg : 0}
			>
				<KeyboardAvoidingWrap scroll contentContainerStyle={styles.content}>
					<TaskForm form={form} setForm={setForm} />

					{error ? (
						<View style={styles.errorBanner}>
							<Ionicons
								name="alert-circle-outline"
								size={18}
								color={colors.semantic.danger}
							/>
							<Text style={styles.errorText}>{error}</Text>
						</View>
					) : null}

					<PrimaryButton
						label={loading ? "Creating..." : "Create task"}
						onPress={handleSave}
						disabled={!canSave}
						loading={loading}
						size="lg"
						fullWidth
					/>
				</KeyboardAvoidingWrap>
			</KeyboardAvoidingView>
		</ScreenContainer>
	);
}

const styles = StyleSheet.create({
	headerWrap: {
		paddingHorizontal: spacing.base,
	},
	flex: {
		flex: 1,
	},
	content: {
		paddingHorizontal: spacing.base,
		paddingBottom: spacing["3xl"],
	},
	backButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	backPressed: {
		backgroundColor: colors.surface.surfaceMuted,
	},
	errorBanner: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		padding: spacing.md,
		borderRadius: 14,
		backgroundColor: colors.semantic.dangerBg,
		marginBottom: spacing.base,
	},
	errorText: {
		...typography.body,
		color: colors.semantic.danger,
		flex: 1,
	},
});
