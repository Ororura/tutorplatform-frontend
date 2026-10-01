// Clipboard writes are used for invitation/share links and content-package prompts.
// All other listed capabilities are unused by the application.
export const permissionsPolicy = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "payment=()",
  "usb=()",
  "serial=()",
  "hid=()",
  "display-capture=()",
  "fullscreen=()",
  "clipboard-read=()",
  "clipboard-write=(self)",
].join(", ");

export function productionSecurityHeaders() {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    // Public share URLs contain bearer tokens: never send the URL as a referrer.
    { key: "Referrer-Policy", value: "no-referrer" },
    { key: "Permissions-Policy", value: permissionsPolicy },
  ];
}
