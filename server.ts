import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import { STUDIO_EXHIBITS } from './src/data/studioSamples.ts';
import {
  buildA2UISurfaceMessages,
  findStarterNode,
  renderHtmxExhibitFragment,
  resolveUniversalAgentMessage,
} from './src/data/starterBridge.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

// Allowlisted local reference images uploaded into public/assets/aistudio
const ALLOWED_LOCAL_ASSETS = new Set([
  'Illustrative_Image2_956e8c1e.jpg',
  'Illustrative_Image1_52befb19.jpg',
  'Illustrative_Image3__2__55d7909b.jpg',
  'Main_Logo___________fb356143.jpg',
]);

interface StoredVideo {
  id: string;
  interactionId: string;
  buffer: Buffer;
  mimeType: string;
  aspectRatio: '16:9' | '9:16';
  duration: string;
  resolution: string;
  prompt: string;
  createdAt: string;
}

const MAX_STORED_VIDEOS = 12;
const videoStore = new Map<string, StoredVideo>();

function storeVideo(entry: StoredVideo): void {
  if (videoStore.size >= MAX_STORED_VIDEOS) {
    const oldestKey = videoStore.keys().next().value;
    if (oldestKey) {
      videoStore.delete(oldestKey);
    }
  }
  videoStore.set(entry.id, entry);
}

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw Object.assign(
      new Error(
        'GEMINI_API_KEY is not configured. Add a billing-enabled API key in Settings > Secrets to generate videos with gemini-omni-1.2-flash.'
      ),
      { status: 400, code: 'API_KEY_MISSING' }
    );
  }
  return new GoogleGenAI({ apiKey });
}

interface ExtractedVideo {
  buffer: Buffer;
  mimeType: string;
}

async function extractVideoFromInteraction(
  interaction: Record<string, unknown>
): Promise<ExtractedVideo> {
  // Primary convenience property
  const outputVideo = interaction.output_video as
    | { data?: string; uri?: string; mime_type?: string }
    | null
    | undefined;

  let videoPart = outputVideo ?? null;

  // Fallback scan across model_output steps
  if (!videoPart && Array.isArray(interaction.steps)) {
    for (let i = interaction.steps.length - 1; i >= 0; i--) {
      const step = interaction.steps[i] as {
        type?: string;
        content?: Array<{ type?: string; data?: string; uri?: string; mime_type?: string }>;
      };
      if (step?.type === 'model_output' && Array.isArray(step.content)) {
        const found = step.content.find((c) => c.type === 'video');
        if (found) {
          videoPart = found;
          break;
        }
      }
    }
  }

  if (!videoPart) {
    throw new Error('The video generation completed without returning a video payload.');
  }

  const mimeType = videoPart.mime_type || 'video/mp4';

  if (videoPart.data) {
    return {
      buffer: Buffer.from(videoPart.data, 'base64'),
      mimeType,
    };
  }

  if (videoPart.uri) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    const separator = videoPart.uri.includes('?') ? '&' : '?';
    const downloadUrl = videoPart.uri.includes('key=')
      ? videoPart.uri
      : `${videoPart.uri}${separator}key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(downloadUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch generated video artifact (${res.status}).`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType: res.headers.get('content-type') || mimeType,
    };
  }

  throw new Error('Generated video payload contained neither inline data nor a downloadable URI.');
}

function classifyApiError(err: unknown): { status: number; code: string; message: string } {
  const e = err as { status?: number; statusCode?: number; code?: string; message?: string };
  const rawMessage = e?.message || 'Unexpected error during video generation.';
  const status = e?.status || e?.statusCode || 500;

  if (e?.code === 'API_KEY_MISSING') {
    return { status: 400, code: 'API_KEY_MISSING', message: rawMessage };
  }
  if (
    status === 403 ||
    rawMessage.includes('PERMISSION_DENIED') ||
    rawMessage.includes('API_KEY_INVALID')
  ) {
    return {
      status: 403,
      code: 'PERMISSION_DENIED',
      message:
        'Video generation requires a valid billing-enabled Gemini API key. Check your key in Settings > Secrets and try again.',
    };
  }
  if (status === 429 || rawMessage.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      code: 'RESOURCE_EXHAUSTED',
      message:
        'Quota exceeded or paid tier required for gemini-omni-1.2-flash. Verify your billing-enabled API key in Settings > Secrets.',
    };
  }
  if (status === 404 || rawMessage.includes('NOT_FOUND')) {
    return {
      status: 404,
      code: 'NOT_FOUND',
      message: `Requested video model or interaction was not found. (${rawMessage})`,
    };
  }

  return {
    status: status >= 400 && status < 600 ? status : 500,
    code: 'GENERATION_FAILED',
    message: rawMessage,
  };
}

