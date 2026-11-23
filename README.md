# DUPAMAN Digital Product Studio — דופמין ("כל אתר = סוכן")

[![License: MIT](https://img.shields.io/badge/License-MIT-e8b84b.svg)](LICENSE)
[![A2A Protocol: v1.0](https://img.shields.io/badge/A2A%20Protocol-v1.0-38bdf8.svg)](public/.well-known/agent.json)
[![A2UI: v1.0](https://img.shields.io/badge/A2UI-v1.0-a78bfa.svg)](src/data/starterBridge.ts)

**DUPAMAN Digital Product Studio** מאת **רפאל ארגנטי** — סטודיו לעיצוב וייצור אפליקציות סוכן ומוצרים דיגיטליים **ללא גלילה (Zero-Scroll · `100vw × 100vh`)**, הבנוי סביב תפיסת **"כל אתר = סוכן" (Every Website = An Agent)**.

המאגר כולל הן את **אפליקציית הסטודיו התלת-ממדית המלאה** (7 צמתים חיים `00`–`06`, מנוע זרקור `Spotlight` חי, ושכבת Serverless ל-Vercel) והן את **[`dupaman_studio_starter/`](dupaman_studio_starter/README.md)** — תבנית-על משוכפלת ללא תלויות (`Zero-Framework`: Native HTML5 `<dialog>` + HTMX + PocketBase + A2UI 1.0 + Google Cloud Agent Platform `gen-lang-client-0569299984`).

---

## 7 צמתי הסטודיו (`00`–`06`)

| צומת | שם החטיבה | יצירת הדגל (Flagship Exhibit) | סטטוס |
| :---: | :--- | :--- | :--- |
| **`00`** | **הסטודיו · כרטיס ביקור חי** | כרטיס ביקור אינטראקטיבי + הבוט המארח החי (`Wake → Listen → Spotlight`) והזמנת אב-טיפוס | פעיל |
| **`01`** | **ממשקי מחר (`AGENTIC INTERFACES`)** | סוכן בנקאות ופיננסים יוקרתי — החלפת אתר עמוס קוביות בחלון ספוט זכוכיתי ופעולות בזמן אמת | קונספט 2027 |
| **`02`** | **מוח מכונה (`AI SYSTEMS`)** | **Alveare AI** — פלטפורמת בינה מלאכותית חיה לאוטומציה וריבוי סוכנים (`alveare-ai.com`) | מוצר חי |
| **`03`** | **למידה חיה (`LIVING EDTECH 3D`)** | **Meet3D / Zume Class** — הרחבת Three.js שהופכת שיעור Google Meet לכיתת תלת-ממד חיה | אב-טיפוס פעיל |
| **`04`** | **אדריכלות הקשב (`NEURO & FOCUS`)** | **הספקטרום האנושי: מוחות הקצה** — מודלים ופרוטוקולי דופמין ההופכים ADHD ואוטיזם ליתרון יצירתי | מאגר מחקר חי |
| **`05`** | **רוח ומקור (`HERITAGE & DEPTH`)** | **תכנון התודעה ומחזורי הציוויליזציה** — מנוע מחקר עומק בן 170 מקורות בהגות, תודעה והיסטוריה | 170 מקורות |
| **`06`** | **חדר המיזמים (`VENTURE VAULT`)** | **Bio-Oracle** — אבחון חזותי חכם לסמנים ביולוגיים דרך צילום עין ופנים (פתוח למשקיעים ושותפים) | פתוח לשותפים |

---

## תבנית-העל המשוכפלת: [`dupaman_studio_starter/`](dupaman_studio_starter/README.md)

תיקיית [`dupaman_studio_starter/`](dupaman_studio_starter/) מספקת ערכת Starter עצמאית ומוכנה לשכפול לכל לקוח או מוצר חדש תוך 2 דקות, ללא React, ללא Webpack וללא `node_modules`:

* **`pb_public/index.html`** — ממשק סטודיו מלא מבוסס Native HTML5 (`<dialog>`, `:has()`) + HTMX.
* **`pb_public/styles/tokens.css` & `runtime.css`** — אסימוני עיצוב (`Design Tokens`) להחלפת מיתוג מיידית.
* **`pb_public/data/exhibits.json`** — קטלוג הצמתים והמוצרים בקובץ JSON יחיד.
* **`pb_hooks/agent_bridge.pb.js`** — גשר A2UI 1.0 (`application/a2ui+json`) + HTMX Fragments + חיבור ל-Google Cloud Agent Platform (`gen-lang-client-0569299984`).
* **`pb_hooks/a2a_endpoint.pb.js` & `pb_public/.well-known/agent.json`** — נקודת קצה תקנית לתקשורת סוכן-לסוכן (`A2A`).
* **`Caddyfile`** — הגדרת Reverse Proxy אוטומטית עם HTTPS לשרת ייצור.

### הרצה מהירה של ה-Starter עם PocketBase:
```bash
cd dupaman_studio_starter
./pocketbase serve
```
או לצפייה דרך שרת ה-Web הראשי בנתיב `/starter`.

---

## נקודות קצה לסוכנים (A2A & A2UI 1.0 Endpoints)

* **`GET /.well-known/agent.json`** — מניפסט הסוכן הרשמי של DUPAMAN Studio.
* **`GET /api/a2a`** ו-**`POST /api/a2a`** — שליפת קטלוג היצירות ושליחת פנייה/הזמנת אב-טיפוס מסוכן חיצוני.
* **`GET /api/a2ui/surface/:id`** — זרם הודעות תקני של **A2UI 1.0** (`createSurface`, `updateComponents`, `updateDataModel`) בפורמט `application/a2ui+json` עבור צמתים `01`–`06`.
* **`GET /api/exhibit/:id`** — רכיב HTML מוכן להזרקה עבור לקוחות HTMX (`hx-get`).
* **`POST /api/agent/message`** — גשר הסוכן האוניברסלי (Google Cloud Agent Platform `gen-lang-client-0569299984` עם גיבוי ניתוב כוונות מקומי בעברית).

---

## הרצה ופיתוח מקומי (Vite + React + Express / Vercel)

```bash
npm install
npm run dev
```

* **בדיקת תקינות וטיפוסים:** `npm run lint`
* **בנייה לייצור:** `npm run build`
* **משתני סביבה (ראו [`.env.example`](.env.example)):**
  * `GEMINI_API_KEY` — מפתח Gemini API עבור הבוט המארח.
  * `GOOGLE_AGENT_ENDPOINT` ו-`GOOGLE_AGENT_API_KEY` — חיבור ל-Google Cloud Agent Platform (`gen-lang-client-0569299984`).
  * `DUPAMAN_SCRIPT_URL` ו-`DUPAMAN_WEBHOOK_SECRET` — חיבור אופציונלי לצנרת המנויים והלידים.

---

## רישיון (License)

קוד המקור במאגר זה מופץ תחת רישיון **MIT License** — ראו קובץ [`LICENSE`](LICENSE) לפרטים מלאים.
