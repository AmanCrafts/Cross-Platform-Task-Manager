import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	RefreshControl,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { TaskService } from "../../src/services/task.service";

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
			setError(result.message);
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

	const renderTask = ({ item }) => (
		<View style={styles.taskCard}>
			<View style={styles.taskRow}>
				<Text style={styles.taskTitle}>{item.title}</Text>
				<Text style={styles.taskStatus}>{item.status}</Text>
			</View>

			{item.description ? (
				<Text style={styles.taskDescription}>{item.description}</Text>
			) : null}

			<View style={styles.metaRow}>
				<Text style={styles.metaText}>Priority: {item.priority}</Text>
				{item.due_at ? (
					<Text style={styles.metaText}>
						Due: {new Date(item.due_at).toLocaleDateString()}
					</Text>
				) : null}
			</View>
		</View>
	);

	if (loading) {
		return (
			<View style={styles.center}>
				<ActivityIndicator />
				<Text style={styles.loadingText}>Loading tasks...</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<View>
					<Text style={styles.title}>Tasks</Text>
					<Text style={styles.subtitle}>
						{tasks.length} task{tasks.length === 1 ? "" : "s"}
					</Text>
				</View>

				<TouchableOpacity
					style={styles.addButton}
					onPress={() => router.push("/(app)/tasks/create")}
				>
					<Text style={styles.addButtonText}>+ New</Text>
				</TouchableOpacity>
			</View>

			{error ? <Text style={styles.error}>{error}</Text> : null}

			<FlatList
				data={tasks}
				keyExtractor={(item) => item.id}
				renderItem={renderTask}
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
							onPress={() => router.push("/(app)/tasks/create")}
						>
							<Text style={styles.emptyButtonText}>Create Task</Text>
						</TouchableOpacity>
					</View>
				}
			/>
		</View>
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
	taskCard: {
		borderWidth: 1,
		borderColor: "#e5e5e5",
		borderRadius: 14,
		padding: 14,
		marginBottom: 12,
		backgroundColor: "#fafafa",
	},
	taskRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 6,
	},
	taskTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#111",
		flex: 1,
		paddingRight: 12,
	},
	taskStatus: {
		fontSize: 12,
		color: "#555",
		textTransform: "uppercase",
	},
	taskDescription: {
		color: "#444",
		marginBottom: 10,
	},
	metaRow: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	metaText: {
		fontSize: 12,
		color: "#666",
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
