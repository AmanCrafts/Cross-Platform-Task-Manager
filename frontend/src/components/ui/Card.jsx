// Card — soft rounded surface. Optional onPress makes it pressable with
// scale feedback. Three elevation levels: subtle (border only), card
// (shadow), floating (heavy shadow).

import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { usePressScale } from "../../hooks/usePressScale";
import { colors, radius, shadows, spacing } from "../../theme";

const PADDING = {
	none: 0,
	sm: spacing.sm,
	md: spacing.base,
	lg: spacing.lg,
};

export default function Card({
	children,
	onPress,
	padding = "md",
	elevation = "subtle",
	style,
}) {
	const { scale, onPressIn, onPressOut } = usePressScale({ variant: "card" });
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const interactive = Boolean(onPress);

	const containerStyle = [
		styles.base,
		elevation === "none"
			? null
			: elevation === "subtle"
				? styles.bordered
				: elevation === "raised"
					? shadows.card
					: shadows.floating,
		{ padding: PADDING[padding] ?? PADDING.md },
		style,
	];

	if (!interactive) {
		return <View style={containerStyle}>{children}</View>;
	}

	return (
		<Animated.View style={[animatedStyle, style]}>
			<Pressable
				onPress={onPress}
				onPressIn={onPressIn}
				onPressOut={onPressOut}
				style={({ pressed }) => [
					styles.base,
					elevation === "none"
						? null
						: elevation === "subtle"
							? styles.bordered
							: elevation === "raised"
								? shadows.card
								: shadows.floating,
					{ padding: PADDING[padding] ?? PADDING.md },
					pressed ? styles.pressed : null,
				]}
			>
				{children}
			</Pressable>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	base: {
		backgroundColor: colors.surface.surface,
		borderRadius: radius.lg,
	},
	bordered: {
		borderWidth: 1,
		borderColor: colors.border.subtle,
	},
	pressed: {
		backgroundColor: colors.surface.surfaceMuted,
	},
});
