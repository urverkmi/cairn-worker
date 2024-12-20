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


interface Env {
    ANTHROPIC_API_KEY: string;  // Bound from Workers Secrets
    CAIRN_STORE: KVNamespace;  // Bound KV namespace
    ALLOWED_ORIGINS: string[];  // Configured origins
}

export default {
    async fetch(request: Request, env: Env) {
        // Handle CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST",
                    "Access-Control-Allow-Headers": "Content-Type",
                }
            });
        }

        if (request.method !== "POST") {
            return new Response("Method not allowed", { status: 405 });
        }

        console.log("request body: " + request.text());

        try {
            // Call Anthropic API
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': env.ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: "claude-3-haiku-20240307",
                    max_tokens: 300,
                    system: "You are a world class poet and philosopher. Response with short poems only, no introduction is needed.",
                    messages: [
                        {
                            role: "user",
                            content: "Write a haiku about the connection between winter and home"
                        }
                    ]
                })
            });

            console.log("here! " + response.status);

            if (!response.ok) {
                throw new Error(`API error! status: ${response.status}`);
            }

            const data = await response.json();

            let responseBody = JSON.stringify(data);

            console.log("before returning. response body: " + data);
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