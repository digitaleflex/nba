# File Upload Security

> **Version:** 1.0

## Validation Pipeline

```
Upload Request
    │
    ▼
Authentication check
    │
    ▼
File type validation (MIME)
    │
    ▼
File extension whitelist
    │
    ▼
File size limit check
    │
    ▼
Filename sanitization
    │
    ▼
Store with UUID filename
    │
    ▼
Process (if applicable)
    │
    ▼
Schedule cleanup
```

## Allowed Types

| Category | MIME Types | Max Size |
|----------|------------|----------|
| KYC documents | image/jpeg, image/png, application/pdf | 10 MB |
| Broker videos | video/mp4, video/quicktime | 100 MB |
| Avatars | image/jpeg, image/png, image/webp | 5 MB |
