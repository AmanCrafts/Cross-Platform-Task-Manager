// Single source of truth for the recurrence dropdown.
// value "" (empty string) means "not recurring" — every other value is
// an uppercase enum. The dropdown stores the value verbatim; is_recurring
// on the payload is derived from whether the value is non-empty.

export const RECURRENCE_OPTIONS = [
	{ value: "", label: "None" },
	{ value: "DAILY", label: "Daily" },
	{ value: "WEEKDAYS", label: "Every Weekday" },
	{ value: "WEEKLY", label: "Weekly" },
	{ value: "BIWEEKLY", label: "Every 2 Weeks" },
	{ value: "MONTHLY", label: "Monthly" },
	{ value: "QUARTERLY", label: "Every 3 Months" },
	{ value: "SEMIANNUAL", label: "Every 6 Months" },
	{ value: "YEARLY", label: "Yearly" },
];

const LABEL_BY_VALUE = new Map(
	RECURRENCE_OPTIONS.map((option) => [option.value, option.label]),
);

export function labelForRecurrence(value) {
	if (value === undefined || value === null) return "None";
	return LABEL_BY_VALUE.get(value) ?? "Repeats";
}

export function isRecurrenceSet(value) {
	return Boolean(value && value.length > 0);
}
