// Apre il browser di Nest Signal (profilo dedicato in workspace/browser) sulla pagina di login di LinkedIn.
// Il cliente fa login una volta; i moduli che leggono LinkedIn useranno lo stesso profilo tramite Playwright MCP.
// La password la scrive solo il cliente: Nest Signal non la vede e non la salva.
import { BROWSER_PROFILE } from "../server/store.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("Playwright non è installato. Esegui: npm install playwright && npx playwright install chromium");
  process.exit(1);
}
const ctx = await chromium.launchPersistentContext(BROWSER_PROFILE, { headless: false, viewport: null });
const page = ctx.pages()[0] || (await ctx.newPage());
await page.goto("https://www.linkedin.com/login");
await new Promise((r) => ctx.on("close", r)); // si chiude quando il cliente chiude la finestra
