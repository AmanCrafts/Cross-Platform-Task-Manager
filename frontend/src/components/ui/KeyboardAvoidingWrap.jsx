// KeyboardAvoidingWrap — wraps forms so the keyboard doesn't cover inputs.
// Platform-aware behavior. Optional inner ScrollView with
// keyboardShouldPersistTaps so the save button stays tappable.

import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
} from "react-native";
import { spacing } from "../../theme";

export default function KeyboardAvoidingWrap({
	children,
	scroll = true,
	behavior,
	keyboardVerticalOffset,
	contentContainerStyle,
	style,
}) {
	const resolvedBehavior =
		behavior ?? (Platform.OS === "ios" ? "padding" : "height");
	const resolvedOffset = keyboardVerticalOffset ?? spacing.sm;

	return (
		<KeyboardAvoidingView
			behavior={resolvedBehavior}
			keyboardVerticalOffset={resolvedOffset}
			style={[styles.flex, style]}
		>
			{scroll ? (
				<ScrollView
					contentContainerStyle={contentContainerStyle}
					keyboardShouldPersistTaps="handled"
					keyboardDismissMode="on-drag"
					showsVerticalScrollIndicator={false}
				>
					{children}
				</ScrollView>
			) : (
				children
			)}
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	flex: {
		flex: 1,
	},
});
