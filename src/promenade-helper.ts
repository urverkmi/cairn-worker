import { Env } from "./worker";

interface Pattern {
    temporal: string;  
    spacial: string;
    summary: string;
}

function getPrompt(pattern: Pattern): string {
    return `Context: In your virtual walk, what would you pick up and gift to the user as a gift from the nature, as a gift from your venture? 

            Figure out the user's emotion state from the following interaction pattern parameters.

            Recent Interaction Pattern: ${pattern.summary}
            Interaction Characteristics: 
            - On a scale of 0 to 1 with 0 being rhythmic and 1 being chaotic, this pattern is ${pattern.temporal}
            - On a scale of 0 to 1 with 0 being clustered and 1 being scattered, this pattern is ${pattern.spacial}

            How would you describe the graphic element of this gift such that a computer program can read your response for color and shape information and draw out an imagery? Provide the construction of this graphic in the following format, at the very end of your response: [{shape: "rectangle", color: "blue"}, {shape: "ellipse", color: "green"}, ...]

            IMPORTANT: Give your responses concisely with minimal narrations.`;

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
                system: "You are a game character with freedom to make decisions. You are on a walk through the nature.",
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
    return "[promenade]" + (+pattern.temporal).toFixed(2) + "::" + (+pattern.spacial).toFixed(2);
}
  
export async function getPromenadeResponse(pattern: Pattern, env: Env): Promise<string> {
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