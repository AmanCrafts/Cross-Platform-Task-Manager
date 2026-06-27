import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../src/hooks/useAuth";

export default function AuthLayout() {
	const { session, loading } = useAuth();

	if (loading) {
		return (
			<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
				<ActivityIndicator />
			</View>
		);
	}

	if (session) {
		return <Redirect href="/(app)" />;
	}

	return <Stack screenOptions={{ headerShown: false }} />;
}
