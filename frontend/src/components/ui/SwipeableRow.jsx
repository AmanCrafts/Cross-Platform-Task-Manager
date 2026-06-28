// SwipeableRow — wraps a tappable card with horizontal swipe gestures.
//
// One gesture handler drives the row. Each side optionally reveals a
// colored action background with an icon and optional label. Vertical
// scroll is preserved by only activating once the user commits to a
// horizontal motion (failure to pass the axis-lock check yields the
// gesture back to the parent ScrollView/FlatList).
//
// When the dragged distance crosses the commit threshold (or velocity)
// and the user releases, the corresponding `onCommitLeft` / `onCommitRight`
// fires and the row animates off-screen in the swipe direction. The parent
// is expected to remove the row from the list once it has fully exited.
//
// Below threshold: row springs back to rest. Cancelled mid-drag: also
// springs back to rest.
//
// `disabled` short-circuits all gesture handling — the child renders
// plainly, taps still work.
//
// The component does NOT know about TaskService or task state — callers
// pass action icons, colors, labels, and commit callbacks.

import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	Extrapolation,
	interpolate,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { colors, radius, spacing, typography } from "../../theme";

const SCREEN_WIDTH = Dimensions.get("window").width;
const COMMIT_DISTANCE = 120;
const COMMIT_VELOCITY = 850;
const AXIS_LOCK = 12;
const RUBBER_BAND = 0.35;

const EXIT_DURATION_DELETE = 220;
const EXIT_DURATION_COMPLETE = 280;

const SPRING = {
	damping: 22,
	stiffness: 220,
	mass: 0.9,
	overshootClamping: false,
};

export default function SwipeableRow({
	children,
	leftAction,
	rightAction,
	disabled = false,
	style,
}) {
	const translateX = useSharedValue(0);
	const startX = useSharedValue(0);
	const opacity = useSharedValue(1);
	const scale = useSharedValue(1);

	const hasLeft = Boolean(leftAction);
	const hasRight = Boolean(rightAction);
	const canSwipe = !disabled && (hasLeft || hasRight);

	const fireLeft = useCallback(() => {
		leftAction?.onCommit?.();
	}, [leftAction]);

	const fireRight = useCallback(() => {
		rightAction?.onCommit?.();
	}, [rightAction]);

	const pan = useMemo(() => {
		return Gesture.Pan()
			.enabled(canSwipe)
			.activeOffsetX([-AXIS_LOCK, AXIS_LOCK])
			.failOffsetY([-12, 12])
			.onStart(() => {
				startX.value = translateX.value;
				scale.value = withSpring(1.015, { damping: 20, stiffness: 220 });
			})
			.onUpdate((event) => {
				const raw = startX.value + event.translationX;
				const max = hasLeft && !hasRight ? COMMIT_DISTANCE * 1.7 : SCREEN_WIDTH;
				const min =
					hasRight && !hasLeft ? -COMMIT_DISTANCE * 1.7 : -SCREEN_WIDTH;
				if (raw > max) {
					translateX.value = max + (raw - max) * RUBBER_BAND;
				} else if (raw < min) {
					translateX.value = min + (raw - min) * RUBBER_BAND;
				} else {
					translateX.value = raw;
				}
			})
			.onEnd((event) => {
				scale.value = withSpring(1, SPRING);
				const dx = translateX.value;
				const vx = event.velocityX;
				const farEnough = Math.abs(dx) >= COMMIT_DISTANCE;
				const fastEnough = Math.abs(vx) >= COMMIT_VELOCITY;

				// Swipe RIGHT (positive dx) commits the leftAction.
				if (dx > 0 && hasLeft && (farEnough || fastEnough)) {
					translateX.value = withTiming(
						SCREEN_WIDTH,
						{ duration: EXIT_DURATION_DELETE },
						() => runOnJS(fireLeft)(),
					);
					opacity.value = withTiming(0, {
						duration: EXIT_DURATION_DELETE,
					});
					return;
				}

				// Swipe LEFT (negative dx) commits the rightAction.
				if (dx < 0 && hasRight && (farEnough || fastEnough)) {
					translateX.value = withTiming(
						-SCREEN_WIDTH,
						{ duration: EXIT_DURATION_COMPLETE },
						() => runOnJS(fireRight)(),
					);
					opacity.value = withTiming(0, {
						duration: EXIT_DURATION_COMPLETE,
					});
					return;
				}

				translateX.value = withSpring(0, SPRING);
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [canSwipe, hasLeft, hasRight, fireLeft, fireRight]);

	const cardStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }, { scale: scale.value }],
		opacity: opacity.value,
	}));

	// Action backgrounds reveal in two stages:
	//   0 → COMMIT_DISTANCE: gentle fade-in + small rise
	//   COMMIT_DISTANCE → 1.5×COMMIT: commit confirmation (full opacity,
	//   icon scales up a touch more, background intensifies)
	const leftStyle = useAnimatedStyle(() => {
		const t = translateX.value;
		const progress = interpolate(
			t,
			[0, COMMIT_DISTANCE, COMMIT_DISTANCE * 1.6],
			[0, 1, 1],
			Extrapolation.CLAMP,
		);
		return {
			opacity: progress,
			transform: [{ scale: 0.9 + progress * 0.1 }],
		};
	});

	const rightStyle = useAnimatedStyle(() => {
		const t = translateX.value;
		const progress = interpolate(
			t,
			[-COMMIT_DISTANCE * 1.6, -COMMIT_DISTANCE, 0],
			[1, 1, 0],
			Extrapolation.CLAMP,
		);
		return {
			opacity: progress,
			transform: [{ scale: 0.9 + progress * 0.1 }],
		};
	});

	if (!canSwipe) {
		return <View style={[styles.outer, style]}>{children}</View>;
	}

	return (
		<View style={[styles.outer, style]}>
			{hasLeft ? (
				<ActionBackground side="right" action={leftAction} style={leftStyle} />
			) : null}
			{hasRight ? (
				<ActionBackground side="left" action={rightAction} style={rightStyle} />
			) : null}

			<GestureDetector gesture={pan}>
				<Animated.View style={[styles.card, cardStyle]}>
					{children}
				</Animated.View>
			</GestureDetector>
		</View>
	);
}

