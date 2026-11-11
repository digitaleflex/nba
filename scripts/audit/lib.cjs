const { chromium, devices } = require('playwright')
const routes = require('./routes.cjs')

const BASE = process.env.BASE_URL || 'http://localhost:3000'

// Tours guidés (driver.js) et jalons : on les marque « vus » pour qu'ils ne masquent pas les pages.
const SEEN_KEYS = ['welcome-guide', 'first-trade-guide', 'stats-guide', 'first-signal-guide', 'reflection-guide']

async function newContext(browser, mode) {
  const base = mode === 'mobile' ? devices[routes.viewports.mobile] : routes.viewports.desktop
  const ctx = await browser.newContext({ ...base, locale: 'fr-FR', bypassCSP: true })
  await ctx.addInitScript((keys) => { for (const k of keys) localStorage.setItem('nba:' + k, 'true') }, SEEN_KEYS)
  return ctx
}

async function login(ctx, who) {
  const { email, password } = routes.accounts[who]
  const page = await ctx.newPage()
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' })
  await page.fill('input[type=email]', email)
  await page.fill('input[type=password]', password)
  await page.click('button[type=submit]')
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 }).catch(() => {})
  await page.close()
}

async function visit(ctx, route) {
  const page = await ctx.newPage()
  await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {})
  await page.waitForTimeout(1200)
  return page
}

// CHROMIUM_PATH : utiliser un Chromium déjà installé (ex. /opt/pw-browsers/chromium en sandbox)
// au lieu de celui que `npx playwright install chromium` télécharge pour cette version de Playwright.
function launchBrowser() {
  const executablePath = process.env.CHROMIUM_PATH || undefined
  return chromium.launch(executablePath ? { executablePath, args: ['--no-sandbox'] } : {})
}

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d }
  return {
    who: (get('who', 'member')),                 // public | member | admin
    modes: get('mode', 'desktop,mobile').split(','),
    only: get('only', ''),                        // filtre sous-chaîne sur la route
    out: get('out', require('path').join(__dirname, 'out')),
  }
}

module.exports = { launchBrowser, routes, BASE, newContext, login, visit, parseArgs }
