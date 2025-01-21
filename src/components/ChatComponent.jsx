import { useState, useRef, useEffect } from "react";
import { Send, X } from "lucide-react";
import { getMistralResponse } from "../services/mistralService";
import { getGeminiResponse } from "../services/geminiService";
import { gptResponse } from "../services/gptService"; // Import the GPT service
import DOMPurify from "dompurify";
import Logo from "../assets/logo.png";
import MistralLogo from "../assets/mistralLogo.svg";
import GeminiLogo from "../assets/geminiLogo.svg";
import GptLogo from "../assets/openaiLogo.svg"; // Add GPT Logo

const ChatComponent = () => {
  const [userMessage, setUserMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modelType, setModelType] = useState("mistral");
  const [progress, setProgress] = useState(0); // State to track the progress
  const chatContainerRef = useRef(null);
  const typingEffectRef = useRef(null);
  const inputRef = useRef(null); // Reference for the input field
  const [isAutoScrolling, setIsAutoScrolling] = useState(true); // Track auto-scrolling state
  const [isUserInteracting, setIsUserInteracting] = useState(false); // Track user interaction with scroll

  const handleTypingEffect = (fullText) => {
    let currentText = "";
    let index = 0;

    typingEffectRef.current = setInterval(() => {
      if (index < fullText.length) {
        currentText += fullText[index];
        index += 1;
        setMessages((prev) =>
          prev.map((msg, idx) =>
            idx === prev.length - 1 ? { ...msg, content: currentText } : msg
          )
        );
      } else {
        clearInterval(typingEffectRef.current);
        typingEffectRef.current = null;
        setIsLoading(false);
      }
    }, 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userMessage.trim()) return;

    const newUserMessage = userMessage;
    setUserMessage("");
    setMessages((prev) => [...prev, { type: "user", content: newUserMessage }]);

    setMessages((prev) => [
      ...prev,
      { type: "ai", content: "Thinking...", model: modelType, progress: 0 },
    ]);
    setIsLoading(true);

    try {
      let response;
      const interval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress < 100) {
            return prevProgress + 1;
          }
          clearInterval(interval);
          return prevProgress;
        });
      }, 100); // Update progress every 100ms

      if (modelType === "mistral") {
        response = await getMistralResponse(newUserMessage);
      } else if (modelType === "gemini") {
        response = await getGeminiResponse(newUserMessage);
      } else if (modelType === "gpt") {
        response = await gptResponse(newUserMessage); // Handle GPT response
      }

      setMessages((prev) => [
        ...prev.slice(0, -1),
        { type: "ai", content: "", model: modelType },
      ]);

      handleTypingEffect(response || "No response received");
    } catch (error) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          type: "ai",
          content: "Error fetching response",
          error: true,
          model: modelType,
        },
      ]);
      setIsLoading(false);
    }
  };

  const stopResponse = () => {
    if (typingEffectRef.current) {
      clearInterval(typingEffectRef.current);
      typingEffectRef.current = null;
      setIsLoading(false);
    }
  };

  const handleScroll = () => {
    const container = chatContainerRef.current;
    const atBottom =
      container.scrollHeight - container.scrollTop === container.clientHeight;

    if (atBottom) {
      setIsAutoScrolling(true); // Enable auto-scroll if at the bottom
    } else {
      setIsAutoScrolling(false); // Disable auto-scroll if user is scrolling up
    }

    // Check if the user is interacting (scrolling manually)
    if (container.scrollTop < container.scrollHeight - container.clientHeight) {
      setIsUserInteracting(true);
    }
  };

  useEffect(() => {
    if (chatContainerRef.current && isAutoScrolling && !isUserInteracting) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isAutoScrolling, isUserInteracting]);

  useEffect(() => {
    // Reset isUserInteracting when reaching the bottom
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      if (
        container.scrollHeight - container.scrollTop === container.clientHeight
      ) {
        setIsUserInteracting(false); // Reset interaction status when at the bottom
      }
    }
  }, [messages]);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const renderMessageContent = (content, isAi) => {
    if (content.startsWith("<") && content.endsWith(">")) {
      return (
        <div className="rounded-lg overflow-x-auto">
          <div
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
          />
        </div>
      );
    }

    return (
      <pre
        className={`whitespace-pre-wrap break-words ${isAi
          ? "bg-gray-800 text-white rounded-lg shadow-md p-4"
          : "bg-gray-300 text-black rounded-lg shadow-md p-4"
          }`}
        style={{
          fontFamily: "Cantarell, serif",
        }}
      >
        {content}
      </pre>
    );
  };

  const handleKeyDown = (event) => {
    const isLargeScreen = window.innerWidth >= 640;

    if (isLargeScreen) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSubmit(event);
      }
    }
  };

  return (
    <div className="h-full flex flex-col text-white py-6">
      {/* Header */}
      <header className="relative -mt-10 z-10 w-full px-6 text-center sm:text-start flex items-center justify-between bg-opacity-90 p-4 rounded-lg">
        <img
          className="h-12 w-12 md:h-24 md:w-24 rounded-full"
          src={Logo}
          alt="ChatMorph Logo"
        />
        <div>
          <h1 className="sm:text-4xl text-2xl font-bold tracking-wide text-white">
            ChatMorph
          </h1>
          <h2 className="hidden sm:block text-lg font-semibold text-gray-400 mt-2">
            Connect with top AI models and explore endless possibilities. Ask,
            share, or chat with AI personalities tailored to your needs.
          </h2>
        </div>
        <button className="btn bg-transparent border-none text-lg" onClick={() => document.getElementById('my_modal_1').showModal()}>ⓘ</button>
        <dialog id="my_modal_1" className="modal text-start">
          <div className="modal-box">
            <div className="flex justify-between items-center"><h3 className="font-bold text-lg text-primary">About ChatMorph</h3><form method="dialog">
              <button className="btn">Close</button>
            </form></div>
            <p className="py-4 text-base text-gray-400">
              ChatMorph is an interactive AI chat application that connects users with top-tier AI models, including Mistral and Gemini. It allows users to ask questions, share thoughts, and explore endless possibilities in conversations with tailored AI personalities. With a seamless and engaging interface, ChatMorph provides real-time responses, accompanied by progress feedback, ensuring an intuitive and responsive user experience. Whether for casual chats or deep discussions, ChatMorph brings the power of advanced AI to your fingertips.
            </p>

            <h4 className="font-semibold text-md text-secondary mt-6">Instructions for Using ChatMorph</h4>

            <ol className="list-decimal pl-6 space-y-4 text-gray-400 text-sm">
              <li>
                <strong>Start a Conversation:</strong> Open the ChatMorph app, and you’ll be greeted with a welcoming message. To begin, type your message in the text input field at the bottom of the screen.
              </li>
              <li>
                <strong>Choose an AI Model:</strong> Select your preferred AI model from the dropdown menu next to the text input. Available models include:
                <ul className="ml-6 list-disc text-gray-400 text-sm">
                  <li><strong>Mistral</strong></li>
                  <li><strong>Gemini</strong></li>
                </ul>
              </li>
              <li>
                <strong>Send Your Message:</strong> Once you’ve typed your message, press the <strong>Send</strong> button or hit <strong>Enter</strong> on your keyboard (on desktop). The AI model you selected will begin processing your message.
              </li>
              <li>
                <strong>Wait for the AI Response:</strong> As the AI processes your message, a progress bar will appear, indicating how much of the response is ready. This bar will fill up over time until the AI responds. If you need to cancel or stop the response, click the <strong>Stop</strong> button (red "X" icon) while the AI is typing.
              </li>
              <li>
                <strong>View the Response:</strong> When the AI response is ready, the message will appear in the chat, displayed in a clean, easy-to-read format. The AI's response will be shown below your message in a separate bubble.
              </li>
              <li>
                <strong>Continue the Conversation:</strong> To keep the conversation going, simply type a new message and repeat the process. You can switch between AI models anytime by selecting a different model from the dropdown menu.
              </li>
              <li>
                <strong>Scroll through Messages:</strong> Scroll up and down through your previous messages. The app will auto-scroll to the most recent messages, but you can manually scroll if needed. If you scroll up, the auto-scroll feature will pause until you reach the bottom again.
              </li>
              <li>
                <strong>Close the App or Reset:</strong> To exit the conversation or reset the chat, simply close the app or refresh the page. All previous chats will be cleared, and you can start fresh.
              </li>
            </ol>

            <p className="mt-6 text-gray-400 text-base">
              Enjoy your conversations with ChatMorph and explore endless possibilities with AI!
            </p>
          </div>
        </dialog>
      </header>

      {/* Chat Messages Container */}
      <div
        className="max-h-2/3 flex-1 overflow-auto mx-6 p-4 md:p-6 rounded-lg bg-white/50 backdrop-blur-md text-white space-y-4 shadow-lg scrollbar-hide"
        ref={chatContainerRef}
        onScroll={handleScroll} // Add scroll event listener
      >
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex flex-col space-y-1 ${message.type === "user"
                ? "items-end text-right"
                : "items-start text-left"
                }`}
            >
              {/* Chat Title */}
              <div
                className={`flex items-center justify-center w-10 h-10 px-3 py-1 rounded-full text-sm ${message.type === "user"
                  ? "bg-gray-700 text-white"
                  : "bg-white text-white"
                  }`}
              >
                {message.type === "user" ? (
                  "Me"
                ) : message.model === "gemini" ? (
                  <img src={GeminiLogo} className="w-10 h-10" alt="" />
                ) : message.model === "gpt" ? (
                  <img src={GptLogo} className="w-10 h-10" alt="" />
                ) : (
                  <img src={MistralLogo} className="w-10 h-10" alt="" />
                )}
              </div>

              {/* Chat Message Bubble */}
              <div
                className={`text-sm max-w-full rounded-lg ${message.type === "user"
                  ? "bg-gray-500 px-4 py-3 text-white shadow-md whitespace-pre-wrap break-words text-justify"
                  : message.error
                    ? "bg-red-400 text-red-400 w-max"
                    : "bg-gray-800 text-white w-max"
                  }`}
              >
                {message.type === "user"
                  ? message.content
                  : renderMessageContent(
                    message.content,
                    message.type === "ai"
                  )}
              </div>

              {/* Progress Bar for Thinking */}
              {message.content === "Thinking..." && (
                <div className="w-full bg-gray-300 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex justify-center items-center h-full w-full">
            <p className="text-gray-600 text-lg">
              Welcome! Choose a model to begin your conversation with ChatMorph
              and explore the possibilities.
            </p>
          </div>
        )}
      </div>

      {/* Input Section */}
      <form
        className="h-max my-4 mx-4 p-2 bg-gray-600 rounded-lg sm:rounded-full grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] items-center"
        onSubmit={handleSubmit}
      >
        <div className="sm:w-24 flex items-center justify-center bg-gray-900 sm:rounded-full rounded-lg">
          <select
            value={modelType}
            onChange={(e) => setModelType(e.target.value)}
            className="text-sm bg-transparent text-white px-1 py-3 sm:rounded-full rounded-lg shadow-md text-lg w-full cursor-pointer transition ease-in-out duration-300"
          >
            <option value="mistral" className="bg-gray-800">
              Mistral
            </option>
            <option value="gemini" className="bg-gray-800">
              Gemini
            </option>
            {/* <option value="gpt" className="bg-gray-800">
              GPT
            </option> */}
          </select>
        </div>

        <textarea
          ref={inputRef}
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="h-max px-4 py-3 bg-transparent text-gray-100 placeholder-gray-400 focus:outline-none resize-none overflow-hidden h-auto max-h-32 sm:rounded-full rounded-md"
          rows="1"
          disabled={isLoading}
        />

        <div className="flex justify-center">
          {isLoading ? (
            <button
              type="button"
              onClick={stopResponse}
              className="w-full flex items-center justify-center bg-red-600 rounded-full p-3 hover:bg-red-700 transition"
            >
              <X className="text-white w-5 h-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!userMessage.trim()}
              className="w-full flex items-center justify-center bg-purple-600 rounded-full p-3 hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="text-white w-5 h-5" />
            </button>
          )}
        </div>
      </form>

      <div>
        <p className="text-center text-gray-400 text-sm">
          Designed & Developed by <br /> Mohammad Inteshar Alam • 2025
        </p>
      </div>
    </div>
  );
};

export default ChatComponent;
