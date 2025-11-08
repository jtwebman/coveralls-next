# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 6.x     | :white_check_mark: |
| < 6.0   | :x:                |

## Reporting a Vulnerability

We take the security of coveralls-next seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please DO NOT:

- Open a public GitHub issue for security vulnerabilities
- Disclose the vulnerability publicly before it has been addressed

### Please DO:

1. **Email** the maintainers directly at: [security contact - add actual email]

2. **Include** in your report:
   - Description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact
   - Suggested fix (if you have one)
   - Your contact information

3. **Allow time** for us to:
   - Confirm the vulnerability
   - Develop and test a fix
   - Release a patched version
   - Publicly disclose the vulnerability

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Assessment**: We will assess the vulnerability and determine its impact within 7 days
- **Fix Timeline**: For confirmed vulnerabilities, we aim to release a fix within 30 days
- **Credit**: We will credit you in the security advisory (unless you prefer to remain anonymous)

### Security Update Process

When a security vulnerability is fixed:

1. A new version is released with the fix
2. A security advisory is published on GitHub
3. The vulnerability details are disclosed after users have had time to upgrade
4. Credit is given to the reporter (if desired)

## Security Best Practices

When using coveralls-next:

### Protect Your Tokens

- **Never commit** `COVERALLS_REPO_TOKEN` or other secrets to your repository
- Use environment variables or CI secrets for sensitive data
- Rotate tokens if they may have been exposed

### CI Configuration

- Use the principle of least privilege for CI permissions
- Limit token scope to only what's necessary
- Audit your CI configurations regularly

### Dependencies

- Keep coveralls-next updated to the latest version
- Regularly run `npm audit` to check for vulnerabilities in dependencies
- Review dependency updates before installing them

## Known Security Considerations

### Token Transmission

- Tokens are transmitted over HTTPS to the Coveralls API
- Tokens are not logged or displayed in output (except with `--stdout` flag)
- Be cautious when using `--stdout` in CI environments where logs are public

### File System Access

- coveralls-next reads local files and git repository data
- Ensure your CI environment is trusted and secure
- Review file paths in LCOV data to prevent information disclosure

### Environment Variables

The following environment variables may contain sensitive information:

- `COVERALLS_REPO_TOKEN`
- `COVERALLS_SERVICE_JOB_ID`
- CI-specific token variables

Ensure these are properly secured in your CI environment.

## Disclosure Policy

We follow coordinated vulnerability disclosure:

1. **Private Disclosure**: Report privately to maintainers
2. **Fix Development**: Maintainers develop and test fix
3. **Coordinated Release**: Fix is released with version bump
4. **Public Disclosure**: Details published after users can upgrade
5. **Timeline**: Typically 90 days from report to public disclosure

## Security Hall of Fame

We recognize and thank security researchers who help keep coveralls-next secure:

(No reports yet - you could be the first!)

## Contact

For security-related questions or concerns, please email: [security contact - add actual email]

For non-security bugs, please use the [GitHub issue tracker](https://github.com/nickmerwin/coveralls-next/issues).

## Updates

This security policy is subject to change. Please check back periodically for updates.

Last updated: 2025-11-08
