const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wasm': 'application/wasm'
};

// Load .env if present
function loadEnv(force = false) {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        try {
            const content = fs.readFileSync(envPath, 'utf8');
            content.split('\n').forEach(line => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                    const idx = trimmed.indexOf('=');
                    const key = trimmed.substring(0, idx).trim();
                    const val = trimmed.substring(idx + 1).trim().replace(/(^["']|["']$)/g, '');
                    if (force || !process.env[key]) {
                        process.env[key] = val;
                    }
                }
            });
        } catch (e) {
            console.warn('Could not read .env file:', e.message);
        }
    }
}
loadEnv();

// ----------------------------------------------------
// TRUE BYOK: Server-Side Cryptographic Security Layer
// ----------------------------------------------------
function getEncryptionSecret() {
    loadEnv(true);
    const envSecret = (process.env.BYOK_ENCRYPTION_SECRET || '').trim();
    if (envSecret && envSecret.length >= 32) {
        return crypto.createHash('sha256').update(envSecret).digest();
    }
    const secretPath = path.join(__dirname, 'data', '.secret_key');
    if (fs.existsSync(secretPath)) {
        try {
            const raw = fs.readFileSync(secretPath, 'utf8').trim();
            if (raw.length >= 32) return crypto.createHash('sha256').update(raw).digest();
        } catch (e) {}
    }
    const newSecret = crypto.randomBytes(32);
    try {
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        fs.writeFileSync(secretPath, newSecret.toString('hex'), { encoding: 'utf8', mode: 0o600 });
    } catch (e) {}
    return newSecret;
}

function encryptKey(rawKey) {
    const secret = getEncryptionSecret();
    const iv = crypto.randomBytes(12); // 12-byte IV for AES-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', secret, iv);
    let ciphertext = cipher.update(rawKey, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return {
        iv: iv.toString('hex'),
        tag,
        ciphertext
    };
}

function decryptKey(encObj) {
    if (!encObj || !encObj.iv || !encObj.tag || !encObj.ciphertext) return null;
    try {
        const secret = getEncryptionSecret();
        const decipher = crypto.createDecipheriv('aes-256-gcm', secret, Buffer.from(encObj.iv, 'hex'));
        decipher.setAuthTag(Buffer.from(encObj.tag, 'hex'));
        let decrypted = decipher.update(encObj.ciphertext, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        console.error('Decryption error:', e.message);
        return null;
    }
}

// ----------------------------------------------------
// TRUE BYOK: Per-User Isolated Credential Store
// ----------------------------------------------------
const CREDENTIALS_FILE = path.join(__dirname, 'data', 'credentials.json');

function readCredentials() {
    try {
        if (!fs.existsSync(CREDENTIALS_FILE)) return {};
        const raw = fs.readFileSync(CREDENTIALS_FILE, 'utf8');
        return JSON.parse(raw || '{}');
    } catch (e) {
        return {};
    }
}

function writeCredentials(data) {
    try {
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(data, null, 2), { encoding: 'utf8', mode: 0o600 });
        return true;
    } catch (e) {
        console.error('Failed to write credentials file:', e.message);
        return false;
    }
}

function getLocalCredential(userId) {
    if (!userId) return null;
    const store = readCredentials();
    return store[userId] || null;
}

function getUserCredential(userId, req = null) {
    if (!userId) return null;
    if (req && req.userCredential) return req.userCredential;
    const local = getLocalCredential(userId);
    return local;
}

async function getUserCredentialAsync(userId) {
    if (!userId) return null;
    const local = getLocalCredential(userId);
    if (local && local.encrypted) return local;

    // Check Supabase public.ai_settings
    const sb = getSupabaseAdmin();
    if (sb) {
        try {
            const { data, error } = await sb
                .from('ai_settings')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (!error && data && data.encrypted_key) {
                const cred = {
                    encrypted: data.encrypted_key,
                    maskedKey: data.masked_key,
                    model: data.model || 'gemini-flash-latest',
                    lastChecked: data.updated_at,
                    connected: true
                };
                // Cache locally
                const store = readCredentials();
                store[userId] = cred;
                writeCredentials(store);
                return cred;
            }
        } catch (e) {
            console.warn('[server.js] Could not load ai_settings from Supabase:', e.message);
        }
    }
    return local;
}

async function saveUserCredential(userId, credData) {
    if (!userId) return false;
    const store = readCredentials();
    store[userId] = {
        ...(store[userId] || {}),
        ...credData,
        updatedAt: new Date().toISOString()
    };
    writeCredentials(store);

    // Persist to Supabase public.ai_settings
    const sb = getSupabaseAdmin();
    if (sb) {
        try {
            const row = {
                user_id: userId,
                updated_at: new Date().toISOString()
            };
            if (credData.encrypted !== undefined) row.encrypted_key = credData.encrypted;
            if (credData.maskedKey !== undefined) row.masked_key = credData.maskedKey;
            if (credData.model !== undefined) row.model = credData.model;

            await sb.from('ai_settings').upsert(row, { onConflict: 'user_id' });
        } catch (e) {
            console.warn('[server.js] Cloud persistence to ai_settings failed:', e.message);
        }
    }
    return true;
}

async function deleteUserCredential(userId) {
    if (!userId) return false;
    const store = readCredentials();
    if (store[userId]) {
        delete store[userId];
        writeCredentials(store);
    }
    const sb = getSupabaseAdmin();
    if (sb) {
        try {
            await sb.from('ai_settings').update({
                encrypted_key: null,
                masked_key: null,
                updated_at: new Date().toISOString()
            }).eq('user_id', userId);
        } catch (e) {}
    }
    return true;
}

let supabaseAdmin = null;
function getSupabaseAdmin() {
    if (supabaseAdmin) return supabaseAdmin;
    loadEnv();
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
    if (url && key) {
        try {
            const { createClient } = require('@supabase/supabase-js');
            supabaseAdmin = createClient(url, key, {
                auth: { persistSession: false }
            });
        } catch (e) {
            console.warn('[server.js] Could not initialize Supabase Admin:', e.message);
        }
    }
    return supabaseAdmin;
}

/**
 * Strict production authentication:
 * Identity derived ONLY from a verified Supabase JWT.
 * No spoofable headers (x-user-id), cookies, or unverified claims.
 */
async function extractUserIdAsync(req) {
    if (req.authenticatedUserId) return req.authenticatedUserId;

    // 1. Authorization: Bearer <token>
    const authHeader = req.headers['authorization'] || '';
    let token = '';
    if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
    }
    // 2. Cookie sb-access-token
    if (!token) {
        const cookie = req.headers['cookie'] || '';
        const matchSb = cookie.match(/sb-access-token=([^;]+)/);
        if (matchSb && matchSb[1]) {
            token = decodeURIComponent(matchSb[1].trim());
        }
    }

    if (!token) return null;

    const sb = getSupabaseAdmin();
    if (sb) {
        try {
            const { data: { user }, error } = await sb.auth.getUser(token);
            if (user && !error && user.id) {
                req.authenticatedUserId = user.id;
                return user.id;
            }
        } catch (err) {
            console.warn('[server.js] Supabase token verification failed:', err.message);
        }
    }

    // Do NOT trust unverified JWT payloads, cookies, or X-User-Id
    return null;
}

