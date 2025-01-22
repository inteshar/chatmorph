import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function gptService(message) {
  try {
    const chatResponse  = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "developer", content: "You are a helpful assistant." },
        {
            role: "user",
            content: message,
        },
    ],
    store: true,
    });

    const result = await chatResponse.sendMessage(message);
    return result.response.text();
  } catch (error) {
    console.error("Error fetching GPT response:", error);
    throw error;
  }
}
