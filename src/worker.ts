/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { getCairnResponse } from "./cairn-helper";
import { getPromenadeResponse } from "./promenade-helper";


export interface Env {
    ANTHROPIC_API_KEY: string;  // Bound from Workers Secrets
    CAIRN_STORE: KVNamespace;  // Bound KV namespace
    ALLOWED_ORIGINS: string[];  // Configured origins
}

export default {
    
    async fetch(request: Request, env: Env) {
        const url = new URL(request.url);
    
        // Debug endpoints
        if (url.pathname.startsWith('/__debug/cache/')) {
            // Only allow GET requests for debug endpoints
            if (request.method !== 'GET') {
                return new Response('Method not allowed', { 
                status: 405,
                headers: {
                    'Allow': 'GET',
                    'Content-Type': 'application/json'
                }
                });
            }

            // List all keys
            if (url.pathname === '/__debug/cache/keys') {
                try {
                    const keys = [];
                    let cursor = undefined;
                    
                    do {
                        const result = await env.CAIRN_STORE.list({ cursor });
                        keys.push(...result.keys);
                        cursor = result.cursor;
                    } while (cursor);
                    
                    return new Response(JSON.stringify(keys, null, 2), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (error) {
                    let message;
                    if (error instanceof Error) {
                        message = JSON.stringify({ error: error.message });
                    }
                    return new Response(JSON.stringify({ error: message }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }
            
            // Get specific key
            if (url.pathname === '/__debug/cache/get') {
                const key = url.searchParams.get('key');
                if (!key) {
                    return new Response(JSON.stringify({ error: 'Key parameter required' }), { 
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                
                try {
                    const value = await env.CAIRN_STORE.get(key);
                    return new Response(JSON.stringify({
                        key,
                        value,
                        exists: value !== null
                    }, null, 2), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (error) {
                    let message;
                    if (error instanceof Error) {
                        message = JSON.stringify({ error: error.message });
                    }
                    return new Response(JSON.stringify({ error: message }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }
        }

        // Handle CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST",
                    "Access-Control-Allow-Headers": "Content-Type, x-api-key, anthropic-version",
                    "Access-Control-Expose-Headers": "*",
                }
            });
        }

        if (request.method !== "POST") {
            return new Response("Method not allowed", { status: 405 });
        }


        let result = "";
        if (request.body != null) {
            for await (const chunk of request.body) {
                result += new TextDecoder().decode(chunk);
            }
        }

        const parsedPattern = JSON.parse(result).pattern;
        console.log("request body parsed extracted temporal: " + parsedPattern.temporal);
        console.log("request body parsed extracted spacial: " + parsedPattern.spacial);
        console.log("request body parsed extracted speed: " + parsedPattern.speed);

        const sessionID = JSON.parse(result).sessionToken;

        try {
            let responseBody;
            switch (parsedPattern.type) {
                case 'promenade':
                    responseBody = await getPromenadeResponse(parsedPattern, env);
                    break;
                case 'cairn':
                    responseBody = await getCairnResponse(parsedPattern, env);
                    break;
            }
            return new Response(responseBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        } catch (error) {
            let message;
            if (error instanceof Error) {
                message = JSON.stringify({ error: error.message });
            }
            return new Response(message, {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        
    }
};