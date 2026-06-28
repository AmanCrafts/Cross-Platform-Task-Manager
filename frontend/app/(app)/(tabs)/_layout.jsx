// Tabs layout — refined, Linear-style calm tab bar.
// Hairline top border, restrained padding, FAB-style elevated center
// "Create" tab with brand-color filled circle (no label, just icon).

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { colors, radius, shadows } from "../../../src/theme";

function HomeIcon({ color, size }) {
	return <Ionicons name="home-outline" size={size} color={color} />;
}

function ProfileIcon({ color, size }) {
	return <Ionicons name="person-outline" size={size} color={color} />;
}

function CreateTabButton({ focused }) {
	return (
		<View
			style={[styles.createButton, focused ? styles.createButtonFocused : null]}
		>
			<Ionicons name="add" size={26} color={colors.text.inverse} />
		</View>
	);
}

export default function TabsLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: colors.text.primary,
				tabBarInactiveTintColor: colors.text.muted,
				tabBarStyle: {
					height: 72,
					paddingTop: 8,
					paddingBottom: 16,
					borderTopWidth: StyleSheet.hairlineWidth,
					borderTopColor: colors.border.subtle,
					backgroundColor: colors.surface.surface,
				},
				tabBarLabelStyle: {
					fontSize: 11,
					fontWeight: "500",
					marginTop: 2,
				},
				tabBarItemStyle: {
					paddingTop: 4,
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					tabBarIcon: HomeIcon,
				}}
			/>

			<Tabs.Screen
				name="create"
				options={{
					title: "",
					tabBarLabel: () => null,
					tabBarIcon: CreateTabButton,
				}}
			/>

			<Tabs.Screen
				name="profile"
				options={{
					title: "Profile",
					tabBarIcon: ProfileIcon,
				}}
			/>
		</Tabs>
	);
}

const styles = StyleSheet.create({
	createButton: {
		width: 52,
		height: 52,
		borderRadius: radius.pill,
		backgroundColor: colors.brand.primary,
		alignItems: "center",
		justifyContent: "center",
		marginTop: -10,
		...shadows.floating,
	},
	createButtonFocused: {
		backgroundColor: colors.brand.primaryPressed,
	},
});
