import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
	Alert,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { AuthService } from "../../src/services/auth.service";

export default function LoginScreen() {
	const router = useRouter();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleLogin = async () => {
		setError("");

		if (!email.trim() || !password) {
			setError("Email and password are required.");
			return;
		}

		try {
			setLoading(true);

			const result = await AuthService.signIn(email.trim(), password);

			if (!result.success) {
				setError(result.message || "Login failed.");
				return;
			}

			Alert.alert("Success", "Logged in successfully.");
			router.replace("/(app)/(tabs)");
		} catch (err) {
			setError(err?.message || "Something went wrong.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Login</Text>

			{error ? <Text style={styles.error}>{error}</Text> : null}

			<TextInput
				style={styles.input}
				placeholder="Email"
				autoCapitalize="none"
				keyboardType="email-address"
				value={email}
				onChangeText={setEmail}
			/>

			<TextInput
				style={styles.input}
				placeholder="Password"
				secureTextEntry
				value={password}
				onChangeText={setPassword}
			/>

			<TouchableOpacity
				style={[styles.button, loading && styles.buttonDisabled]}
				onPress={handleLogin}
				disabled={loading}
			>
				<Text style={styles.buttonText}>
					{loading ? "Logging in..." : "Login"}
				</Text>
			</TouchableOpacity>

			<Link href="/(auth)/signup" style={styles.link}>
				Create an account
			</Link>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		padding: 24,
		backgroundColor: "#fff",
	},
	title: {
		fontSize: 32,
		fontWeight: "700",
		marginBottom: 20,
		color: "#111",
	},
	error: {
		color: "crimson",
		marginBottom: 12,
	},
	input: {
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 12,
		padding: 14,
		marginBottom: 14,
		backgroundColor: "#fafafa",
	},
	button: {
		backgroundColor: "#111",
		padding: 14,
		borderRadius: 12,
		alignItems: "center",
		marginBottom: 14,
	},
	buttonDisabled: {
		opacity: 0.7,
	},
	buttonText: {
		color: "#fff",
		fontWeight: "700",
	},
	link: {
		color: "#111",
		fontWeight: "600",
	},
});
