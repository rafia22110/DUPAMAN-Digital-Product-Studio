export interface StarterExhibit {
  id: string;
  status: string;
  title: string;
  summary: string;
  stack: string[];
  demoUrl: string;
  cta: string;
}

export interface StarterNode {
  id: string;
  name: string;
  en: string;
  pos: string;
  exhibit: StarterExhibit;
}

export interface StarterCatalog {
  studio: {
    name: string;
    founder: string;
    tagline: string;
    pillars: string[];
    welcome_message: string;
    google_cloud_project: string;
  };
  nodes: StarterNode[];
}

export const STARTER_CATALOG: StarterCatalog = {
  studio: {
    name: 'DUPAMAN Studio',
    founder: 'רפאל ארגנטי',
    tagline:
      'מעצבים אפליקציות סוכן ומוצרים דיגיטליים — חיבור בין עומק אנושי, חינוך ובינה מלאכותית.',
    pillars: [
      'ממשקי מחר (כל אתר = סוכן)',
      'למידה חיה ו-3D',
      'מערכות AI ואדריכלות הקשב',
    ],
    welcome_message:
      'ברוך הבא ל-DUPAMAN. כאן לא גוללים בתפריטים — אומרים מה מחפשים, ואני מאיר את היצירה המדויקת. מתעניין בפיתוח מוצר, למידה חיה, או בחדר המיזמים?',
    google_cloud_project: 'gen-lang-client-0569299984',
  },
  nodes: [
    {
      id: '01',
      name: 'ממשקי מחר',
      en: 'AGENTIC INTERFACES',
      pos: 'top-left',
      exhibit: {
        id: 'EXH-01',
        status: 'קונספט 2027',
        title: 'סוכן בנקאות ופיננסים יוקרתי',
        summary:
          'החלפת אתר בנק עמוס קוביות בחלון ספוט זכוכיתי וסוכן המזהה לקוח מול מתעניין ושולף פעולות בזמן אמת.',
        stack: ['HTMX v4', 'hx-live', 'A2A Runtime'],
        demoUrl: 'https://dupaman.vercel.app/',
        cta: 'הפעל הדגמת סוכן',
      },
    },
    {
      id: '02',
      name: 'מוח מכונה',
      en: 'AI SYSTEMS',
      pos: 'mid-left',
      exhibit: {
        id: 'EXH-02',
        status: 'מוצר חי',
        title: 'Alveare AI',
        summary:
          'פלטפורמת בינה מלאכותית חיה לאוטומציה, שירותי AI וייצור תוצרים עסקיים בקנה מידה.',
        stack: ['Multi-Agent', 'PocketBase', 'Google Cloud AI'],
        demoUrl: 'http://alveare-ai.com',
        cta: 'פתח מוצר חי ↗',
      },
    },
    {
      id: '03',
      name: 'למידה חיה',
      en: 'LIVING EDTECH 3D',
      pos: 'bot-left',
      exhibit: {
        id: 'EXH-03',
        status: 'אב-טיפוס פעיל',
        title: 'Meet3D / Zume Class',
        summary:
          'הרחבת Three.js שהופכת כל שיעור Google Meet לכיתת תלת-ממד חיה עם אווטארים, לוחות משותפים ומשחוק.',
        stack: ['Three.js', 'Google Meet API', 'EdTech'],
        demoUrl: 'https://tusba-65636555-d7738.web.app/',
        cta: 'צפה בדמו למידה ↗',
      },
    },
    {
      id: '04',
      name: 'אדריכלות הקשב',
      en: 'NEURO & FOCUS',
      pos: 'top-right',
      exhibit: {
        id: 'EXH-04',
        status: 'מאגר מחקר חי',
        title: 'הספקטרום האנושי: מוחות הקצה',
        summary:
          'מודלים, פרוטוקולי דופמין וכלים קוגניטיביים שהופכים ADHD ואוטיזם ליתרון יצירתי ומערכתי.',
        stack: ['Neuroscience', 'NotebookLM', 'Behavioral UI'],
        demoUrl:
          'https://notebooklm.google.com/notebook/ea8f6bd3-9b3e-4001-988a-39b51777a13e',
        cta: 'חקור מאגר ידע ↗',
      },
    },
    {
      id: '05',
      name: 'רוח ומקור',
      en: 'HERITAGE & DEPTH',
      pos: 'mid-right',
      exhibit: {
        id: 'EXH-05',
        status: '170 מקורות',
        title: 'תכנון התודעה ומחזורי הציוויליזציה',
        summary:
          "מנוע מחקר עומק המחבר בין תודעה, פילוסופיית הרמב\"ם וליבוביץ', היסטוריה ומחזורי תרבות.",
        stack: ['Knowledge Engine', 'NotebookLM', 'Semantic RAG'],
        demoUrl:
          'https://notebooklm.google.com/notebook/021d819f-85d5-4d37-9078-bc865077ab9c',
        cta: 'פתח מנוע עומק ↗',
      },
    },
    {
      id: '06',
      name: 'חדר המיזמים',
      en: 'VENTURE VAULT',
      pos: 'bot-right',
      exhibit: {
        id: 'EXH-06',
        status: 'פתוח לשותפים',
        title: 'Bio-Oracle — אבחון חזותי חכם',
        summary:
          'אב-טיפוס ומחקר קליני-רגולטורי לאבחון סמנים ביולוגיים דרך צילום עין ופנים באמצעות ראייה ממוחשבת.',
        stack: ['Computer Vision', 'HealthTech', 'Investor Ready'],
        demoUrl:
          'https://notebooklm.google.com/notebook/0e5d4e57-7336-4ff9-838f-6fcb1f5b4fd7',
        cta: 'תיק משקיעים ↗',
      },
    },
  ],
};