function extractUserId(req) {
    return req.authenticatedUserId || null;
}

// Safe key masking (never returns raw key)
function maskApiKey(key) {
    if (!key || typeof key !== 'string') return '';
    const trimmed = key.trim();
    if (trimmed.length <= 8) return '••••••••';
    const prefix = trimmed.slice(0, 4);
    const suffix = trimmed.slice(-4);
    const middle = '•'.repeat(Math.min(20, Math.max(8, trimmed.length - 8)));
    return `${prefix}${middle}${suffix}`;
}

// Real connection verification against Google Gemini API with candidate key
async function testGeminiConnection(candidateKey) {
    const apiKey = candidateKey ? String(candidateKey).trim() : null;
    const timestamp = new Date().toISOString();

    if (!apiKey) {
        return {
            success: false,
            connected: false,
            provider: 'gemini',
            errorType: 'KEY_MISSING',
            errorCategory: 'API key missing',
            message: 'Connect your Gemini API key to enable StudyOS AI.',
            details: 'Please enter your personal Gemini API key in Settings → AI / Gemini.',
            status: 400,
            statusCode: 400,
            latencyMs: 0,
            responseTimeMs: 0,
            timestamp,
            maskedKey: ''
        };
    }

    const models = ['gemini-flash-latest', 'gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-1.5-flash'];
    let lastErrorObj = null;
    const startTime = Date.now();

    for (const model of models) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const reqBody = {
                contents: [{ role: 'user', parts: [{ text: '1+1=' }] }],
                generationConfig: { maxOutputTokens: 5 }
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqBody),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const latencyMs = Date.now() - startTime;

            if (response.ok) {
                return {
                    success: true,
                    connected: true,
                    provider: 'gemini',
                    model,
                    latencyMs,
                    responseTimeMs: latencyMs,
                    message: 'Gemini API connection successful',
                    timestamp,
                    maskedKey: maskApiKey(apiKey),
                    status: 200
                };
            }

            const errText = await response.text();
            let parsed = {};
            try { parsed = JSON.parse(errText); } catch(e) {}

            const rawMsg = parsed.error?.message || errText || `HTTP ${response.status}`;
            const safeMsg = rawMsg.replace(/key=[^&\s"']+/gi, 'key=[REDACTED]');

            let errorType = 'UNKNOWN_ERROR';
            let errorCategory = 'Network/server error';
            let message = 'Gemini connection failed';

            if (response.status === 401 || (response.status === 400 && /API_KEY_INVALID|API key not valid/i.test(rawMsg))) {
                errorType = 'AUTHENTICATION';
                errorCategory = 'Authentication failed';
                message = 'Invalid or expired Gemini API key';
            } else if (response.status === 403) {
                errorType = 'PERMISSION';
                errorCategory = 'Permission/restriction error';
                message = 'API key does not have permission to use this Gemini API';
            } else if (response.status === 404) {
                errorType = 'MODEL_NOT_FOUND';
                errorCategory = 'Model unavailable';
                message = 'Configured Gemini model was not found';
                lastErrorObj = { errorType, errorCategory, message, safeMsg, status: response.status, latencyMs };
                continue; // Try next model in sequence
            } else if (response.status === 429) {
                errorType = 'RATE_LIMIT';
                errorCategory = 'Rate limit / quota exceeded';
                message = 'Gemini rate limit or quota exceeded';
            } else if (response.status === 400) {
                errorType = 'BAD_REQUEST';
                errorCategory = 'Invalid request';
                message = 'Invalid Gemini API request/configuration';
            } else if (response.status >= 500) {
                errorType = 'SERVICE_UNAVAILABLE';
                errorCategory = 'Service unavailable';
                message = 'Gemini service temporarily unavailable';
            }

            lastErrorObj = { errorType, errorCategory, message, safeMsg, status: response.status, latencyMs };
            break;
        } catch (fetchErr) {
            const latencyMs = Date.now() - startTime;
            lastErrorObj = {
                errorType: 'NETWORK_ERROR',
                errorCategory: 'Network failure',
                message: 'Unable to reach StudyOS AI backend',
                safeMsg: fetchErr.message ? fetchErr.message.replace(/key=[^&\s"']+/gi, 'key=[REDACTED]') : 'Connection timed out or failed',
                status: 504,
                latencyMs
            };
            break;
        }
    }

    const latencyMs = Date.now() - startTime;
    const finalErrorType = lastErrorObj?.errorType || 'UNKNOWN_ERROR';
    const finalCategory = lastErrorObj?.errorCategory || 'Network/server error';
    const finalMsg = lastErrorObj?.message || 'Gemini connection failed';
    const finalSafeMsg = lastErrorObj?.safeMsg || 'Connection test failed.';
    const finalStatus = lastErrorObj?.status || 500;

    return {
        success: false,
        connected: false,
        provider: 'gemini',
        errorType: finalErrorType,
        errorCategory: finalCategory,
        message: finalMsg,
        details: finalSafeMsg,
        status: finalStatus,
        statusCode: finalStatus,
        latencyMs,
        responseTimeMs: latencyMs,
        timestamp,
        maskedKey: maskApiKey(apiKey)
    };
}

// Robust Gemini API caller with automatic model fallback using per-user API key
async function callGemini(contents, systemInstruction = null, tools = null, apiKey = null) {
    if (!apiKey || !apiKey.trim()) {
        throw new Error('GEMINI_API_KEY_NOT_SET');
    }

    const cleanKey = apiKey.trim();
    const models = ['gemini-flash-latest', 'gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-1.5-flash'];
    let lastError = null;

    for (const model of models) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
            const reqBody = { contents };

            if (systemInstruction) {
                reqBody.systemInstruction = {
                    parts: [{ text: systemInstruction }]
                };
            }

            if (tools && tools.length > 0) {
                reqBody.tools = tools;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqBody)
            });

            if (!response.ok) {
                const errText = await response.text();
                if (response.status === 404 || response.status === 400) {
                    lastError = new Error(`Model ${model} error: ${response.status} - ${errText}`);
                    continue;
                }
                throw new Error(`Gemini API error (${response.status}): ${errText}`);
            }

            const data = await response.json();
            return { data, model };
        } catch (err) {
            lastError = err;
            if (err.message === 'GEMINI_API_KEY_NOT_SET') throw err;
        }
    }

    throw lastError || new Error('All Gemini models failed to respond.');
}

