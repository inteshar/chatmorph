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
    }, 0.1); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userMessage.trim()) return;

    const newUserMessage = userMessage;
    setUserMessage("");
    setMessages((prev) => [...prev, { type: "user", content: newUserMessage }]);

    setMessages((prev) => [
      ...prev,
      { type: "ai", content: "Thinking...", model: modelType },
    ]);
    setIsLoading(true);

    try {
      let response;
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

  // Detect if the user is scrolling up or down
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
        className={`whitespace-pre-wrap break-words ${
          isAi
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
      <header className="relative -mt-10 z-10 w-full px-6 text-center sm:text-start flex items-center space-x-6 bg-opacity-90 p-4 rounded-lg">
        <img
          className="h-10 w-10 md:h-24 md:w-24 rounded-full"
          src={Logo}
          alt="ChatMorph Logo"
        />
        <div>
          <h1 className="sm:text-5xl text-2xl font-bold tracking-wide text-black">
            ChatMorph
          </h1>
          <h2 className="hidden sm:block text-lg font-semibold text-gray-600 mt-2">
            Connect with top AI models and explore endless possibilities. Ask,
            share, or chat with AI personalities tailored to your needs.
          </h2>
        </div>
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
              className={`flex flex-col space-y-1 ${
                message.type === "user"
                  ? "items-end text-right"
                  : "items-start text-left"
              }`}
            >
              {/* Chat Title */}
              <div
                className={`flex items-center justify-center w-10 h-10 px-3 py-1 rounded-full text-sm ${
                  message.type === "user"
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
                className={`text-sm max-w-full rounded-lg ${
                  message.type === "user"
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
        className="h-max my-4 mx-4 p-2 bg-gray-800 rounded-lg sm:rounded-full grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] items-center"
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
            <option value="gpt" className="bg-gray-800">
              GPT
            </option>
          </select>
        </div>

        <textarea
          ref={inputRef}
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="h-max px-4 py-3 bg-transparent text-gray-300 placeholder-gray-500 focus:outline-none resize-none overflow-hidden h-auto max-h-32 sm:rounded-full rounded-md"
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
        <p className="text-center text-gray-700 text-sm">
          Designed & Developed by <br /> Mohammad Inteshar Alam • 2025
        </p>
      </div>
    </div>
  );
};

export default ChatComponent;