function ActionBackground({ side, action, style }) {
	const isRightSide = side === "right"; // background revealed on swipe-right
	const bg = action.backgroundColor ?? colors.surface.surface;
	const fg = action.foregroundColor ?? colors.text.primary;

	return (
		<Animated.View
			pointerEvents="none"
			style={[
				styles.actionBg,
				isRightSide ? styles.actionBgRight : styles.actionBgLeft,
				{ backgroundColor: bg },
				style,
			]}
		>
			<View
				style={[
					styles.actionContent,
					isRightSide ? styles.actionContentLeft : styles.actionContentRight,
				]}
			>
				<Ionicons
					name={action.icon ?? "ellipsis-horizontal"}
					size={22}
					color={fg}
				/>
				{action.label ? (
					<Text style={[styles.actionLabel, { color: fg }]} numberOfLines={1}>
						{action.label}
					</Text>
				) : null}
			</View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	outer: {
		position: "relative",
		overflow: "hidden",
		borderRadius: radius.lg,
	},
	actionBg: {
		...StyleSheet.absoluteFillObject,
		justifyContent: "center",
	},
	actionBgRight: {
		alignItems: "flex-start",
		paddingLeft: spacing.xl,
	},
	actionBgLeft: {
		alignItems: "flex-end",
		paddingRight: spacing.xl,
	},
	actionContent: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
	},
	actionContentLeft: {
		flexDirection: "row-reverse",
	},
	actionContentRight: {},
	actionLabel: {
		...typography.body,
		fontWeight: "600",
		letterSpacing: 0.2,
	},
	card: {
		backgroundColor: "transparent",
	},
});
