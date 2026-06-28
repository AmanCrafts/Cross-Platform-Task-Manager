// TaskCard — the hero visual on the Home list.
//
// Design intent:
//  - Strong title hierarchy (medium-weight, tight letter-spacing).
//  - Quiet metadata: single-line meta row with muted icons + caption.
//  - Status shown as a tiny pill next to the title — replaces a heavier
//    footer chip so the row breathes.
//  - Priority expressed as a 2.5px left rail in the priority color;
//    a soft inner highlight when not done. When done, rail fades to
//    border so the row reads as "settled".
//  - Done state: surface dims, title gets strike + muted color, all
//    metadata muted. Calm, not loud.
//  - Trailing chevron removed — the press feedback + the rail already
//    signal interactivity. Reduces visual noise.

import { Ionicons } from "@expo/vector-icons";
import { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../../theme";
import Card from "./Card";
import { labelForRecurrence } from "./recurrence.options";

const STATUS_TONE = {
	todo: "neutral",
	in_progress: "brand",
	done: "done",
	archived: "muted",
};

const STATUS_LABEL = {
	todo: "To do",
	in_progress: "In progress",
	done: "Done",
	archived: "Archived",
};

function formatDue(value) {
	if (!value) return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;

	const now = new Date();
	const startOfToday = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
	);
	const startOfDate = new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
	);
	const diffDays = Math.round(
		(startOfDate.getTime() - startOfToday.getTime()) / 86_400_000,
	);

	if (diffDays === 0) return { label: "Today", tone: "soon" };
	if (diffDays === 1) return { label: "Tomorrow", tone: "soon" };
	if (diffDays === -1) return { label: "Yesterday", tone: "overdue" };
	if (diffDays < -1 && diffDays >= -7)
		return { label: `${Math.abs(diffDays)}d overdue`, tone: "overdue" };
	if (diffDays > 1 && diffDays <= 7)
		return { label: `In ${diffDays}d`, tone: "soon" };
	return {
		label: date.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
		}),
		tone: "default",
	};
}

function TaskCard({ task, onPress, style }) {
	const isDone = task.status === "done";
	const isArchived = task.status === "archived";

	const priorityColor =
		colors.priority[task.priority] ?? colors.priority.medium;

	const statusTone = STATUS_TONE[task.status] ?? "neutral";
	const statusLabel = STATUS_LABEL[task.status] ?? task.status;

	const due = formatDue(task.due_at);
	const isOverdue = due?.tone === "overdue";

	const metaItems = useMemo(() => {
		const items = [];
		if (due) {
			items.push({
				key: "due",
				icon: (
					<Ionicons
						name={isOverdue ? "alert-circle-outline" : "calendar-clear-outline"}
						size={13}
						color={isOverdue ? colors.semantic.danger : colors.text.muted}
					/>
				),
				label: due.label,
				tone: isOverdue ? "danger" : "default",
			});
		}
		if (task.is_recurring) {
			items.push({
				key: "recurrence",
				icon: (
					<Ionicons name="repeat-outline" size={13} color={colors.text.muted} />
				),
				label: labelForRecurrence(task.recurrence_rule),
				tone: "default",
			});
		}
		if (task.is_pinned) {
			items.push({
				key: "pinned",
				icon: <Ionicons name="bookmark" size={12} color={colors.text.muted} />,
				label: "Pinned",
				tone: "default",
			});
		}
		return items;
	}, [due, isOverdue, task.is_recurring, task.is_pinned, task.recurrence_rule]);

	const railColor = isDone
		? colors.border.strong
		: isArchived
			? colors.border.subtle
			: priorityColor;

	return (
		<Card onPress={onPress} padding="none" elevation="subtle" style={style}>
			<View style={[styles.row, isDone ? styles.rowDone : null]}>
				<View
					style={[
						styles.rail,
						{ backgroundColor: railColor },
						isDone ? styles.railDone : null,
					]}
				/>

				<View style={styles.content}>
					<View style={styles.titleRow}>
						<Text
							style={[styles.title, isDone ? styles.titleDone : null]}
							numberOfLines={2}
						>
							{task.title || "Untitled"}
						</Text>
						<StatusPill label={statusLabel} tone={statusTone} />
					</View>

					{task.description ? (
						<Text
							style={[
								styles.description,
								isDone ? styles.descriptionDone : null,
							]}
							numberOfLines={1}
						>
							{task.description}
						</Text>
					) : null}

					{metaItems.length > 0 ? (
						<View style={styles.metaRow}>
							{metaItems.map((item) => (
								<View key={item.key} style={styles.metaItem}>
									{item.icon}
									<Text
										style={[
											styles.metaLabel,
											item.tone === "danger" ? styles.metaLabelDanger : null,
										]}
										numberOfLines={1}
									>
										{item.label}
									</Text>
								</View>
							))}
						</View>
					) : null}
				</View>
			</View>
		</Card>
	);
}

function StatusPill({ label, tone }) {
	const palette = PILL_PALETTE[tone] ?? PILL_PALETTE.neutral;
	return (
		<View style={[styles.pill, { backgroundColor: palette.bg }]}>
			<View style={[styles.pillDot, { backgroundColor: palette.dot }]} />
			<Text
				style={[styles.pillText, { color: palette.text }]}
				numberOfLines={1}
			>
				{label}
			</Text>
		</View>
	);
}

const PILL_PALETTE = {
	neutral: {
		bg: colors.surface.surfaceMuted,
		dot: colors.text.muted,
		text: colors.text.secondary,
	},
	brand: {
		bg: "rgba(91, 108, 255, 0.10)",
		dot: colors.accent,
		text: colors.accent,
	},
	done: {
		bg: "rgba(16, 185, 129, 0.10)",
		dot: colors.status.done,
		text: colors.status.done,
	},
	muted: {
		bg: colors.surface.surfaceMuted,
		dot: colors.border.strong,
		text: colors.text.muted,
	},
};

export default memo(TaskCard);

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		minHeight: 76,
	},
	rowDone: {
		opacity: 0.78,
	},
	rail: {
		width: 2.5,
		borderTopLeftRadius: radius.lg,
		borderBottomLeftRadius: radius.lg,
		marginVertical: spacing.sm,
	},
	railDone: {
		opacity: 0.5,
	},
	content: {
		flex: 1,
		paddingHorizontal: spacing.base,
		paddingVertical: spacing.md,
		gap: spacing.xs,
		justifyContent: "center",
	},
	titleRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: spacing.sm,
	},
	title: {
		...typography.h3,
		color: colors.text.primary,
		flex: 1,
		fontWeight: "600",
		letterSpacing: -0.1,
	},
	titleDone: {
		textDecorationLine: "line-through",
		color: colors.text.muted,
		fontWeight: "500",
	},
	description: {
		...typography.body,
		color: colors.text.secondary,
	},
	descriptionDone: {
		color: colors.text.muted,
	},
	metaRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "center",
		gap: spacing.md,
		marginTop: spacing.xs,
	},
	metaItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	metaLabel: {
		...typography.caption,
		color: colors.text.secondary,
		fontWeight: "500",
	},
	metaLabelDanger: {
		color: colors.semantic.danger,
		fontWeight: "600",
	},
	pill: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: spacing.sm,
		paddingVertical: 3,
		borderRadius: radius.pill,
		gap: 5,
		maxHeight: 22,
	},
	pillDot: {
		width: 5,
		height: 5,
		borderRadius: 2.5,
	},
	pillText: {
		...typography.caption,
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 0.2,
	},
});
