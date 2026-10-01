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

export function applicationCsp(nonce?: string) {
  return [
    "default-src 'self'",
    `script-src 'self'${nonce ? ` 'nonce-${nonce}'` : ""}`,
    "script-src-attr 'none'",
    // React uses style attributes for progress widths and Next/Image layout.
    "style-src 'self' 'unsafe-inline'",
    // Uploaded image previews use object URLs. No remote image hosts are used.
    "img-src 'self' blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'none'",
    "media-src 'none'",
    "object-src 'none'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}
