import { Mistral } from "@mistralai/mistralai";

// Mistral API Key (ensure it's kept secure)
const mistralApiKey = import.meta.env.VITE_MISTRAL_API_KEY;

// Initialize Mistral client with Mistral API key
const mistralClient = new Mistral({ apiKey: mistralApiKey });

export const getMistralResponse = async (message) => {
  try {
    const chatResponse = await mistralClient.chat.complete({
      model: "mistral-large-latest",
      messages: [
        {
          role: "system",
          content: "Provide clear, direct responses without using markdown headers (###) or asterisks for emphasis. Use natural formatting and spacing for readability."
        },
        { 
          role: "user", 
          content: message 
        }
      ],
    });

    if (chatResponse && chatResponse.choices && chatResponse.choices.length > 0) {
      return chatResponse.choices[0].message.content;
    } else {
      throw new Error("No valid response received from Mistral");
    }
  } catch (error) {
    console.error("Error fetching Mistral response:", error);
    throw error;
  }
};
