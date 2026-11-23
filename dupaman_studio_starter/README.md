# DUPAMAN Studio Starter Kit — תבנית-על משוכפלת ("כל אתר = סוכן")

[![License: MIT](https://img.shields.io/badge/License-MIT-e8b84b.svg)](LICENSE)

ערכה מלאה ומוכנה להרצה ללא React, ללא Webpack וללא `node_modules`.
מבוססת על **Native HTML5 (`<dialog>`, `popover`, `:has()`) + HTMX (`hx-get` / `hx-live`) + PocketBase (`SQLite`) + A2UI 1.0 + Google Cloud Agent Platform (`gen-lang-client-0569299984`)**.

---

## הרצה מהירה ב-3 צעדים
1. הורד את קובץ ההרצה היחיד של [PocketBase](https://pocketbase.io/docs/) לתוך התיקייה הראשית (`dupaman_studio_starter/`).
2. הרץ פקודה אחת בטרמינל:
   ```bash
   ./pocketbase serve
   ```
3. פתח בדפדפן:
   - האפליקציה החיה: `http://127.0.0.1:8090/`
   - לוח הניהול של PocketBase: `http://127.0.0.1:8090/_/`
   - שכבת A2A לסוכנים חיצוניים: `http://127.0.0.1:8090/api/a2a` ו-`/.well-known/agent.json`
   - שכבת A2UI 1.0 וגשר הסוכן: `http://127.0.0.1:8090/api/a2ui/surface/01` ו-`POST /api/agent/message`

*(טיפ: ניתן גם לפתוח ישירות את `pb_public/index.html` בדפדפן לתצוגה מקדימה מיידית ללא שרת!)*

---

## חיבור ל-Google Cloud Agent Platform (`gen-lang-client-0569299984`)
הגדר 2 משתני סביבה לפני הרצת PocketBase:
```bash
export GOOGLE_AGENT_ENDPOINT="https://<your-agent-endpoint>"
export GOOGLE_AGENT_API_KEY="<your-token>"
./pocketbase serve
```

---

## איך משכפלים את הערכה ללקוח או עבודה חדשה ב-2 דקות?
1. שכפל את התיקייה `dupaman_studio_starter/`.
2. ערוך **רק 2 קבצים**:
   - `pb_public/styles/tokens.css` — צבעי המותג והגופנים.
   - `pb_public/data/exhibits.json` — שם המותג, המוצרים והקישורים.
3. הרץ `./pocketbase serve` — יש לך אפליקציית סוכן חדשה באוויר.

---

## רישיון (License)
פרויקט זה מופץ תחת רישיון **MIT License** — ראו קובץ [`LICENSE`](LICENSE).
