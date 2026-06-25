# Regression Tests

> **Version:** 1.0

## Critical Paths

These tests must pass before every release:

### Authentication
- [ ] User can register, verify email, and login
- [ ] User can reset password
- [ ] Session expires correctly

### KYC + Broker
- [ ] User can submit KYC documents
- [ ] Agent can approve KYC
- [ ] User can submit broker verification
- [ ] Agent can approve broker verification

### Signals
- [ ] Admin can create and publish a signal
- [ ] Signal appears for members with access
- [ ] Signal does not appear for members without access

### Notifications
- [ ] In-app notification created on signal publish
- [ ] Email sent on KYC approval
