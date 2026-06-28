// AppHeader — repeated on every primary screen.
// Title + optional subtitle + optional leading/back + optional trailing actions
// + optional rightSlot (e.g. sync status pill).

import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../../theme";

export default function AppHeader({
	title,
	subtitle,
	leading,
	trailing,
	rightSlot,
	withBorder = false,
	style,
}) {
	return (
		<View
			style={[styles.container, withBorder ? styles.bordered : null, style]}
		>
			<View style={styles.row}>
				{leading ? <View style={styles.leading}>{leading}</View> : null}

				<View style={styles.titleBlock}>
					<Text style={styles.title} numberOfLines={1}>
						{title}
					</Text>
					{subtitle ? (
						<Text style={styles.subtitle} numberOfLines={1}>
							{subtitle}
						</Text>
					) : null}
				</View>

				{rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}

				{trailing ? <View style={styles.trailing}>{trailing}</View> : null}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		paddingTop: spacing.md,
		paddingBottom: spacing.base,
	},
	bordered: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.border.subtle,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
	},
	leading: {
		marginRight: spacing.xs,
	},
	titleBlock: {
		flex: 1,
		minWidth: 0,
	},
	title: {
		...typography.h1,
		color: colors.text.primary,
	},
	subtitle: {
		...typography.caption,
		color: colors.text.secondary,
		marginTop: 2,
	},
	rightSlot: {
		marginLeft: spacing.sm,
	},
	trailing: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		marginLeft: spacing.sm,
	},
});
