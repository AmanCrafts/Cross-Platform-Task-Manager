// Motion tokens. Easings follow Material standard curves; consumed via
// Easing.bezier(...easing) in Reanimated.

export const motion = {
	durations: {
		fast: 120,
		base: 200,
		slow: 320,
	},
	easings: {
		standard: [0.4, 0.0, 0.2, 1],
		decelerate: [0.0, 0.0, 0.2, 1],
		accelerate: [0.4, 0.0, 1.0, 1.0],
	},
	presets: {
		press: { duration: 120, easing: [0.4, 0.0, 0.2, 1] },
		cardPress: { duration: 120, easing: [0.4, 0.0, 0.2, 1] },
		modalBackdrop: { duration: 200, easing: [0.4, 0.0, 0.2, 1] },
		modalSheet: { duration: 320, easing: [0.0, 0.0, 0.2, 1] },
		snackbar: { duration: 200, easing: [0.0, 0.0, 0.2, 1] },
	},
};
