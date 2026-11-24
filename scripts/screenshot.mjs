// Screenshot di una creatività HTML con Playwright per Node: node screenshot.mjs <html> <png> [scala]
const [html, png, scale = "2"] = process.argv.slice(2);
const { chromium } = await import("playwright");
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: Number(scale) });
await p.goto("file://" + html, { waitUntil: "networkidle" });
await p.evaluate("window.__fit()");
await p.waitForTimeout(300);
await p.locator("#c").screenshot({ path: png });
await b.close();
