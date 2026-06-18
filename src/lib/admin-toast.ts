export type ToastType = "success" | "error" | "warning" | "info";

export function showToast(message: string, type: ToastType = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("admin-toast", { detail: { message, type } }));
}
