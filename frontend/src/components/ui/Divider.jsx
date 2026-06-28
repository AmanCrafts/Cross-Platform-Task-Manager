// Divider — simple hairline. Optional inset for indented dividers.
import { StyleSheet, View } from "react-native";
import { colors } from "../../theme";

export default function Divider({ inset = 0, style }) {
	return (
		<View
			style={[
				styles.base,
				inset > 0 ? { marginHorizontal: inset } : null,
				style,
			]}
		/>
	);
}

const styles = StyleSheet.create({
	base: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: colors.border.subtle,
	},
});
