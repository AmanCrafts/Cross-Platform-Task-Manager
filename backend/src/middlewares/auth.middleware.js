import { createRemoteJWKSet, jwtVerify } from "jose";

import { SUPABASE_JWKS_URL } from "../config/env.js";

const JWKS = createRemoteJWKSet(new URL(SUPABASE_JWKS_URL));

export async function authenticate(req, res, next) {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader?.startsWith("Bearer ")) {
			return res.status(401).json({
				success: false,
				message: "Authentication required",
			});
		}

		const token = authHeader.substring(7);

		const { payload } = await jwtVerify(token, JWKS);

		req.user = {
			id: payload.sub,
			email: payload.email,
			role: payload.role,
		};

		next();
	} catch (_error) {
		return res.status(401).json({
			success: false,
			message: "Invalid or expired token",
		});
	}
}
