# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in ai-prompt-cache, please report it responsibly.

**Do not** open a public GitHub issue for security vulnerabilities.

Instead, email security@ai-prompt-cache.dev (or open a private security advisory on GitHub) with:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

We aim to respond within 48 hours and will keep you informed of the remediation progress.

## Security Best Practices

When using ai-prompt-cache:

- Never commit API keys — use environment variables
- Use Redis AUTH and TLS in production
- Set appropriate TTL values to limit stale cached data
- Review cached content for sensitive data before enabling caching in production
