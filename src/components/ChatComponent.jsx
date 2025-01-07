import { useState, useRef, useEffect } from "react";
import { Send, X } from "lucide-react";
import { getMistralResponse } from "../services/mistralService";
import { getGeminiResponse } from "../services/geminiService";
import DOMPurify from "dompurify";
import Logo from "../assets/logo.png";
import MistralLogo from "../assets/mistralLogo.svg";
import GeminiLogo from "../assets/geminiLogo.svg";

const ChatComponent = () => {
  const [userMessage, setUserMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modelType, setModelType] = useState("mistral");
  const chatContainerRef = useRef(null);
  const typingEffectRef = useRef(null);
  const inputRef = useRef(null); // Reference for the input field

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
    }, 1); // Reduced delay to 1ms for faster typing
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

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus(); // Focus the input when typing is done
    }
  }, [isLoading]); // Trigger when isLoading state changes

  const renderMessageContent = (content, isAi) => {
    // Check if the content is HTML
    if (content.startsWith("<") && content.endsWith(">")) {
      return (
        <div className="rounded-lg overflow-x-auto">
          <div
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
          />
        </div>
      );
    }

    // Render plain text content in a bash-like format
    return (
      <pre
        className={`whitespace-pre-wrap break-words ${
          isAi
            ? "bg-gray-800 text-white rounded-lg shadow-md p-4"
            : "bg-gray-300 text-black rounded-lg shadow-md p-4"
        }`}
        style={{
          fontFamily: "Cantarell, serif", // Monospace for bash-like feel
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
      } else if (event.key === "Enter" && event.shiftKey) {
        return;
      }
    }
  };

  return (
    <div className="h-full flex flex-col text-white py-6">
      {/* Header */}
      <header className="relative -mt-10 z-10 w-full px-6 text-center sm:text-start flex flex-col sm:flex-row items-center space-x-6 bg-opacity-90 p-4 rounded-lg">
        <img
          className="h-16 w-16 md:h-24 md:w-24 rounded-full"
          src={Logo}
          alt="ChatMorph Logo"
        />
        <div>
          <h1 className="sm:text-5xl text-2xl font-bold tracking-wide text-black">
            ChatMorph
          </h1>
          <h2 className="text-xs sm:text-lg md:text-base font-semibold text-gray-200 mt-2">
            Connect with top AI models and explore endless possibilities. Ask,
            share, or chat with AI personalities tailored to your needs.
          </h2>
        </div>
      </header>

      {/* Chat Messages Container */}
      <div
        className="max-h-2/3 flex-1 overflow-auto mx-6 p-4 md:p-6 rounded-lg bg-white/50 backdrop-blur-md text-white space-y-4 shadow-lg scrollbar-hide"
        ref={chatContainerRef}
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
              {/* Title Bar */}
              <div
                className={`w-max px-3 py-1 rounded-full text-sm ${
                  message.type === "user"
                    ? "bg-gray-700 text-white"
                    : "bg-white text-white"
                }`}
              >
                {message.type === "user" ? (
                  "Me"
                ) : message.model === "gemini" ? (
                  <img src={GeminiLogo} className="w-6 h-6" alt="" />
                ) : (
                  <img src={MistralLogo} className="w-6 h-6" alt="" />
                )}
              </div>

              {/* Chat Bubble */}
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
            <p>
              Welcome! Choose a model to begin your conversation with ChatMorph
              and explore the possibilities.
            </p>
          </div>
        )}
      </div>

      {/* Input Section */}
      <form
        className="my-4 mx-4 p-2 bg-gray-800 rounded-lg sm:rounded-full grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] items-center"
        onSubmit={handleSubmit}
      >
        {/* AI Model Select */}
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
          </select>
        </div>

        {/* Expanded input field */}
        <textarea
          ref={inputRef}
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="px-4 py-3 bg-transparent text-gray-300 placeholder-gray-500 focus:outline-none resize-none overflow-hidden h-auto max-h-32 sm:rounded-full rounded-md"
          rows="1"
          disabled={isLoading}
        />

        {/* Send or Stop Button */}
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

      {/* Footer Section */}
      <div>
        <p className="text-center text-gray-700 text-sm">
          Designed & Developed by <br /> Mohammad Inteshar Alam • 2025
        </p>
      </div>
    </div>
  );
};

export default ChatComponent;
