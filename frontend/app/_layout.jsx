import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ToastHost from "../src/components/ui/ToastHost";
import { AuthProvider } from "../src/context/AuthProvider";

export default function RootLayout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<AuthProvider>
					<StatusBar style="dark" />
					<Stack screenOptions={{ headerShown: false }} />
					<ToastHost />
				</AuthProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
