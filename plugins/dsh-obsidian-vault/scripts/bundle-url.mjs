import { chromium } from './playwright-env.mjs'
const url = process.argv[2]
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH === undefined ? {} : { executablePath: process.env.CHROMIUM_PATH }) })
const page = await browser.newPage()
const bundle = []
page.on('response', (r) => { if (r.url().includes('dsh-obsidian-vault/client.js')) bundle.push(r.url()) })
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(4500)
console.log(JSON.stringify(bundle, null, 2))
await browser.close()
