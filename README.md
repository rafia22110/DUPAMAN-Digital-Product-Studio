# DUPAMAN — דופמין | Heritage · Education · AI

[![Code License: MIT](https://img.shields.io/badge/Code%20License-MIT-e8b84b.svg)](LICENSE)
[![Content License: CC BY-NC-SA 4.0](https://img.shields.io/badge/Content%20License-CC%20BY--NC--SA%204.0-48d6fc.svg)](LICENSES/CONTENT-CC-BY-NC-SA-4.0.md)
[![Brand & Assets: All Rights Reserved](https://img.shields.io/badge/Brand%20%26%20Assets-All%20Rights%20Reserved-8a97b0.svg)](LICENSES/TRADEMARK-AND-ASSETS.md)

מרחב ידע ויצירה מרחבי **ללא גלילה (Zero-Scroll · `100vw × 100vh`)** מאת **רפאל ארגנטי**, הבנוי סביב קונסטלציית 7 מוחות חיים בזכוכית קריסטלית תלת-ממדית.

---

## מבנה המערכת
* **`00` — המוח המרכזי (קבלת פנים → בוט AI ומנהל מנויים):** מציג כרטיסיית קבלת פנים שקופה במרכז המסך; בלחיצה עובר לבוט החכם המכיר את כל מאגר התכנים והתגיות ולמנהל המנויים.
* **`01` — חדשות ומדריכים:** מחולק לחדשות ולמדריכים — סינון אוטומטי לתכנים חדשים מהחודש האחרון בלבד (עד 30 יום).
* **`02`–`06` — עולמות התוכן האישיים:** חינוך ולמידה פעילה, פסיכולוגיה ובריאות, בינה מלאכותית יוצרת, מדעי המוח וקוגניציה, ומדע פיזיקה ואסטרונומיה.
* **לוגו DUPAMAN (פינה ימנית-עליונה):** פותח בלחיצה את דפי **אודות**, **יצירת קשר** ו-**התחברות** ללא גלילה.
* **מאגר התכנים [`content/`](content/README.md):** מנוע טעינה אוטומטי של קובצי JSON עם שיוך מרובה-כרטיסיות (`cards`) ותגיות (`tags`) המזינות את הבוט ואת ההצלבה בין כרטיסיות.

---

## הרצה מקומית (Local Development)

```bash
npm install
npm run dev
```

* בדיקת טיפוסים: `npm run lint`
* בנייה לייצור: `npm run build`
* משתני סביבה אופציונליים (ראו [`.env.example`](.env.example)): `GEMINI_API_KEY`, `DUPAMAN_SCRIPT_URL`, `DUPAMAN_WEBHOOK_SECRET`.

---

## רישוי וזכויות יוצרים (Licensing)

המאגר משתמש במבנה רישוי רב-שכבתי ברור:

| שכבה | רישיון | קובץ |
| :--- | :--- | :--- |
| **קוד מקור (Source Code)** | **MIT License** | [`LICENSE`](LICENSE) |
| **תכנים, מדריכים ומאמרים (`content/`)** | **CC BY-NC-SA 4.0** | [`LICENSES/CONTENT-CC-BY-NC-SA-4.0.md`](LICENSES/CONTENT-CC-BY-NC-SA-4.0.md) |
| **מותג DUPAMAN, לוגואים ואיורים (`public/assets/`)** | **All Rights Reserved** | [`LICENSES/TRADEMARK-AND-ASSETS.md`](LICENSES/TRADEMARK-AND-ASSETS.md) |
| **ספריות צד-שלישי (Third-Party)** | MIT / Apache-2.0 / ISC / BSD | [`NOTICE.md`](NOTICE.md) |
