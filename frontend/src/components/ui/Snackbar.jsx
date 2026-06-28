// Snackbar — kept as a thin alias of ToastHost for screens that prefer
// to render their own toasts. In this app ToastHost is the canonical
// implementation; this file exists so feature code can import either.
import ToastHost from "./ToastHost";
export default ToastHost;
