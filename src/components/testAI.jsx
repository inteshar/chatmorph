import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Allow API requests from the browser (unsafe)
});

async function generateImage() {
  try {
    const completion  = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "developer", content: "You are a helpful assistant." },
        {
            role: "user",
            content: "Write a haiku about recursion in programming.",
        },
    ],
    store: true,
    });

    console.log(completion.choices[0].message);
  } catch (error) {
    console.error('Error generating:', error);
  }
}

export default generateImage();
