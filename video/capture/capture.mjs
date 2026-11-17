// Headless capture of the REAL Kidzopedia pages (served by video/harness) at a phone viewport.
// Usage (harness dev server must be running on :5199):  node capture.mjs
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, "../reel/assets/app");
fs.mkdirSync(out, { recursive: true });

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = "http://127.0.0.1:5199";
const W = 390, H = 844, DPR = 3;

// route, file prefix, scroll offsets (CSS px) to capture
const SHOTS = [
  ["/home", "home", [0, 760, 1500]],
  ["/moments", "moments", [0, 700, 1400]],
  ["/grow", "grow", [0, 700]],
  ["/books", "books", [0]],
  ["/books/new", "books-new", [0, 700]],
];

const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ["--no-sandbox", "--hide-scrollbars"] });
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: DPR, isMobile: true, hasTouch: true });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
page.on("console",(m) => m.type() === "error" && errors.push(m.text()));

for (const [route, name, offsets] of SHOTS) {
  await page.goto(BASE + route, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1800)); // let entrance animations settle
  for (const y of offsets) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await new Promise((r) => setTimeout(r, 500));
    const file = path.join(out, `${name}-${y}.png`);
    await page.screenshot({ path: file });
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    console.log(`${route} @${y} -> ${path.basename(file)} (page height ${h}px)`);
  }
}
console.log("console/page errors:", errors.length ? errors.slice(0, 15) : "none");
await browser.close();
