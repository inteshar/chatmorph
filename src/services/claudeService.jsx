import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: import.meta.env.VITE_CLAUDE_API_KEY,
    dangerouslyAllowBrowser: true,
});


export async function claudeService(message) {
    try {
        const chatResponse = await anthropic.completions.create({
            model: "claude-2.1",
            max_tokens: 1024,
            messages: [{ role: "user", content: message }],
            store: true,
        });
        const result = await chatResponse.sendMessage(message);
        return result.response.text();
    } catch (error) {
        console.error("Error fetching Claude response:", error);
        throw error;
    }
}