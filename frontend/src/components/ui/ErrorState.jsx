// ErrorState — centered alert icon + title + description + retry.

import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../../theme";
import SecondaryButton from "./SecondaryButton";

export default function ErrorState({
	title = "Something went wrong",
	description,
	action,
	style,
}) {
	return (
		<View style={[styles.container, style]}>
			<View style={styles.iconCircle}>
				<Ionicons
					name="alert-circle-outline"
					size={28}
					color={colors.semantic.danger}
				/>
			</View>
			<Text style={styles.title}>{title}</Text>
			{description ? (
				<Text style={styles.description}>{description}</Text>
			) : null}
			{action ? (
				<View style={styles.action}>
					<SecondaryButton
						label={action.label}
						onPress={action.onPress}
						fullWidth={false}
					/>
				</View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		justifyContent: "center",
		padding: spacing.xl,
		gap: spacing.sm,
	},
	iconCircle: {
		width: 64,
		height: 64,
		borderRadius: radius.xl,
		backgroundColor: colors.semantic.dangerBg,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: spacing.sm,
	},
	title: {
		...typography.h3,
		color: colors.text.primary,
		textAlign: "center",
		letterSpacing: -0.1,
	},
	description: {
		...typography.body,
		color: colors.text.secondary,
		textAlign: "center",
		maxWidth: 320,
		lineHeight: 22,
	},
	action: {
		marginTop: spacing.md,
	},
});
