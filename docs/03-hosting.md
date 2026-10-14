# 03 · Hosting & Access

App today = static files (HTML/JS, ~1 MB) + browser localStorage. No server. Any static host works.

| Option | Effort | SSO | Cost | Notes |
|---|---|---|---|---|
| **GitHub Pages** (rough draft) | done | none (public URL) | $0 | Fine for demo; no Creek data stored server-side. Not for production. |
| **AWS S3 + CloudFront** | ~1 hr | add via CloudFront + Lambda@Edge/OIDC, or Cognito federated to Entra ID | pennies/mo at this scale | Custom domain flyers.creekpe.com via Route 53/ACM. |
| **AWS Amplify Hosting** | ~30 min, Git push deploys | Amplify Auth (Cognito) + Entra ID SAML/OIDC | low | Easiest AWS path; adds backend (DynamoDB/S3) when shared docs needed. |
| Azure Static Web Apps (comes with M365 tenant's Azure) | ~30 min | **Entra ID built in** (config file), restrict to Creek tenant | free tier available | Lowest-friction SSO for an O365 shop. |
| SharePoint / Teams tab | medium | automatic | included | SharePoint blocks custom script on modern pages; would need SPFx packaging. Good as a *link/tab* to the hosted app, not as the host. |
| creekpe.com subpath | depends on current host | none | ? | Check who hosts creekpe.com; simplest is a DNS CNAME `flyers.creekpe.com` → AWS/Azure host. |

## Recommendation
- **Now:** GitHub Pages for the review.
- **Pilot (week 1-2):** AWS Amplify (Creek already has AWS) at `flyers.creekpe.com`, Cognito federated with Entra ID so staff use O365 login; pin a Teams/SharePoint tab to it. If IT prefers Microsoft-only, Azure Static Web Apps is equal effort with native Entra auth.
- **v2 backend:** shared property records/templates → DynamoDB + S3 (Amplify) or SharePoint lists via Graph API. Proxy paid data API keys through a Lambda so keys never ship to the browser.
