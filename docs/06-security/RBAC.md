# Role-Based Access Control (RBAC)

> **Version:** 1.0

## Roles

| Role | Level | Description |
|------|-------|-------------|
| SUPER_ADMIN | 5 | Full system access |
| ADMIN | 4 | Administrative operations |
| KYC_AGENT | 3 | KYC verification |
| SUPPORT_AGENT | 2 | Support operations |
| MEMBER | 1 | Standard platform access |

## Permissions by Role

| Permission | SUPER_ADMIN | ADMIN | KYC_AGENT | SUPPORT_AGENT | MEMBER |
|------------|:-----------:|:-----:|:---------:|:-------------:|:-----:|
| users.read | ✅ | ✅ | ❌ | ✅ | ❌ |
| users.update | ✅ | ✅ | ❌ | ❌ | ❌ |
| users.suspend | ✅ | ✅ | ❌ | ❌ | ❌ |
| subscriptions.manage | ✅ | ✅ | ❌ | ❌ | ❌ |
| kyc.review | ✅ | ✅ | ✅ | ❌ | ❌ |
| broker.review | ✅ | ✅ | ✅ | ❌ | ❌ |
| signals.create | ✅ | ✅ | ❌ | ❌ | ❌ |
| signals.publish | ✅ | ✅ | ❌ | ❌ | ❌ |
| notifications.send | ✅ | ✅ | ❌ | ❌ | ❌ |
| settings.manage | ✅ | ❌ | ❌ | ❌ | ❌ |
| audit.read | ✅ | ✅ | ❌ | ❌ | ❌ |
