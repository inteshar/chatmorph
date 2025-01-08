import axios from "axios";

const API_URL = "https://api.openai.com/v1/chat/completions";
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function gptResponse(prompt) {
  try {
    const response = await axios.post(
      API_URL,
      {
        model: "gpt-4o",
        messages: [{ role: "developer", content: prompt }],
        max_tokens: 150,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error fetching GPT response:", error);
    throw error;
  }
}
