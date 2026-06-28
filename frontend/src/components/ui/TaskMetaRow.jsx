// TaskMetaRow — horizontal row of icon + label items.
// Used at the bottom of TaskCard and in task detail metadata.

import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../../theme";

const TONE_COLOR = {
	default: colors.text.secondary,
	muted: colors.text.muted,
	danger: colors.semantic.danger,
	success: colors.semantic.success,
};

export default function TaskMetaRow({ items = [], style }) {
	if (!items.length) return null;

	return (
		<View style={[styles.row, style]}>
			{items.map((item, index) => {
				if (!item) return null;
				const tone =
					TONE_COLOR[item.tone ?? "default"] ?? colors.text.secondary;
				return (
					<View
						key={item.label ?? `meta-${index}`}
						style={[styles.item, index > 0 ? styles.itemSpaced : null]}
					>
						{item.icon ? <View style={styles.icon}>{item.icon}</View> : null}
						<Text style={[styles.label, { color: tone }]} numberOfLines={1}>
							{item.label}
						</Text>
					</View>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "center",
		gap: spacing.md,
	},
	item: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	itemSpaced: {},
	icon: {
		marginRight: 0,
	},
	label: {
		...typography.caption,
		fontWeight: "500",
	},
});
