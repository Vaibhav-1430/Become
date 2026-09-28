/**
 * Netlify Serverless Function: Judge Proxy
 * Securely proxies code execution requests to Judge0 CE GCC Sandboxed Compiler.
 * Keeps any credentials and execution configuration server-side.
 */

const https = require('https');

exports.handler = async (event, context) => {
    // Enable CORS for frontend requests
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const payload = JSON.parse(event.body || '{}');
        const { source_code, language_id, stdin, cpu_time_limit } = payload;

        if (!source_code) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'source_code is required' })
            };
        }

        const judgePayload = JSON.stringify({
            source_code: Buffer.from(source_code).toString('base64'),
            language_id: language_id || 105, // Default: C++17 (GCC 14.1.0)
            stdin: stdin ? Buffer.from(stdin).toString('base64') : undefined,
            cpu_time_limit: cpu_time_limit || 2.5,
            memory_limit: 256000
        });

        const judgeRes = await new Promise((resolve, reject) => {
            const req = https.request('https://ce.judge0.com/submissions?base64_encoded=true&wait=true', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(judgePayload)
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
            });

            req.on('error', reject);
            req.write(judgePayload);
            req.end();
        });

        const raw = JSON.parse(judgeRes.body || '{}');

        // Decode base64 responses
        const stdout = raw.stdout ? Buffer.from(raw.stdout, 'base64').toString('utf8') : null;
        const stderr = raw.stderr ? Buffer.from(raw.stderr, 'base64').toString('utf8') : null;
        const compile_output = raw.compile_output ? Buffer.from(raw.compile_output, 'base64').toString('utf8') : null;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                status: raw.status || { id: -1, description: 'Unknown' },
                time: raw.time || '0.000',
                memory: raw.memory || 0,
                stdout,
                stderr,
                compile_output
            })
        };

    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message || 'Judge execution failed' })
        };
    }
};
