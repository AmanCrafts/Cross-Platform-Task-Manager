// Chip — pill-shaped selectable / display element.
// Used in priority/status rows in TaskForm, filter rows on Home, and
// status badges in TaskCard / AppHeader.

import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { usePressScale } from "../../hooks/usePressScale";
import { colors, radius, spacing, typography } from "../../theme";

// Lookup table for tones. Returns { bg, fg, border } for each tone.
// Priority/status tones use calm pastel backgrounds with darker text.
const TONES = {
	neutral: {
		selectedBg: colors.text.primary,
		selectedFg: colors.text.inverse,
		bg: colors.surface.surfaceMuted,
		fg: colors.text.primary,
		border: colors.border.subtle,
	},
	brand: {
		selectedBg: colors.accent,
		selectedFg: colors.text.inverse,
		bg: colors.surface.surfaceMuted,
		fg: colors.accent,
		border: colors.border.subtle,
	},
	"priority-low": {
		selectedBg: colors.priority.low,
		selectedFg: "#3730A3",
		bg: colors.surface.surface,
		fg: "#3730A3",
		border: colors.priority.low,
	},
	"priority-medium": {
		selectedBg: colors.priority.medium,
		selectedFg: "#1F1F1F",
		bg: colors.surface.surface,
		fg: "#1F1F1F",
		border: colors.priority.medium,
	},
	"priority-high": {
		selectedBg: colors.priority.high,
		selectedFg: "#78350F",
		bg: colors.surface.surface,
		fg: "#92400E",
		border: colors.priority.high,
	},
	"priority-urgent": {
		selectedBg: colors.priority.urgent,
		selectedFg: "#7F1D1D",
		bg: colors.surface.surface,
		fg: "#991B1B",
		border: colors.priority.urgent,
	},
	"status-todo": {
		selectedBg: colors.status.todo,
		selectedFg: colors.text.inverse,
		bg: colors.surface.surfaceMuted,
		fg: colors.text.secondary,
		border: colors.border.subtle,
	},
	"status-in_progress": {
		selectedBg: colors.status.in_progress,
		selectedFg: colors.text.inverse,
		bg: colors.surface.surfaceMuted,
		fg: colors.accent,
		border: colors.border.subtle,
	},
	"status-done": {
		selectedBg: colors.status.done,
		selectedFg: colors.text.inverse,
		bg: colors.surface.surfaceMuted,
		fg: "#047857",
		border: colors.border.subtle,
	},
	"status-archived": {
		selectedBg: colors.status.archived,
		selectedFg: colors.text.primary,
		bg: colors.surface.surfaceMuted,
		fg: colors.text.muted,
		border: colors.border.subtle,
	},
};

export default function Chip({
	label,
	selected = false,
	onPress,
	icon,
	tone = "neutral",
	size = "md",
	disabled = false,
	style,
}) {
	const { scale, onPressIn, onPressOut } = usePressScale({ variant: "press" });
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const palette = TONES[tone] ?? TONES.neutral;
	const bg = selected ? palette.selectedBg : palette.bg;
	const fg = selected ? palette.selectedFg : palette.fg;
	const borderColor = selected ? "transparent" : palette.border;

	const sizeStyle = size === "sm" ? styles.sizeSm : styles.sizeMd;
	const labelStyle = size === "sm" ? styles.labelSm : styles.labelMd;

	const interactive = Boolean(onPress) && !disabled;

	return (
		<Animated.View style={[animatedStyle, style]}>
			<Pressable
				onPress={interactive ? onPress : undefined}
				onPressIn={interactive ? onPressIn : undefined}
				onPressOut={interactive ? onPressOut : undefined}
				disabled={!interactive}
				accessibilityRole={interactive ? "button" : undefined}
				accessibilityState={{ selected, disabled }}
				style={({ pressed }) => [
					styles.base,
					sizeStyle,
					{
						backgroundColor: bg,
						borderColor,
						borderWidth: 1,
					},
					pressed && interactive ? styles.pressed : null,
					disabled ? styles.disabled : null,
				]}
			>
				{icon ? <View style={styles.icon}>{icon}</View> : null}
				<Text style={[labelStyle, { color: fg }]}>{label}</Text>
			</Pressable>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	base: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs,
		borderRadius: radius.pill,
	},
	sizeMd: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		minHeight: 36,
	},
	sizeSm: {
		paddingHorizontal: spacing.md,
		paddingVertical: 6,
		minHeight: 30,
	},
	labelMd: {
		...typography.caption,
		fontWeight: "600",
	},
	labelSm: {
		fontSize: 12,
		lineHeight: 16,
		fontWeight: "600",
	},
	icon: {
		marginRight: 0,
	},
	pressed: {
		opacity: 0.85,
	},
	disabled: {
		opacity: 0.5,
	},
});
