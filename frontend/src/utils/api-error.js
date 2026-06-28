export function getApiError(error) {
	if (!error.response) {
		return {
			message: "Unable to connect to the server.",
			status: null,
		};
	}

	return {
		message: error.response.data?.message || "Something went wrong.",
		status: error.response.status,
	};
}

export const getApiErrorMessage = getApiError;
