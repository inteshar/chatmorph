import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


export const getGeminiResponse = async (conversationContext) => {
  try {
    
    const history = conversationContext.map(message => ({
      role: message.role === 'user' ? 'user' : 'model',
      parts: [{ text: message.content }]
    }));

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(conversationContext[conversationContext.length - 1].content);
    return result.response.text(); 
  } catch (error) {
    console.error("Error fetching Gemini response:", error);
    throw error;
  }
};