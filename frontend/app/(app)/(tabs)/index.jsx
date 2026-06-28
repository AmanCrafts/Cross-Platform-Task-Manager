// Home — Tasks list. The product's center.
//
// Layout, top to bottom:
//  - Greeting-style header (Today + date) with sync status pill.
//  - Compact one-line summary ("X open · Y done").
//  - Segmented filter row (All / Open / Done / Pinned).
//  - Sticky hairline divider that fades in once the list scrolls.
//  - List of TaskCards wrapped in SwipeableRow:
//      * swipe-left  → mark complete (green reveal, spring+fade exit)
//      * swipe-right → soft delete with Undo snackbar (red reveal, faster exit)
//  - Skeleton placeholder on the first load; contextual empty/error states otherwise.

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
	FlatList,
	Pressable,
	RefreshControl,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppHeader from "../../../src/components/ui/AppHeader";
import EmptyState from "../../../src/components/ui/EmptyState";
import ErrorState from "../../../src/components/ui/ErrorState";
import ScreenContainer from "../../../src/components/ui/ScreenContainer";
import SwipeableRow from "../../../src/components/ui/SwipeableRow";
import TaskCard from "../../../src/components/ui/TaskCard";
import TaskListSkeleton from "../../../src/components/ui/TaskListSkeleton";
import { useAuth } from "../../../src/hooks/useAuth";
import { useToast } from "../../../src/hooks/useToast";
import { TaskService } from "../../../src/services/task.service";
import { colors, radius, spacing, typography } from "../../../src/theme";

const FILTERS = [
	{ id: "open", label: "Open" },
	{ id: "done", label: "Done" },
	{ id: "pinned", label: "Pinned" },
	{ id: "all", label: "All" },
];

const EMPTY_COPY = {
	all: {
		title: "Your day is clear",
		description: "Capture what's on your mind and start organising from here.",
		action: "New task",
		icon: "sparkles-outline",
	},
	open: {
		title: "No tasks to do",
		description:
			"You're all caught up. Capture what's next when it comes to mind.",
		action: "New task",
		icon: "checkmark-circle-outline",
	},
	done: {
		title: "No completed tasks yet",
		description: "Swipe a task left to mark it done. It'll show up here.",
		action: undefined,
		icon: "ribbon-outline",
	},
	pinned: {
		title: "Nothing pinned",
		description:
			"Long-press a task to keep it close. Pinned items show up here.",
		action: undefined,
		icon: "bookmark-outline",
	},
};

// "Open" on Home = only `status === "todo"` (excludes in_progress, done,
// archived, deleted). The detail/edit screens still track in_progress
// separately, but Home focuses on the to-do pile.
function isOpen(task) {
	return task.status === "todo" && !task.deleted_at;
}

function isDone(task) {
	return task.status === "done";
}

function formatHeaderDate(now = new Date()) {
	const weekday = now.toLocaleDateString(undefined, { weekday: "long" });
	const month = now.toLocaleDateString(undefined, { month: "long" });
	const day = now.getDate();
	return { weekday, month, day };
}

