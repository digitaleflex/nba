// Parcours audités. Source unique pour shoot.cjs et a11y.cjs.
const tabs = ['requests', 'membres', 'users', 'kyc', 'broker', 'signals', 'emails', 'notifications',
  'formation', 'bugs', 'moderation', 'security', 'fraud', 'analytics', 'revenue', 'devices', 'settings', 'crons']

module.exports = {
  public: ['/login', '/register', '/forgot-password'],
  member: [
    '/dashboard', '/dashboard/signals', '/dashboard/signals/tracking', '/dashboard/journal', '/dashboard/lot',
    '/dashboard/messages', '/dashboard/notifications', '/dashboard/profile', '/dashboard/redpills',
    '/dashboard/subscription', '/dashboard/support', '/dashboard/devices', '/dashboard/verification',
  ],
  admin: [
    '/admin', '/admin/a-traiter', '/admin/audit', '/admin/bulk-message', '/admin/coaching', '/admin/messages',
    '/admin/queues', '/admin/redpills', '/admin/security/fraud', '/admin/support', '/admin/tracker',
    '/admin/webhooks/dlq', '/admin/developer', '/admin/cache',
    ...tabs.map((t) => `/admin?tab=${t}`),
  ],
  accounts: {
    member: { email: process.env.MEMBER_EMAIL || 'membre@example.com', password: process.env.MEMBER_PASSWORD || 'Membre12345!x' },
    admin: { email: process.env.ADMIN_EMAIL || 'admin@example.com', password: process.env.ADMIN_PASSWORD || 'Admin12345!x' },
  },
  viewports: {
    desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    mobile: 'iPhone 13', // émulation Playwright (390x844, DPR 3)
  },
}
