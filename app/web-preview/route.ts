import { webPreviewCsp } from "../../browser-security";

// A separate document policy permits student scripts without relaxing application script policy.
// The iframe and the response CSP both give the document an opaque origin.
const document = `<!doctype html><html lang="ru"><head><meta charset="utf-8"></head><body>
<script>
(function () {
  function receive(event) {
    if (event.source !== parent || event.origin !== location.origin || event.data?.type !== 'web-preview-source') return;
    const files = event.data.files;
    if (!files || ['html','css','javascript'].some(key => typeof files[key] !== 'string') ||
        Object.values(files).some(value => value.length > 200000)) return;
    removeEventListener('message', receive);
    const escapeEnd = value => value.replace(/<\\//g, '<\\\\/');
    const bridge = '(' + function () {
      let count = 0;
      const send = (level, value) => {
        if (count++ < 100) parent.postMessage({type:'web-preview-log', level, message:String(value).slice(0,2000)}, '*');
      };
      for (const level of ['log','warn','error']) {
        console[level] = (...args) => send(level, args.map(value => {
          try { return typeof value === 'string' ? value : JSON.stringify(value); } catch { return String(value); }
        }).join(' '));
      }
      addEventListener('error', event => send('error', event.message));
      addEventListener('unhandledrejection', event => send('error', event.reason));
    }.toString() + ')();';
    const html = '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>' + escapeEnd(files.css) + '</style><script>' + escapeEnd(bridge) + '<' + '/script></head><body>' + files.html + '<script>' + escapeEnd(files.javascript) + '<' + '/script></body></html>';
    document.open(); document.write(html); document.close();
  }
  addEventListener('message', receive);
  parent.postMessage({type:'web-preview-ready'}, '*');
})();
</script></body></html>`;

export function GET() {
  return new Response(document, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": webPreviewCsp,
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
