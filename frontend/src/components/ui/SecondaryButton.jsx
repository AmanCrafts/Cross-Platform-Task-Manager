// SecondaryButton — outlined action, paired with PrimaryButton.
// Same press feedback and shape, surface bg + 1px border + primary text.

import {
	ActivityIndicator,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { usePressScale } from "../../hooks/usePressScale";
import { colors, radius, spacing, typography } from "../../theme";

export default function SecondaryButton({
	label,
	onPress,
	loading = false,
	disabled = false,
	size = "md",
	fullWidth = true,
	leftIcon,
	style,
}) {
	const { scale, onPressIn, onPressOut } = usePressScale({ variant: "press" });

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const isDisabled = disabled || loading;

	return (
		<Animated.View
			style={[fullWidth ? styles.fullWidth : null, animatedStyle, style]}
		>
			<Pressable
				onPress={onPress}
				onPressIn={onPressIn}
				onPressOut={onPressOut}
				disabled={isDisabled}
				accessibilityRole="button"
				accessibilityState={{ disabled: isDisabled, busy: loading }}
				accessibilityLabel={typeof label === "string" ? label : undefined}
				style={({ pressed }) => [
					styles.base,
					size === "lg" ? styles.sizeLg : styles.sizeMd,
					pressed && !isDisabled ? styles.pressed : null,
					isDisabled ? styles.disabled : null,
				]}
			>
				{loading ? (
					<ActivityIndicator color={colors.text.primary} />
				) : (
					<View style={styles.content}>
						{leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
						<Text style={[styles.label, size === "lg" ? styles.labelLg : null]}>
							{label}
						</Text>
					</View>
				)}
			</Pressable>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	fullWidth: {
		width: "100%",
	},
	base: {
		backgroundColor: colors.surface.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border.default,
		alignItems: "center",
		justifyContent: "center",
	},
	sizeMd: {
		paddingVertical: spacing.md - 1,
		paddingHorizontal: spacing.lg,
		minHeight: 48,
	},
	sizeLg: {
		paddingVertical: spacing.base - 1,
		paddingHorizontal: spacing.xl,
		minHeight: 56,
	},
	pressed: {
		backgroundColor: colors.surface.surfaceMuted,
	},
	disabled: {
		opacity: 0.5,
	},
	content: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
	},
	icon: {},
	label: {
		...typography.bodyLg,
		color: colors.text.primary,
		fontWeight: "600",
	},
	labelLg: {
		fontSize: 17,
	},
});
