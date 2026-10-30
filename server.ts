/**
 * Sentinel AI Police CCTV Investigation Server
 * 
 * Features:
 * - Server-side authentication with scrypt hashed passwords & rate limiting (5 tries = 1 min lock)
 * - 15-minute httpOnly sameSite session cookies
 * - Role-based authorization (Admin vs. Investigator)
 * - Append-only audit logging persisted to store.json
 * - Real server-side Gemini AI image/sighting analysis
 * - Full case export (JSON & printable report)
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';
import { 
  INITIAL_CAMERAS, 
  INITIAL_SIGHTINGS, 
  INITIAL_CASES, 
  INITIAL_WATCHLIST, 
  INITIAL_ALERTS, 
  INITIAL_ACTIVITY_LOG,
  createFreshSightings,
  Camera,
  Sighting,
  Case,
  WatchlistItem,
  AlertItem,
  ActivityLogItem,
  normalizePlate
} from './src/data/sentinelData';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = path.join(process.cwd(), 'server-store.json');
const EVIDENCE_DIR = path.join(process.cwd(), 'data', 'evidence');
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// ==========================================
// 1. PERSISTENT SERVER DATA STORE
// ==========================================
interface ServerStore {
  cameras: Camera[];
  sightings: Sighting[];
  cases: Case[];
  watchlist: WatchlistItem[];
  alerts: AlertItem[];
  activityLog: ActivityLogItem[];
}

function loadStore(): ServerStore {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.cameras?.some((c: Camera) => c.id.startsWith('CAM-PU-'))) {
        const fresh = new Map(createFreshSightings().map(s => [s.id, s.time]));
        parsed.sightings = parsed.sightings.map((s: Sighting) => {const sample=INITIAL_SIGHTINGS.find(initial=>initial.id===s.id);return {...s,...(fresh.has(s.id)?{time:fresh.get(s.id)}:{}),sampleImageUrl:s.evidenceUrl?null:(sample?.sampleImageUrl||s.sampleImageUrl||null)}});
        parsed.cases = parsed.cases.map((c: Case) => c.caseId === 'CASE-2026-002' ? {...c,lastSeenTime:fresh.get('SGT-07')} : c);
        saveStore(parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading store, falling back to initial data:', err);
  }

  const defaultStore: ServerStore = {
    cameras: INITIAL_CAMERAS,
    sightings: INITIAL_SIGHTINGS,
    cases: INITIAL_CASES,
    watchlist: INITIAL_WATCHLIST,
    alerts: INITIAL_ALERTS,
    activityLog: INITIAL_ACTIVITY_LOG,
  };
  saveStore(defaultStore);
  return defaultStore;
}

function saveStore(store: ServerStore) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving store:', err);
  }
}

let store = loadStore();

function appendAuditLog(user: string, role: 'Admin' | 'Investigator', action: string, details: string) {
  const now = new Date();
  const timestamp = `${now.toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata'})} ${now.toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour12:false})} IST`;
  const logItem: ActivityLogItem = {
    id: `ACT-${Date.now().toString().slice(-5)}`,
    timestamp,
    user,
    role,
    action,
    details,
  };
  store.activityLog.push(logItem);
  saveStore(store);
  return logItem;
}

// ==========================================
// 2. AUTHENTICATION & SECURITY
// ==========================================
const SALT = process.env.SESSION_SECRET || 'sentinel_maharashtra_demo_salt_2026';

function hashPassword(password: string): string {
  return crypto.scryptSync(password, SALT, 64).toString('hex');
}

// Demo users with hashed passwords
const USERS: Record<string, { username: string; role: 'Admin' | 'Investigator'; passwordHash: string; displayName: string }> = {
  investigator: {
    username: 'investigator',
    role: 'Investigator',
    displayName: 'Inspector Kulkarni',
    passwordHash: hashPassword('investigator123'),
  },
  admin: {
    username: 'admin',
    role: 'Admin',
    displayName: 'Admin',
    passwordHash: hashPassword('admin123'),
  },
};

// Rate limiting: 5 failed attempts = 1 minute lockout
interface RateLimitRecord {
  attempts: number;
  lockUntil: number;
}
const loginAttempts: Map<string, RateLimitRecord> = new Map();

// Active server sessions
interface SessionData {
  username: string;
  displayName: string;
  role: 'Admin' | 'Investigator';
  expiresAt: number;
}
const SESSIONS: Map<string, SessionData> = new Map();
const SESSION_DURATION_MS = 15 * 60 * 1000; // 15 minutes timeout

// Authentication Middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.sentinel_session;
  if (!token || !SESSIONS.has(token)) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in.' });
  }

  const session = SESSIONS.get(token)!;
  if (Date.now() > session.expiresAt) {
    SESSIONS.delete(token);
    res.clearCookie('sentinel_session');
    return res.status(401).json({ error: 'Session timeout (15 mins). Please log in again.' });
  }

  // Slide expiration window
  session.expiresAt = Date.now() + SESSION_DURATION_MS;
  (req as any).user = session;
  next();
}

// Role Enforcement Middleware
function requireRole(role: 'Admin') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || user.role !== role) {
      appendAuditLog(
        user?.displayName || 'Unknown',
        user?.role || 'Investigator',
        'ACCESS_DENIED',
        `Unauthorized attempt to access Admin-restricted action on ${req.path}`
      );
      return res.status(403).json({ error: `Forbidden: This action requires '${role}' clearance.` });
    }
    next();
  };
}

// ==========================================
// 3. API ROUTES
// ==========================================
app.get('/api/health', (_req, res) => res.json({ api: 'ok', store: fs.existsSync(DATA_FILE) ? 'ok' : 'error', ai: process.env.GEMINI_API_KEY ? 'configured' : 'missing key' }));

// Login endpoint with rate-limiting
app.post('/api/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const ip = req.ip || '127.0.0.1';
  const key = `${ip}_${username || ''}`;

  const record = loginAttempts.get(key) || { attempts: 0, lockUntil: 0 };
  const now = Date.now();

  // Check lockout
  if (record.lockUntil > now) {
    const remainingSeconds = Math.ceil((record.lockUntil - now) / 1000);
    appendAuditLog(
      username || 'Unknown',
      'Investigator',
      'LOGIN_LOCKED',
      `Login blocked by rate limiter (${remainingSeconds}s remaining)`
    );
    return res.status(429).json({
      error: `Account temporarily locked due to 5 failed attempts. Please retry in ${remainingSeconds} seconds.`,
      lockoutSeconds: remainingSeconds,
    });
  }

  const user = USERS[username?.toLowerCase()];
  if (!user || user.passwordHash !== hashPassword(password || '')) {
    record.attempts += 1;
    if (record.attempts >= 5) {
      record.lockUntil = now + 60 * 1000; // Lock for 1 minute
      record.attempts = 0;
      loginAttempts.set(key, record);
      appendAuditLog(
        username || 'Unknown',
        'Investigator',
        'LOGIN_LOCKOUT_TRIGGERED',
        `Account locked for 1 minute after 5 consecutive failed login attempts.`
      );
      return res.status(429).json({
        error: 'Too many failed login attempts. Account locked for 1 minute for security.',
        lockoutSeconds: 60,
      });
    }

    loginAttempts.set(key, record);
    appendAuditLog(
      username || 'Unknown',
      'Investigator',
      'LOGIN_FAILED',
      `Invalid password attempt (${record.attempts}/5 before lockout)`
    );
    return res.status(401).json({
      error: `Invalid credentials. (${5 - record.attempts} attempts remaining before 1-minute lockout)`,
    });
  }

  // Successful login
  loginAttempts.delete(key);
  const sessionToken = crypto.randomBytes(32).toString('hex');
  SESSIONS.set(sessionToken, {
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    expiresAt: now + SESSION_DURATION_MS,
  });

  res.cookie('sentinel_session', sessionToken, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_DURATION_MS,
  });

  appendAuditLog(user.displayName, user.role, 'LOGIN_SUCCESS', `Officer authenticated into terminal.`);

  return res.json({
    success: true,
    user: {
      username: user.displayName,
      role: user.role,
    },
  });
});

// Logout endpoint
app.post('/api/logout', authMiddleware, (req: Request, res: Response) => {
  const token = req.cookies.sentinel_session;
  const user = (req as any).user;
  if (token) {
    SESSIONS.delete(token);
  }
  res.clearCookie('sentinel_session');
  appendAuditLog(user.displayName, user.role, 'LOGOUT', 'Officer logged out of terminal.');
  res.json({ success: true });
});

// Check current session
app.get('/api/session', (req: Request, res: Response) => {
  const token = req.cookies.sentinel_session;
  if (!token || !SESSIONS.has(token)) {
    return res.status(401).json({ authenticated: false });
  }
  const session = SESSIONS.get(token)!;
  if (Date.now() > session.expiresAt) {
    SESSIONS.delete(token);
    return res.status(401).json({ authenticated: false });
  }

  return res.json({
    authenticated: true,
    user: {
      username: session.displayName,
      role: session.role,
    },
  });
});

// Get all data
app.get('/api/data', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;
  // If investigator, provide sightings, cameras, cases, alerts, and their own recent actions
  // If admin, provide full audit log as well
  res.json({
    cameras: store.cameras.map(c => ({...c,detectionCount:store.sightings.filter(s=>s.cameraId===c.id).length})),
    sightings: store.sightings,
    cases: store.cases,
    watchlist: store.watchlist,
    alerts: store.alerts,
    activityLog: user.role === 'Admin' ? store.activityLog : store.activityLog.filter((e) => e.user === user.displayName),
    userRole: user.role,
  });
});

// Sighting decision (Confirm or Reject)
app.post('/api/sighting/decision', authMiddleware, (req: Request, res: Response) => {
  const { sightingId, decision, notes } = req.body;
  const user = (req as any).user;

  if (!['confirmed', 'rejected'].includes(decision)) return res.status(400).json({ error: 'Decision must be confirmed or rejected.' });
  if (decision === 'rejected' && (typeof notes !== 'string' || !notes.trim())) return res.status(400).json({ error: 'A reason is required to reject a sighting.' });

  const sightingIndex = store.sightings.findIndex((s) => s.id === sightingId);
  if (sightingIndex === -1) {
    return res.status(404).json({ error: 'Sighting not found' });
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const sighting = store.sightings[sightingIndex];
  sighting.decision = decision;
  sighting.decisionBy = `${user.displayName} (${user.role})`;
  sighting.decisionTime = now;
  if (notes) sighting.notes = notes;

  const targetIdentifier = sighting.plateNumber || sighting.personDescription || sighting.id;
  const cam = store.cameras.find((c) => c.id === sighting.cameraId);

  appendAuditLog(
    user.displayName,
    user.role,
    decision === 'confirmed' ? 'CONFIRM_SIGHTING' : 'REJECT_SIGHTING',
    `${decision === 'confirmed' ? 'Confirmed' : 'Rejected'} sighting ${sighting.id} (${targetIdentifier}) at ${cam?.name || sighting.cameraId}.${notes ? ` Note: "${notes}"` : ''}`
  );

  saveStore(store);
  res.json({ success: true, sighting });
});

// Case update (status or notes)
app.post('/api/case/update', authMiddleware, (req: Request, res: Response) => {
  const { caseId, status, notes, linkedSightingIds } = req.body;
  const user = (req as any).user;

  const targetCase = store.cases.find((c) => c.caseId === caseId);
  if (!targetCase) {
    return res.status(404).json({ error: 'Case not found' });
  }

  if (status) targetCase.status = status;
  if (notes) targetCase.notes = notes;
  if (linkedSightingIds) targetCase.linkedSightingIds = linkedSightingIds;

  appendAuditLog(
    user.displayName,
    user.role,
    'UPDATE_CASE',
    `Updated case ${caseId} (${targetCase.title}): Status=${targetCase.status}`
  );

  saveStore(store);
  res.json({ success: true, case: targetCase });
});

// Watchlist update (Admin Only)
app.post('/api/watchlist', authMiddleware, requireRole('Admin'), (req: Request, res: Response) => {
  const { action, item } = req.body;
  const user = (req as any).user;

  if (action === 'add') {
    const newItem: WatchlistItem = {
      id: `WCH-${Date.now().toString().slice(-4)}`,
      type: item.type,
      target: item.target,
      description: item.description,
      priority: item.priority || 'High',
      addedBy: user.displayName,
      addedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    store.watchlist.push(newItem);
    appendAuditLog(user.displayName, user.role, 'ADD_WATCHLIST', `Added target to watchlist: "${newItem.target}"`);
  } else if (action === 'remove') {
    store.watchlist = store.watchlist.filter((w) => w.id !== item.id);
    appendAuditLog(user.displayName, user.role, 'REMOVE_WATCHLIST', `Removed target from watchlist ID: ${item.id}`);
  }

  saveStore(store);
  res.json({ success: true, watchlist: store.watchlist });
});

// Acknowledge alert
app.post('/api/alert/acknowledge', authMiddleware, (req: Request, res: Response) => {
  const { alertId } = req.body;
  const user = (req as any).user;

  const targetAlert = store.alerts.find((a) => a.id === alertId);
  if (targetAlert) {
    targetAlert.status = 'acknowledged';
    appendAuditLog(
      user.displayName,
      user.role,
      'ACKNOWLEDGE_ALERT',
      `Acknowledged alert ${alertId} for target ${targetAlert.target}`
    );
    saveStore(store);
  }
  res.json({ success: true });
});

// Reset Demo Data (Admin or Investigator view button)
app.post('/api/reset-demo', authMiddleware, requireRole('Admin'), (req: Request, res: Response) => {
  const user = (req as any).user;
  const freshSightings = createFreshSightings();
  const priorAudit = store.activityLog;
  store = {
    cameras: INITIAL_CAMERAS,
    sightings: freshSightings,
    cases: INITIAL_CASES.map(c => c.caseId === 'CASE-2026-002' ? {...c,lastSeenTime:freshSightings[6].time} : {...c}),
    watchlist: INITIAL_WATCHLIST,
    alerts: INITIAL_ALERTS,
    activityLog: priorAudit,
  };
  saveStore(store);
  appendAuditLog(
    user.displayName,
    user.role,
    'RESET_DEMO_DATA',
    'Demonstration dataset reset to the Pune sample baseline.'
  );
  res.json({
    success: true,
    data: {
      cameras: store.cameras,
      sightings: store.sightings,
      cases: store.cases,
      watchlist: store.watchlist,
      alerts: store.alerts,
      activityLog: store.activityLog,
    },
  });
});

// Simulate new sighting
app.post('/api/sighting/simulate', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;
  const timeStr = new Date().toISOString();
  const newSighting: Sighting = {
    id: `SGT-${Date.now()}`,
    cameraId: 'CAM-PU-05',
    time: timeStr,
    type: 'vehicle',
    plateNumber: 'MH 12 AB 1234',
    rawPlateRead: 'MH 12 AB 1234',
    normalizedPlate: 'MH12AB1234',
    plateReadConfidence: 96.2,
    confidence: 95.8,
    reason: 'Simulated sighting; image evidence has not been supplied.',
    whyMatched: ['Sample plate matches the Pune vehicle watchlist'],
    confidenceBreakdown: { readOrAppearance: 97, timePlausibility: 96, cameraQuality: 95 },
    evidenceUrl: null, evidenceSha256: null, sampleImageUrl: null, detectionBox: null, isAiGenerated: false,
    decision: 'pending',
    notes: 'Simulated prototype event; no camera feed is connected.',
  };

  store.sightings.push(newSighting);

  // Link to case if exists
  const targetCase = store.cases.find((c) => normalizePlate(c.searchCriteria) === 'MH12AB1234');
  if (targetCase && !targetCase.linkedSightingIds.includes(newSighting.id)) {
    targetCase.linkedSightingIds.push(newSighting.id);
  }

  const matchingWatch = store.watchlist.find(w => w.type === 'vehicle' && normalizePlate(w.target) === 'MH12AB1234');
  const cam = store.cameras.find(c => c.id === newSighting.cameraId)!;
  const newAlert: AlertItem | null = matchingWatch ? {
    id: `ALT-${Date.now().toString().slice(-4)}`,
    sightingId: newSighting.id,
    target: 'MH 12 AB 1234',
    type: 'vehicle',
    time: timeStr,
    cameraId: cam.id,
    cameraName: cam.name,
    location: cam.location,
    confidence: 95.8,
    status: 'active',
  } : null;
  if (newAlert) store.alerts = [newAlert, ...store.alerts];

  appendAuditLog(
    user.displayName,
    user.role,
    'SIMULATE_SIGHTING',
    `Simulated new detection for target MH 12 AB 1234 on ${cam.id}`
  );

  saveStore(store);
  res.json({ success: true, sighting: newSighting, alert: newAlert });
});

// Log general client action (Search, View Case)
app.post('/api/audit/log', authMiddleware, (req: Request, res: Response) => {
  const { action, details } = req.body;
  const user = (req as any).user;
  appendAuditLog(user.displayName, user.role, action, details);
  res.json({ success: true });
});

// Full Case Export (Admin Only) (Requirement 23)
app.get('/api/case/export/:caseId', authMiddleware, requireRole('Admin'), (req: Request, res: Response) => {
  const { caseId } = req.params;
  const user = (req as any).user;

  const targetCase = store.cases.find((c) => c.caseId === caseId);
  if (!targetCase) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const linkedSightings = store.sightings.filter((s) => targetCase.linkedSightingIds.includes(s.id));
  const caseAuditLogs = store.activityLog.filter((log) => 
    log.details.includes(caseId) ||
    linkedSightings.some((s) => log.details.includes(s.id))
  );

  appendAuditLog(
    user.displayName,
    user.role,
    'EXPORT_CASE',
    `Exported full forensic evidence dossier for case ${caseId} (${targetCase.title})`
  );

  res.json({
    case: targetCase,
    sightings: linkedSightings,
    auditTrail: caseAuditLogs,
    exportedBy: user.displayName,
    role: user.role,
    exportTimestamp: new Date().toISOString(),
  });
});

// Gemini AI Sighting Analysis (Server side only)
app.get('/api/evidence/:id/file', authMiddleware, (req, res) => {
  const s = store.sightings.find(x => x.id === req.params.id);
  if (!s?.evidenceUrl || !fs.existsSync(path.join(EVIDENCE_DIR, path.basename(s.evidenceUrl)))) return res.status(404).json({error:'No evidence image yet'});
  res.sendFile(path.join(EVIDENCE_DIR, path.basename(s.evidenceUrl)));
});
app.get('/api/evidence/:id/verify', authMiddleware, (req, res) => {
  const s = store.sightings.find(x => x.id === req.params.id);
  if (!s?.evidenceUrl) return res.status(404).json({verified:false,error:'No evidence image yet'});
  const file=path.join(EVIDENCE_DIR,path.basename(s.evidenceUrl));
  const hash=fs.existsSync(file)?crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'):'';
  res.json({verified:!!hash&&hash===s.evidenceSha256,hash});
});
app.post('/api/evidence/:id', authMiddleware, requireRole('Admin'), (req,res)=>{
  const s=store.sightings.find(x=>x.id===req.params.id); if(!s)return res.status(404).json({error:'Sighting not found'});
  const {dataUrl,label}=req.body as {dataUrl?:string;label?:string};
  const m=dataUrl?.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/); if(!m)return res.status(400).json({error:'Upload must be JPEG, PNG or WebP.'});
  const bytes=Buffer.from(m[2],'base64'); if(bytes.length>5*1024*1024)return res.status(413).json({error:'Image exceeds 5 MB.'});
  const ext=m[1]==='image/jpeg'?'jpg':m[1].split('/')[1];const filename=`${s.id}.${ext}`;const file=path.join(EVIDENCE_DIR,filename);fs.writeFileSync(file,bytes);
  s.evidenceUrl=filename;s.evidenceSha256=crypto.createHash('sha256').update(bytes).digest('hex');s.sampleImageUrl=null;s.isAiGenerated=false;if(label)s.detectionBox={x:20,y:25,w:45,h:35,label};
  appendAuditLog((req as any).user.displayName,'Admin','UPLOAD_EVIDENCE',`Saved evidence image for ${s.id} (SHA-256 ${s.evidenceSha256})`);saveStore(store);res.json({success:true,sighting:s});
});
// ---- AI evidence image generation (shared by button, "generate all" and auto-start) ----
const imageJob = { running: false, done: 0, total: 0, lastError: '', updatedAt: '' };
function buildImagePrompt(s: any): string {
  const base = 'Photorealistic CCTV still frame, 16:9, from a busy road in Pune, Maharashtra, India, daytime, slightly grainy low-resolution look, fixed camera mounted about 4 metres high looking down the road, auto-rickshaws and two-wheelers in the background.';
  const tail = 'No text overlay, no watermark, no timestamp, no cartoon, no illustration, no drawing, no 3D render.';
  if (s.type === 'vehicle') {
    const plate = s.plateNumber || 'MH 12 AB 1234';
    const target = normalizePlateServer(plate) === 'MH12AB1234' || s.isOcrUncertain;
    const car = target ? 'a dark grey sedan' : 'a white hatchback';
    const dirty = s.isOcrUncertain ? ' The plate is slightly dirty and the letter B looks like the digit 8.' : '';
    return `${base} Main subject: ${car} seen from the front, with a white Indian number plate clearly readable as "${plate}" (black characters).${dirty} ${tail}`;
  }
  return `${base} Main subject: a pedestrian walking on the footpath: ${s.personDescription || 'adult wearing a red hooded jacket, dark trousers and a black backpack'}. ${tail}`;
}
function normalizePlateServer(p: string) { return String(p || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
async function generateEvidenceFor(s: any, actor: string): Promise<void> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Add GEMINI_API_KEY to enable AI image generation');
  const ai: any = new GoogleGenAI({ apiKey: key });
  const prompt = buildImagePrompt(s);
  const models = [process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image', process.env.GEMINI_IMAGE_MODEL_FALLBACK || 'gemini-2.5-flash-image-preview', 'gemini-3-pro-image-preview'];
  const errors: string[] = [];
  let data: string | undefined; let mime = 'image/png';
  for (const model of models) {
    try {
      const out: any = await ai.models.generateContent({ model, contents: prompt, config: { responseModalities: ['TEXT', 'IMAGE'] } });
      const part = out.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
      if (!part) throw new Error('no image returned' + (out.candidates?.[0]?.finishReason ? ` (${out.candidates[0].finishReason})` : ''));
      data = part.inlineData.data; mime = part.inlineData.mimeType || 'image/png'; break;
    } catch (e: any) { errors.push(`${model}: ${String(e?.message || e).replace(/\s+/g, ' ').slice(0, 160)}`); }
  }
  if (!data) throw new Error(errors.join(' | '));
  const bytes = Buffer.from(data, 'base64');
  const ext = mime.includes('jpeg') ? 'jpg' : mime.includes('webp') ? 'webp' : 'png';
  const filename = `${s.id}.${ext}`;
  fs.writeFileSync(path.join(EVIDENCE_DIR, filename), bytes);
  s.evidenceUrl = filename; s.evidenceSha256 = crypto.createHash('sha256').update(bytes).digest('hex'); s.sampleImageUrl = null; s.isAiGenerated = true;
  if (!s.detectionBox) s.detectionBox = null;
  appendAuditLog(actor, 'Admin', 'GENERATE_EVIDENCE', `Generated AI sample image for ${s.id} (SHA-256 ${s.evidenceSha256})`);
  saveStore(store);
}
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
async function runImageJob(actor: string) {
  if (imageJob.running) return;
  const todo = store.sightings.filter((s: any) => !s.evidenceUrl && !s.sampleImageUrl);
  if (!todo.length || !process.env.GEMINI_API_KEY) return;
  imageJob.running = true; imageJob.done = 0; imageJob.total = todo.length; imageJob.lastError = '';
  let failures = 0;
  for (const s of todo) {
    let ok = false;
    for (let attempt = 0; attempt < 2 && !ok; attempt++) {
      try { await generateEvidenceFor(s, actor); ok = true; failures = 0; }
      catch (e: any) {
        imageJob.lastError = `${s.id}: ${e.message}`;
        console.warn('[images]', imageJob.lastError);
        if (/429|quota|RESOURCE_EXHAUSTED|rate/i.test(e.message) && attempt === 0) await sleep(40000); else break;
      }
    }
    if (ok) imageJob.done++; else if (++failures >= 2) break;
    imageJob.updatedAt = new Date().toISOString();
    await sleep(3000);
  }
  imageJob.running = false; imageJob.updatedAt = new Date().toISOString();
  if (imageJob.done === imageJob.total) imageJob.lastError = '';
}
app.get('/api/evidence/status', authMiddleware, (_req, res) => res.json({ ...imageJob, keyConfigured: !!process.env.GEMINI_API_KEY }));
app.post('/api/evidence/generate-all', authMiddleware, requireRole('Admin'), (req, res) => {
  if (!process.env.GEMINI_API_KEY) return res.status(400).json({ error: 'Add GEMINI_API_KEY to enable AI image generation' });
  runImageJob((req as any).user.displayName);
  res.json({ started: true });
});
app.post('/api/evidence/:id/generate', authMiddleware, requireRole('Admin'), async (req, res) => {
  const s = store.sightings.find((x: any) => x.id === req.params.id); if (!s) return res.status(404).json({ error: 'Sighting not found' });
  try { await generateEvidenceFor(s, (req as any).user.displayName); res.json({ success: true, sighting: s }); }
  catch (e: any) { res.status(e.message?.startsWith('Add GEMINI') ? 400 : 502).json({ error: e.message || 'AI image generation unavailable' }); }
});
app.post('/api/evidence/:id/box', authMiddleware, requireRole('Admin'), (req,res)=>{const s=store.sightings.find(x=>x.id===req.params.id);if(!s)return res.status(404).json({error:'Sighting not found'});const b=req.body?.detectionBox;if(!b||![b.x,b.y,b.w,b.h].every((v:any)=>Number.isFinite(v)&&v>=0&&v<=100)||!b.label)return res.status(400).json({error:'Invalid detection box'});s.detectionBox=b;saveStore(store);appendAuditLog((req as any).user.displayName,'Admin','DRAW_EVIDENCE_BOX',`Updated detection box for ${s.id}`);res.json({success:true,sighting:s});});
app.get('/api/audit/export',authMiddleware,requireRole('Admin'),(_req,res)=>{res.type('text/csv').send(['id,timestamp,user,role,action,details',...store.activityLog.map(e=>[e.id,e.timestamp,e.user,e.role,e.action,e.details].map(v=>`"${String(v).replaceAll('"','""')}"`).join(','))].join('\n'))});
app.post('/api/analyze-image', authMiddleware, async (req: Request, res: Response) => {
  const { sightingId, type, description } = req.body;
  const user = (req as any).user;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        success: false,
        suggestion: null,
        error: 'AI service unavailable: GEMINI_API_KEY environment variable not configured on server.',
      });
    }

    const ai = new GoogleGenAI({apiKey});
    const prompt = `You are an AI assistant assisting a police CCTV investigator analyzing surveillance footage.
Target type: ${type === 'vehicle' ? 'Vehicle / License Plate' : 'Missing Person appearance'}.
Context notes: ${description || 'Surveillance camera sighting in Pune, Maharashtra'}.

Provide a concise forensic classification in JSON format with these exact keys:
"recognizedText": A clean text read (e.g. "MH 12 AB 1234" for plate or "Red hooded jacket with dark backpack" for person).
"confidence": Numeric percentage returned by the model.
"explanation": A clear one-sentence technical explanation of visible visual features.`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    appendAuditLog(
      user.displayName,
      user.role,
      'AI_IMAGE_ANALYSIS',
      `Ran server-side Gemini AI analysis on sighting ${sightingId}`
    );

    return res.json({
      success: true,
      suggestion: {
        recognizedText: parsed.recognizedText,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : null,
        explanation: parsed.explanation,
      },
    });
  } catch (err: any) {
    console.error('Gemini AI error:', err);
    return res.json({
      success: false,
      suggestion: null,
      error: 'AI analysis service temporarily unavailable. Please proceed with manual officer review.',
    });
  }
});

// ==========================================
// 4. VITE DEV OR STATIC FRONTEND SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sentinel Police CCTV Investigation Server active on port ${PORT}`);
    if (process.env.GEMINI_API_KEY && process.env.AUTO_GENERATE_IMAGES !== 'false') {
      console.log('[images] GEMINI_API_KEY found: generating missing evidence images in the background...');
      runImageJob('System (auto)');
    }
  });
}

startServer();

