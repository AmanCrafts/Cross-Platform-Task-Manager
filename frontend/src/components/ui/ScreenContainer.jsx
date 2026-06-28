// ScreenContainer — replaces the old Screen wrapper.
// Adds SafeAreaView + consistent horizontal padding + themeable background.

import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../../theme";

const BACKGROUND_MAP = {
	surface: colors.surface.surface,
	muted: colors.surface.background,
	transparent: "transparent",
};

export default function ScreenContainer({
	children,
	edges = ["top", "left", "right"],
	padded = true,
	background = "surface",
	style,
}) {
	return (
		<SafeAreaView
			edges={edges}
			style={[
				{
					flex: 1,
					backgroundColor: BACKGROUND_MAP[background] ?? colors.surface.surface,
				},
				padded ? { paddingHorizontal: spacing.base } : null,
				style,
			]}
		>
			{children}
		</SafeAreaView>
	);
}
