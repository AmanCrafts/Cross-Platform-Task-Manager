// LoadingState — centered ActivityIndicator with optional label.

import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../../theme";

export default function LoadingState({ label, style }) {
	return (
		<View style={[styles.container, style]}>
			<ActivityIndicator color={colors.text.primary} size="small" />
			{label ? <Text style={styles.label}>{label}</Text> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: spacing.xl,
		gap: spacing.md,
	},
	label: {
		...typography.body,
		color: colors.text.secondary,
		textAlign: "center",
	},
});
