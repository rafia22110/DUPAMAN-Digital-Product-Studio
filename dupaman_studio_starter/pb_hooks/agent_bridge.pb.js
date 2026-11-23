/// <reference path="../pb_data/types.d.ts" />
/**
 * DUPAMAN Universal Studio Agent Bridge — A2UI 1.0 + HTMX + Google Cloud Agent Platform
 * Project: gen-lang-client-0569299984
 * Spec: https://github.com/a2ui-project/a2ui (A2UI 1.0 — createSurface, updateComponents, updateDataModel)
 */

function loadCatalog() {
  const raw = $os.readFile(__hooks + "/../pb_public/data/exhibits.json");
  return JSON.parse(toString(raw));
}

/**
 * Builds a standard A2UI 1.0 message stream (createSurface + updateComponents + updateDataModel)
 * that @a2ui/web_core + @a2ui/react (or @a2ui/lit) renders natively using DUPAMAN's existing glass theme.
 */
function buildA2UISurfaceMessages(node) {
  const surfaceId = "dupaman-node-" + node.id;
  const ex = node.exhibit;

  return [
    {
      version: "v1.0",
      createSurface: {
        surfaceId: surfaceId,
        catalogId: "dupaman-studio-basic"
      }
    },
    {
      version: "v1.0",
      updateComponents: {
        surfaceId: surfaceId,
        components: [
          {
            id: "root",
            component: {
              Card: {
                child: "card-col"
              }
            }
          },
          {
            id: "card-col",
            component: {
              Column: {
                children: {
                  explicitList: ["badge-text", "title-text", "summary-text", "actions-row"]
                }
              }
            }
          },
          {
            id: "badge-text",
            component: {
              Text: {
                text: { path: "/exhibit/badge" },
                usageHint: "caption"
              }
            }
          },
          {
            id: "title-text",
            component: {
              Text: {
                text: { path: "/exhibit/title" },
                usageHint: "h3"
              }
            }
          },
          {
            id: "summary-text",
            component: {
              Text: {
                text: { path: "/exhibit/summary" },
                usageHint: "body"
              }
            }
          },
          {
            id: "actions-row",
            component: {
              Row: {
                children: {
                  explicitList: ["demo-btn", "order-btn"]
                }
              }
            }
          },
          {
            id: "demo-btn",
            component: {
              Button: {
                child: "demo-btn-label",
                primary: true,
                action: {
                  name: "open_live_demo",
                  context: [
                    { key: "url", value: { path: "/exhibit/demoUrl" } },
                    { key: "nodeId", value: { path: "/node/id" } }
                  ]
                }
              }
            }
          },
          {
            id: "demo-btn-label",
            component: {
              Text: { text: { path: "/exhibit/cta" } }
            }
          },
          {
            id: "order-btn",
            component: {
              Button: {
                child: "order-btn-label",
                primary: false,
                action: {
                  name: "request_similar_prototype",
                  context: [
                    { key: "topic", value: { path: "/exhibit/title" } },
                    { key: "nodeId", value: { path: "/node/id" } }
                  ]
                }
              }
            }
          },
          {
            id: "order-btn-label",
            component: {
              Text: { text: { literalString: "הזמן אב-טיפוס דומה" } }
            }
          }
        ]
      }
    },
    {
      version: "v1.0",
      updateDataModel: {
        surfaceId: surfaceId,
        path: "/",
        value: {
          node: { id: node.id, name: node.name, en: node.en },
          exhibit: {
            id: ex.id,
            badge: node.id + " · " + node.name + " · " + ex.status,
            title: ex.title,
            summary: ex.summary,
            stack: ex.stack,
            demoUrl: ex.demoUrl,
            cta: ex.cta
          }
        }
      }
    }
  ];
}

// 1. Standard A2UI 1.0 Endpoint (application/a2ui+json) — ready for @a2ui/react in dupaman.vercel.app
routerAdd("GET", "/api/a2ui/surface/{id}", (e) => {
  const id = e.request.pathValue("id");
  const catalog = loadCatalog();
  const node = catalog.nodes.find((n) => n.id === id);

  if (!node) {
    return e.json(404, { error: "Surface node not found", nodeId: id });
  }

  const a2uiMessages = buildA2UISurfaceMessages(node);
  e.response.header().set("Content-Type", "application/a2ui+json; charset=utf-8");
  e.response.header().set("Access-Control-Allow-Origin", "*");
  return e.string(200, JSON.stringify(a2uiMessages));
});

