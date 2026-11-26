# DUPAMAN Google Sheets bridge

This Apps Script project is the server-side bridge between the DUPAMAN Vercel API and the `Studio_CMS` tab.

## Setup

1. Open the management spreadsheet while signed into the Google account that has **Editor** access.
2. Open **Extensions → Apps Script** and add the contents of `Code.gs`.
3. In **Project Settings → Script Properties**, add:
   - `DUPAMAN_WEBHOOK_SECRET`: a long random secret. Keep it private.
4. Deploy as a **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
   This exposes read-only CMS records via GET. POST requests still require the secret and the owner email.
5. In Vercel project environment variables, set for **Production**:
   - `DUPAMAN_EXHIBITS_SCRIPT_URL`: the deployed `/exec` URL.
   - `DUPAMAN_WEBHOOK_SECRET`: the same random secret.
   - `DUPAMAN_ADMIN_PIN`: a separate owner-only PIN.
6. Redeploy the production deployment after saving the variables.
7. In the DUPAMAN control panel, sign in as the owner and approve one intended item. Confirm the response is saved to `Studio_CMS` and then visible on the site.

## Safety and behavior

- No article or CMS content is created or approved by this bridge on its own.
- Only the owner's final control-panel approval sends `visibility: TRUE`.
- The `delete` action changes visibility to `HIDDEN` to preserve row history.
- The code refuses to write if the expected columns, server URL, secret, or owner PIN are missing.
- Do not put either secret in a spreadsheet cell, client-side code, or browser local storage.