export function findStarterNode(rawId: string): StarterNode | undefined {
  const id = String(rawId ?? '').trim().padStart(2, '0');
  return STARTER_CATALOG.nodes.find((n) => n.id === id);
}

/**
 * Builds a standard A2UI 1.0 message stream (createSurface + updateComponents + updateDataModel)
 */
export function buildA2UISurfaceMessages(node: StarterNode) {
  const surfaceId = 'dupaman-node-' + node.id;
  const ex = node.exhibit;

  return [
    {
      version: 'v1.0',
      createSurface: {
        surfaceId,
        catalogId: 'dupaman-studio-basic',
      },
    },
    {
      version: 'v1.0',
      updateComponents: {
        surfaceId,
        components: [
          {
            id: 'root',
            component: {
              Card: {
                child: 'card-col',
              },
            },
          },
          {
            id: 'card-col',
            component: {
              Column: {
                children: {
                  explicitList: ['badge-text', 'title-text', 'summary-text', 'actions-row'],
                },
              },
            },
          },
          {
            id: 'badge-text',
            component: {
              Text: {
                text: { path: '/exhibit/badge' },
                usageHint: 'caption',
              },
            },
          },
          {
            id: 'title-text',
            component: {
              Text: {
                text: { path: '/exhibit/title' },
                usageHint: 'h3',
              },
            },
          },
          {
            id: 'summary-text',
            component: {
              Text: {
                text: { path: '/exhibit/summary' },
                usageHint: 'body',
              },
            },
          },
          {
            id: 'actions-row',
            component: {
              Row: {
                children: {
                  explicitList: ['demo-btn', 'order-btn'],
                },
              },
            },
          },
          {
            id: 'demo-btn',
            component: {
              Button: {
                child: 'demo-btn-label',
                primary: true,
                action: {
                  name: 'open_live_demo',
                  context: [
                    { key: 'url', value: { path: '/exhibit/demoUrl' } },
                    { key: 'nodeId', value: { path: '/node/id' } },
                  ],
                },
              },
            },
          },
          {
            id: 'demo-btn-label',
            component: {
              Text: { text: { path: '/exhibit/cta' } },
            },
          },
          {
            id: 'order-btn',
            component: {
              Button: {
                child: 'order-btn-label',
                primary: false,
                action: {
                  name: 'request_similar_prototype',
                  context: [
                    { key: 'topic', value: { path: '/exhibit/title' } },
                    { key: 'nodeId', value: { path: '/node/id' } },
                  ],
                },
              },
            },
          },
          {
            id: 'order-btn-label',
            component: {
              Text: { text: { literalString: 'הזמן אב-טיפוס דומה' } },
            },
          },
        ],
      },
    },
    {
      version: 'v1.0',
      updateDataModel: {
        surfaceId,
        path: '/',
        value: {
          node: { id: node.id, name: node.name, en: node.en },
          exhibit: {
            id: ex.id,
            badge: `${node.id} · ${node.name} · ${ex.status}`,
            title: ex.title,
            summary: ex.summary,
            stack: ex.stack,
            demoUrl: ex.demoUrl,
            cta: ex.cta,
          },
        },
      },
    },
  ];
}

