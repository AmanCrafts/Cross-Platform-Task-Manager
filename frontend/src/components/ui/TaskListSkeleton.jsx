// TaskListSkeleton — placeholder shown on the initial Tasks screen load.
// Three shimmering rows that suggest the eventual content shape without
// imitating it. Used while data is being fetched for the first time
// after auth or app foregrounding.

import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import { colors, radius, spacing } from "../../theme";

const ROW_COUNT = 5;

export default function TaskListSkeleton() {
	const shimmer = useSharedValue(0);

	useEffect(() => {
		shimmer.value = withRepeat(
			withTiming(1, {
				duration: 1200,
				easing: Easing.inOut(Easing.quad),
			}),
			-1,
			true,
		);
	}, [shimmer]);

	return (
		<View style={styles.container}>
			{Array.from({ length: ROW_COUNT }).map((_, index) => (
				<SkeletonRow key={index} shimmer={shimmer} delay={index * 80} />
			))}
		</View>
	);
}

function SkeletonRow({ shimmer, delay }) {
	const opacity = useAnimatedStyle(() => ({
		opacity: 0.4 + shimmer.value * 0.4,
	}));

	return (
		<Animated.View
			style={[styles.row, { marginTop: delay > 0 ? spacing.md : 0 }, opacity]}
		>
			<View style={styles.rail} />
			<View style={styles.content}>
				<View style={[styles.bar, styles.barTitle]} />
				<View style={[styles.bar, styles.barMeta]} />
				<View style={styles.metaRow}>
					<View style={[styles.bar, styles.barChipSmall]} />
					<View style={[styles.bar, styles.barChipSmall]} />
				</View>
			</View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		paddingTop: spacing.sm,
	},
	row: {
		flexDirection: "row",
		backgroundColor: colors.surface.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border.subtle,
		minHeight: 76,
		overflow: "hidden",
	},
	rail: {
		width: 2.5,
		backgroundColor: colors.border.subtle,
		marginVertical: spacing.sm,
		borderRadius: radius.xs,
	},
	content: {
		flex: 1,
		paddingHorizontal: spacing.base,
		paddingVertical: spacing.md,
		gap: spacing.sm,
		justifyContent: "center",
	},
	bar: {
		backgroundColor: colors.surface.surfaceMuted,
		borderRadius: radius.xs,
		height: 10,
	},
	barTitle: {
		height: 14,
		width: "72%",
		borderRadius: radius.sm,
	},
	barMeta: {
		width: "44%",
	},
	barChipSmall: {
		width: 56,
		height: 8,
		borderRadius: radius.pill,
	},
	metaRow: {
		flexDirection: "row",
		gap: spacing.md,
		marginTop: spacing.xs,
	},
});
