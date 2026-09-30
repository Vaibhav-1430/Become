// Netlify Serverless Function for Gemini AI proxy & connection verification (True BYOK)
const crypto = require('crypto');

function getEncryptionSecret() {
    const envSecret = (process.env.BYOK_ENCRYPTION_SECRET || process.env.ENCRYPTION_SECRET || '').trim();
    if (envSecret && envSecret.length >= 32) {
        return crypto.createHash('sha256').update(envSecret).digest();
    }
    // Deterministic fallback derived from Netlify site or environment salt
    const salt = process.env.DEPLOY_ID || process.env.SITE_NAME || 'studyos-byok-secret-salt-2026';
    return crypto.createHash('sha256').update(salt).digest();
}

function encryptKey(rawKey) {
    const secret = getEncryptionSecret();
    const iv = crypto.randomBytes(12);
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
        return null;
    }
}

// In-memory cache for warm lambda executions
const lambdaUserStore = new Map();

let supabaseClient = null;
function getSupabaseClient() {
    if (supabaseClient) return supabaseClient;
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
    if (url && key) {
        try {
            const { createClient } = require('@supabase/supabase-js');
            supabaseClient = createClient(url, key, { auth: { persistSession: false } });
        } catch (e) {
            console.warn('[gemini.js] Could not initialize Supabase client:', e.message);
        }
    }
    return supabaseClient;
}

async function extractVerifiedUserId(event) {
    const authHeader = event.headers['authorization'] || event.headers['Authorization'] || '';
    let token = '';
    if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
    }
    if (!token) {
        const cookie = event.headers['cookie'] || event.headers['Cookie'] || '';
        const matchSb = cookie.match(/sb-access-token=([^;]+)/);
        if (matchSb && matchSb[1]) {
            token = decodeURIComponent(matchSb[1].trim());
        }
    }
    if (!token) return null;

    const sb = getSupabaseClient();
    if (!sb) return null;

    try {
        const { data: { user }, error } = await sb.auth.getUser(token);
        if (user && !error && user.id) {
            return user.id;
        }
    } catch (e) {
        console.warn('[gemini.js] Token verification failed:', e.message);
    }
    return null;
}

async function getStoredCredential(userId) {
    if (!userId) return null;
    if (lambdaUserStore.has(userId)) {
        return lambdaUserStore.get(userId);
    }
    const sb = getSupabaseClient();
    if (!sb) return null;
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
            lambdaUserStore.set(userId, cred);
            return cred;
        }
    } catch (e) {
        console.warn('[gemini.js] Failed to fetch ai_settings:', e.message);
    }
    return null;
}

