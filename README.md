# Haryana + UP RERA new-registration email monitor

This service polls both official Haryana RERA registered-project lists (Panchkula/all other Haryana districts and the separate Gurugram authority list) plus the official UP RERA Gautam Buddha Nagar district feed. It emails each newly appearing registration to `bharadwajr278@gmail.com`.

Priority coverage:

- Gurugram and Faridabad on Haryana RERA
- Noida, Greater Noida, and Yamuna Expressway projects registered under Gautam Buddha Nagar on UP RERA

All Haryana districts remain monitored.

## What the alert contains

- Project name
- RERA registration/certificate number and portal project ID
- Developer/builder
- Location and city/district
- Registration approval date (looked up from the official detail page)
- Project type when a strong public category phrase is available
- Official RERA project/search link

SQLite stores every observed registration key with its authority source. Each source gets its own first-run baseline, so adding UP RERA does **not** send hundreds of historical emails. A newly detected record is queued until email succeeds and then marked notified, preventing normal restart/poll duplicates.

## Quick start on Windows

1. Install Python 3.11 or newer.
2. Copy `.env.example` to `.env`.
3. Enable Google two-step verification on the sending Gmail account, create a Google App Password, and put that 16-character app password in `SMTP_PASSWORD`. Do not use your normal Google password.
4. Fill `SMTP_USERNAME` and `EMAIL_FROM`. `EMAIL_TO` is already set to `bharadwajr278@gmail.com`.
5. Run:

   ```powershell
   .\run.ps1
   ```

Leave the process running. For reliable 24/7 monitoring, run it on an always-on VPS or use Docker below.

## Docker / VPS (recommended)

Copy `.env.example` to `.env`, fill the SMTP fields, then:

```bash
docker compose up -d --build
docker compose logs -f
```

The `data` directory is mounted so the deduplication database survives restarts and upgrades.

## GitHub Actions (runs with the laptop off)

The repository includes `.github/workflows/monitor-rera.yml`. GitHub runs it every
20 minutes and the checked-in SQLite baseline prevents duplicate or historical
alerts across fresh cloud runners.

Before enabling live email, add a repository Actions secret named
`GMAIL_APP_PASSWORD` containing a Google App Password for
`bharadwajr278@gmail.com`. Never use or commit the normal Gmail password. The
workflow can also sync the hosted admin panel when `ADMIN_API_URL`,
`ADMIN_API_KEY`, and `OAI_SITES_AUTH_TOKEN` are added as Actions secrets.

You can test it from GitHub under **Actions → Monitor new RERA projects → Run
workflow**. Scheduled runs may start a few minutes late during periods of high
GitHub Actions load.

## Admin dashboard

The project includes two admin interfaces:

- Hosted owner-only dashboard: `https://rera-mail-admin-bharadwaj.bhardwaj0129.chatgpt.site`
- Local fallback: `http://localhost:8080` when started through Docker Compose

The dashboard shows project name, RERA number, builder, city, registration date, official link, email status, detection time, and priority-market status. Search and filter controls cover Haryana RERA and UP RERA.

The hosted dashboard uses a private D1 database and a private R2 ingestion-audit bucket. The bucket has no public URL. Dashboard viewing requires the site owner's ChatGPT sign-in. The write API at `/api/ingest` separately requires the secret `ADMIN_API_KEY`; owner-private Sites deployments also require `OAI_SITES_AUTH_TOKEN` in the monitor environment. Never commit either token.

To run the local dashboard without Docker:

```powershell
.\run-admin.ps1
```

Set a long random `ADMIN_PASSWORD` first. The local dashboard uses HTTP Basic authentication and reads the same SQLite state as the monitor.

## Safe verification

To verify scraping without sending email, set `DRY_RUN=true` and `ALERT_ON_FIRST_RUN=false`, then run:

```powershell
python monitor.py --once
```

The initial run logs the baseline size. Set `DRY_RUN=false` for real alerts. Do not set `ALERT_ON_FIRST_RUN=true` on the live database unless you intentionally want an email for every currently listed project.

After adding SMTP credentials, send one clearly labelled test message with:

```powershell
python monitor.py --test-email
```

For an external mail sender such as the connected Gmail integration, collect new
records without SMTP and inspect the durable queue with:

```powershell
python monitor.py --collect-only
python monitor.py --pending-json
python monitor.py --mark-notified "Haryana RERA::registration-key"
```

Only mark a key after its email succeeds. This preserves retry behavior and
duplicate prevention across scheduled runs.

## Operations

- Default polling is every 120 seconds, giving an expected detection delay of roughly 0–2 minutes after an authority feed publishes a record, plus email delivery time.
- The monitor never bypasses authentication, CAPTCHA, or access controls.
- HTTP failures retry with backoff; a partial-looking page is rejected instead of being treated as a new state.
- Failed emails stay queued and retry on a later poll.
- Keep `.env` private and back up `data/haryana_rera.sqlite3`.
- The hosted admin API rejects unauthenticated requests and accepts at most 100 validated records per request.

## Official sources

`https://haryanarera.gov.in/admincontrol/registered_projects/1`

`https://haryanarera.gov.in/admincontrol/registered_projects/2`

`https://www.up-rera.in/View_projects.aspx`

The UP RERA browser search is CAPTCHA-protected and is not automated or bypassed. The monitor uses the public Gautam Buddha Nagar district service called by UP RERA's own project map.

The monitor can only detect a registration after the relevant authority publishes it in its public feed. Portal maintenance, delayed publication, or email-provider delays are outside the monitor's control.
