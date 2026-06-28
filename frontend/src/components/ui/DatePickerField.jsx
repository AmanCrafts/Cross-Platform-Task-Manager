// DatePickerField — a Pressable trigger styled like InputField that
// opens the native calendar from @react-native-community/datetimepicker.
// Emits an ISO string (start-of-day, UTC) via onChange.

import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../../theme";

function startOfDay(date) {
	const next = new Date(date);
	next.setHours(0, 0, 0, 0);
	return next;
}

function formatDisplay(iso) {
	if (!iso) return null;
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return null;

	const today = startOfDay(new Date());
	const target = startOfDay(date);
	const dayMs = 1000 * 60 * 60 * 24;
	const diffDays = Math.round((target.getTime() - today.getTime()) / dayMs);

	if (diffDays === 0) return "Today";
	if (diffDays === 1) return "Tomorrow";
	if (diffDays === -1) return "Yesterday";

	return date.toLocaleDateString(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric",
		year:
			date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
	});
}

export default function DatePickerField({
	label,
	value,
	onChange,
	placeholder = "Select a date",
	minimumDate,
	maximumDate,
	editable = true,
	error,
	helper,
	leftIcon,
	style,
}) {
	const [open, setOpen] = useState(false);
	const [internal, setInternal] = useState(null);

	// `value` is the controlled ISO string the parent owns.
	// `internal` is a working copy used while the picker is open on iOS
	// (where the picker stays mounted and edits don't auto-commit).
	const committed = value ?? null;
	const pickerValue =
		internal ?? (committed ? new Date(committed) : null) ?? new Date();

	const hasError = Boolean(error);
	const displayValue = formatDisplay(committed);

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
		setInternal(null);
		setOpen(true);
	};

	const handleChange = (event, selectedDate) => {
		// Android fires `dismissed` for cancel and `set` for confirm.
		// iOS fires `set` on every wheel change AND `dismissed` when the
		// "Done" affordance closes the picker.
		if (Platform.OS === "android") {
			setOpen(false);
			if (event?.type === "dismissed" || !selectedDate) return;
			onChange?.(startOfDay(selectedDate).toISOString());
			return;
		}

		// iOS path.
		if (event?.type === "dismissed") {
			setOpen(false);
			setInternal(null);
			return;
		}

		if (!selectedDate) return;

		// Keep an internal working copy; only commit on Done.
		setInternal(selectedDate);
	};

	const handleIosDone = () => {
		const next = internal ?? (committed ? new Date(committed) : new Date());
		setOpen(false);
		setInternal(null);
		onChange?.(startOfDay(next).toISOString());
	};

	const handleClear = () => {
		onChange?.(null);
		setOpen(false);
		setInternal(null);
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
				accessibilityHint={editable ? "Opens date picker" : undefined}
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
				{leftIcon ?? (
					<View style={styles.iconLeft}>
						<Ionicons
							name="calendar-clear-outline"
							size={18}
							color={colors.text.secondary}
						/>
					</View>
				)}

				<Text
					style={[
						styles.valueText,
						displayValue ? null : styles.placeholderText,
					]}
					numberOfLines={1}
				>
					{displayValue ?? placeholder}
				</Text>

				{committed && editable ? (
					<Pressable
						onPress={handleClear}
						hitSlop={8}
						accessibilityRole="button"
						accessibilityLabel={`Clear ${label ?? "date"}`}
						style={({ pressed }) => [
							styles.clearButton,
							pressed ? styles.clearPressed : null,
						]}
					>
						<Ionicons name="close-circle" size={18} color={colors.text.muted} />
					</Pressable>
				) : (
					<Ionicons
						name="chevron-down"
						size={18}
						color={colors.text.muted}
						style={styles.chevron}
					/>
				)}
			</Pressable>

			{hasError ? (
				<Text style={styles.error}>{error}</Text>
			) : helper ? (
				<Text style={styles.helper}>{helper}</Text>
			) : null}

			{open ? (
				<View style={styles.pickerHost}>
					<PlatformPicker
						value={pickerValue}
						onChange={handleChange}
						minimumDate={minimumDate}
						maximumDate={maximumDate}
						onIosDone={handleIosDone}
						onIosClear={committed ? handleClear : null}
					/>
				</View>
			) : null}
		</View>
	);
}

function PlatformPicker({
	value,
	onChange,
	minimumDate,
	maximumDate,
	onIosDone,
	onIosClear,
}) {
	if (Platform.OS === "ios") {
		return (
			<View style={styles.iosHost}>
				<View style={styles.iosHeader}>
					{onIosClear ? (
						<Pressable
							onPress={onIosClear}
							hitSlop={8}
							style={styles.iosHeaderButton}
						>
							<Text style={styles.iosClearText}>Clear</Text>
						</Pressable>
					) : (
						<View style={styles.iosHeaderButton} />
					)}
					<Pressable
						onPress={onIosDone}
						hitSlop={8}
						style={styles.iosHeaderButton}
					>
						<Text style={styles.iosDoneText}>Done</Text>
					</Pressable>
				</View>
				<DateTimePicker
					value={value}
					mode="date"
					display="inline"
					minimumDate={minimumDate}
					maximumDate={maximumDate}
					onChange={onChange}
					accentColor={colors.brand.primary}
					themeVariant="light"
				/>
			</View>
		);
	}

	return (
		<DateTimePicker
			value={value}
			mode="date"
			minimumDate={minimumDate}
			maximumDate={maximumDate}
			onChange={onChange}
		/>
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
	valueText: {
		...typography.bodyLg,
		flex: 1,
		color: colors.text.primary,
	},
	placeholderText: {
		color: colors.text.muted,
	},
	clearButton: {
		padding: 2,
		borderRadius: radius.pill,
	},
	clearPressed: {
		opacity: 0.6,
	},
	chevron: {
		marginLeft: spacing.sm,
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
	pickerHost: {
		marginTop: spacing.sm,
	},
	iosHost: {
		borderRadius: radius.md,
		backgroundColor: colors.surface.surface,
		borderWidth: 1,
		borderColor: colors.border.subtle,
		overflow: "hidden",
	},
	iosHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.border.subtle,
	},
	iosHeaderButton: {
		minHeight: 32,
		justifyContent: "center",
	},
	iosClearText: {
		...typography.body,
		color: colors.text.secondary,
		fontWeight: "500",
	},
	iosDoneText: {
		...typography.body,
		color: colors.accent,
		fontWeight: "600",
	},
});
