import { Link } from "expo-router";
import { useState } from "react";
import {
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { AuthService } from "../../src/services/auth.service";

export default function LoginScreen() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const handleLogin = async () => {
		console.log({
			email,
			password,
		});
		await AuthService.signIn(email, password);
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Login</Text>

			<TextInput
				placeholder="Email"
				autoCapitalize="none"
				keyboardType="email-address"
				value={email}
				onChangeText={setEmail}
				style={styles.input}
			/>

			<TextInput
				placeholder="Password"
				secureTextEntry
				value={password}
				onChangeText={setPassword}
				style={styles.input}
			/>

			<TouchableOpacity style={styles.button} onPress={handleLogin}>
				<Text style={styles.buttonText}>Login</Text>
			</TouchableOpacity>

			<Link href="/signup">Don't have an account? Sign Up</Link>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		padding: 24,
	},

	title: {
		fontSize: 32,
		fontWeight: "700",
		marginBottom: 30,
	},

	input: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 14,
		marginBottom: 16,
	},

	button: {
		backgroundColor: "#000",
		padding: 16,
		borderRadius: 8,
		marginBottom: 20,
	},

	buttonText: {
		color: "#fff",
		textAlign: "center",
		fontWeight: "600",
	},
});
