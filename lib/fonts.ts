import localFont from "next/font/local";

// Glock Grotesk font - user will need to add the font files to /public/fonts
// For now, using a fallback system font
export const glockGrotesk = localFont({
  src: [
    {
      path: "../public/fonts/GlockGrotesk-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/GlockGrotesk-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/GlockGrotesk-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-glock-grotesk",
  fallback: ["system-ui", "sans-serif"],
  display: "swap",
});

