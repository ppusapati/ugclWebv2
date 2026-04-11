import { component$, isDev, useVisibleTask$ } from "@builder.io/qwik";
import { QwikCityProvider, RouterOutlet } from "@builder.io/qwik-city";
import { RouterHead } from "./components/router-head/router-head";
import { AuthProvider } from "./contexts/auth-context";
import { MenuProvider } from "./contexts/menu-context";
import { ThemeProvider } from "./contexts/theme-context";
import "./styles/tokens.css";
import 'virtual:uno.css';
import "./global.css";

export default component$(() => {
  // Defer non-critical browser work until idle so first paint is not blocked.
  useVisibleTask$(() => {
    const requestPermission = () => {
      if ("Notification" in window && Notification.permission === "default") {
        void Notification.requestPermission();
      }
    };
    const browserWindow = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (browserWindow.requestIdleCallback) {
      const idleId = browserWindow.requestIdleCallback(requestPermission, { timeout: 3000 });
      return () => browserWindow.cancelIdleCallback?.(idleId);
    }

    const timeoutId = globalThis.setTimeout(requestPermission, 1500);
    return () => globalThis.clearTimeout(timeoutId);
  });
  /**
   * The root of a QwikCity site always start with the <QwikCityProvider> component,
   * immediately followed by the document's <head> and <body>.
   *
   * Don't remove the `<head>` and `<body>` elements.
   */

  return (
    <QwikCityProvider>
      <head>
        <meta charset="utf-8" />
        {!isDev && (
          <link
            rel="manifest"
            href={`${import.meta.env.BASE_URL}manifest.json`}
          />
        )}
        {/* Inter Font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <RouterHead />
      </head>
      <body lang="en" class="font-sans antialiased">
        <AuthProvider>
          <ThemeProvider>
            <MenuProvider>
              <RouterOutlet />
            </MenuProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </QwikCityProvider>
  );
});