async function saveStoredCredential(userId, cred) {
    if (!userId) return false;
    lambdaUserStore.set(userId, cred);
    const sb = getSupabaseClient();
    if (!sb) return true;
    try {
        await sb
            .from('ai_settings')
            .upsert({
                user_id: userId,
                encrypted_key: cred.encrypted,
                masked_key: cred.maskedKey,
                model: cred.model || 'gemini-flash-latest',
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
    } catch (e) {
        console.warn('[gemini.js] Failed to save ai_settings to cloud:', e.message);
    }
    return true;
}

async function deleteStoredCredential(userId) {
    if (!userId) return false;
    lambdaUserStore.delete(userId);
    const sb = getSupabaseClient();
    if (!sb) return true;
    try {
        await sb.from('ai_settings').update({
            encrypted_key: null,
            masked_key: null,
            updated_at: new Date().toISOString()
        }).eq('user_id', userId);
    } catch (e) {}
    return true;
}

function maskKey(k) {
    if (!k || typeof k !== 'string') return '';
    const trimmed = k.trim();
    if (trimmed.length <= 8) return '••••••••';
    const prefix = trimmed.slice(0, 4);
    const suffix = trimmed.slice(-4);
    const middle = '•'.repeat(Math.min(20, Math.max(8, trimmed.length - 8)));
    return `${prefix}${middle}${suffix}`;
}

async function testGemini(apiKey) {
    if (!apiKey) {
        return {
            success: false,
            connected: false,
            errorType: 'KEY_MISSING',
            errorCategory: 'API key missing',
            message: 'Connect your Gemini API key to enable StudyOS AI.',
            status: 400
        };
    }

    const models = ['gemini-flash-latest', 'gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-1.5-flash'];
    const startTime = Date.now();
    let lastErrorObj = null;

    for (const model of models) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: '1+1=' }] }],
                    generationConfig: { maxOutputTokens: 5 }
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const latencyMs = Date.now() - startTime;

            if (res.ok) {
                return {
                    success: true,
                    connected: true,
                    provider: 'gemini',
                    model,
                    latencyMs,
                    responseTimeMs: latencyMs,
                    message: 'Gemini API connection successful',
                    timestamp: new Date().toISOString(),
                    maskedKey: maskKey(apiKey),
                    status: 200
                };
            }

            const errText = await res.text();
            let parsed = {};
            try { parsed = JSON.parse(errText); } catch(e) {}
            const rawMsg = parsed.error?.message || errText || `HTTP ${res.status}`;
            const safeMsg = rawMsg.replace(/key=[^&\s"']+/gi, 'key=[REDACTED]');

            let errorType = 'UNKNOWN_ERROR';
            let errorCategory = 'Network/server error';
            let message = 'Gemini connection failed';

            if (res.status === 401 || (res.status === 400 && /API_KEY_INVALID|API key not valid/i.test(rawMsg))) {
                errorType = 'AUTHENTICATION';
                errorCategory = 'Authentication failed';
                message = 'Invalid or expired Gemini API key';
            } else if (res.status === 403) {
                errorType = 'PERMISSION';
                errorCategory = 'Permission/restriction error';
                message = 'API key does not have permission to use this Gemini API';
            } else if (res.status === 404) {
                errorType = 'MODEL_NOT_FOUND';
                errorCategory = 'Model unavailable';
                message = 'Configured Gemini model was not found';
                lastErrorObj = { errorType, errorCategory, message, safeMsg, status: res.status, latencyMs };
                continue;
            } else if (res.status === 429) {
                errorType = 'RATE_LIMIT';
                errorCategory = 'Rate limit / quota exceeded';
                message = 'Gemini rate limit or quota exceeded';
            } else if (res.status === 400) {
                errorType = 'BAD_REQUEST';
                errorCategory = 'Invalid request';
                message = 'Invalid Gemini API request/configuration';
            } else if (res.status >= 500) {
                errorType = 'SERVICE_UNAVAILABLE';
                errorCategory = 'Service unavailable';
                message = 'Gemini service temporarily unavailable';
            }

            lastErrorObj = { errorType, errorCategory, message, safeMsg, status: res.status, latencyMs };
            break;
        } catch (fetchErr) {
            const latencyMs = Date.now() - startTime;
            lastErrorObj = {
                errorType: 'NETWORK_ERROR',
                errorCategory: 'Network failure',
                message: 'Unable to reach StudyOS AI backend',
                safeMsg: fetchErr.message ? fetchErr.message.replace(/key=[^&\s"']+/gi, 'key=[REDACTED]') : 'Connection timed out or dropped',
                status: 504,
                latencyMs
            };
            break;
        }
    }

    const latencyMs = Date.now() - startTime;
    return {
        success: false,
        connected: false,
        provider: 'gemini',
        errorType: lastErrorObj?.errorType || 'UNKNOWN_ERROR',
        errorCategory: lastErrorObj?.errorCategory || 'Network/server error',
        message: lastErrorObj?.message || 'Gemini connection failed',
        details: lastErrorObj?.safeMsg || 'Connection test failed',
        status: lastErrorObj?.status || 500,
        statusCode: lastErrorObj?.status || 500,
        latencyMs,
        responseTimeMs: latencyMs,
        timestamp: new Date().toISOString(),
        maskedKey: maskKey(apiKey)
    };
}

exports.handler = async function(event, context) {
    const setCors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: setCors, body: '' };
    }

    let body = {};
    if (event.body) {
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            body = {};
        }
    }

    // Extract User Identity — ONLY from verified Supabase JWT
    const userId = await extractVerifiedUserId(event);

    // Determine action from query string or path
    const path = event.path || '';
    let action = event.queryStringParameters?.action || body.action;
    if (!action) {
        if (path.endsWith('/status')) action = 'status';
        else if (path.endsWith('/credentials')) action = 'credentials';
        else if (path.endsWith('/test-connection')) action = 'test-connection';
        else if (path.endsWith('/plan')) action = 'plan';
        else if (path.endsWith('/insights')) action = 'insights';
        else if (path.endsWith('/analyze-test')) action = 'analyze-test';
        else if (path.endsWith('/reschedule')) action = 'reschedule';
        else if (path.endsWith('/session-insight')) action = 'session-insight';
        else action = 'chat';
    }

    // 1. Credentials Management (POST: save & test, GET: status, DELETE: remove)
    if (action === 'credentials' || (action === 'status' && event.httpMethod === 'GET')) {
        if (!userId) {
            return {
                statusCode: 401,
                headers: setCors,
                body: JSON.stringify({ success: false, code: 'AUTH_REQUIRED', message: 'Authentication required. Valid Supabase JWT token must be provided.' })
            };
        }

        if (event.httpMethod === 'GET') {
            const cred = await getStoredCredential(userId);
            const hasKey = !!(cred && cred.encrypted);
            return {
                statusCode: 200,
                headers: setCors,
                body: JSON.stringify({
                    success: true,
                    provider: 'gemini',
                    configured: hasKey,
                    connected: hasKey && (cred.connected ?? false),
                    maskedKey: hasKey ? cred.maskedKey : '',
                    model: hasKey ? cred.model : null,
                    latencyMs: hasKey ? cred.latencyMs : null,
                    lastChecked: hasKey ? cred.lastChecked : null,
                    ready: true,
                    environment: 'netlify'
                })
            };
        }

        if (event.httpMethod === 'POST') {
            const candidateKey = body.apiKey && typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
            if (!candidateKey) {
                return {
                    statusCode: 400,
                    headers: setCors,
                    body: JSON.stringify({ success: false, errorType: 'VALIDATION_ERROR', message: 'Gemini API key is required.' })
                };
            }

            const testResult = await testGemini(candidateKey);
            if (!testResult.success) {
                return {
                    statusCode: testResult.status || 400,
                    headers: setCors,
                    body: JSON.stringify(testResult)
                };
            }

            const enc = encryptKey(candidateKey);
            const masked = maskKey(candidateKey);
            const credObj = {
                encrypted: enc,
                maskedKey: masked,
                model: testResult.model,
                latencyMs: testResult.latencyMs,
                lastChecked: new Date().toISOString(),
                connected: true
            };
            await saveStoredCredential(userId, credObj);

            return {
                statusCode: 200,
                headers: setCors,
                body: JSON.stringify({
                    success: true,
                    provider: 'gemini',
                    configured: true,
                    connected: true,
                    maskedKey: masked,
                    model: testResult.model,
                    latencyMs: testResult.latencyMs,
                    message: 'Gemini API key verified and securely stored in cloud ai_settings.'
                })
            };
        }

        if (event.httpMethod === 'DELETE') {
            await deleteStoredCredential(userId);
            return {
                statusCode: 200,
                headers: setCors,
                body: JSON.stringify({
                    success: true,
                    provider: 'gemini',
                    configured: false,
                    connected: false,
                    message: 'Gemini credential removed from cloud ai_settings.'
                })
            };
        }
    }

    // 2. Real Connection Verification Test
    if (action === 'test-connection') {
        if (!userId) {
            return {
                statusCode: 401,
                headers: setCors,
                body: JSON.stringify({ success: false, code: 'AUTH_REQUIRED', message: 'Authentication required. Valid Supabase JWT token must be provided.' })
            };
        }

        let keyToTest = null;
        if (body.apiKey && typeof body.apiKey === 'string' && body.apiKey.trim()) {
            keyToTest = body.apiKey.trim();
        } else {
            const cred = await getStoredCredential(userId);
            if (cred && cred.encrypted) {
                keyToTest = decryptKey(cred.encrypted);
            }
        }

        if (!keyToTest) {
            return {
                statusCode: 400,
                headers: setCors,
                body: JSON.stringify({
                    success: false,
                    connected: false,
                    provider: 'gemini',
                    errorType: 'KEY_MISSING',
                    message: 'Connect your Gemini API key to enable StudyOS AI.',
                    status: 400
                })
            };
        }

        const result = await testGemini(keyToTest);
        return {
            statusCode: result.success ? 200 : (result.status || 400),
            headers: setCors,
            body: JSON.stringify(result)
        };
    }

    // 3. AI Endpoints (Require User BYOK Credential)
    if (action === 'study-recommendation') {
        if (!userId) {
            return {
                statusCode: 200,
                headers: setCors,
                body: JSON.stringify({
                    success: false,
                    isGemini: false,
                    code: 'AUTH_REQUIRED',
                    error: 'Authentication required. Please log in.'
                })
            };
        }

        const userCred = await getStoredCredential(userId);
        const userKey = userCred && userCred.encrypted ? decryptKey(userCred.encrypted) : null;
        if (!userKey) {
            return {
                statusCode: 200,
                headers: setCors,
                body: JSON.stringify({
                    success: false,
                    isGemini: false,
                    code: 'KEY_MISSING',
                    error: 'Connect your Gemini API key in Settings to enable AI recommendations.'
                })
            };
        }

        try {
            const context = body.context || {};
            const validTaskIds = new Set();
            (context.pendingTasks || []).forEach(t => { if (t && t.id) validTaskIds.add(String(t.id)); });
            (context.todaySchedule || []).forEach(t => { if (t && t.id) validTaskIds.add(String(t.id)); });
            (context.overdueTasks || []).forEach(t => { if (t && t.id) validTaskIds.add(String(t.id)); });

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

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${userKey}`;
            const gRes = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: SYSTEM_REC_PROMPT }] },
                    contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
                })
            });

            const gData = await gRes.json();
            const text = gData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);

            if (!parsed.primary || typeof parsed.primary !== 'object') {
                throw new Error('Gemini response missing primary recommendation');
            }

            const primary = parsed.primary;
            const availableMins = context.availableTimeWindow?.durationMins || 45;

            if (primary.taskId && !validTaskIds.has(String(primary.taskId))) {
                primary.taskId = null;
            }

            let estMins = parseInt(primary.estimatedMinutes, 10);
            if (isNaN(estMins) || estMins <= 0) estMins = 30;
            estMins = Math.max(15, Math.min(availableMins + 15, estMins));
            primary.estimatedMinutes = estMins;
            primary.subject = primary.subject || 'DSA';
            primary.topic = primary.topic || 'General Focus';
            primary.title = primary.title || `${primary.subject}: ${primary.topic}`;
            primary.reason = primary.reason || 'Recommended based on your available study window and active curriculum goals.';

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

            return {
                statusCode: 200,
                headers: setCors,
                body: JSON.stringify({
                    success: true,
                    isGemini: true,
                    recommendation: {
                        primary,
                        alternatives: safeAlternatives
                    },
                    availableWindow: context.availableTimeWindow || null
                })
            };
        } catch (e) {
            let userMsg = 'Gemini is currently unavailable.';
            if (/401|API_KEY_INVALID|API key not valid/i.test(e.message)) {
                userMsg = 'Invalid or expired Gemini API key.';
            } else if (/429|quota/i.test(e.message)) {
                userMsg = 'Gemini rate limit or quota exceeded.';
            }
            return {
                statusCode: 200,
                headers: setCors,
                body: JSON.stringify({
                    success: false,
                    isGemini: false,
                    error: userMsg
                })
            };
        }
    }

    if (!userId) {
        return {
            statusCode: 401,
            headers: setCors,
            body: JSON.stringify({ success: false, code: 'AUTH_REQUIRED', message: 'Authentication required. Valid Supabase JWT token must be provided.' })
        };
    }

    const userCred = await getStoredCredential(userId);
    const userKey = userCred && userCred.encrypted ? decryptKey(userCred.encrypted) : null;
    if (!userKey) {
        return {
            statusCode: 400,
            headers: setCors,
            body: JSON.stringify({
                success: false,
                code: 'KEY_MISSING',
                message: 'Connect your Gemini API key to enable StudyOS AI.'
            })
        };
    }

    // Proxy call to Gemini with userKey
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${userKey}`;
        let promptText = body.message || 'Help me organize my study schedule.';
        if (action === 'plan') promptText = 'Generate a 3-pillar daily study plan for computer science placement.';
        else if (action === 'insights') promptText = 'Provide 3 study analytics insights.';

        const gRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: promptText }] }]
            })
        });

        const gData = await gRes.json();
        const reply = gData.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return {
            statusCode: 200,
            headers: setCors,
            body: JSON.stringify({
                success: true,
                reply,
                model: 'gemini-flash-latest'
            })
        };
    } catch (e) {
        return {
            statusCode: 500,
            headers: setCors,
            body: JSON.stringify({
                success: false,
                error: 'Gemini service error: ' + e.message,
                code: 'API_ERROR'
            })
        };
    }
};