interface IncomingReference {
  localFilename?: string;
  dataUrl?: string;
  mimeType?: string;
  label?: string;
}

function buildReferenceParts(references: IncomingReference[] = []): Array<{
  type: 'image';
  mime_type: string;
  data: string;
}> {
  const parts: Array<{ type: 'image'; mime_type: string; data: string }> = [];
  const capped = references.slice(0, 6);

  for (const ref of capped) {
    if (ref.localFilename && ALLOWED_LOCAL_ASSETS.has(ref.localFilename)) {
      const filePath = path.join(__dirname, 'public', 'assets', 'aistudio', ref.localFilename);
      if (fs.existsSync(filePath)) {
        const bytes = fs.readFileSync(filePath);
        parts.push({
          type: 'image',
          mime_type: 'image/jpeg',
          data: bytes.toString('base64'),
        });
      }
    } else if (ref.dataUrl && ref.dataUrl.startsWith('data:image/')) {
      const match = ref.dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (match) {
        parts.push({
          type: 'image',
          mime_type: match[1],
          data: match[2],
        });
      }
    }
  }

  return parts;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  // Serve static public assets (including /assets/aistudio/*)
  app.use(express.static(path.join(__dirname, 'public')));

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      hasApiKey: Boolean(
        process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
      ),
    });
  });

  // Generate a new video via Gemini Interactions API (gemini-omni-1.2-flash)
  app.post('/api/videos/generate', async (req: Request, res: Response) => {
    try {
      const {
        prompt,
        aspectRatio = '16:9',
        duration = '10s',
        resolution = '1080p',
        references = [],
      } = req.body as {
        prompt?: string;
        aspectRatio?: '16:9' | '9:16';
        duration?: string;
        resolution?: '360p' | '720p' | '1080p' | '4k';
        references?: IncomingReference[];
      };

      const trimmedPrompt = (prompt || '').trim();
      if (!trimmedPrompt) {
        res.status(400).json({ code: 'INVALID_PROMPT', message: 'A video prompt is required.' });
        return;
      }

      const validAspectRatio: '16:9' | '9:16' = aspectRatio === '9:16' ? '9:16' : '16:9';
      const validDuration = /^([3-9]|1[0-5])s$/.test(duration) ? duration : '10s';
      const validResolution = ['360p', '720p', '1080p', '4k'].includes(resolution)
        ? resolution
        : '1080p';

      const ai = getAiClient();
      const imageParts = buildReferenceParts(references);

      const inputPayload =
        imageParts.length > 0
          ? [
              ...imageParts,
              {
                type: 'text' as const,
                text: `Use the attached visual reference(s) as aesthetic and structural inspiration for glass refraction, color palette, and neural lighting while rendering without any embedded text or logos. ${trimmedPrompt}`,
              },
            ]
          : trimmedPrompt;

      const interaction = (await ai.interactions.create(
        {
          model: 'gemini-omni-1.2-flash',
          input: inputPayload,
          background: false,
          store: true,
          stream: false,
          response_format: {
            type: 'video',
            aspect_ratio: validAspectRatio,
            duration: validDuration,
            resolution: validResolution,
          },
        } as Parameters<typeof ai.interactions.create>[0],
        { timeout: 300000 }
      )) as unknown as Record<string, unknown>;

      const { buffer, mimeType } = await extractVideoFromInteraction(interaction);
      const id = crypto.randomUUID();
      const interactionId = String(interaction.id || '');
      const createdAt = new Date().toISOString();

      storeVideo({
        id,
        interactionId,
        buffer,
        mimeType,
        aspectRatio: validAspectRatio,
        duration: validDuration,
        resolution: validResolution,
        prompt: trimmedPrompt,
        createdAt,
      });

      res.json({
        id,
        interactionId,
        videoUrl: `/api/videos/${id}`,
        mimeType,
        sizeBytes: buffer.length,
        aspectRatio: validAspectRatio,
        duration: validDuration,
        resolution: validResolution,
        createdAt,
      });
    } catch (err) {
      const classified = classifyApiError(err);
      res.status(classified.status).json({
        code: classified.code,
        message: classified.message,
      });
    }
  });

  // Multi-turn video editing or extension using previous_interaction_id
  app.post('/api/videos/edit', async (req: Request, res: Response) => {
    try {
      const {
        previousInteractionId,
        instruction,
        mode = 'edit',
        aspectRatio = '16:9',
        duration = '10s',
        resolution = '1080p',
      } = req.body as {
        previousInteractionId?: string;
        instruction?: string;
        mode?: 'edit' | 'extend';
        aspectRatio?: '16:9' | '9:16';
        duration?: string;
        resolution?: '360p' | '720p' | '1080p' | '4k';
      };

      if (!previousInteractionId) {
        res.status(400).json({
          code: 'MISSING_INTERACTION_ID',
          message: 'A stored interaction ID is required to edit or extend a clip.',
        });
        return;
      }

      const trimmedInstruction = (instruction || '').trim();
      if (!trimmedInstruction) {
        res.status(400).json({
          code: 'INVALID_INSTRUCTION',
          message: 'Please provide an edit or continuation instruction.',
        });
        return;
      }

      const validAspectRatio: '16:9' | '9:16' = aspectRatio === '9:16' ? '9:16' : '16:9';
      const validDuration = /^([3-9]|10)s$/.test(duration) ? duration : '10s';
      const validResolution = ['360p', '720p', '1080p', '4k'].includes(resolution)
        ? resolution
        : '1080p';

      const ai = getAiClient();
      const promptText =
        mode === 'extend'
          ? `Continue the scene seamlessly: ${trimmedInstruction}`
          : trimmedInstruction;

      const interaction = (await ai.interactions.create(
        {
          model: 'gemini-omni-1.2-flash',
          previous_interaction_id: previousInteractionId,
          input: promptText,
          background: false,
          store: true,
          stream: false,
          response_format: {
            type: 'video',
            ...(mode === 'extend' ? { duration: validDuration } : {}),
          },
        } as Parameters<typeof ai.interactions.create>[0],
        { timeout: 300000 }
      )) as unknown as Record<string, unknown>;

      const { buffer, mimeType } = await extractVideoFromInteraction(interaction);
      const id = crypto.randomUUID();
      const interactionId = String(interaction.id || '');
      const createdAt = new Date().toISOString();

      storeVideo({
        id,
        interactionId,
        buffer,
        mimeType,
        aspectRatio: validAspectRatio,
        duration: validDuration,
        resolution: validResolution,
        prompt: promptText,
        createdAt,
      });

      res.json({
        id,
        interactionId,
        videoUrl: `/api/videos/${id}`,
        mimeType,
        sizeBytes: buffer.length,
        aspectRatio: validAspectRatio,
        duration: validDuration,
        resolution: validResolution,
        createdAt,
      });
    } catch (err) {
      const classified = classifyApiError(err);
      res.status(classified.status).json({
        code: classified.code,
        message: classified.message,
      });
    }
  });

  // Stream stored video with full HTTP Range support for smooth 60 FPS looping & seeking
  app.get('/api/videos/:id', (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const entry = videoStore.get(id);
    if (!entry) {
      res.status(404).json({ code: 'VIDEO_NOT_FOUND', message: 'Video clip not found in session.' });
      return;
    }

    const total = entry.buffer.length;
    const range = req.headers.range;

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', entry.mimeType);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : total - 1;

      if (Number.isNaN(start) || start >= total || end >= total || start > end) {
        res.status(416).setHeader('Content-Range', `bytes */${total}`).end();
        return;
      }

      const chunkSize = end - start + 1;
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
      res.setHeader('Content-Length', String(chunkSize));
      res.end(entry.buffer.subarray(start, end + 1));
    } else {
      res.status(200);
      res.setHeader('Content-Length', String(total));
      res.end(entry.buffer);
    }
  });

  // Shared subscription / prototype-request pipeline (forwards to DUPAMAN_SCRIPT_URL when configured)
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  async function processSubscribePayload(body: {
    name?: string;
    email?: string;
    topics?: string[] | string;
    source?: string;
    website?: string;
  }): Promise<{ statusCode: number; payload: Record<string, unknown> }> {
    if (body.website) {
      return { statusCode: 200, payload: { ok: true, status: 'ignored' } };
    }

    const name = String(body.name ?? '').trim().slice(0, 100);
    const email = String(body.email ?? '').trim().toLowerCase();
    const source = String(body.source ?? 'website').trim().slice(0, 60);
    const topics = Array.isArray(body.topics)
      ? body.topics.map((t) => String(t).trim()).filter(Boolean).slice(0, 10)
      : String(body.topics ?? 'כללי').trim().slice(0, 150);

    if (!email || !EMAIL_REGEX.test(email)) {
      return {
        statusCode: 400,
        payload: { ok: false, error: 'נא להזין כתובת אימייל תקינה.' },
      };
    }

    const scriptUrl = process.env.DUPAMAN_SCRIPT_URL;
    const secret = process.env.DUPAMAN_WEBHOOK_SECRET;

    if (scriptUrl) {
      const upstream = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, name, email, topics, source }),
        redirect: 'follow',
      });
      if (upstream.ok) {
        const result = (await upstream.json()) as { ok?: boolean; status?: string; id?: string };
        if (result.ok) {
          return {
            statusCode: 200,
            payload: {
              ok: true,
              status: result.status || 'created',
              id: result.id ?? `DUP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
            },
          };
        }
      }
    }

    return {
      statusCode: 200,
      payload: {
        ok: true,
        status: 'created',
        id: `DUP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      },
    };
  }

  app.post('/api/subscribe', async (req: Request, res: Response) => {
    try {
      const { statusCode, payload } = await processSubscribePayload(req.body ?? {});
      res.status(statusCode).json(payload);
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'שגיאה בעיבוד ההרשמה.',
      });
    }
  });

  // A2A (Agent-to-Agent) isolated JSON API layer
  app.get('/api/a2a', (req: Request, res: Response) => {
    const q = String(req.query.q ?? '').trim().toLowerCase();
    const nodeFilter = String(req.query.node ?? '').trim();

    let exhibits = STUDIO_EXHIBITS;
    if (nodeFilter) {
      exhibits = exhibits.filter((e) => e.nodeCode === nodeFilter.padStart(2, '0'));
    }
    if (q) {
      exhibits = exhibits.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.nodeTitle.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          e.techTags.some((t) => t.toLowerCase().includes(q))
      );
    }

    res.json({
      agent: 'DUPAMAN Digital Product Studio',
      studio: 'DUPAMAN Studio',
      founder: 'רפאל ארגנטי',
      googleCloudProject: 'gen-lang-client-0569299984',
      protocol: 'a2a/1.0',
      exhibits,
    });
  });

  // A2UI 1.0 Surface Descriptor Endpoint (application/a2ui+json)
  app.get('/api/a2ui/surface/:id', (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const node = findStarterNode(String(req.params.id ?? '01'));
    if (!node) {
      res.status(404).json({ error: 'Surface node not found', nodeId: req.params.id });
      return;
    }
    res.setHeader('Content-Type', 'application/a2ui+json; charset=utf-8');
    res.status(200).send(JSON.stringify(buildA2UISurfaceMessages(node)));
  });

  // HTMX HTML Fragment Endpoint (for lightweight HTMX / hx-live clients)
  app.get('/api/exhibit/:id', (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const node = findStarterNode(String(req.params.id ?? ''));
    if (!node) {
      res.status(404).type('html').send('<div class="exhibit-card">הצומת לא נמצא.</div>');
      return;
    }
    res.status(200).type('html').send(renderHtmxExhibitFragment(node));
  });

  // Universal Agent Endpoint — Google Cloud Agent Platform (gen-lang-client-0569299984) + A2UI 1.0 Stream + Local Fallback
  app.post('/api/agent/message', async (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const body = (req.body ?? {}) as { message?: string; mode?: string };
    const payload = await resolveUniversalAgentMessage(
      String(body.message ?? ''),
      String(body.mode ?? 'human')
    );
    res.status(200).json(payload);
  });

  app.post('/api/a2a', async (req: Request, res: Response) => {
    try {
      const body = (req.body ?? {}) as {
        name?: string;
        email?: string;
        topics?: string[] | string;
        nodeCode?: string;
        notes?: string;
        source?: string;
      };

      const matchedNode = body.nodeCode
        ? STUDIO_EXHIBITS.find((e) => e.nodeCode === String(body.nodeCode).padStart(2, '0'))
        : undefined;

      const topics =
        body.topics ?? (matchedNode ? [matchedNode.nodeTitle] : ['ממשקי מחר']);

      const { statusCode, payload } = await processSubscribePayload({
        name: body.name || 'External A2A Agent',
        email: body.email,
        topics,
        source: body.source || 'a2a-gateway',
      });

      res.status(statusCode).json({
        protocol: 'a2a/1.0',
        skill: 'request_prototype',
        ...payload,
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'A2A request failed.',
      });
    }
  });

  // Site-aware AI Bot endpoint using Gemini when GEMINI_API_KEY is configured
  app.post('/api/bot/chat', async (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.json({ fallback: true });
      return;
    }

    try {
      const { message, activeSubscriber, subscribersCount } = req.body as {
        message?: string;
        activeSubscriber?: { name?: string; status?: string; topics?: string[]; id?: string } | null;
        subscribersCount?: number;
      };
      const userMsg = String(message ?? '').trim();
      if (!userMsg) {
        res.status(400).json({ fallback: true });
        return;
      }

      // Read approved live tagged content items (.json & .md) from /content/** so Gemini knows ONLY user-approved items & tags
      const contentDir = path.join(__dirname, 'content');
      const liveItemsSummary: string[] = [];
      const scanContentDir = (dir: string) => {
        if (!fs.existsSync(dir)) return;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scanContentDir(full);
          } else if (entry.name.endsWith('.json') && !entry.name.startsWith('_')) {
            try {
              const parsed = JSON.parse(fs.readFileSync(full, 'utf-8')) as unknown;
              const arr = Array.isArray(parsed) ? parsed : [parsed];
              for (const raw of arr) {
                if (raw && typeof raw === 'object' && 'title' in raw) {
                  const o = raw as {
                    title?: string;
                    cards?: string[];
                    tags?: string[];
                    summary?: string;
                    draft?: boolean;
                    approved?: boolean;
                  };
                  if (o.draft === true || o.approved === false) continue;
                  liveItemsSummary.push(
                    `- ${o.title} | כרטיסיות: ${(o.cards || []).join(',')} | תגיות: ${(o.tags || []).join(', ')} | ${o.summary || ''}`
                  );
                }
              }
            } catch {
              // ignore malformed content file
            }
          } else if (
            entry.name.endsWith('.md') &&
            !entry.name.startsWith('_') &&
            entry.name.toLowerCase() !== 'readme.md'
          ) {
            try {
              const rawMd = fs.readFileSync(full, 'utf-8');
              const fm = rawMd.match(/^---\r?\n([\s\S]*?)\r?\n---/);
              if (fm) {
                const block = fm[1];
                if (/draft:\s*true/i.test(block) || /approved:\s*false/i.test(block)) continue;
                const titleM = block.match(/title:\s*["']?([^"'\r\n]+)["']?/);
                const tagsM = block.match(/tags:\s*\[([^\]]*)\]/);
                const cardsM = block.match(/cards:\s*\[([^\]]*)\]/);
                if (titleM?.[1]) {
                  liveItemsSummary.push(
                    `- ${titleM[1].trim()} | כרטיסיות: ${cardsM?.[1] || ''} | תגיות: ${tagsM?.[1] || ''}`
                  );
                }
              }
            } catch {
              // ignore unreadable markdown file
            }
          }
        }
      };
      scanContentDir(contentDir);

      const ai = new GoogleGenAI({ apiKey });
      const studioList = STUDIO_EXHIBITS.map(
        (ex) => `${ex.nodeCode}. ${ex.nodeTitle}: ${ex.title} — ${ex.summary}`
      ).join('\n');
      const context = [
        'אתה הבוט המארח של DUPAMAN Digital Product Studio מאת רפאל ארגנטי.',
        '7 שמות הסטודיו הרשמיים:',
        '00. הסטודיו · כרטיס ביקור חי',
        studioList,
        liveItemsSummary.length > 0
          ? `תכנים נוספים במאגר:\n${liveItemsSummary.slice(0, 40).join('\n')}`
          : '',
        activeSubscriber
          ? `פונה פעיל: ${activeSubscriber.name || ''} (${activeSubscriber.id || ''})`
          : '',
        'ענה בעברית תמציתית, אלגנטית וחמה (עד 2-3 משפטים) והפנה ליצירה המתאימה.',
      ]
        .filter(Boolean)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${context}\n\nשאלת המשתמש: ${userMsg}`,
      });

      const reply = response.text?.trim();
      if (!reply) {
        res.json({ fallback: true });
        return;
      }
      res.json({ fallback: false, reply });
    } catch {
      res.json({ fallback: true });
    }
  });

  // Mount Vite middleware in dev or static dist in production
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DUPAMAN Studio server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start DUPAMAN Studio server:', err);
  process.exit(1);
});
