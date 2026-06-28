// Task detail / edit — single screen, always-editable, three states:
//   - Active: header + form sections + Save + Delete (modal confirm).
//   - Deleted: warning banner + form disabled + Restore.
//   - Loading / not-found: spinner or empty state with back.
//
// The form is rendered inline (no outer Card) so dividers can sit between
// major sections. Local helpers — SectionHeader, ToggleRow, MetadataLine —
// exist only for this screen. Save/Delete use ConfirmationModal instead
// of Alert.alert.

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	View,
} from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import AppHeader from "../../../src/components/ui/AppHeader";
import Chip from "../../../src/components/ui/Chip";
import ConfirmationModal from "../../../src/components/ui/ConfirmationModal";
import DatePickerField from "../../../src/components/ui/DatePickerField";
import Divider from "../../../src/components/ui/Divider";
import InputField from "../../../src/components/ui/InputField";
import KeyboardAvoidingWrap from "../../../src/components/ui/KeyboardAvoidingWrap";
import LoadingState from "../../../src/components/ui/LoadingState";
import PrimaryButton from "../../../src/components/ui/PrimaryButton";
import { RECURRENCE_OPTIONS } from "../../../src/components/ui/recurrence.options";
import ScreenContainer from "../../../src/components/ui/ScreenContainer";
import SelectField from "../../../src/components/ui/SelectField";
import TextButton from "../../../src/components/ui/TextButton";
import { useToast } from "../../../src/hooks/useToast";
import { TaskService } from "../../../src/services/task.service";
import { colors, radius, spacing, typography } from "../../../src/theme";

const EMPTY_FORM = {
	title: "",
	description: "",
	status: "todo",
	priority: "medium",
	due_at: "",
	reminder_at: "",
	recurrence_rule: "",
	is_pinned: false,
};

const PRIORITIES = ["low", "medium", "high", "urgent"];

const PRIORITY_TONE = {
	low: "priority-low",
	medium: "priority-medium",
	high: "priority-high",
	urgent: "priority-urgent",
};

const STATUS_LABEL = {
	todo: "To do",
	in_progress: "In progress",
	done: "Done",
	archived: "Archived",
};

const STATUS_TONE = {
	todo: "status-todo",
	in_progress: "status-in_progress",
	done: "status-done",
	archived: "status-archived",
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
	};
}

function toIsoOrUndefined(value) {
	if (!value) return undefined;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function formatLongDate(value) {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleDateString(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric",
		year:
			date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
	});
}

