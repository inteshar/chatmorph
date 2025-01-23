import { Mistral } from "@mistralai/mistralai";

const mistralApiKey = import.meta.env.VITE_MISTRAL_API_KEY;

const mistralClient = new Mistral({ apiKey: mistralApiKey });

export const getMistralResponse = async (conversationContext) => {
  try {
   
    const messages = [
      {
        role: "system",
        content: "Provide clear, direct responses using markdown headers (###) or asterisks for emphasis. Use natural formatting and spacing for readability."
      },
      
      ...conversationContext
    ];

    const chatResponse = await mistralClient.chat.complete({
      model: "mistral-large-latest",
      messages: messages,
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