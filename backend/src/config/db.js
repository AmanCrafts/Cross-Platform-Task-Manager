import { createClient } from "@supabase/supabase-js";

import { SUPABASE_SECRET_KEY, SUPABASE_URL } from "./env.js";

export const db = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
	db: {
		schema: "public",
	},

	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});
