// Theme barrel — every primitive and screen imports from here.
// Two ergonomics: individual token exports for narrow imports, and a
// `theme` object for components that want one namespace.

import { colors } from "./colors";
import { motion } from "./motion";
import { radius } from "./radius";
import { shadows } from "./shadows";
import { spacing } from "./spacing";
import { type } from "./typography";

export { colors, motion, radius, shadows, spacing, type as typography };

export const theme = {
	colors,
	spacing,
	radius,
	typography: type,
	shadows,
	motion,
};