function formatDateTime(value) {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

function updateField(setForm, field, value) {
	setForm((previous) => ({ ...previous, [field]: value }));
}

// --- Local helpers (single consumer: this screen) ---------------------------

function SectionHeader({ children, style }) {
	return <Text style={[styles.sectionHeader, style]}>{children}</Text>;
}

function ToggleRow({ icon, label, value, onValueChange, disabled }) {
	return (
		<View style={styles.toggleRow}>
			<View style={styles.toggleLabelBlock}>
				{icon ? <View style={styles.toggleIcon}>{icon}</View> : null}
				<Text style={styles.toggleLabel}>{label}</Text>
			</View>
			<Switch
				value={!!value}
				onValueChange={onValueChange}
				disabled={disabled}
				trackColor={{ false: colors.border.strong, true: colors.brand.primary }}
				thumbColor={colors.surface.surface}
			/>
		</View>
	);
}

function MetadataLine({ label, value }) {
	return (
		<View style={styles.metaLine}>
			<Text style={styles.metaLabel}>{label}</Text>
			<Text style={styles.metaValue}>{value}</Text>
		</View>
	);
}

// --- Screen ----------------------------------------------------------------

export default function TaskDetailsScreen() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const { show } = useToast();

	const taskId = useMemo(() => {
		if (Array.isArray(params.id)) return params.id[0];
		return params.id;
	}, [params.id]);

	const [task, setTask] = useState(null);
	const [form, setForm] = useState(EMPTY_FORM);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [restoring, setRestoring] = useState(false);
	const [error, setError] = useState("");
	const [confirmDelete, setConfirmDelete] = useState(false);

	const isDeleted = !!task?.deleted_at;

	const loadTask = useCallback(async () => {
		if (!taskId) {
			setError("Missing task id.");
			setLoading(false);
			return;
		}

		setLoading(true);
		setError("");

		const result = await TaskService.getById(taskId);

		if (!result.success) {
			setTask(null);
			setError(result.message || "Failed to load task.");
			setLoading(false);
			return;
		}

		setTask(result.data);
		setForm(toForm(result.data));
		setLoading(false);
	}, [taskId]);

	useEffect(() => {
		loadTask();
	}, [loadTask]);

	const formDisabled = isDeleted || saving || deleting || restoring;
	const canSave =
		!isDeleted &&
		form.title.trim().length > 0 &&
		!saving &&
		!deleting &&
		!restoring;

	const reminderMaxDate = useMemo(() => {
		if (!form.due_at) return undefined;
		const date = new Date(form.due_at);
		return Number.isNaN(date.getTime()) ? undefined : date;
	}, [form.due_at]);

	const headerSubtitle = useMemo(() => {
		if (!task) return undefined;
		if (isDeleted) {
			const moved = task.deleted_at ? formatLongDate(task.deleted_at) : "";
			return moved ? `In trash · moved ${moved}` : "In trash";
		}
		const stamp = task.updated_at ?? task.created_at;
		return formatLongDate(stamp ?? new Date());
	}, [task, isDeleted]);

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

		setSaving(true);
		const result = await TaskService.update(taskId, {
			title: form.title.trim(),
			description: form.description?.trim() || null,
			status: form.status,
			priority: form.priority,
			due_at: toIsoOrUndefined(form.due_at) ?? null,
			reminder_at: toIsoOrUndefined(form.reminder_at) ?? null,
			is_pinned: form.is_pinned,
			is_recurring: Boolean(form.recurrence_rule),
			recurrence_rule: form.recurrence_rule?.trim() || null,
			client_timestamp: new Date().toISOString(),
		});
		setSaving(false);

		if (!result.success) {
			setError(result.message || "Failed to update task.");
			return;
		}

		setTask(result.data);
		setForm(toForm(result.data));
		show({ message: "Task updated", tone: "success" });
	};

	const handleDelete = async () => {
		setDeleting(true);
		const result = await TaskService.remove(taskId);
		setDeleting(false);
		setConfirmDelete(false);

		if (!result.success) {
			setError(result.message || "Failed to delete task.");
			return;
		}

		show({ message: "Task moved to trash", tone: "default" });
		router.back();
	};

	const handleRestore = async () => {
		setRestoring(true);
		const result = await TaskService.restore(taskId);
		setRestoring(false);

		if (!result.success) {
			setError(result.message || "Failed to restore task.");
			return;
		}

		setTask(result.data);
		setForm(toForm(result.data));
		show({ message: "Task restored", tone: "success" });
	};

	const renderHeader = () => (
		<View style={styles.headerWrap}>
			<AppHeader
				title="Task"
				subtitle={headerSubtitle}
				leading={
					<Pressable
						onPress={() => router.back()}
						accessibilityRole="button"
						accessibilityLabel="Back"
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
				rightSlot={
					task ? (
						<Chip
							label={STATUS_LABEL[task.status] ?? task.status}
							tone={STATUS_TONE[task.status] ?? "status-todo"}
							size="sm"
						/>
					) : null
				}
			/>
		</View>
	);

	if (loading) {
		return (
			<ScreenContainer padded={false} background="background">
				{renderHeader()}
				<LoadingState label="Loading task..." />
			</ScreenContainer>
		);
	}

	if (!task) {
		return (
			<ScreenContainer padded={false} background="background">
				{renderHeader()}
				<View style={styles.notFound}>
					<Text style={styles.notFoundTitle}>Task not found</Text>
					{error ? <Text style={styles.notFoundText}>{error}</Text> : null}
				</View>
			</ScreenContainer>
		);
	}

	return (
		<ScreenContainer padded={false} background="background">
			{renderHeader()}

			<KeyboardAvoidingWrap scroll contentContainerStyle={styles.content}>
				<Animated.View
					entering={FadeIn.duration(220).delay(0)}
					style={styles.body}
				>
					{/* Title — page-level, borderless, display typography */}
					<Animated.View entering={SlideInDown.duration(260)}>
						<InputField
							label=""
							value={form.title}
							onChangeText={(text) => updateField(setForm, "title", text)}
							placeholder="Task title"
							autoCapitalize="sentences"
							editable={!formDisabled}
							inputStyle={styles.titleInput}
							style={styles.titleField}
						/>
					</Animated.View>

					{/* Description */}
					<InputField
						label="Description"
						value={form.description}
						onChangeText={(text) => updateField(setForm, "description", text)}
						placeholder="Add a short description"
						multiline
						numberOfLines={4}
						editable={!formDisabled}
					/>

					{/* Priority */}
					<SectionHeader>Priority</SectionHeader>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.priorityRow}
					>
						{PRIORITIES.map((item) => (
							<Chip
								key={item}
								label={item.charAt(0).toUpperCase() + item.slice(1)}
								tone={PRIORITY_TONE[item]}
								selected={form.priority === item}
								onPress={() => updateField(setForm, "priority", item)}
								disabled={formDisabled}
							/>
						))}
					</ScrollView>

					{/* Schedule */}
					<View style={styles.dividerBlock}>
						<Divider />
					</View>
					<SectionHeader>Schedule</SectionHeader>

					<DatePickerField
						label="Due date"
						value={form.due_at || null}
						onChange={(iso) => updateField(setForm, "due_at", iso ?? "")}
						placeholder="Set a due date"
						minimumDate={new Date()}
						editable={!formDisabled}
					/>

					<DatePickerField
						label="Reminder"
						value={form.reminder_at || null}
						onChange={(iso) => updateField(setForm, "reminder_at", iso ?? "")}
						placeholder="Set a reminder"
						minimumDate={new Date()}
						maximumDate={reminderMaxDate}
						editable={!formDisabled}
						helper={
							reminderMaxDate ? "Cannot be after the due date." : undefined
						}
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
						editable={!formDisabled}
					/>

					{/* Options */}
					<View style={styles.dividerBlock}>
						<Divider />
					</View>
					<SectionHeader>Options</SectionHeader>
					<ToggleRow
						icon={
							<Ionicons
								name="bookmark-outline"
								size={18}
								color={colors.text.secondary}
							/>
						}
						label="Pinned"
						value={form.is_pinned}
						onValueChange={(value) => updateField(setForm, "is_pinned", value)}
						disabled={formDisabled}
					/>

					{/* Metadata */}
					<View style={styles.dividerBlock}>
						<Divider />
					</View>
					<View style={styles.metaBlock}>
						{task.created_at ? (
							<MetadataLine
								label="Created"
								value={formatDateTime(task.created_at)}
							/>
						) : null}
						{task.updated_at ? (
							<MetadataLine
								label="Updated"
								value={formatDateTime(task.updated_at)}
							/>
						) : null}
						{task.completed_at ? (
							<MetadataLine
								label="Completed"
								value={formatDateTime(task.completed_at)}
							/>
						) : null}
					</View>

					{/* Banners */}
					{isDeleted ? (
						<View style={styles.deletedBanner}>
							<Ionicons
								name="trash-outline"
								size={18}
								color={colors.semantic.warning}
							/>
							<Text style={styles.deletedBannerText}>
								This task is in the trash.
							</Text>
						</View>
					) : null}

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

					{/* Actions */}
					{isDeleted ? (
						<PrimaryButton
							label={restoring ? "Restoring..." : "Restore task"}
							onPress={handleRestore}
							loading={restoring}
							disabled={saving || deleting}
							size="lg"
							fullWidth
						/>
					) : (
						<>
							<PrimaryButton
								label={saving ? "Saving..." : "Save changes"}
								onPress={handleSave}
								loading={saving}
								disabled={!canSave}
								size="lg"
								fullWidth
							/>
							<View style={styles.deleteRow}>
								<TextButton
									label={deleting ? "Deleting..." : "Delete task"}
									tone="danger"
									onPress={() => setConfirmDelete(true)}
									disabled={saving || restoring || deleting}
								/>
							</View>
						</>
					)}
				</Animated.View>
			</KeyboardAvoidingWrap>

			<ConfirmationModal
				visible={confirmDelete}
				title="Delete task?"
				description="You can restore it later from the trash."
				confirmLabel="Delete"
				cancelLabel="Cancel"
				tone="danger"
				loading={deleting}
				onConfirm={handleDelete}
				onCancel={() => setConfirmDelete(false)}
			/>
		</ScreenContainer>
	);
}

