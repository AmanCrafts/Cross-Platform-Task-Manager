// Tiny event-emitter-backed toast system.
//
// useToast().show({ message }) pushes a message to the global ToastHost
// mounted in app/_layout.jsx. The host handles rendering and auto-dismiss.

import { useCallback, useEffect, useState } from "react";

// Module-level pub/sub — lives outside React tree.
const listeners = new Set();

let nextId = 1;

function emit(toast) {
	for (const listener of listeners) {
		listener(toast);
	}
}

export const toast = {
	show({ message, tone = "default", durationMs, action } = {}) {
		if (!message) return;
		const id = nextId++;
		const resolvedDuration = durationMs ?? (action ? 4000 : 2500);
		emit({ id, message, tone, durationMs: resolvedDuration, action });
	},
};

export function useToast() {
	const show = useCallback((options) => toast.show(options), []);
	return { show };
}

// Used internally by ToastHost to subscribe to new toasts.
export function useToastSubscription() {
	const [current, setCurrent] = useState(null);

	useEffect(() => {
		const handler = (toastEvent) => {
			setCurrent(toastEvent);
		};
		listeners.add(handler);
		return () => {
			listeners.delete(handler);
		};
	}, []);

	const clear = useCallback(() => setCurrent(null), []);

	return { current, clear };
}
