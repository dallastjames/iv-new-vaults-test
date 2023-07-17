import toast from "solid-toast";

export function success(message: string) {
  toast.success(message, { position: "bottom-center" });
}

export function warn(message: string) {
  toast.error(message, {
    position: "bottom-center",
    iconTheme: {
      primary: "#ea580c",
      secondary: "#ffedd5",
    },
    className: "border-2 border-orange-800",
    style: {
      color: "#c2410c",
      background: "#ffedd5",
    },
  });
}

export function error(message: string) {
  toast.error(message, { position: "bottom-center" });
}