const styles = StyleSheet.create({
	headerWrap: {
		paddingHorizontal: spacing.base,
	},
	content: {
		paddingHorizontal: spacing.base,
		paddingBottom: spacing["3xl"],
	},
	body: {
		flex: 1,
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
	titleField: {
		marginTop: spacing.sm,
		marginBottom: spacing.lg,
	},
	titleInput: {
		...typography.display,
		paddingVertical: 0,
	},
	sectionHeader: {
		...typography.overline,
		color: colors.text.muted,
		marginTop: spacing.lg,
		marginBottom: spacing.sm,
	},
	priorityRow: {
		paddingVertical: spacing.xs,
		gap: spacing.sm,
		paddingRight: spacing.base,
		marginBottom: spacing.sm,
	},
	dividerBlock: {
		marginTop: spacing.xl,
		marginBottom: spacing.lg,
	},
	toggleRow: {
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
	toggleLabelBlock: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
	},
	toggleIcon: {
		marginRight: spacing.sm,
		alignContent: "center",
		justifyContent: "center",
	},
	toggleLabel: {
		...typography.bodyLg,
		color: colors.text.primary,
		fontWeight: "500",
	},
	metaBlock: {
		gap: spacing.xs,
		marginBottom: spacing.lg,
	},
	metaLine: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "baseline",
		gap: spacing.md,
	},
	metaLabel: {
		...typography.caption,
		color: colors.text.muted,
	},
	metaValue: {
		...typography.caption,
		color: colors.text.secondary,
		flexShrink: 1,
		textAlign: "right",
	},
	deletedBanner: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		padding: spacing.md,
		borderRadius: radius.md,
		backgroundColor: colors.semantic.warningBg,
		marginBottom: spacing.base,
	},
	deletedBannerText: {
		...typography.body,
		color: "#7A5A00",
		flex: 1,
	},
	errorBanner: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		padding: spacing.md,
		borderRadius: radius.md,
		backgroundColor: colors.semantic.dangerBg,
		marginBottom: spacing.base,
	},
	errorText: {
		...typography.body,
		color: colors.semantic.danger,
		flex: 1,
	},
	deleteRow: {
		alignItems: "center",
		marginTop: spacing.md,
	},
	notFound: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: spacing.xl,
		gap: spacing.sm,
	},
	notFoundTitle: {
		...typography.h2,
		color: colors.text.primary,
	},
	notFoundText: {
		...typography.body,
		color: colors.text.secondary,
		textAlign: "center",
	},
});