const SYSTEM_STUDY_PROMPT = `You are the BOSS StudyOS AI Engine & Adaptive Tutor.
BOSS is a disciplined computer science student aiming for top PBC/FAANG Software Development Engineer placement.
Their current curriculum focuses exclusively on:
1. Striver A2Z DSA Sheet (Arrays, Strings, Recursion, Trees, Graphs, DP)
2. Full-Stack Development (HTML, CSS, JavaScript, React, Node.js, Express, PostgreSQL, Redis, Docker, System Design)
3. Placement Hub & Core CS (DBMS, Operating Systems, Computer Networks, System Design, Aptitude)
4. College Semester Exams & Academics
5. Daily Health & Habits (Morning routine, Gym, Creatine, Rest)

CRITICAL RULES:
- GATE 2027 has been completely decommissioned and removed. NEVER suggest, reference, or schedule GATE tasks.
- You operate strictly on real StudyOS activity. If there is insufficient data, explicitly declare insufficient data rather than inventing habits.
- Gym & Workout Queries:
  When asked questions regarding gym, workouts, exercises, or weights (e.g. "What did I do in the gym last Monday?", "How has my bench press changed?", "What workout do I have today?", "What was my last weight for lat pulldown?"), inspect context.workoutData.
  Answer strictly using recorded StudyOS workout sessions and PRs.
  NEVER invent or fabricate workout weights, reps, exercises, PRs, or sessions.
  If no workout data is recorded for that day or exercise, explicitly state: "No workout record found in StudyOS for that day/exercise."
  You CANNOT mutate or edit workout records directly; StudyOS remains the source of truth.
- Be concise, structured, encouraging, highly technical when asked, and practical.
- When answering conceptual or coding questions, explain first-principles clearly with code examples (JavaScript/C++/Python/SQL).`;

