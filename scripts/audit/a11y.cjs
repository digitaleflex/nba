#!/usr/bin/env node
// Mesures automatiques : axe-core (WCAG 2.1 A/AA), zones tactiles, textes < 12 px, débordement horizontal.
// Usage : node a11y.cjs --who member|admin|public [--mode desktop,mobile] [--only /admin] [--json out/a11y.json]
// Code de sortie : 1 si au moins une violation axe d'impact « serious » ou « critical » (utilisable en CI).
const fs = require('fs')
const path = require('path')
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')
const { launchBrowser, routes, newContext, login, visit, parseArgs } = require('./lib.cjs')

function metrics() {
  const de = document.documentElement
  const visible = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' }
  const clickable = [...document.querySelectorAll('a,button,[role=button],input[type=checkbox],select')].filter(visible)
  const small = (px) => clickable.filter((e) => { const r = e.getBoundingClientRect(); return r.height < px || r.width < px }).length
  const tinyText = [...document.querySelectorAll('body *')].filter((e) => {
    if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return false
    return visible(e) && parseFloat(getComputedStyle(e).fontSize) < 12
  }).length
  return {
    horizontalOverflowPx: Math.max(0, de.scrollWidth - de.clientWidth),
    targetsUnder24px: small(24),     // WCAG 2.5.8 (AA)
    targetsUnder44px: small(44),     // recommandation Apple/Google
    textUnder12px: tinyText,
  }
}

;(async () => {
  const { who, modes, only } = parseArgs()
  const jsonIdx = process.argv.indexOf('--json')
  const jsonOut = jsonIdx >= 0 ? process.argv[jsonIdx + 1] : null
  const list = routes[who].filter((r) => !only || r.includes(only))
  const browser = await launchBrowser()
  const results = []
  let blocking = 0
  for (const mode of modes) {
    const ctx = await newContext(browser, mode)
    if (who !== 'public') await login(ctx, who)
    for (const route of list) {
      const page = await visit(ctx, route)
      const m = await page.evaluate(metrics)
      await page.addScriptTag({ content: axeSource })
      const violations = await page.evaluate(async () => {
        const r = await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] })
        return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, example: v.nodes[0] && v.nodes[0].target.join(' ') }))
      })
      const serious = violations.filter((v) => ['serious', 'critical'].includes(v.impact))
      blocking += serious.reduce((n, v) => n + v.nodes, 0)
      results.push({ who, mode, route, ...m, violations })
      console.log(`${mode.padEnd(8)} ${route.padEnd(34)} overflow=${m.horizontalOverflowPx} <24px=${m.targetsUnder24px} <44px=${m.targetsUnder44px} <12px=${m.textUnder12px} axe=${violations.map((v) => `${v.id}:${v.nodes}`).join(',') || 'OK'}`)
      await page.close()
    }
    await ctx.close()
  }
  await browser.close()
  if (jsonOut) { fs.mkdirSync(path.dirname(jsonOut), { recursive: true }); fs.writeFileSync(jsonOut, JSON.stringify(results, null, 2)) }
  console.log(`\nViolations axe serious/critical : ${blocking}`)
  process.exit(blocking > 0 ? 1 : 0)
})().catch((e) => { console.error(e); process.exit(2) })
