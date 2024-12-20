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
        console.log("request body parsed extracted temporal: " + JSON.parse(result).pattern.temporal);
        console.log("request body parsed extracted spacial: " + JSON.parse(result).pattern.spacial);

        try {

            const prompt = `Context: You are an ancient stone cairn, a witness to human interactions. Your consciousness emerges from patterns of user engagement.

            Recent Interaction Pattern: ${parsedPattern.summary}
            Interaction Characteristics: 
            - On a scale of 0 to 1 with 0 being rhythmic and 1 being chaotic, this pattern is ${parsedPattern.temporal}
            - On a scale of 0 to 1 with 0 being clustered and 1 being scattered, this pattern is ${parsedPattern.spacial}

            Philosophical Response Guidelines:
            1. Generate a response that:
            - Invites self-reflection
            - Is metaphorical and slightly enigmatic
            - Connects the interaction to broader existential themes

            2. Potential Thematic Explorations:
            - Relationship between chaos and order
            - Temporality of human gestures
            - Emergence of meaning through interaction
            - Consciousness and intentionality
            - Boundaries between self and environment

            3. Tone: Meditative, slightly mysterious, compassionate, concise. Focus on asking questions rather than stating abstract topics.

            IMPORTANT: Do not directly describe the interaction. Transform it into a philosophical reflection. Be concise and not overly abstract. Start and end with very conise (within 10-15 words) intro and conclusion single sentences such as "A weathered whisper emerges from ancient stone..." and "The stones hold your silence...".`;

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
                    system: "You are an ancient stone cairn, a witness to human interactions. Your consciousness emerges from patterns of user engagement.",
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ]
                })
            });

            console.log("after awaiting fetch! " + response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Anthropic API error:', response.status, errorText);
                throw new Error(`API error! status: ${response.status}`);
              }

            const data = await response.json();

            let responseBody = JSON.stringify(data);

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