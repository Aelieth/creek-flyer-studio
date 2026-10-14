# Deployment

The build (`app/dist`, ~1.5 MB plus fonts) is static and works from any subpath (`base: './'`).

```bash
cd app && npm ci && npm run build   # → app/dist
```

## Current: GitHub Pages
The `gh-pages` branch holds the contents of `app/dist`. Live at https://aelieth.github.io/creek-flyer-studio/.
Binary assets (fonts, demo photos) are committed as base64 text (`*.b64`) and decoded at runtime; after adding one, run `app/scripts/encode-assets.sh`.

## Options
| Option | Effort | Sign-in | Cost | Notes |
|---|---|---|---|---|
| GitHub Pages | done | none (public) | $0 | Demo only. Don't put confidential listings in the public repo. |
| AWS Amplify Hosting | ~30 min | Cognito federated to Entra ID (O365 login) | low | Git-push deploys; easy to add DynamoDB/S3 for shared records |
| AWS S3 + CloudFront | ~1 hr | CloudFront + OIDC at edge | pennies/mo | Custom domain via Route 53/ACM |
| Azure Static Web Apps | ~30 min | Entra ID built in, restricted to tenant | free tier | Least friction for an Office 365 shop |
| SharePoint / Teams | medium | automatic | included | Modern pages block custom script; pin the hosted app as a Teams tab or link instead |
| Company website subdomain | DNS only | – | – | CNAME `flyers.<domain>` → the AWS/Azure host |

## Recommended path
1. Review on GitHub Pages now.
2. Pilot on Amplify or Azure SWA behind O365 sign-in with a private repo.
3. Backend for shared records/templates (DynamoDB+S3 or SharePoint lists via Graph). Proxy any paid data-API keys through a serverless function.