// 2. HTMX HTML Fragment Endpoint (for lightweight HTMX / hx-live clients)
routerAdd("GET", "/api/exhibit/{id}", (e) => {
  const id = e.request.pathValue("id");
  const catalog = loadCatalog();
  const node = catalog.nodes.find((n) => n.id === id);

  if (!node) {
    return e.html(404, `<div class="exhibit-card">הצומת לא נמצא.</div>`);
  }

  const ex = node.exhibit;
  const tags = ex.stack.map((t) => `<span class="tech-tag" dir="ltr">${t}</span>`).join("");
  const html = `
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

  return e.html(200, html);
});

// 3. Universal Agent Endpoint — Google Cloud Agent Platform + A2UI 1.0 Stream + Local Fallback
routerAdd("POST", "/api/agent/message", (e) => {
  e.response.header().set("Access-Control-Allow-Origin", "*");
  const body = e.requestInfo().body || {};
  const prompt = String(body.message || "").trim();
  const mode = String(body.mode || "human");
  const catalog = loadCatalog();

  const endpoint = $os.getenv("GOOGLE_AGENT_ENDPOINT");
  const apiKey = $os.getenv("GOOGLE_AGENT_API_KEY");

  let targetNodeId = "01";
  let replyText = "הארתי עבורך את 'ממשקי מחר' (01) — הדגמת תפיסת 'כל אתר = סוכן'. תרצה אב-טיפוס דומה?";

  if (endpoint && apiKey) {
    try {
      const res = $http.send({
        url: endpoint,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + apiKey
        },
        body: JSON.stringify({
          message: prompt,
          mode: mode,
          project: "gen-lang-client-0569299984"
        }),
        timeout: 15
      });
      if (res.statusCode === 200 && res.json) {
        const agentOut = res.json;
        targetNodeId = agentOut.target_node || "01";
        replyText = agentOut.reply_text || replyText;
      }
    } catch (err) {
      console.log("Google Agent fallback triggered:", err);
    }
  } else {
    if (prompt.includes("למידה") || prompt.includes("חינוך") || prompt.includes("3D") || prompt.includes("Meet")) {
      targetNodeId = "03";
      replyText = "הארתי את 'למידה חיה' (03) עם Meet3D / Zume Class. אפשר להפעיל דמו או להזמין התאמה למוסד שלך.";
    } else if (prompt.includes("AI") || prompt.includes("סוכן") || prompt.includes("אוטומציה")) {
      targetNodeId = "02";
      replyText = "הארתי את 'מוח מכונה' (02) עם Alveare AI ומערכות הסוכנים האוטונומיים שלנו.";
    } else if (prompt.includes("משקיע") || prompt.includes("מיזם") || prompt.includes("Bio")) {
      targetNodeId = "06";
      replyText = "הארתי את 'חדר המיזמים' (06) עם Bio-Oracle. השאר פרטים בכרטיס הביקור משמאל לגישת משקיעים.";
    } else if (prompt.includes("קשב") || prompt.includes("ADHD") || prompt.includes("דופמין")) {
      targetNodeId = "04";
      replyText = "הארתי את 'אדריכלות הקשב' (04) — מוחות הקצה ומדע הדופמין.";
    } else if (prompt.includes("תודעה") || prompt.includes("הגות") || prompt.includes("רמב") || prompt.includes("יהדות")) {
      targetNodeId = "05";
      replyText = "הארתי את 'רוח ומקור' (05) — מנוע המחקר בן 170 המקורות על תודעה והגות.";
    }
  }

  const matchedNode = catalog.nodes.find((n) => n.id === targetNodeId) || catalog.nodes[0];
  const a2uiMessages = buildA2UISurfaceMessages(matchedNode);

  if (mode === "a2a") {
    return e.json(200, {
      protocol: "a2a-v1",
      intent: prompt,
      matched_node: matchedNode.id,
      exhibit: matchedNode.exhibit
    });
  }

  // Returns standard MCP-compatible embedded A2UI resource alongside reply_text
  return e.json(200, {
    state: "spotlight",
    reply_text: replyText,
    target_node: matchedNode.id,
    content: [
      {
        type: "resource",
        resource: {
          uri: "a2ui://dupaman-studio/node-" + matchedNode.id,
          mimeType: "application/a2ui+json",
          text: JSON.stringify(a2uiMessages)
        }
      }
    ],
    a2ui_messages: a2uiMessages
  });
});
