import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	RefreshControl,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Screen from "../../../src/components/Screen";
import TaskCard from "../../../src/components/TaskCard";
import { TaskService } from "../../../src/services/task.service";

export default function HomeScreen() {
	const router = useRouter();

	const [tasks, setTasks] = useState([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState("");

	const loadTasks = useCallback(async () => {
		setError("");

		const result = await TaskService.getAll();

		if (!result.success) {
			setError(result.message || "Failed to load tasks.");
			setTasks([]);
			return;
		}

		setTasks(Array.isArray(result.data) ? result.data : []);
	}, []);

	useFocusEffect(
		useCallback(() => {
			let mounted = true;

			(async () => {
				if (!mounted) return;
				setLoading(true);
				await loadTasks();
				if (mounted) setLoading(false);
			})();

			return () => {
				mounted = false;
			};
		}, [loadTasks]),
	);

	const handleRefresh = async () => {
		setRefreshing(true);
		await loadTasks();
		setRefreshing(false);
	};

	const handleToggleComplete = async (task) => {
		const nextStatus = task.status === "done" ? "todo" : "done";

		const result = await TaskService.update(task.id, {
			status: nextStatus,
			completed_at: nextStatus === "done" ? new Date().toISOString() : null,
		});

		if (!result.success) {
			Alert.alert("Error", result.message || "Failed to update task.");
			return;
		}

		await loadTasks();
	};

	if (loading) {
		return (
			<View style={styles.center}>
				<ActivityIndicator />
				<Text style={styles.loadingText}>Loading tasks...</Text>
			</View>
		);
	}

	return (
		<Screen>
			<View style={styles.container}>
				<View style={styles.header}>
					<View>
						<Text style={styles.title}>Tasks</Text>
						<Text style={styles.subtitle}>
							{tasks.length} task{tasks.length === 1 ? "" : "s"}
						</Text>
					</View>
				</View>

				{error ? <Text style={styles.error}>{error}</Text> : null}

				<FlatList
					data={tasks}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => (
						<TaskCard
							task={item}
							onPress={() => router.push(`/(app)/tasks/${item.id}`)}
							onToggleComplete={() => handleToggleComplete(item)}
						/>
					)}
					contentContainerStyle={
						tasks.length === 0 ? styles.emptyContainer : styles.listContent
					}
					refreshControl={
						<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
					}
					ListEmptyComponent={
						<View style={styles.emptyState}>
							<Text style={styles.emptyTitle}>No tasks yet</Text>
							<Text style={styles.emptyText}>
								Create your first task to get started.
							</Text>
							<TouchableOpacity
								style={styles.emptyButton}
								onPress={() => router.push("/(app)/(tabs)/create")}
							>
								<Text style={styles.emptyButtonText}>Create Task</Text>
							</TouchableOpacity>
						</View>
					}
				/>
			</View>
		</Screen>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		padding: 16,
	},
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	loadingText: {
		marginTop: 10,
		color: "#666",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 16,
	},
	title: {
		fontSize: 28,
		fontWeight: "700",
		color: "#111",
	},
	subtitle: {
		marginTop: 4,
		color: "#666",
	},
	addButton: {
		backgroundColor: "#111",
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 10,
	},
	addButtonText: {
		color: "#fff",
		fontWeight: "600",
	},
	error: {
		color: "crimson",
		marginBottom: 12,
	},
	listContent: {
		paddingBottom: 24,
	},
	emptyContainer: {
		flexGrow: 1,
	},
	emptyState: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 40,
	},
	emptyTitle: {
		fontSize: 20,
		fontWeight: "700",
		marginBottom: 8,
	},
	emptyText: {
		color: "#666",
		marginBottom: 16,
		textAlign: "center",
	},
	emptyButton: {
		backgroundColor: "#111",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 10,
	},
	emptyButtonText: {
		color: "#fff",
		fontWeight: "600",
	},
});