export function renderHtmxExhibitFragment(node: StarterNode): string {
  const ex = node.exhibit;
  const tags = ex.stack.map((t) => `<span class="tech-tag" dir="ltr">${t}</span>`).join('');
  return `
    <article class="exhibit-card" data-node="${node.id}">
      <div class="exhibit-top">
        <span class="exhibit-badge">${node.id} · ${node.name} · ${ex.status}</span>
        <button class="btn-close-spot" onclick="document.getElementById('spotlight-stage').innerHTML=''" aria-label="סגור">✕</button>
      </div>
      <h3 class="exhibit-title">${ex.title}</h3>
      <p class="exhibit-summary">${ex.summary}</p>
      <div class="exhibit-footer">
        <div class="tech-tags">${tags}</div>
        <div class="exhibit-actions">
          <a class="btn-primary" href="${ex.demoUrl}" target="_blank" rel="noopener noreferrer">${ex.cta}</a>
          <button class="btn-ghost" onclick="openCoreWithIntent('${node.name}: ${ex.title}')">הזמן דומה בסטודיו</button>
        </div>
      </div>
    </article>`;
}

export async function resolveUniversalAgentMessage(
  promptRaw: string,
  modeRaw: string = 'human'
): Promise<Record<string, unknown>> {
  const prompt = String(promptRaw || '').trim();
  const mode = String(modeRaw || 'human');

  const endpoint = process.env.GOOGLE_AGENT_ENDPOINT;
  const apiKey = process.env.GOOGLE_AGENT_API_KEY;

  let targetNodeId = '01';
  let replyText =
    "הארתי עבורך את 'ממשקי מחר' (01) — הדגמת תפיסת 'כל אתר = סוכן'. תרצה אב-טיפוס דומה?";

  if (endpoint && apiKey) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + apiKey,
        },
        body: JSON.stringify({
          message: prompt,
          mode,
          project: STARTER_CATALOG.studio.google_cloud_project,
        }),
      });
      if (res.ok) {
        const agentOut = (await res.json()) as {
          target_node?: string;
          reply_text?: string;
        };
        targetNodeId = agentOut.target_node || '01';
        replyText = agentOut.reply_text || replyText;
      }
    } catch {
      // Fallback to local intent routing
    }
  } else {
    if (
      prompt.includes('למידה') ||
      prompt.includes('חינוך') ||
      prompt.includes('3D') ||
      prompt.includes('Meet')
    ) {
      targetNodeId = '03';
      replyText =
        "הארתי את 'למידה חיה' (03) עם Meet3D / Zume Class. אפשר להפעיל דמו או להזמין התאמה למוסד שלך.";
    } else if (
      prompt.includes('AI') ||
      prompt.includes('סוכן') ||
      prompt.includes('אוטומציה')
    ) {
      targetNodeId = '02';
      replyText =
        "הארתי את 'מוח מכונה' (02) עם Alveare AI ומערכות הסוכנים האוטונומיים שלנו.";
    } else if (
      prompt.includes('משקיע') ||
      prompt.includes('מיזם') ||
      prompt.includes('Bio')
    ) {
      targetNodeId = '06';
      replyText =
        "הארתי את 'חדר המיזמים' (06) עם Bio-Oracle. השאר פרטים בכרטיס הביקור משמאל לגישת משקיעים.";
    } else if (
      prompt.includes('קשב') ||
      prompt.includes('ADHD') ||
      prompt.includes('דופמין')
    ) {
      targetNodeId = '04';
      replyText = "הארתי את 'אדריכלות הקשב' (04) — מוחות הקצה ומדע הדופמין.";
    } else if (
      prompt.includes('תודעה') ||
      prompt.includes('הגות') ||
      prompt.includes('רמב') ||
      prompt.includes('יהדות')
    ) {
      targetNodeId = '05';
      replyText =
        "הארתי את 'רוח ומקור' (05) — מנוע המחקר בן 170 המקורות על תודעה והגות.";
    }
  }

  const matchedNode = findStarterNode(targetNodeId) || STARTER_CATALOG.nodes[0];
  const a2uiMessages = buildA2UISurfaceMessages(matchedNode);

  if (mode === 'a2a') {
    return {
      protocol: 'a2a-v1',
      intent: prompt,
      matched_node: matchedNode.id,
      exhibit: matchedNode.exhibit,
    };
  }

  return {
    state: 'spotlight',
    reply_text: replyText,
    target_node: matchedNode.id,
    content: [
      {
        type: 'resource',
        resource: {
          uri: 'a2ui://dupaman-studio/node-' + matchedNode.id,
          mimeType: 'application/a2ui+json',
          text: JSON.stringify(a2uiMessages),
        },
      },
    ],
    a2ui_messages: a2uiMessages,
  };
}
