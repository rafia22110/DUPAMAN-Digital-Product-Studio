/// <reference path="../pb_data/types.d.ts" />
/**
 * DUPAMAN A2A (Agent-to-Agent) Pure Data & Action Endpoint
 * Zero visual bloat — direct JSON for external AI agents & search.
 */

routerAdd("GET", "/api/a2a", (e) => {
  const raw = $os.readFile(__hooks + "/../pb_public/data/exhibits.json");
  const catalog = JSON.parse(toString(raw));
  return e.json(200, {
    protocol: "a2a-v1",
    studio: catalog.studio.name,
    founder: catalog.studio.founder,
    googleCloudProject: catalog.studio.google_cloud_project,
    exhibits: catalog.nodes.map((n) => ({
      node: n.id,
      division: n.name,
      title: n.exhibit.title,
      status: n.exhibit.status,
      summary: n.exhibit.summary,
      demoUrl: n.exhibit.demoUrl
    }))
  });
});

routerAdd("POST", "/api/a2a", (e) => {
  const body = e.requestInfo().body || {};
  return e.json(200, {
    ok: true,
    received_at: new Date().toISOString(),
    action: body.action || "inquiry",
    status: "queued_for_studio_approval"
  });
});
