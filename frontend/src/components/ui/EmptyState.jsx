// EmptyState — centered placeholder for empty lists / screens.
// 72px icon circle + h3 title + body description + optional action.

import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../../theme";
import SecondaryButton from "./SecondaryButton";

export default function EmptyState({
	icon,
	title,
	description,
	action,
	style,
}) {
	return (
		<View style={[styles.container, style]}>
			{icon ? <View style={styles.iconCircle}>{icon}</View> : null}
			{title ? <Text style={styles.title}>{title}</Text> : null}
			{description ? (
				<Text style={styles.description}>{description}</Text>
			) : null}
			{action ? (
				<View style={styles.action}>
					<SecondaryButton
						label={action.label}
						onPress={action.onPress}
						fullWidth={false}
						size="md"
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
		paddingHorizontal: spacing.xl,
		paddingVertical: spacing["4xl"],
		gap: spacing.sm,
	},
	iconCircle: {
		width: 72,
		height: 72,
		borderRadius: radius.xl,
		backgroundColor: colors.surface.surfaceMuted,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: spacing.md,
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
		marginTop: spacing.lg,
	},
});
