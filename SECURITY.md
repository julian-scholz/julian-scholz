# Security Policy

## Supported versions

Only the current state of `main`, as deployed to [julian-scholz.dev](https://julian-scholz.dev), is supported. Older
commits and deployments receive no fixes.

## Scope

In scope:

- the website at `julian-scholz.dev`, both locales (`/` and `/en`)
- the Cloudflare Pages Function in `functions/` (e.g. the per-request CSP nonce)
- the static headers in `src/_headers`
- the source code and build setup in this repository

Out of scope:

- the infrastructure of Cloudflare and GitHub themselves; please report issues there to the respective vendor
- vulnerabilities in third-party dependencies that are not exploitable on this site; please report them upstream
- denial of service, load or volume testing
- social engineering, phishing or physical attacks
- reports from automated scanners without a demonstrated impact
- missing best-practice headers or email settings (e.g. SPF, DMARC) without a concrete attack scenario

## Reporting a vulnerability

Please do not open a public issue or pull request for security problems.

Report it privately through
[GitHub's private vulnerability reporting](https://github.com/julian-scholz/julian-scholz/security/advisories/new)
or by email to [mail@julian-scholz.dev](mailto:mail@julian-scholz.dev), with:

- a description of the issue and its impact
- the affected URL, file or component
- steps to reproduce or a proof of concept
- the browser and device, if relevant

Reports in English or German are welcome.

## What to expect

This is a personal website maintained by one person, so handling is best effort:

- an acknowledgement of your report within 7 days
- an assessment and, if the report is valid, a fix as soon as reasonably possible
- an update once the issue is resolved; with your consent, you will be credited in the fix commit

There is no bug bounty program.

## Good faith

Research that respects this policy is welcome. Please only test against your own sessions, do not access, modify or
delete data that is not yours, do not degrade the availability of the site, and give reasonable time for a fix before
disclosing the issue publicly.
