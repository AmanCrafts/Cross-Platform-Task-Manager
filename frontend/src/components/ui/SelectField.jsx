// SelectField — Pressable trigger styled like InputField that opens a
// SelectSheet for single-select. Value is the option's `value`, not label.
// Optional `renderValue(value)` lets callers customize the displayed label
// (e.g. for recurring rules) instead of doing a lookup in the consumer.

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../../theme";
import SelectSheet from "./SelectSheet";

export default function SelectField({
	label,
	value,
	options,
	onChange,
	leftIcon,
	rightIcon,
	placeholder = "Select an option",
	renderValue,
	error,
	helper,
	editable = true,
	style,
}) {
	const [open, setOpen] = useState(false);

	const hasError = Boolean(error);

	const selectedOption = options.find((option) => option.value === value);
	const displayValue = renderValue
		? renderValue(value, selectedOption)
		: selectedOption?.label;

	const borderColor = hasError
		? colors.semantic.danger
		: open
			? colors.brand.primary
			: colors.border.default;

	const borderWidth = open || hasError ? 1.5 : 1;
	const labelColor = hasError
		? colors.semantic.danger
		: open
			? colors.text.primary
			: colors.text.muted;

	const handlePress = () => {
		if (!editable) return;
		setOpen(true);
	};

	const accessibilityLabel = displayValue ?? placeholder;

	return (
		<View style={[styles.container, style]}>
			{label ? (
				<Text style={[styles.label, { color: labelColor }]}>{label}</Text>
			) : null}

			<Pressable
				onPress={handlePress}
				disabled={!editable}
				accessibilityRole="button"
				accessibilityLabel={
					typeof label === "string"
						? `${label}: ${accessibilityLabel}`
						: undefined
				}
				accessibilityHint={editable ? "Opens options" : undefined}
				style={({ pressed }) => [
					styles.fieldRow,
					{
						borderColor,
						borderWidth,
					},
					pressed && editable ? styles.pressed : null,
					!editable ? styles.disabled : null,
				]}
			>
				{leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}

				<Text
					style={[
						styles.valueText,
						displayValue ? null : styles.placeholderText,
					]}
					numberOfLines={1}
				>
					{displayValue ?? placeholder}
				</Text>

				{rightIcon ? (
					<View style={styles.iconRight}>{rightIcon}</View>
				) : (
					<Ionicons
						name="chevron-down"
						size={18}
						color={colors.text.muted}
						style={styles.iconRight}
					/>
				)}
			</Pressable>

			{hasError ? (
				<Text style={styles.error}>{error}</Text>
			) : helper ? (
				<Text style={styles.helper}>{helper}</Text>
			) : null}

			<SelectSheet
				visible={open}
				title={label}
				value={value}
				options={options}
				onChange={onChange}
				onClose={() => setOpen(false)}
			/>
		</View>
	);
}

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
		backgroundColor: colors.surface.surface,
		borderRadius: radius.md,
		paddingHorizontal: spacing.md,
		minHeight: 52,
	},
	pressed: {
		backgroundColor: colors.surface.background,
	},
	disabled: {
		opacity: 0.5,
	},
	iconLeft: {
		marginRight: spacing.sm,
	},
	iconRight: {
		marginLeft: spacing.sm,
	},
	valueText: {
		...typography.bodyLg,
		flex: 1,
		color: colors.text.primary,
	},
	placeholderText: {
		color: colors.text.muted,
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
