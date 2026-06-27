export function getAuthErrorMessage(error) {
	if (!error) {
		return "Something went wrong.";
	}

	switch (error.code) {
		case "email_exists":
			return "An account with this email already exists.";

		case "invalid_credentials":
			return "Invalid email or password.";

		case "email_not_confirmed":
			return "Please verify your email before logging in.";

		case "weak_password":
			return "Password must be at least 6 characters.";

		default:
			break;
	}

	const message = error.message?.toLowerCase() ?? "";

	if (message.includes("already registered")) {
		return "An account with this email already exists.";
	}

	if (message.includes("invalid login credentials")) {
		return "Invalid email or password.";
	}

	if (message.includes("password")) {
		return "Password is invalid.";
	}

	if (message.includes("network")) {
		return "No internet connection.";
	}

	return "Something went wrong. Please try again.";
}
