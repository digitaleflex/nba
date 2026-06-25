# Test Cases

> **Version:** 1.0

## Authentication

| TC | Description | Expected |
|----|-------------|----------|
| TC-AUTH-001 | Register with valid data | User created, email sent |
| TC-AUTH-002 | Register with existing email | Error: email exists |
| TC-AUTH-003 | Login with valid credentials | Session created |
| TC-AUTH-004 | Login with wrong password | Error: invalid credentials |
| TC-AUTH-005 | Login with unverified email | Error: email not verified |
| TC-AUTH-006 | Reset password with valid token | Password changed |
| TC-AUTH-007 | Reset password with expired token | Error: token expired |

## Members

| TC | Description | Expected |
|----|-------------|----------|
| TC-MEM-001 | List members as admin | Member list returned |
| TC-MEM-002 | List members as member | Error: forbidden |
| TC-MEM-003 | Update own profile | Profile updated |
| TC-MEM-004 | Update another member as admin | Profile updated |
| TC-MEM-005 | Update another member as member | Error: forbidden |

## KYC

| TC | Description | Expected |
|----|-------------|----------|
| TC-KYC-001 | Submit KYC with valid documents | Status: PENDING |
| TC-KYC-002 | Submit KYC with invalid file type | Error: invalid file |
| TC-KYC-003 | Approve KYC as agent | Status: APPROVED, notification sent |
| TC-KYC-004 | Reject KYC with reason | Status: REJECTED, notification sent |

## Signals

| TC | Description | Expected |
|----|-------------|----------|
| TC-SIG-001 | Create signal as admin | Signal created (DRAFT) |
| TC-SIG-002 | Create signal as member | Error: forbidden |
| TC-SIG-003 | Publish signal | Signal published, queued for distribution |
| TC-SIG-004 | View signal as member with access | Signal visible |
| TC-SIG-005 | View signal as member without access | Error: not found |
