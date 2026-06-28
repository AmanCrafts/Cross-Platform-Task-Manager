// Signup screen — same shape as login, plus a confirm-password field
// with inline match validation.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import InputField from "../../src/components/ui/InputField";
import PrimaryButton from "../../src/components/ui/PrimaryButton";
import ScreenContainer from "../../src/components/ui/ScreenContainer";
import TextButton from "../../src/components/ui/TextButton";
import { useToast } from "../../src/hooks/useToast";
import { AuthService } from "../../src/services/auth.service";
import { colors, radius, spacing, typography } from "../../src/theme";

export default function SignupScreen() {
	const router = useRouter();
	const { show } = useToast();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const passwordsMismatch = confirm.length > 0 && confirm !== password;
	const canSubmit =
		email.trim().length > 0 &&
		password.length >= 6 &&
		confirm === password &&
		!loading;

	const handleSignup = async () => {
		setError("");

		if (!email.trim() || !password) {
			setError("Email and password are required.");
			return;
		}

		if (password.length < 6) {
			setError("Password must be at least 6 characters.");
			return;
		}

		if (password !== confirm) {
			setError("Passwords do not match.");
			return;
		}

		setLoading(true);
		const result = await AuthService.signUp(email.trim(), password);
		setLoading(false);

		if (!result.success) {
			setError(result.message || "Sign up failed. Please try again.");
			return;
		}

		show({ message: "Account created", tone: "success" });

		if (result.data?.session) {
			router.replace("/(app)/(tabs)/profile");
		} else {
			router.replace("/(auth)/login");
		}
	};

	return (
		<ScreenContainer background="background" padded>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={styles.flex}
			>
				<ScrollView
					contentContainerStyle={styles.content}
					keyboardShouldPersistTaps="handled"
					keyboardDismissMode="on-drag"
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.brandMark}>
						<Ionicons
							name="checkmark-circle"
							size={28}
							color={colors.text.inverse}
						/>
					</View>

					<Text style={styles.title}>Create your account</Text>
					<Text style={styles.subtitle}>
						Get started with your tasks in seconds.
					</Text>

					<View style={styles.form}>
						{error ? (
							<View style={styles.errorBanner}>
								<Ionicons
									name="alert-circle-outline"
									size={18}
									color={colors.semantic.danger}
								/>
								<Text style={styles.errorText}>{error}</Text>
							</View>
						) : null}

						<InputField
							label="Email"
							value={email}
							onChangeText={setEmail}
							placeholder="you@example.com"
							keyboardType="email-address"
							autoCapitalize="none"
							autoComplete="email"
							leftIcon={
								<Ionicons
									name="mail-outline"
									size={18}
									color={colors.text.secondary}
								/>
							}
						/>

						<InputField
							label="Password"
							value={password}
							onChangeText={setPassword}
							placeholder="At least 6 characters"
							secureTextEntry
							autoComplete="password-new"
							leftIcon={
								<Ionicons
									name="lock-closed-outline"
									size={18}
									color={colors.text.secondary}
								/>
							}
							helper="Use something memorable — at least 6 characters."
						/>

						<InputField
							label="Confirm password"
							value={confirm}
							onChangeText={setConfirm}
							placeholder="Re-enter password"
							secureTextEntry
							autoComplete="password-new"
							error={passwordsMismatch ? "Passwords do not match." : undefined}
							leftIcon={
								<Ionicons
									name="shield-checkmark-outline"
									size={18}
									color={colors.text.secondary}
								/>
							}
						/>

						<PrimaryButton
							label={loading ? "Creating account..." : "Create account"}
							onPress={handleSignup}
							disabled={!canSubmit}
							loading={loading}
							size="lg"
							fullWidth
						/>

						<View style={styles.linkRow}>
							<TextButton
								label="Already have an account?"
								tone="brand"
								onPress={() => router.replace("/(auth)/login")}
							/>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</ScreenContainer>
	);
}

const styles = StyleSheet.create({
	flex: {
		flex: 1,
	},
	content: {
		flexGrow: 1,
		justifyContent: "center",
		paddingVertical: spacing["3xl"],
	},
	brandMark: {
		width: 48,
		height: 48,
		borderRadius: radius.md,
		backgroundColor: colors.brand.primary,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: spacing.xl,
	},
	title: {
		...typography.display,
		color: colors.text.primary,
	},
	subtitle: {
		...typography.bodyLg,
		color: colors.text.secondary,
		marginTop: spacing.sm,
		marginBottom: spacing["2xl"],
	},
	form: {
		gap: spacing.base,
	},
	errorBanner: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		padding: spacing.md,
		borderRadius: radius.md,
		backgroundColor: colors.semantic.dangerBg,
		marginBottom: spacing.sm,
	},
	errorText: {
		...typography.body,
		color: colors.semantic.danger,
		flex: 1,
	},
	linkRow: {
		alignItems: "center",
		marginTop: spacing.base,
	},
});
