import dotenv from "dotenv";

dotenv.config();

function requireEnv(name) {
	const value = process.env[name];

	if (!value) {
		throw new Error(`Missing environment variable: ${name}`);
	}

	return value;
}

export const PORT = process.env.PORT || 3000;

export const SUPABASE_URL = requireEnv("SUPABASE_URL");
export const SUPABASE_PUBLISHABLE_KEY = requireEnv("SUPABASE_PUBLISHABLE_KEY");
export const SUPABASE_SECRET_KEY = requireEnv("SUPABASE_SECRET_KEY");
export const SUPABASE_JWKS_URL = requireEnv("SUPABASE_JWKS_URL");
