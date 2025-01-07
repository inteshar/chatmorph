// services/geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize the GoogleGenerativeAI client with the API key
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Function to get Gemini response
export const getGeminiResponse = async (message) => {
  try {
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: "Hello" }] },
        {
          role: "model",
          parts: [{ text: "Great to meet you. What would you like to know?" }],
        },
      ],
    });

    const result = await chat.sendMessage(message);
    return result.response.text(); // Return the response text
  } catch (error) {
    console.error("Error fetching Gemini response:", error);
    throw error;
  }
};
