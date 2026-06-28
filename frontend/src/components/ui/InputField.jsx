// InputField — the foundation of form feel.
// Internal focus state so the border tracks focus without consumers
// having to wire onFocus/onBlur manually. Supports left/right icons,
// error/helper text, multiline, secureTextEntry.

import { forwardRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing, typography } from "../../theme";

const InputField = forwardRef(function InputField(
	{
		label,
		value,
		onChangeText,
		placeholder,
		error,
		helper,
		leftIcon,
		rightIcon,
		multiline = false,
		secureTextEntry,
		keyboardType,
		autoCapitalize,
		autoComplete,
		onFocus,
		onBlur,
		editable = true,
		numberOfLines,
		style,
		inputStyle,
		...rest
	},
	ref,
) {
	const [focused, setFocused] = useState(false);

	const hasError = Boolean(error);
	const isInactive = !focused && !value;

	const borderColor = hasError
		? colors.semantic.danger
		: focused
			? colors.brand.primary
			: colors.border.default;

	const borderWidth = focused || hasError ? 1.5 : 1;

	const backgroundColor = isInactive
		? colors.surface.background
		: colors.surface.surface;

	const labelColor = hasError
		? colors.semantic.danger
		: focused
			? colors.text.primary
			: colors.text.muted;

	return (
		<View style={[styles.container, style]}>
			{label ? (
				<Text style={[styles.label, { color: labelColor }]}>{label}</Text>
			) : null}

			<View
				style={[
					styles.fieldRow,
					{
						borderColor,
						borderWidth,
						backgroundColor,
					},
					multiline ? styles.fieldRowMultiline : null,
				]}
			>
				{leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}

				<TextInput
					ref={ref}
					value={value}
					onChangeText={onChangeText}
					placeholder={placeholder}
					placeholderTextColor={colors.text.muted}
					secureTextEntry={secureTextEntry}
					keyboardType={keyboardType}
					autoCapitalize={autoCapitalize}
					autoComplete={autoComplete}
					multiline={multiline}
					numberOfLines={multiline ? (numberOfLines ?? 4) : undefined}
					editable={editable}
					onFocus={(event) => {
						setFocused(true);
						onFocus?.(event);
					}}
					onBlur={(event) => {
						setFocused(false);
						onBlur?.(event);
					}}
					style={[
						styles.input,
						multiline ? styles.inputMultiline : null,
						inputStyle,
					]}
					{...rest}
				/>

				{rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
			</View>

			{hasError ? (
				<Text style={styles.error}>{error}</Text>
			) : helper ? (
				<Text style={styles.helper}>{helper}</Text>
			) : null}
		</View>
	);
});

export default InputField;

const styles = StyleSheet.create({
	container: {
		marginBottom: spacing.base,
	},
	label: {
		...typography.overline,
		marginBottom: spacing.sm,
	},
	fieldRow: {
		flexDirection: "row",
		alignItems: "center",
		borderRadius: radius.md,
		paddingHorizontal: spacing.md,
		minHeight: 52,
	},
	fieldRowMultiline: {
		alignItems: "flex-start",
		paddingVertical: spacing.md,
		minHeight: 0,
	},
	leftIcon: {
		marginRight: spacing.sm,
	},
	rightIcon: {
		marginLeft: spacing.sm,
	},
	input: {
		...typography.bodyLg,
		color: colors.text.primary,
		display: "flex",
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		paddingBottom: 5,
	},
	inputMultiline: {
		minHeight: 96,
		textAlignVertical: "top",
		paddingTop: 0,
	},
	helper: {
		...typography.caption,
		marginTop: spacing.xs,
		color: colors.text.secondary,
	},
	error: {
		...typography.caption,
		marginTop: spacing.xs,
		color: colors.semantic.danger,
	},
});
