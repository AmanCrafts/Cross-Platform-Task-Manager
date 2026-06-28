// SelectSheet — bottom-sheet modal that lists options for single-select.
// Built on the same Reanimated backdrop + sheet pattern as ConfirmationModal.
// Reusable for any future single-select field.

import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import {
	Dimensions,
	Modal,
	Pressable,
	ScrollView,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
	colors,
	motion,
	radius,
	shadows,
	spacing,
	typography,
} from "../../theme";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function SelectSheet({
	visible,
	title,
	value,
	options,
	onChange,
	onClose,
}) {
	const insets = useSafeAreaInsets();
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
			onRequestClose={onClose}
		>
			<View style={styles.container}>
				<Animated.View style={[styles.backdrop, backdropStyle]}>
					<Pressable
						style={StyleSheet.absoluteFill}
						onPress={onClose}
						accessibilityRole="button"
						accessibilityLabel="Close"
					/>
				</Animated.View>

				<Animated.View
					style={[
						styles.sheet,
						{ paddingBottom: insets.bottom + spacing.lg },
						sheetStyle,
					]}
				>
					<View style={styles.grabber} />

					{title ? <Text style={styles.title}>{title}</Text> : null}

					<ScrollView
						style={styles.optionsScroll}
						contentContainerStyle={styles.optionsContent}
						showsVerticalScrollIndicator={false}
					>
						{options.map((option, index) => {
							const selected = option.value === value;
							return (
								<Pressable
									key={option.value || `__option_${index}`}
									onPress={() => {
										onChange?.(option.value);
										onClose?.();
									}}
									accessibilityRole="button"
									accessibilityState={{ selected }}
									accessibilityLabel={option.label}
									style={({ pressed }) => [
										styles.optionRow,
										index === 0 ? styles.optionRowFirst : null,
										index === options.length - 1 ? styles.optionRowLast : null,
										pressed ? styles.optionRowPressed : null,
									]}
								>
									<Text
										style={[
											styles.optionLabel,
											selected ? styles.optionLabelSelected : null,
										]}
									>
										{option.label}
									</Text>
									{selected ? (
										<Ionicons
											name="checkmark"
											size={22}
											color={colors.accent}
										/>
									) : null}
								</Pressable>
							);
						})}
					</ScrollView>

					<Pressable
						onPress={onClose}
						accessibilityRole="button"
						style={({ pressed }) => [
							styles.cancelButton,
							pressed ? styles.cancelPressed : null,
						]}
					>
						<Text style={styles.cancelText}>Cancel</Text>
					</Pressable>
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
		paddingTop: spacing.sm,
		...shadows.floating,
	},
	grabber: {
		alignSelf: "center",
		width: 40,
		height: 4,
		borderRadius: 2,
		backgroundColor: colors.border.strong,
		marginBottom: spacing.md,
	},
	title: {
		...typography.h3,
		color: colors.text.primary,
		marginBottom: spacing.md,
	},
	optionsScroll: {
		maxHeight: SCREEN_HEIGHT * 0.6,
	},
	optionsContent: {
		borderRadius: radius.md,
		backgroundColor: colors.surface.surfaceMuted,
		overflow: "hidden",
		marginBottom: spacing.md,
	},
	optionRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: spacing.base,
		paddingVertical: spacing.md,
		minHeight: 56,
		backgroundColor: colors.surface.surfaceMuted,
	},
	optionRowFirst: {
		borderTopLeftRadius: radius.md,
		borderTopRightRadius: radius.md,
	},
	optionRowLast: {
		borderBottomLeftRadius: radius.md,
		borderBottomRightRadius: radius.md,
	},
	optionRowPressed: {
		backgroundColor: colors.border.subtle,
	},
	optionLabel: {
		...typography.bodyLg,
		color: colors.text.primary,
	},
	optionLabelSelected: {
		fontWeight: "600",
	},
	cancelButton: {
		minHeight: 52,
		borderRadius: radius.lg,
		backgroundColor: colors.surface.surfaceMuted,
		alignItems: "center",
		justifyContent: "center",
	},
	cancelPressed: {
		backgroundColor: colors.border.subtle,
	},
	cancelText: {
		...typography.bodyLg,
		color: colors.text.primary,
		fontWeight: "600",
	},
});
