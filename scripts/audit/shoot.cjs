#!/usr/bin/env node
// Captures d'écran des parcours (desktop 1440x900 + mobile iPhone 13).
// Usage : node shoot.cjs --who member|admin|public [--mode desktop,mobile] [--only /dashboard/signals] [--out ./out]
const fs = require('fs')
const path = require('path')
const { launchBrowser, routes, newContext, login, visit, parseArgs } = require('./lib.cjs')

;(async () => {
  const { who, modes, only, out } = parseArgs()
  fs.mkdirSync(out, { recursive: true })
  const list = routes[who].filter((r) => !only || r.includes(only))
  const browser = await launchBrowser()
  for (const mode of modes) {
    const ctx = await newContext(browser, mode)
    if (who !== 'public') await login(ctx, who)
    for (const route of list) {
      const page = await visit(ctx, route)
      await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' }).catch(() => {})
      const name = `${who}_${mode}_${route.replace(/[\/?=&]/g, '_').replace(/^_/, '') || 'root'}.png`
      await page.screenshot({ path: path.join(out, name), fullPage: mode === 'desktop' })
      console.log(`${mode.padEnd(8)} ${route}  ->  ${name}`)
      await page.close()
    }
    await ctx.close()
  }
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
