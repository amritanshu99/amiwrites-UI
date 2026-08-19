import { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT_ID = "google-identity-services";
const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let googleScriptPromise;

const loadGoogleIdentityServices = () => {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
    const script = existingScript || document.createElement("script");

    const handleLoad = () => {
      if (window.google?.accounts?.id) {
        resolve(window.google);
      } else {
        googleScriptPromise = undefined;
        reject(new Error("Google Identity Services did not initialize."));
      }
    };

    const handleError = () => {
      googleScriptPromise = undefined;
      reject(new Error("Google Identity Services could not be loaded."));
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (!existingScript) {
      script.id = GOOGLE_SCRIPT_ID;
      script.src = GOOGLE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });

  return googleScriptPromise;
};

export default function GoogleSignInButton({
  disabled = false,
  mode = "signin",
  onCredential,
  onError,
}) {
  const buttonRef = useRef(null);
  const callbackRef = useRef(onCredential);
  const errorCallbackRef = useRef(onError);
  const [isLoading, setIsLoading] = useState(true);
  const clientId = (process.env.REACT_APP_GOOGLE_CLIENT_ID || "").trim();

  callbackRef.current = onCredential;
  errorCallbackRef.current = onError;

  useEffect(() => {
    if (!clientId || disabled) {
      setIsLoading(false);
      return undefined;
    }

    let disposed = false;
    setIsLoading(true);

    loadGoogleIdentityServices()
      .then((google) => {
        if (disposed || !buttonRef.current) return;

        buttonRef.current.replaceChildren();
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            const credential = response?.credential;
            if (typeof credential === "string" && credential) {
              callbackRef.current?.(credential);
            } else {
              errorCallbackRef.current?.(
                "Google did not return a credential. Please try again.",
              );
            }
          },
          ux_mode: "popup",
        });

        google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: document.documentElement.classList.contains("dark")
            ? "filled_black"
            : "outline",
          size: "large",
          text: mode === "signup" ? "signup_with" : "continue_with",
          shape: "pill",
          logo_alignment: "left",
          width: Math.min(buttonRef.current.clientWidth || 360, 400),
        });
        setIsLoading(false);
      })
      .catch((error) => {
        if (disposed) return;
        setIsLoading(false);
        errorCallbackRef.current?.(
          error?.message || "Google sign-in is unavailable right now.",
        );
      });

    return () => {
      disposed = true;
    };
  }, [clientId, disabled, mode]);

  if (!clientId) {
    return (
      <p
        className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100"
        role="status"
      >
        Google sign-in will appear after the site owner adds a Google client ID.
      </p>
    );
  }

  return (
    <div className="relative min-h-11 w-full">
      <div
        ref={buttonRef}
        className={`flex min-h-11 w-full items-center justify-center transition-opacity ${
          disabled ? "pointer-events-none opacity-50" : ""
        }`}
        aria-hidden={disabled || undefined}
      />
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300"
          role="status"
        >
          Loading Google sign-in...
        </div>
      )}
    </div>
  );
}

export { loadGoogleIdentityServices };
