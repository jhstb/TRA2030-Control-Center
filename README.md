# TRA 2030 Control Center — V3.9.1 GitHub-Ready

Baseline: 18.09.2026

V3.9.1 is the GitHub-ready public package based on the confirmed V3.8.5 FIX2 / V3.9 functionality.

## Architecture
- Public project-control data is shipped with the static build.
- Detailed confidential money allocation is kept outside GitHub.
- Private allocation schema: `TRA2030_PRIVATE_COSTS_V1`.
- Private data is imported locally through **Costs 🔒** and stored in browser local storage.
- The repository explicitly ignores common private-cost filenames and paths.

## Important
The private layer is a data-separation mechanism, not cryptographic security. Do not store highly sensitive secrets in browser local storage.

See `README-GITHUB-DEPLOYMENT.md` for the deployment and pre-push checklist.
