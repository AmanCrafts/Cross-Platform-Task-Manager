// Three elevation levels. Cross-platform — both shadow* (iOS) and
// elevation (Android) keys are set per level so a single spread covers
// both platforms.

export const shadows = {
	none: {
		shadowColor: "transparent",
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0,
		shadowRadius: 0,
		elevation: 0,
	},
	subtle: {
		shadowColor: "#000000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.04,
		shadowRadius: 6,
		elevation: 1,
	},
	card: {
		shadowColor: "#000000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.06,
		shadowRadius: 14,
		elevation: 3,
	},
	floating: {
		shadowColor: "#000000",
		shadowOffset: { width: 0, height: 12 },
		shadowOpacity: 0.1,
		shadowRadius: 24,
		elevation: 8,
	},
};
