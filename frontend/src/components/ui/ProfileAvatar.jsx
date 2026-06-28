// ProfileAvatar — circular avatar with initials placeholder.
// Renders Image when uri is provided; otherwise shows 1-2 initials on
// surfaceMuted bg. Optional camera badge for editable avatars.

import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { usePressScale } from "../../hooks/usePressScale";
import { colors, radius } from "../../theme";

function initialsFor(name) {
	if (!name) return "?";
	const parts = String(name).trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
	return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function ProfileAvatar({
	uri,
	name = "",
	size = 96,
	editable = false,
	onPress,
	style,
}) {
	const { scale, onPressIn, onPressOut } = usePressScale({ variant: "press" });
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const dim = {
		width: size,
		height: size,
		borderRadius: radius.pill,
	};
	const fontSize = Math.max(18, Math.round(size * 0.38));
	const badgeSize = Math.max(24, Math.round(size * 0.3));
	const badgeIconSize = Math.max(14, Math.round(badgeSize * 0.55));

	const content = uri ? (
		<Image source={{ uri }} style={[styles.image, dim]} />
	) : (
		<View style={[styles.initials, dim]}>
			<Text
				style={[styles.initialsText, { fontSize, lineHeight: fontSize * 1.1 }]}
			>
				{initialsFor(name)}
			</Text>
		</View>
	);

	const inner = (
		<View>
			{content}
			{editable ? (
				<View
					style={[
						styles.badge,
						{
							width: badgeSize,
							height: badgeSize,
							borderRadius: badgeSize / 2,
							right: 0,
							bottom: 0,
						},
					]}
				>
					<Ionicons
						name="camera-outline"
						size={badgeIconSize}
						color={colors.text.inverse}
					/>
				</View>
			) : null}
		</View>
	);

	if (!onPress) {
		return <View style={[styles.container, style]}>{inner}</View>;
	}

	return (
		<Animated.View style={[animatedStyle, style]}>
			<Pressable
				onPress={onPress}
				onPressIn={onPressIn}
				onPressOut={onPressOut}
				accessibilityRole="button"
				accessibilityLabel={editable ? "Change profile photo" : "Profile photo"}
			>
				{inner}
			</Pressable>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: "relative",
	},
	image: {
		backgroundColor: colors.surface.surfaceMuted,
	},
	initials: {
		backgroundColor: colors.surface.surfaceMuted,
		borderWidth: 1,
		borderColor: colors.border.subtle,
		alignItems: "center",
		justifyContent: "center",
	},
	initialsText: {
		color: colors.text.primary,
		fontWeight: "600",
		letterSpacing: 0.5,
	},
	badge: {
		position: "absolute",
		backgroundColor: colors.brand.primary,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 2,
		borderColor: colors.surface.surface,
	},
});
