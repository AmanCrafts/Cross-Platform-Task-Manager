// ConfirmationModal — bottom-sheet modal with backdrop fade and slide-up.
// Reanimated-driven so transitions feel intentional without being heavy.

import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import {
	Dimensions,
	Modal,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import {
	colors,
	motion,
	radius,
	shadows,
	spacing,
	typography,
} from "../../theme";

const SCREEN_HEIGHT = Dimensions.get("window").height;

const TONE_COLOR = {
	default: colors.brand.primary,
	danger: colors.semantic.danger,
};

export default function ConfirmationModal({
	visible,
	title,
	description,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	tone = "default",
	loading = false,
	onConfirm,
	onCancel,
}) {
	const opacity = useSharedValue(0);
	const translateY = useSharedValue(SCREEN_HEIGHT);

	useEffect(() => {
		if (visible) {
			opacity.value = withTiming(1, {
				duration: motion.presets.modalBackdrop.duration,
				easing: Easing.bezier(...motion.presets.modalBackdrop.easing),
			});
			translateY.value = withTiming(0, {
				duration: motion.presets.modalSheet.duration,
				easing: Easing.bezier(...motion.presets.modalSheet.easing),
			});
		} else {
			opacity.value = withTiming(0, {
				duration: motion.presets.modalBackdrop.duration,
				easing: Easing.bezier(...motion.easings.accelerate),
			});
			translateY.value = withTiming(SCREEN_HEIGHT, {
				duration: motion.presets.modalSheet.duration,
				easing: Easing.bezier(...motion.easings.accelerate),
			});
		}
	}, [visible, opacity, translateY]);

	const backdropStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));
	const sheetStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
	}));

	return (
		<Modal
			visible={visible}
			transparent
			animationType="none"
			statusBarTranslucent
			onRequestClose={onCancel}
		>
			<View style={styles.container}>
				<Animated.View style={[styles.backdrop, backdropStyle]}>
					<Pressable
						style={StyleSheet.absoluteFill}
						onPress={loading ? undefined : onCancel}
					/>
				</Animated.View>

				<Animated.View style={[styles.sheet, sheetStyle]}>
					{tone === "danger" ? (
						<View style={styles.iconCircle}>
							<Ionicons
								name="trash-outline"
								size={22}
								color={colors.semantic.danger}
							/>
						</View>
					) : null}

					<Text style={styles.title}>{title}</Text>
					{description ? (
						<Text style={styles.description}>{description}</Text>
					) : null}

					<View style={styles.actions}>
						<Pressable
							onPress={loading ? undefined : onCancel}
							disabled={loading}
							style={({ pressed }) => [
								styles.actionButton,
								pressed && !loading ? styles.actionPressed : null,
								loading ? styles.actionDisabled : null,
							]}
						>
							<Text style={styles.cancelLabel}>{cancelLabel}</Text>
						</Pressable>

						<Pressable
							onPress={loading ? undefined : onConfirm}
							disabled={loading}
							accessibilityRole="button"
							style={({ pressed }) => [
								styles.confirmButton,
								{ backgroundColor: TONE_COLOR[tone] ?? colors.brand.primary },
								pressed && !loading ? styles.confirmPressed : null,
								loading ? styles.actionDisabled : null,
							]}
						>
							<Text style={styles.confirmLabel}>{confirmLabel}</Text>
						</Pressable>
					</View>
				</Animated.View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "flex-end",
	},
	backdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: colors.scrim,
	},
	sheet: {
		backgroundColor: colors.surface.surface,
		borderTopLeftRadius: radius.xl,
		borderTopRightRadius: radius.xl,
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.lg,
		paddingBottom: spacing["3xl"],
		...shadows.floating,
	},
	iconCircle: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: colors.surface.surfaceMuted,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: spacing.md,
	},
	title: {
		...typography.h2,
		color: colors.text.primary,
		marginBottom: spacing.sm,
	},
	description: {
		...typography.bodyLg,
		color: colors.text.secondary,
		marginBottom: spacing.xl,
	},
	actions: {
		flexDirection: "row",
		gap: spacing.md,
	},
	actionButton: {
		flex: 1,
		minHeight: 52,
		borderRadius: radius.lg,
		backgroundColor: colors.surface.surfaceMuted,
		alignItems: "center",
		justifyContent: "center",
	},
	cancelLabel: {
		...typography.bodyLg,
		color: colors.text.primary,
		fontWeight: "600",
	},
	actionPressed: {
		opacity: 0.7,
	},
	actionDisabled: {
		opacity: 0.5,
	},
	confirmButton: {
		flex: 1,
		minHeight: 52,
		borderRadius: radius.lg,
		alignItems: "center",
		justifyContent: "center",
	},
	confirmPressed: {
		opacity: 0.85,
	},
	confirmLabel: {
		...typography.bodyLg,
		color: colors.text.inverse,
		fontWeight: "600",
	},
});