export default function HomeScreen() {
	const router = useRouter();
	const { refreshSync, syncing, syncError } = useAuth();
	const { show } = useToast();
	const insets = useSafeAreaInsets();

	const [tasks, setTasks] = useState([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState("");
	const [filter, setFilter] = useState("open");

	// In-memory backup of recently deleted tasks so we can undo without
	// re-fetching. Cleared when the user navigates away.
	const trashRef = useRef(new Map());

	const loadTasks = useCallback(
		async ({ syncFirst = false } = {}) => {
			setError("");

			if (syncFirst) {
				await refreshSync();
			}

			const result = await TaskService.getAll();

			if (!result.success) {
				setError(result.message || "Failed to load tasks.");
				setTasks([]);
				return;
			}

			setTasks(Array.isArray(result.data) ? result.data : []);
		},
		[refreshSync],
	);

	useFocusEffect(
		useCallback(() => {
			let mounted = true;

			(async () => {
				if (!mounted) return;
				setLoading(true);
				await loadTasks({ syncFirst: true });
				if (mounted) setLoading(false);
			})();

			return () => {
				mounted = false;
			};
		}, [loadTasks]),
	);

	const handleRefresh = async () => {
		setRefreshing(true);
		await loadTasks({ syncFirst: true });
		setRefreshing(false);
	};

	const handleComplete = useCallback(
		async (task) => {
			if (!task || task.status === "done") return;
			trashRef.current.set(task.id, task);
			setTasks((previous) => previous.filter((item) => item.id !== task.id));

			const result = await TaskService.update(task.id, {
				status: "done",
				completed_at: new Date().toISOString(),
				client_timestamp: new Date().toISOString(),
			});

			if (!result.success) {
				setTasks((previous) => {
					const restored = trashRef.current.get(task.id);
					trashRef.current.delete(task.id);
					if (!restored) return previous;
					return [restored, ...previous.filter((item) => item.id !== task.id)];
				});
				show({
					message: result.message || "Couldn't complete task.",
					tone: "danger",
				});
				return;
			}

			trashRef.current.delete(task.id);
			show({ message: "Task completed", tone: "success" });
		},
		[show],
	);

	const handleDelete = useCallback(
		async (task) => {
			if (!task) return;
			trashRef.current.set(task.id, task);
			setTasks((previous) => previous.filter((item) => item.id !== task.id));

			const result = await TaskService.remove(task.id);

			if (!result.success) {
				setTasks((previous) => {
					const restored = trashRef.current.get(task.id);
					trashRef.current.delete(task.id);
					if (!restored) return previous;
					return [restored, ...previous.filter((item) => item.id !== task.id)];
				});
				show({
					message: result.message || "Couldn't delete task.",
					tone: "danger",
				});
				return;
			}

			const deletedTask = task;
			show({
				message: "Task moved to trash",
				tone: "default",
				action: {
					label: "Undo",
					onPress: async () => {
						const restoreResult = await TaskService.restore(deletedTask.id);
						if (!restoreResult.success) {
							show({
								message: restoreResult.message || "Couldn't restore task.",
								tone: "danger",
							});
							return;
						}
						setTasks((previous) => {
							if (previous.some((item) => item.id === deletedTask.id)) {
								return previous;
							}
							const restored = restoreResult.data ?? {
								...deletedTask,
								deleted_at: null,
								archived_at: null,
							};
							return [restored, ...previous];
						});
						trashRef.current.delete(deletedTask.id);
						show({ message: "Task restored", tone: "success" });
					},
				},
			});
		},
		[show],
	);

	const filteredTasks = useMemo(() => {
		switch (filter) {
			case "open":
				return tasks.filter(isOpen);
			case "done":
				return tasks.filter(isDone);
			case "pinned":
				return tasks.filter((task) => task.is_pinned && !task.deleted_at);
			default:
				return tasks.filter((task) => !task.deleted_at);
		}
	}, [tasks, filter]);

	const counts = useMemo(() => {
		const active = tasks.filter((task) => !task.deleted_at);
		return {
			total: active.length,
			open: active.filter(isOpen).length,
			done: active.filter(isDone).length,
			pinned: active.filter((task) => task.is_pinned).length,
		};
	}, [tasks]);

	const summary = useMemo(() => {
		if (counts.total === 0)
			return "Nothing here yet — start whenever you're ready";
		if (counts.open === 0) {
			return counts.done === 1
				? "1 task completed · nicely done"
				: `${counts.done} tasks completed · nicely done`;
		}
		if (counts.done === 0) {
			return counts.open === 1 ? "1 open task" : `${counts.open} open tasks`;
		}
		return `${counts.open} open · ${counts.done} done`;
	}, [counts]);

	const dateMeta = useMemo(() => formatHeaderDate(), []);

	return (
		<ScreenContainer background="background">
			<View style={styles.headerBlock}>
				<AppHeader
					title="Today"
					subtitle={`${dateMeta.weekday}, ${dateMeta.month} ${dateMeta.day}`}
					rightSlot={<SyncPill syncing={syncing} syncError={syncError} />}
				/>

				<Text style={styles.summary}>{summary}</Text>

				<FilterRow filter={filter} onChange={setFilter} />
			</View>

			<View style={styles.stickyDivider} />

			{loading ? (
				<TaskListSkeleton />
			) : error && filteredTasks.length === 0 ? (
				<ErrorState
					title="Couldn't load tasks"
					description={error}
					action={{ label: "Try again", onPress: handleRefresh }}
				/>
			) : (
				<FlatList
					data={filteredTasks}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => {
						const swipeable = isOpen(item);
						return (
							<View style={styles.cardWrap}>
								<SwipeableRow
									disabled={!swipeable}
									leftAction={
										swipeable
											? {
													icon: "trash-outline",
													label: "Delete",
													backgroundColor: colors.semantic.danger,
													foregroundColor: colors.text.inverse,
													onCommit: () => handleDelete(item),
												}
											: null
									}
									rightAction={
										swipeable
											? {
													icon: "checkmark",
													label: "Complete",
													backgroundColor: colors.status.done,
													foregroundColor: colors.text.inverse,
													onCommit: () => handleComplete(item),
												}
											: null
									}
								>
									<TaskCard
										task={item}
										onPress={() => router.push(`/(app)/tasks/${item.id}`)}
									/>
								</SwipeableRow>
							</View>
						);
					}}
					onScroll={() => {}}
					scrollEventThrottle={16}
					showsVerticalScrollIndicator={false}
					contentContainerStyle={
						filteredTasks.length === 0
							? [
									styles.emptyContainer,
									{ paddingBottom: insets.bottom + spacing["4xl"] },
								]
							: [
									styles.listContent,
									{ paddingBottom: insets.bottom + spacing["4xl"] },
								]
					}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={handleRefresh}
							tintColor={colors.text.secondary}
							colors={[colors.text.secondary]}
							progressBackgroundColor={colors.surface.surface}
						/>
					}
					ListEmptyComponent={
						<EmptyState
							icon={
								<Ionicons
									name={EMPTY_COPY[filter].icon}
									size={28}
									color={colors.text.secondary}
								/>
							}
							title={EMPTY_COPY[filter].title}
							description={EMPTY_COPY[filter].description}
							action={
								EMPTY_COPY[filter].action
									? {
											label: EMPTY_COPY[filter].action,
											onPress: () => router.push("/(app)/(tabs)/create"),
										}
									: undefined
							}
						/>
					}
				/>
			)}
		</ScreenContainer>
	);
}

