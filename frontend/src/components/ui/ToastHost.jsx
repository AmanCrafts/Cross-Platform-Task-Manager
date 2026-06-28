// ToastHost — top-level component mounted in app/_layout.jsx.
// Subscribes to useToast subscription and renders the latest toast as
// a top pill with slide-down + fade-in. Auto-dismisses after duration.

import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToastSubscription } from "../../hooks/useToast";
import {
	colors,
	motion,
	radius,
	shadows,
	spacing,
	typography,
} from "../../theme";

const TONE_BG = {
	default: colors.text.primary,
	success: colors.semantic.success,
	danger: colors.semantic.danger,
	warning: colors.semantic.warning,
	info: colors.semantic.info,
};

export default function ToastHost() {
	const insets = useSafeAreaInsets();
	const { current, clear } = useToastSubscription();

	const translateY = useSharedValue(-80);
	const opacity = useSharedValue(0);

	useEffect(() => {
		if (!current) return;
		translateY.value = withTiming(0, {
			duration: motion.presets.snackbar.duration,
			easing: Easing.bezier(...motion.presets.snackbar.easing),
		});
		opacity.value = withTiming(1, {
			duration: motion.presets.snackbar.duration,
			easing: Easing.bezier(...motion.presets.snackbar.easing),
		});

		const timeout = setTimeout(() => {
			translateY.value = withTiming(-80, {
				duration: motion.presets.snackbar.duration,
				easing: Easing.bezier(...motion.easings.accelerate),
			});
			opacity.value = withTiming(0, {
				duration: motion.presets.snackbar.duration,
				easing: Easing.bezier(...motion.easings.accelerate),
			});
			setTimeout(clear, motion.presets.snackbar.duration);
		}, current.durationMs ?? 2500);

		return () => clearTimeout(timeout);
	}, [current, clear, translateY, opacity]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
		opacity: opacity.value,
	}));

	if (!current) return null;

	const bg = TONE_BG[current.tone] ?? TONE_BG.default;
	const hasAction = Boolean(current.action);

	return (
		<View
			pointerEvents={hasAction ? "box-none" : "none"}
			style={[styles.container, { top: insets.top + spacing.sm }]}
		>
			<Animated.View
				style={[styles.pill, { backgroundColor: bg }, animatedStyle]}
			>
				<Text style={styles.message} numberOfLines={2}>
					{current.message}
				</Text>
				{hasAction ? (
					<Pressable
						onPress={() => {
							current.action?.onPress?.();
							clear();
						}}
						accessibilityRole="button"
						accessibilityLabel={current.action.label}
						hitSlop={8}
						style={({ pressed }) => [
							styles.actionButton,
							pressed ? styles.actionPressed : null,
						]}
					>
						<Text style={styles.actionText}>{current.action.label}</Text>
					</Pressable>
				) : null}
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		left: 0,
		right: 0,
		alignItems: "center",
		zIndex: 999,
	},
	pill: {
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
		borderRadius: radius.pill,
		maxWidth: "90%",
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
		...shadows.floating,
	},
	message: {
		...typography.body,
		color: colors.text.inverse,
		fontWeight: "600",
		textAlign: "center",
		flexShrink: 1,
	},
	actionButton: {
		paddingVertical: 4,
		paddingHorizontal: spacing.sm,
		borderRadius: radius.sm,
	},
	actionPressed: {
		opacity: 0.6,
	},
	actionText: {
		...typography.body,
		color: colors.text.inverse,
		fontWeight: "700",
		letterSpacing: 0.3,
		textTransform: "uppercase",
		fontSize: 13,
	},
});