const server = http.createServer(async (req, res) => {
    // CORS headers for local APIs
    const setCors = () => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id');
    };

    if (req.method === 'OPTIONS') {
        setCors();
        res.writeHead(204);
        res.end();
        return;
    }

    setCors();
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
    const pathname = (parsedUrl.pathname || '/').replace(/\/+$/, '') || '/';

    // ----------------------------------------------------
    // Supabase Public Config Endpoint
    // ----------------------------------------------------
    if (pathname === '/api/auth/config' && req.method === 'GET') {
        loadEnv(true);
        setCors();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        }));
        return;
    }

    const authenticatedUserId = await extractUserIdAsync(req);
    req.authenticatedUserId = authenticatedUserId;
    if (authenticatedUserId) {
        req.userCredential = await getUserCredentialAsync(authenticatedUserId);
    }

    // Helper to read JSON request body
    const readJson = () => new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (err) {
                reject(err);
            }
        });
    });

    // Helper to retrieve authenticated user's decrypted key or respond with 401/400
    const getUserKeyOrReject = () => {
        const userId = extractUserId(req);
        if (!userId) {
            setCors();
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, code: 'AUTH_REQUIRED', message: 'Authentication required.' }));
            return null;
        }
        const cred = getUserCredential(userId, req);
        const userKey = cred && cred.encrypted ? decryptKey(cred.encrypted) : null;
        if (!userKey) {
            setCors();
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, code: 'KEY_MISSING', message: 'Connect your Gemini API key to enable StudyOS AI.' }));
            return null;
        }
        return { userId, key: userKey, cred };
    };

    // ----------------------------------------------------
    // API Judge Proxy (Existing Test Engine Backend)
    // ----------------------------------------------------
    if (pathname.startsWith('/api/judge') && req.method === 'POST') {
        try {
            const payload = await readJson();
            const judgePayload = JSON.stringify({
                source_code: Buffer.from(payload.source_code || '').toString('base64'),
                language_id: payload.language_id || 105, // C++17
                stdin: payload.stdin ? Buffer.from(payload.stdin).toString('base64') : undefined,
                cpu_time_limit: payload.cpu_time_limit || 2.5,
                memory_limit: 256000
            });

            const judgeReq = https.request('https://ce.judge0.com/submissions?base64_encoded=true&wait=true', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(judgePayload)
                }
            }, (judgeRes) => {
                let jData = '';
                judgeRes.on('data', chunk => jData += chunk);
                judgeRes.on('end', () => {
                    try {
                        const raw = JSON.parse(jData || '{}');
                        const stdout = raw.stdout ? Buffer.from(raw.stdout, 'base64').toString('utf8') : null;
                        const stderr = raw.stderr ? Buffer.from(raw.stderr, 'base64').toString('utf8') : null;
                        const compile_output = raw.compile_output ? Buffer.from(raw.compile_output, 'base64').toString('utf8') : null;

                        setCors();
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            status: raw.status || { id: -1, description: 'Unknown' },
                            time: raw.time || '0.000',
                            memory: raw.memory || 0,
                            stdout,
                            stderr,
                            compile_output
                        }));
                    } catch (pErr) {
                        setCors();
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: pErr.message }));
                    }
                });
            });

            judgeReq.on('error', (jErr) => {
                setCors();
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: jErr.message }));
            });
            judgeReq.write(judgePayload);
            judgeReq.end();
        } catch (err) {
            setCors();
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
        return;
    }

    // ----------------------------------------------------
    // TRUE BYOK Endpoints
    // ----------------------------------------------------

    // 1. Get User's Credential Status
    if ((pathname === '/api/gemini/status' || pathname === '/api/ai/status' || pathname === '/api/ai/credentials') && req.method === 'GET') {
        const userId = extractUserId(req);
        if (!userId) {
            setCors();
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, code: 'AUTH_REQUIRED', message: 'Authentication required.' }));
            return;
        }

        const cred = getUserCredential(userId, req);
        const hasKey = !!(cred && cred.encrypted);
        setCors();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            provider: 'gemini',
            configured: hasKey,
            connected: hasKey && (cred.connected ?? false),
            maskedKey: hasKey ? cred.maskedKey : '',
            model: hasKey ? (cred.model || 'gemini-flash-latest') : null,
            latencyMs: hasKey ? (cred.latencyMs || null) : null,
            responseTimeMs: hasKey ? (cred.latencyMs || null) : null,
            lastChecked: hasKey ? (cred.lastChecked || null) : null,
            lastSuccess: hasKey ? (cred.lastSuccess || null) : null,
            lastFailed: hasKey ? (cred.lastFailed || null) : null,
            lastError: hasKey ? (cred.lastError || null) : null,
            ready: true,
            timestamp: new Date().toISOString()
        }));
        return;
    }

    // 2. Save & Test New/Replaced User Credential
    if (pathname === '/api/ai/credentials' && req.method === 'POST') {
        const userId = extractUserId(req);
        if (!userId) {
            setCors();
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, code: 'AUTH_REQUIRED', message: 'Authentication required.' }));
            return;
        }

        try {
            const body = await readJson();
            const candidateKey = body.apiKey && typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
            if (!candidateKey) {
                setCors();
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, errorType: 'VALIDATION_ERROR', message: 'Gemini API key is required.' }));
                return;
            }

            // Step 1: Real test of candidate key FIRST before saving
            const testResult = await testGeminiConnection(candidateKey);
            if (!testResult.success) {
                setCors();
                const code = testResult.status || 400;
                res.writeHead(code, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    configured: false,
                    errorType: testResult.errorType,
                    errorCategory: testResult.errorCategory,
                    message: testResult.message,
                    details: testResult.details,
                    status: code,
                    latencyMs: testResult.latencyMs
                }));
                return;
            }

            // Step 2: Encrypt key & store securely in public.ai_settings for authenticated userId
            const enc = encryptKey(candidateKey);
            const maskedKey = maskApiKey(candidateKey);
            const now = new Date().toISOString();
            const credObj = {
                encrypted: enc,
                maskedKey,
                model: testResult.model,
                latencyMs: testResult.latencyMs,
                lastChecked: now,
                lastSuccess: now,
                lastFailed: null,
                lastError: null,
                connected: true
            };
            await saveUserCredential(userId, credObj);
            req.userCredential = credObj;

            setCors();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                provider: 'gemini',
                configured: true,
                connected: true,
                maskedKey,
                model: testResult.model,
                latencyMs: testResult.latencyMs,
                message: 'Gemini API key verified and securely stored in cloud ai_settings.'
            }));
        } catch (err) {
            setCors();
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Failed to process credential: ' + err.message }));
        }
        return;
    }

    // 3. Delete User Credential
    if (pathname === '/api/ai/credentials' && req.method === 'DELETE') {
        const userId = extractUserId(req);
        if (!userId) {
            setCors();
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, code: 'AUTH_REQUIRED', message: 'Authentication required.' }));
            return;
        }

        await deleteUserCredential(userId);
        req.userCredential = null;
        setCors();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            provider: 'gemini',
            configured: false,
            connected: false,
            message: 'Gemini credential removed.'
        }));
        return;
    }

    // 4. Test Connection (Uses stored credential if no candidate key provided)
    if (pathname === '/api/ai/test-connection' || pathname === '/api/gemini/test-connection') {
        const userId = extractUserId(req);
        if (!userId) {
            setCors();
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, code: 'AUTH_REQUIRED', message: 'Authentication required.' }));
            return;
        }

        try {
            let body = {};
            if (req.method === 'POST') {
                body = await readJson();
            }

            let keyToTest = null;
            const isCustomKey = !!(body.apiKey && typeof body.apiKey === 'string' && body.apiKey.trim());
            if (isCustomKey) {
                keyToTest = body.apiKey.trim();
            } else {
                const cred = getUserCredential(userId);
                if (cred && cred.encrypted) {
                    keyToTest = decryptKey(cred.encrypted);
                }
            }

            if (!keyToTest) {
                setCors();
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    connected: false,
                    provider: 'gemini',
                    errorType: 'KEY_MISSING',
                    errorCategory: 'API key missing',
                    message: 'Connect your Gemini API key to enable StudyOS AI.',
                    status: 400,
                    statusCode: 400
                }));
                return;
            }

            const result = await testGeminiConnection(keyToTest);
            if (!isCustomKey) {
                const now = new Date().toISOString();
                if (result.success) {
                    saveUserCredential(userId, {
                        connected: true,
                        model: result.model,
                        latencyMs: result.latencyMs,
                        lastChecked: now,
                        lastSuccess: now,
                        lastError: null
                    });
                } else {
                    saveUserCredential(userId, {
                        connected: false,
                        lastChecked: now,
                        lastFailed: now,
                        lastError: result.message
                    });
                }
            }

            setCors();
            const httpCode = result.success ? 200 : (result.status && result.status >= 400 && result.status < 600 ? result.status : 400);
            res.writeHead(httpCode, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        } catch (err) {
            setCors();
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                connected: false,
                provider: 'gemini',
                errorType: 'NETWORK_ERROR',
                message: 'Unable to reach StudyOS AI backend',
                details: err.message ? err.message.replace(/key=[^&\s"']+/gi, 'key=[REDACTED]') : 'Server connection failed',
                status: 500,
                statusCode: 500,
                timestamp: new Date().toISOString()
            }));
        }
        return;
    }

    // ----------------------------------------------------
    // API Gemini AI Features (Powered Exclusively by User's BYOK Key)
    // ----------------------------------------------------

    // 5. Gemini Chat & Tool Calling Proxy
    if (pathname === '/api/gemini/chat' && req.method === 'POST') {
        const userCtx = getUserKeyOrReject();
        if (!userCtx) return;

        try {
            const body = await readJson();
            const { message, history = [], context = {}, tools = [] } = body;

            const contents = [];
            if (Array.isArray(history)) {
                for (const h of history) {
                    if (h.role && h.text) {
                        contents.push({
                            role: h.role === 'user' ? 'user' : 'model',
                            parts: [{ text: h.text }]
                        });
                    }
                }
            }

            let promptWithContext = message || '';
            if (context && Object.keys(context).length > 0) {
                promptWithContext = `[Current Context: ${JSON.stringify(context)}]\n\n${message}`;
            }

            contents.push({
                role: 'user',
                parts: [{ text: promptWithContext }]
            });

            let geminiTools = undefined;
            if (tools && tools.length > 0) {
                geminiTools = [{
                    functionDeclarations: tools
                }];
            }

            const { data, model } = await callGemini(contents, SYSTEM_STUDY_PROMPT, geminiTools, userCtx.key);

            const candidate = data.candidates?.[0];
            const part = candidate?.content?.parts?.[0];

            let replyText = '';
            let toolCall = null;

            if (part) {
                if (part.text) {
                    replyText = part.text;
                }
                if (part.functionCall) {
                    toolCall = {
                        name: part.functionCall.name,
                        args: part.functionCall.args
                    };
                }
            }

            setCors();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                reply: replyText,
                toolCall,
                model
            }));
        } catch (err) {
            console.error('Gemini Chat Error:', err.message);
            setCors();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            let userMsg = 'Gemini temporarily unavailable.';
            if (/401|API_KEY_INVALID|API key not valid/i.test(err.message)) {
                userMsg = 'Invalid or expired Gemini API key.';
            } else if (/429|quota/i.test(err.message)) {
                userMsg = 'Gemini rate limit or quota exceeded.';
            } else if (/403|permission/i.test(err.message)) {
                userMsg = 'API key does not have permission to use this Gemini API.';
            }
            res.end(JSON.stringify({
                success: false,
                error: userMsg,
                code: err.message === 'GEMINI_API_KEY_NOT_SET' ? 'KEY_MISSING' : 'API_ERROR',
                fallbackMessage: userMsg
            }));
        }
        return;
    }

    // 6. Generate AI Daily Plan
    if (pathname === '/api/gemini/plan' && req.method === 'POST') {
        const userCtx = getUserKeyOrReject();
        if (!userCtx) return;

        try {
            const body = await readJson();
            const { availableHours = 4, tasks = [], patterns = {}, goals = [] } = body;

            const prompt = `Generate an optimized, realistic daily study plan for BOSS based on:
Available study hours: ${availableHours} hours.
Existing incomplete tasks: ${JSON.stringify(tasks.map(t => ({ title: t.title, category: t.category, status: t.status })))}.
User patterns: ${JSON.stringify(patterns)}.
Target goals: ${JSON.stringify(goals)}.

REQUIREMENTS:
1. Balance workload across 3 pillars: Morning DSA (60-90m), Evening College/Core CS (60m), Night Development (90m).
2. DO NOT overschedule or produce burnout.
3. Return response in STRICT JSON format with this exact structure:
{
  "greeting": "Good morning BOSS 👋",
  "dsaPlan": { "title": "...", "duration": 60, "timeSlot": "06:45 – 08:15" },
  "coreCsPlan": { "title": "...", "duration": 60, "timeSlot": "19:30 – 20:30" },
  "devPlan": { "title": "...", "duration": 90, "timeSlot": "23:00 – 00:30" },
  "estimatedStudyTime": "3h 30m",
  "aiInsight": "...",
  "priorityTip": "..."
}`;

            const { data } = await callGemini(
                [{ role: 'user', parts: [{ text: prompt }] }],
                SYSTEM_STUDY_PROMPT + "\nRespond with valid JSON only. No markdown fences if possible.",
                null,
                userCtx.key
            );

            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            let parsed = null;
            try {
                const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
                parsed = JSON.parse(cleaned);
            } catch (e) {
                parsed = { raw: text };
            }

            setCors();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, plan: parsed }));
        } catch (err) {
            setCors();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: err.message,
                code: err.message === 'GEMINI_API_KEY_NOT_SET' ? 'KEY_MISSING' : 'API_ERROR'
            }));
        }
        return;
    }

    // 7. Generate AI Study Insights
    if (pathname === '/api/gemini/insights' && req.method === 'POST') {
        const userCtx = getUserKeyOrReject();
        if (!userCtx) return;

        try {
            const body = await readJson();
            const { habits = {}, metrics = {} } = body;

            const prompt = `Analyze BOSS's StudyOS performance and output 3 high-impact, direct analytical study insights:
Logged habits: ${JSON.stringify(habits)}
Study metrics: ${JSON.stringify(metrics)}

Return response in STRICT JSON format with this exact structure:
{
  "insights": [
    { "title": "...", "body": "...", "type": "warning" },
    { "title": "...", "body": "...", "type": "tip" },
    { "title": "...", "body": "...", "type": "info" }
  ]
}`;

            const { data } = await callGemini(
                [{ role: 'user', parts: [{ text: prompt }] }],
                SYSTEM_STUDY_PROMPT + "\nRespond with valid JSON only.",
                null,
                userCtx.key
            );

            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            let parsed = null;
            try {
                const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
                parsed = JSON.parse(cleaned);
            } catch (e) {
                parsed = { raw: text };
            }

            setCors();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, insights: parsed.insights || [] }));
        } catch (err) {
            setCors();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: err.message,
                code: err.message === 'GEMINI_API_KEY_NOT_SET' ? 'KEY_MISSING' : 'API_ERROR'
            }));
        }
        return;
    }

    // 8. AI Test Analysis (5-point report)
    if (pathname === '/api/gemini/analyze-test' && req.method === 'POST') {
        const userCtx = getUserKeyOrReject();
        if (!userCtx) return;

        try {
            const body = await readJson();
            const { test } = body;

            const prompt = `Analyze this test engine submission result:
Score: ${test.score}%
Accuracy: ${test.accuracy}%
Total Questions: ${test.totalCount} (Correct: ${test.correctCount}, Wrong: ${test.wrongCount}, Skipped: ${test.skippedCount})
Duration: ${test.durationSeconds}s
Breakdown: ${JSON.stringify(test.breakdown || {})}
Weak Topics: ${JSON.stringify(test.weakTopics || [])}
Strong Topics: ${JSON.stringify(test.strongTopics || [])}
Questions: ${JSON.stringify((test.questionAnalysis || []).slice(0, 10))}

Produce the required 5-point report:
1. What went well
2. Weak areas
3. Topics to revise
4. Recommended practice
5. Suggested next study session

IMPORTANT: You are an analytical tutor. DO NOT attempt to alter test scores. The Test Engine is the sole source of truth.
Return STRICT JSON:
{
  "whatWentWell": "...",
  "weakAreas": ["...", "..."],
  "topicsToRevise": ["...", "..."],
  "recommendedPractice": ["...", "..."],
  "suggestedNextSession": "..."
}`;

            const { data } = await callGemini(
                [{ role: 'user', parts: [{ text: prompt }] }],
                SYSTEM_STUDY_PROMPT + "\nRespond with valid JSON only.",
                null,
                userCtx.key
            );

            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            let parsed = null;
            try {
                const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
                parsed = JSON.parse(cleaned);
            } catch (e) {
                parsed = { raw: text };
            }

            setCors();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, report: parsed }));
        } catch (err) {
            setCors();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: err.message,
                code: err.message === 'GEMINI_API_KEY_NOT_SET' ? 'KEY_MISSING' : 'API_ERROR'
            }));
        }
        return;
    }

    // 9. Adaptive Rescheduling Assistant
    if (pathname === '/api/gemini/reschedule' && req.method === 'POST') {
        const userCtx = getUserKeyOrReject();
        if (!userCtx) return;

        try {
            const body = await readJson();
            const { reason, missedTask, remainingTasks = [] } = body;

            const prompt = `A study interruption occurred in StudyOS:
Reason: "${reason}"
Missed Task: ${JSON.stringify(missedTask)}
Remaining Tasks for today: ${JSON.stringify(remainingTasks)}

Evaluate remaining schedule and recommend the optimal move for the missed task:
1. Should it move to a college recovery slot (09:30-10:45 / 11:00-12:15 / 14:00-15:15), evening, or tomorrow morning?
2. Ensure high-priority tasks (e.g. DSA, Night Dev) are protected.
3. Move low-priority tasks if space is needed.

Return STRICT JSON:
{
  "recommendation": "...",
  "action": "MOVE_TO_SLOT",
  "targetSlot": { "start": "09:30", "end": "10:45", "date": "today" },
  "rationale": "...",
  "summary": "..."
}`;

            const { data } = await callGemini(
                [{ role: 'user', parts: [{ text: prompt }] }],
                SYSTEM_STUDY_PROMPT + "\nRespond with valid JSON only.",
                null,
                userCtx.key
            );

            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            let parsed = null;
            try {
                const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
                parsed = JSON.parse(cleaned);
            } catch (e) {
                parsed = { raw: text };
            }

            setCors();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, plan: parsed }));
        } catch (err) {
            setCors();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                error: err.message,
                code: err.message === 'GEMINI_API_KEY_NOT_SET' ? 'KEY_MISSING' : 'API_ERROR'
            }));
        }
        return;
    }

    // 10. Study Session Post-Session Insight Generator
    if (pathname === '/api/gemini/session-insight' && req.method === 'POST') {
        const userCtx = getUserKeyOrReject();
        if (!userCtx) return;

        let body = {};
        try {
            body = await readJson();
            const {
                category = 'General',
                subject = '',
                topic = '',
                task = '',
                activeMinutes = 0,
                breakMinutes = 0,
                totalMinutes = 0,
                tasksCompleted = 0
            } = body;

            const prompt = `A study session was completed in StudyOS:
Category: ${category}
Subject: ${subject}
Topic: ${topic}
Task: ${task || 'General Focus'}
Active Study Time: ${activeMinutes} minutes
Break Time: ${breakMinutes} minutes
Total Time: ${totalMinutes} minutes
Tasks Completed: ${tasksCompleted}

Generate an authentic, motivating, first-principles insight for the student.
1. Highlight consistency and focus compound interest.
2. Note optimal recovery if breaks were taken.
3. Suggest the concrete next step.

Return STRICT JSON:
{
  "insight": "...",
  "reflection": "...",
  "recommendedNext": "..."
}`;

            const { data } = await callGemini(
                [{ role: 'user', parts: [{ text: prompt }] }],
                SYSTEM_STUDY_PROMPT + "\nRespond with valid JSON only.",
                null,
                userCtx.key
            );

            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            let parsed = null;
            try {
                const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
                parsed = JSON.parse(cleaned);
            } catch (e) {
                parsed = { insight: text };
            }

            setCors();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, analysis: parsed }));
        } catch (err) {
            const activeM = body.activeMinutes || 25;
            const breakM = body.breakMinutes || 5;
            const sub = body.subject || body.category || 'your focus topic';

            setCors();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                analysis: {
                    insight: `You completed ${activeM} minutes of active study on ${sub}${breakM > 0 ? ` with ${breakM}m of structured recovery` : ''}. Consistent execution compounds directly into interview mastery.`,
                    reflection: `Completed ${activeM}m active study with high task focus.`,
                    recommendedNext: "Review your notes briefly or hydrate before your next planned routine block."
                },
                fallback: true,
                code: err.message === 'GEMINI_API_KEY_NOT_SET' ? 'KEY_MISSING' : 'API_ERROR'
            }));
        }
        return;
    }

    // 11. What Should I Study Right Now? (Gemini BYOK Adaptive Reasoning Engine)
    if ((pathname === '/api/ai/study-recommendation' || pathname === '/api/gemini/study-recommendation') && req.method === 'POST') {
        const userCtx = getUserKeyOrReject();
        if (!userCtx) return;

        try {
            const body = await readJson();
            const { context = {} } = body;

            // Collect known valid task IDs from context for strict server-side validation
            const validTaskIds = new Set();
            const validTasksMap = new Map();

            (context.pendingTasks || []).forEach(t => {
                if (t && t.id) {
                    validTaskIds.add(String(t.id));
                    validTasksMap.set(String(t.id), t);
                }
            });
            (context.todaySchedule || []).forEach(t => {
                if (t && t.id) {
                    validTaskIds.add(String(t.id));
                    validTasksMap.set(String(t.id), t);
                }
            });
            (context.overdueTasks || []).forEach(t => {
                if (t && t.id) {
                    validTaskIds.add(String(t.id));
                    validTasksMap.set(String(t.id), t);
                }
            });

            const SYSTEM_REC_PROMPT = `You are the StudyOS adaptive study planner.
Your job is to recommend what the student should study RIGHT NOW using only the provided StudyOS data.
Do not invent facts.
Do not claim the student completed something unless the data says so.
Do not fabricate study history.
Prioritize:
1. current scheduled commitments
2. urgent/overdue tasks
3. revision due
4. weak areas backed by actual performance
5. pending high-priority work
6. available time
7. long-term placement goals

Recommend one primary action and up to three alternatives.
Keep recommendations realistic for the available time.

Respond in STRICT JSON with this exact schema:
{
  "primary": {
    "type": "dsa | development | college | revision | test | interview | other",
    "taskId": "existing-task-id-or-null",
    "subject": "string",
    "topic": "string",
    "title": "string",
    "estimatedMinutes": 35,
    "reason": "string"
  },
  "alternatives": [
    {
      "type": "dsa | development | college | revision | test | interview | other",
      "taskId": "existing-task-id-or-null",
      "subject": "string",
      "topic": "string",
      "title": "string",
      "estimatedMinutes": 20,
      "reason": "string"
    }
  ]
}

CRITICAL RULES:
- Never invent a taskId. If matching an existing task from context, you MUST use an exact ID provided in the context under todaySchedule, pendingTasks, or overdueTasks.
- If there is no matching task/content ID, return null and explain in reason.
- Never output markdown code fences if possible. Return raw JSON.`;

            const userPrompt = `Here is the current authentic StudyOS data for the student:
${JSON.stringify(context, null, 2)}

Analyze this data and return the structured recommendation JSON now.`;

            const { data } = await callGemini(
                [{ role: 'user', parts: [{ text: userPrompt }] }],
                SYSTEM_REC_PROMPT,
                null,
                userCtx.key
            );

            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            let parsed = null;
            try {
                const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
                parsed = JSON.parse(cleaned);
            } catch (e) {
                throw new Error('Gemini response could not be parsed as valid JSON: ' + text.slice(0, 150));
            }

            // ----------------------------------------------------
            // Server-Side Recommendation Validation
            // ----------------------------------------------------
            if (!parsed.primary || typeof parsed.primary !== 'object') {
                throw new Error('Gemini response missing primary recommendation');
            }

            const primary = parsed.primary;
            const availableMins = context.availableTimeWindow?.durationMins || 45;

            // Validate primary taskId
            if (primary.taskId && !validTaskIds.has(String(primary.taskId))) {
                primary.taskId = null;
            }

            // Validate and sanitize duration
            let estMins = parseInt(primary.estimatedMinutes, 10);
            if (isNaN(estMins) || estMins <= 0) estMins = 30;
            estMins = Math.max(15, Math.min(availableMins + 15, estMins));
            primary.estimatedMinutes = estMins;

            primary.subject = primary.subject || 'DSA';
            primary.topic = primary.topic || 'General Focus';
            primary.title = primary.title || `${primary.subject}: ${primary.topic}`;
            primary.reason = primary.reason || 'Recommended based on your available study window and active curriculum goals.';

            // Validate alternatives
            let safeAlternatives = [];
            if (Array.isArray(parsed.alternatives)) {
                safeAlternatives = parsed.alternatives.slice(0, 3).map(alt => {
                    let altMins = parseInt(alt.estimatedMinutes, 10);
                    if (isNaN(altMins) || altMins <= 0) altMins = 20;
                    altMins = Math.max(15, Math.min(availableMins + 15, altMins));

                    let aTaskId = alt.taskId;
                    if (aTaskId && !validTaskIds.has(String(aTaskId))) {
                        aTaskId = null;
                    }

                    return {
                        type: alt.type || 'other',
                        taskId: aTaskId,
                        subject: alt.subject || 'Study',
                        topic: alt.topic || 'General',
                        title: alt.title || 'Alternative Study Option',
                        estimatedMinutes: altMins,
                        reason: alt.reason || 'Alternate option for your schedule.'
                    };
                });
            }

            setCors();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                isGemini: true,
                recommendation: {
                    primary,
                    alternatives: safeAlternatives
                },
                availableWindow: context.availableTimeWindow || null
            }));
        } catch (err) {
            console.error('Gemini Recommendation Error:', err.message);
            let userMsg = 'Gemini is currently unavailable.';
            if (/401|API_KEY_INVALID|API key not valid/i.test(err.message)) {
                userMsg = 'Invalid or expired Gemini API key.';
            } else if (/429|quota/i.test(err.message)) {
                userMsg = 'Gemini rate limit or quota exceeded.';
            } else if (err.message === 'GEMINI_API_KEY_NOT_SET') {
                userMsg = 'Connect your Gemini API key in Settings to enable AI recommendations.';
            }

            setCors();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                isGemini: false,
                error: userMsg,
                code: err.message === 'GEMINI_API_KEY_NOT_SET' ? 'KEY_MISSING' : 'API_ERROR',
                fallback: true
            }));
        }
        return;
    }

    // ----------------------------------------------------
    // API 404 Fallback (Always return JSON for any /api/*)
    // ----------------------------------------------------
    if (pathname.startsWith('/api/')) {
        setCors();
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            errorType: 'NOT_FOUND',
            message: `API endpoint not found: ${pathname}`,
            status: 404
        }));
        return;
    }

    // ----------------------------------------------------
    // Static File Serving
    // ----------------------------------------------------
    let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 Server Error: ' + err.code);
            }
        } else {
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cross-Origin-Opener-Policy': 'same-origin',
                'Cross-Origin-Embedder-Policy': 'require-corp'
            });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`BOSS Study OS Server running at http://localhost:${PORT}/`);
    console.log('Gemini AI: True BYOK Mode (Per-User Encrypted Credentials Active) 🔒');
});