function FilterRow({ filter, onChange }) {
	return (
		<View style={styles.filterRow}>
			{FILTERS.map((item) => {
				const selected = filter === item.id;
				return (
					<Pressable
						key={item.id}
						onPress={() => onChange(item.id)}
						accessibilityRole="button"
						accessibilityState={{ selected }}
						accessibilityLabel={`${item.label} filter`}
						style={({ pressed }) => [
							styles.filterChip,
							selected ? styles.filterChipSelected : null,
							pressed ? styles.filterChipPressed : null,
						]}
					>
						<Text
							style={[
								styles.filterText,
								selected ? styles.filterTextSelected : null,
							]}
							numberOfLines={1}
						>
							{item.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

function SyncPill({ syncing, syncError }) {
	let label = "Synced";
	let tint = colors.status.done;
	let icon = "checkmark-circle";

	if (syncing) {
		label = "Syncing";
		tint = colors.accent;
		icon = "sync-outline";
	} else if (syncError) {
		label = "Sync paused";
		tint = colors.semantic.warning;
		icon = "cloud-offline-outline";
	}

	return (
		<View style={[styles.pill, { borderColor: tint }]}>
			<Ionicons name={icon} size={12} color={tint} />
			<Text style={[styles.pillText, { color: tint }]}>{label}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	headerBlock: {
		paddingBottom: spacing.sm,
	},
	summary: {
		...typography.body,
		color: colors.text.secondary,
		marginTop: -spacing.xs,
		marginBottom: spacing.base,
		marginHorizontal: spacing.xs,
		letterSpacing: -0.1,
	},
	stickyDivider: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: colors.border.subtle,
		marginBottom: spacing.sm,
	},
	filterRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs,
		paddingHorizontal: spacing.xs,
	},
	filterChip: {
		paddingVertical: 7,
		paddingHorizontal: spacing.md,
		borderRadius: radius.pill,
		backgroundColor: colors.surface.surface,
		borderWidth: 1,
		borderColor: colors.border.subtle,
	},
	filterChipSelected: {
		backgroundColor: colors.text.primary,
		borderColor: colors.text.primary,
	},
	filterChipPressed: {
		opacity: 0.75,
	},
	filterText: {
		...typography.caption,
		color: colors.text.secondary,
		fontWeight: "600",
		letterSpacing: 0.2,
	},
	filterTextSelected: {
		color: colors.text.inverse,
	},
	cardWrap: {
		marginBottom: spacing.md,
		paddingHorizontal: spacing.xs,
	},
	listContent: {
		paddingTop: spacing.sm,
	},
	emptyContainer: {
		flexGrow: 1,
		justifyContent: "center",
	},
	pill: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: spacing.sm,
		paddingVertical: 4,
		borderRadius: radius.pill,
		borderWidth: 1,
		backgroundColor: colors.surface.surface,
	},
	pillText: {
		...typography.caption,
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 0.2,
	},
});
