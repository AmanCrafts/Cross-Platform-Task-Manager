// Light, neutral, premium palette. Inspired by Linear, Things 3, Notion calm.
// All values are tokens — components reference them via the theme barrel,
// never hardcoded in screens.

export const colors = {
	surface: {
		background: "#F7F7F5",
		surface: "#FFFFFF",
		surfaceElevated: "#FFFFFF",
		surfaceMuted: "#F2F2EF",
		overlay: "rgba(15, 15, 15, 0.04)",
	},

	text: {
		primary: "#1A1A1A",
		secondary: "#5C5C5C",
		muted: "#8A8A8A",
		inverse: "#FFFFFF",
	},

	border: {
		subtle: "#EDECE9",
		default: "#E2E1DD",
		strong: "#C8C7C2",
	},

	brand: {
		primary: "#1A1A1A",
		primaryHover: "#2D2D2D",
		primaryPressed: "#000000",
	},

	accent: "#5B6CFF",

	priority: {
		low: "#C7D2FE",
		medium: "#D6D3D1",
		high: "#FCD34D",
		urgent: "#F87171",
	},

	status: {
		todo: "#9CA3AF",
		in_progress: "#5B6CFF",
		done: "#10B981",
		archived: "#C7C7C2",
	},

	semantic: {
		success: "#10B981",
		warning: "#F59E0B",
		danger: "#DC2626",
		info: "#3B82F6",
		warningBg: "#FEF3C7",
		dangerBg: "#FEE2E2",
	},

	scrim: "rgba(15, 15, 15, 0.40)",
};
