import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

function formatDate(value) {
	if (!value) return null;

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;

	return date.toLocaleDateString();
}

function TaskCard({ task, onPress, onToggleComplete, onDelete }) {
	const completed =
		task.status === "done" || !!task.completed_at || !!task.deleted_at;

	return (
		<TouchableOpacity
			activeOpacity={0.85}
			style={[styles.card, completed && styles.cardCompleted]}
			onPress={onPress}
		>
			<View style={styles.headerRow}>
				<View style={styles.titleRow}>
					<View style={[styles.statusDot, completed && styles.statusDotDone]} />
					<Text
						style={[styles.title, completed && styles.titleCompleted]}
						numberOfLines={1}
					>
						{task.title}
					</Text>
				</View>

				<Text style={styles.badge}>{task.priority}</Text>
			</View>

			{task.description ? (
				<Text
					style={[styles.description, completed && styles.descriptionCompleted]}
					numberOfLines={2}
				>
					{task.description}
				</Text>
			) : null}

			<View style={styles.metaRow}>
				{task.due_at ? (
					<Text style={styles.metaText}>Due: {formatDate(task.due_at)}</Text>
				) : (
					<Text style={styles.metaText}>No due date</Text>
				)}

				<Text style={styles.metaText}>{task.status}</Text>
			</View>

			{/* Stop touch events from bubbling to the outer card TouchableOpacity.
			    Without this, tapping Delete also fires onPress (navigation),
			    which dismisses the Alert before the user can confirm. */}
			<View style={styles.actionsRow} onStartShouldSetResponder={() => true}>
				<TouchableOpacity
					style={[styles.actionButton, completed && styles.actionButtonActive]}
					onPress={onToggleComplete}
					activeOpacity={0.8}
				>
					<Text style={styles.actionButtonText}>
						{completed ? "Mark Active" : "Mark Done"}
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.deleteButton}
					onPress={onDelete}
					activeOpacity={0.8}
				>
					<Text style={styles.deleteButtonText}>Delete</Text>
				</TouchableOpacity>
			</View>
		</TouchableOpacity>
	);
}

export default memo(TaskCard);

const styles = StyleSheet.create({
	card: {
		borderWidth: 1,
		borderColor: "#e5e5e5",
		borderRadius: 16,
		padding: 14,
		marginBottom: 12,
		backgroundColor: "#fff",
	},
	cardCompleted: {
		opacity: 0.9,
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 10,
	},
	titleRow: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
		paddingRight: 12,
	},
	statusDot: {
		width: 10,
		height: 10,
		borderRadius: 999,
		backgroundColor: "#111",
		marginRight: 10,
	},
	statusDotDone: {
		backgroundColor: "green",
	},
	title: {
		fontSize: 17,
		fontWeight: "700",
		color: "#111",
		flex: 1,
	},
	titleCompleted: {
		textDecorationLine: "line-through",
		color: "#777",
	},
	badge: {
		fontSize: 12,
		textTransform: "uppercase",
		color: "#444",
		borderWidth: 1,
		borderColor: "#ddd",
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 999,
	},
	description: {
		color: "#444",
		marginBottom: 10,
		lineHeight: 20,
	},
	descriptionCompleted: {
		color: "#888",
	},
	metaRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 12,
	},
	metaText: {
		fontSize: 12,
		color: "#666",
	},
	actionsRow: {
		flexDirection: "row",
		gap: 10,
	},
	actionButton: {
		flex: 1,
		paddingVertical: 10,
		borderRadius: 10,
		backgroundColor: "#111",
		alignItems: "center",
	},
	actionButtonActive: {
		backgroundColor: "#2c6e49",
	},
	actionButtonText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 13,
	},
	deleteButton: {
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 10,
		backgroundColor: "#f4f4f4",
		alignItems: "center",
	},
	deleteButtonText: {
		color: "#b00020",
		fontWeight: "700",
		fontSize: 13,
	},
});
