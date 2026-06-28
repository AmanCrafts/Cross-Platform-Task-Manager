// TextButton — tertiary, text-only action. Used for navigation links,
// "Sign out", and header trailing actions. Min 44pt hit area for a11y.

import { Pressable, StyleSheet, Text } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { usePressScale } from "../../hooks/usePressScale";
import { colors, spacing, typography } from "../../theme";

const TONE_COLOR = {
	brand: colors.accent,
	danger: colors.semantic.danger,
	muted: colors.text.muted,
	primary: colors.text.primary,
};

export default function TextButton({
	label,
	onPress,
	disabled = false,
	fullWidth = false,
	tone = "brand",
	size = "md",
	style,
}) {
	const { scale, onPressIn, onPressOut } = usePressScale({ variant: "press" });

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const color = TONE_COLOR[tone] ?? colors.accent;

	return (
		<Animated.View
			style={[fullWidth ? styles.fullWidth : animatedStyle, style]}
		>
			<Pressable
				onPress={onPress}
				onPressIn={onPressIn}
				onPressOut={onPressOut}
				disabled={disabled}
				accessibilityRole="button"
				accessibilityState={{ disabled }}
				accessibilityLabel={typeof label === "string" ? label : undefined}
				style={({ pressed }) => [
					styles.base,
					size === "lg" ? styles.sizeLg : styles.sizeMd,
					pressed && !disabled ? styles.pressed : null,
					disabled ? styles.disabled : null,
				]}
			>
				<Text
					style={[
						styles.label,
						size === "lg" ? styles.labelLg : null,
						{ color },
					]}
				>
					{label}
				</Text>
			</Pressable>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	fullWidth: {
		width: "100%",
	},
	base: {
		alignItems: "center",
		justifyContent: "center",
		minHeight: 44,
		paddingHorizontal: spacing.md,
		borderRadius: 10,
	},
	sizeMd: {},
	sizeLg: {
		minHeight: 52,
	},
	pressed: {
		opacity: 0.6,
	},
	disabled: {
		opacity: 0.4,
	},
	label: {
		...typography.body,
		fontWeight: "600",
	},
	labelLg: {
		fontSize: 17,
	},
});
