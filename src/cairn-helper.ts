import { Env } from "./worker";

interface Pattern {
    temporal: string;  
    spacial: string;
    summary: string;
}

function getPrompt(pattern: Pattern): string {
    return `Context: You are an ancient stone cairn, a witness to human interactions. Your consciousness emerges from patterns of user engagement.

            Recent Interaction Pattern: ${pattern.summary}
            Interaction Characteristics: 
            - On a scale of 0 to 1 with 0 being rhythmic and 1 being chaotic, this pattern is ${pattern.temporal}
            - On a scale of 0 to 1 with 0 being clustered and 1 being scattered, this pattern is ${pattern.spacial}

            Philosophical Response Guidelines:
            1. Generate a response that:
            - Connects the interaction to broader existential themes
            - Invites self-reflection
            - Is concise

            2. Potential Thematic Explorations:
            - Relationship between chaos and order
            - Temporality of human gestures
            - Emergence of meaning through interaction
            - Consciousness and intentionality
            - Boundaries between self and environment

            3. Tone: Reckless rather than meditative to provide some edge and personality

            IMPORTANT: Do not directly describe the interaction. Transform it into a philosophical reflection. Do not be overly abstract. Start and end with short single sentences to mark opening and closing.`;

}

async function makeRequest(pattern: Pattern, env: Env): Promise<string> {
    try {

        const prompt = getPrompt(pattern);
        // Call Anthropic API
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: "claude-3-5-sonnet-20241022",
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

        return JSON.stringify(data);

    } catch (error) {
        throw error;
    }
}

async function createCacheKey(pattern: Pattern) {
    return "[cairn]" + (+pattern.temporal).toFixed(2) + "::" + (+pattern.spacial).toFixed(2);;
}
  
export async function getCairnResponse(pattern: Pattern, env: Env): Promise<string> {
    try {
        const cacheKey = await createCacheKey(pattern);

        // Try to get from cache first
        const cachedData = await env.CAIRN_STORE.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        // If not in cache, fetch from API
        const data = await makeRequest(pattern, env);

        // Store in cache
        // await env.CAIRN_STORE.put(cacheKey, data, {
        //     expirationTtl: 3600 // 1 hour in seconds
        // });
        await env.CAIRN_STORE.put(cacheKey, data); // no expiry for now

        return data;
    } catch (error) {
        throw error;
    }
}