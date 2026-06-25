# QA Checklist

> **Version:** 1.0

## Pre-Release

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] E2E tests pass on staging
- [ ] Lint passes
- [ ] Type check passes
- [ ] No known critical bugs

## Functional

- [ ] Registration flow works end-to-end
- [ ] Login/logout works
- [ ] Password reset works
- [ ] KYC submission and review works
- [ ] Broker verification works
- [ ] Signal creation and publication works
- [ ] Notifications are delivered
- [ ] Admin panel functions work

## Security

- [ ] Unauthenticated users cannot access protected routes
- [ ] Unauthorized users cannot access admin features
- [ ] File upload validation works
- [ ] Rate limiting is active
- [ ] No sensitive data in API responses
