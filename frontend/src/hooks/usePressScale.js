// Shared Reanimated press-feedback helper.
// Returns shared value, animated style, and press handlers.
// Used by PrimaryButton, SecondaryButton, TextButton, and Card-on-press
// to keep the press motion consistent across the app.

import { useCallback } from "react";
import { Easing, useSharedValue, withTiming } from "react-native-reanimated";
import { motion } from "../theme";

const PRESS_SCALE = 0.97;
const CARD_PRESS_SCALE = 0.99;

export function usePressScale({ variant = "press" } = {}) {
	const scale = useSharedValue(1);

	const targetScale = variant === "card" ? CARD_PRESS_SCALE : PRESS_SCALE;
	const easing = Easing.bezier(...motion.presets.press.easing);
	const duration = motion.presets.press.duration;

	const onPressIn = useCallback(() => {
		scale.value = withTiming(targetScale, { duration, easing });
	}, [scale, targetScale, duration, easing]);

	const onPressOut = useCallback(() => {
		scale.value = withTiming(1, { duration, easing });
	}, [scale, duration, easing]);

	return { scale, onPressIn, onPressOut };
}
