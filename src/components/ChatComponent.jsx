import { useState, useRef, useEffect } from "react";
import { Send, ArrowDown } from "lucide-react";


import { getMistralResponse } from "../services/mistralService";
import { getGeminiResponse } from "../services/geminiService";
// import { claudeService } from "../services/claudeService";
// import { gptService } from "../services/gptService";


// import DOMPurify from "dompurify";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";


import Logo from "../assets/logo.png";
import MistralLogo from "../assets/mistralLogo.svg";
import GeminiLogo from "../assets/geminiLogo.svg";
import GptLogo from "../assets/openaiLogo.svg";
import Check from "../assets/check.gif";

const ChatComponent = () => {
  const [userMessage, setUserMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modelType, setModelType] = useState("mistral");
  const [progress, setProgress] = useState(0);
  const [conversationContext, setConversationContext] = useState([]);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const [showToast, setShowToast] = useState(false);
  const [showScrollToBottomButton, setShowScrollToBottomButton] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userMessage.trim()) return;

    const newUserMessage = userMessage;
    setUserMessage("");

    const updatedContext = [
      ...conversationContext,
      { role: "user", content: newUserMessage }
    ];
    setConversationContext(updatedContext);

    setMessages((prev) => [
      ...prev,
      { type: "user", content: newUserMessage }
    ]);
    setMessages((prev) => [
      ...prev,
      { type: "ai", content: "Thinking...", model: modelType },
    ]);
    setIsLoading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress < 90) return prevProgress + 1;
        return prevProgress;
      });
    }, 100);

    try {
      let response;
      if (modelType === "mistral") {
        response = await getMistralResponse(updatedContext);
      } else if (modelType === "gemini") {
        response = await getGeminiResponse(updatedContext);
      } else if (modelType === "claude") {
        response = await claudeService(newUserMessage);
      }

      const updatedFullContext = [
        ...updatedContext,
        { role: "assistant", content: response || "No response received" }
      ];
      setConversationContext(updatedFullContext);

      clearInterval(interval);
      setProgress(100);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { type: "ai", content: response || "No response received", model: modelType },
      ]);
      setIsLoading(false);
    } catch (error) {
      clearInterval(interval);
      setProgress(100);
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

  const handleScroll = () => {
    const container = chatContainerRef.current;
    const atBottom =
      container.scrollHeight - container.scrollTop === container.clientHeight;

    if (!atBottom) {
      setShowScrollToBottomButton(true);
    } else {
      setShowScrollToBottomButton(false);
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      setShowScrollToBottomButton(false);
    }
  };

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener("scroll", handleScroll);
      return () => chatContainer.removeEventListener("scroll", handleScroll);
    }
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  useEffect(() => {
    const disablePullToRefresh = (evt) => {
      if (window.scrollY === 0 && evt.touches) {
        evt.preventDefault(); 
      }
    };
  
    document.addEventListener('touchstart', disablePullToRefresh, { passive: false });
    document.addEventListener('touchmove', disablePullToRefresh, { passive: false });
  
    return () => {
      document.removeEventListener('touchstart', disablePullToRefresh);
      document.removeEventListener('touchmove', disablePullToRefresh);
    };
  }, []);
  

  const renderMessageContent = (content, isAi) => {

    // Copy-to-clipboard function
    const handleCopy = (text) => {
      navigator.clipboard.writeText(text).then(() => {
        // console.log("Response copied to clipboard!");
        setShowToast(true);

        // Hide toast after 3 seconds
        setTimeout(() => setShowToast(false), 3000);
      }).catch((err) => {
        console.error("Failed to copy text:", err);
      });
    };


    return (
      <div
        className={`whitespace-pre-wrap break-words ${isAi
          ? "bg-gray-800 text-white rounded-lg shadow-md"
          : "bg-gray-300 text-black rounded-lg shadow-md p-4"
          }`}
        style={{
          fontFamily: "Cantarell, serif",
        }}
      >
        {/* AI Response Header */}
        {isAi && content !== "Thinking..." && (
          <div className="flex justify-between px-2 items-center h-8 w-full bg-gray-400 rounded-t-md rounded-tl-none shadow-lg">
            <h6 className="text-gray-800 font-semibold text-md">Response</h6>
            <button
              onClick={() => handleCopy(content)}
              className="flex items-center justify-center transition duration-300 ease-in-out hover:bg-gray-300 rounded-lg"
            >
              <img
                className="h-5 w-5"
                src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAABtElEQVR4nO2ZvytGURjHP6SQQiwMzH4W/gKDQRkoZLIZZJP3DOoNIZGdRCmTsDJJFpvFSCySlEQUBr+6ddTTrVt0znl19XzqqfeeW9+n7znf9w7PAUVRlB9SBWSBPeDYQ+0Di0ADOWQAeAI+A9QbMAXkhTbRaZt9Bq7xkCYKgAvR7A6YsCfU71ijwJnQfgVqQhlpjzVq8qxfBlyKHhnf4m3294hockgYFkWPdV+irXaHjH02oskWYTC+e1QCN1Yw1UbGhGCqjWz8FyNbasQNoyeSgEbLEaPRSkCj5YjRaCWg0XLEaLQS0Gg5YjRaCWi0HDEarV9EKyPWtknxiQyJtWjwHIJl0WPFh+CqEJyxay2x+WwvfmmMDcejjXNmWgjuiPUjsf4B7Nrp4LxjbQLPQvvWTjm9TN2/RR+BUrteDzwEnsS/A914ohC4F+Jz4l00vD4JZOIK6MIz2dgu9Yh3+UAHMGn/oCuONQv0AcUEoAQ4FWberLkiUkhdLGJRXQNLwLCHC57vqs2FmcbYTZXvOrennxPKgQXgxbOJ6DPbzB9QAQwCa45X0wf2S1j9FyYURSFdfAGHpe1Zdfn2qgAAAABJRU5ErkJggg=="
                alt="copy-icon"
              />
            </button>
          </div>
        )}

        {/* Render Markdown Content */}
        <div className="px-4 py-2 mt-0 mb-0">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || ""); // Detect language
                const codeContent = String(children).replace(/\n$/, ""); // Ensure code content is clean

                return !inline && match ? (
                  <div className="relative group">
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {codeContent}
                    </SyntaxHighlighter>
                    {/* Button to copy individual code block */}
                    <button
                      onClick={() => handleCopy(codeContent)}
                      className="absolute top-2 right-2 bg-gray-700 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      Copy Code
                    </button>
                  </div>
                ) : (
                  <code
                    className={`bg-gray-200 text-gray-800 rounded-md px-1 py-0.5 ${inline ? "text-sm" : ""
                      }`}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              table: ({ children }) => (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-700 divide-y divide-gray-700 bg-gray-500 shadow-sm rounded-lg overflow-hidden">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="px-6 py-3 text-left text-xs font-medium bg-gray-600 text-gray-300 uppercase border border-gray-700">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-6 py-4 text-sm text-gray-300 border border-gray-700">
                  {children}
                </td>
              ),
              tr: ({ children }) => (
                <tr className="hover:bg-gray-700 transition-colors duration-200 divide-x divide-gray-700">
                  {children}
                </tr>
              ),
            }}
          >
            {content}
          </ReactMarkdown>

          {showToast && (
            <div className="fixed bottom-4 right-4 bg-green-500 text-white p-2 rounded-md">
              Copied to clipboard!
            </div>
          )}
        </div>

      </div>
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

  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [userMessage]);

  return (
    <div className="h-full flex flex-col justify-between text-white py-6">

      {/* Toast */}
      {showToast && (
        <div className="fixed top-5 right-5 z-50">
          <div className="flex items-center bg-green-200 text-white text-sm font-bold px-4 py-3 rounded shadow-md border-2 border-green-600" role="alert">
            <img src={Check} className="h-6 w-6 rounded-full mr-2" alt="Check Icon" />
            <span className="text-green-800">Copied to clipboard!</span>
          </div>
        </div>
      )}


      {/* Header */}
      <header className="relative -mt-10 z-10 w-full text-center sm:text-start flex items-center justify-between bg-opacity-90 py-4 rounded-lg">

        <div className="flex flex-row items-center">
          <img
            className="h-12 w-12 md:h-24 md:w-24 rounded-full"
            src={Logo}
            alt="ChatMorph Logo"
          />
          <div className="flex flex-col"><h1 className="sm:text-3xl text-2xl font-bold tracking-wide text-white">
            ChatMorph
          </h1>
            <h2 className="hidden sm:block text-md font-semibold text-gray-400 mt-2">
              Connect with top AI models and explore endless possibilities. Ask,
              share, or chat with AI personalities tailored to your needs.
            </h2></div>
        </div>
        <button className="btn bg-transparent border-none text-lg sm:text-3xl" onClick={() => document.getElementById('my_modal_1').showModal()}>ⓘ</button>
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
            <div className="mt-6 bg-gray-800 p-4 rounded-lg space-y-2">
              <p className="text-gray-400 text-sm">Made with ❤️ by Mohammad Inteshar Alam (MrXiwlev) - 2024</p>
              <span className="text-gray-400 text-sm">
                Need help or have a complaint? Reach out to me on&nbsp;
                <a href="https://inteshar.github.io/" target="_blank" className="text-primary">
                  https://inteshar.github.io/
                </a>
              </span>
            </div>
          </div>
        </dialog>
      </header>

      {/* Chat Messages Container */}
      <div
        className="max-h-2/3 flex-1 mb-2 overflow-auto mx-6 rounded-lg text-white space-y-4 scrollbar-hide"
        ref={chatContainerRef}
        onScroll={handleScroll}
      >
        {messages.length > 0 ? (messages.map((message, index) => (
          <div
            id="message"
            key={index}
            className={`flex flex-col space-y-1 ${message.type === "user"
              ? "items-end text-right"
              : "items-start text-left"
              }`}
          >
            {/* Chat Title */}
            <div
              className={`flex items-center justify-center w-10 h-10 px-3 py-1 text-sm ${message.type === "user"
                ? "bg-gray-700 text-white rounded-r-full rounded-tl-full"
                : "bg-white text-white rounded-l-full rounded-tr-full"
                }`}
            >
              {message.type === "user" ? (
                "Me"
              ) : message.model === "gemini" ? (
                <img src={GeminiLogo} className="w-10 h-10" alt="" />
              ) : message.model === "gpt" ? (
                <img src={GptLogo} className="w-10 h-10" alt="" />
              ) : message.model === "mistral" ? (
                <img src={MistralLogo} className="w-10 h-10" alt="" />
              ) : (
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA
                ABwAAAAcCAMAAABF0y+mAAAAJFBMVEVHcEzZd1fZd1fZd1fZd1fad1jZd1
                fZd1fZd1fZd1fZd1fZd1deZDooAAAADHRSTlMA//F3mhLfyjpWsiMDGU5m
                AAABH0lEQVQokXVSWXbEIAzDuw33v28FJCnpTP3BA6+yRGvbLK39a0F9RUv
                HZ5CIazZwkm+VpCi1nZP1GpJEnq2NdabzU594N0XpzInRhq/7jvm8wsOjFf
                VmcQG4guTWZKYL8HSiA1XFHDjgHMqCpKfpNPgIXiZVVvSJ9yazOJARxBiYf
                /ZMoIUxrYGjRHs/di2nbdzDZxIb1maPriold3QlyFJCAonMd08A7/WhkN19
                PWDolSeiXU7URWPm8S3ewMCuvGpB+kigVXvWZKlgIVycF0Hjl6DIoVRCGKz
                9pE8W0QKXkgkIEmjzUDuh11TSuVkn348DLHs1Y7/kzTi+ksX8GLn0wBRrdv
                CQS949C43fstj6FhfM8Unfqqwv3gf3+/kDMJgHC0kwnjEAAAAASUVORK5CYII="
                  className="w-10 h-10" alt="" />
              )}
            </div>

            {/* Chat Message Bubble */}
            <div
              className={`border-2 border-gray-400 text-sm max-h-max max-w-full rounded-lg ${message.type === "user"
                ? "bg-gray-700 px-4 py-3 text-white shadow-md whitespace-pre-wrap break-words text-justify"
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

            {/* Progress Bar for AI Response */}
            {isLoading && message.type === "ai" && index === messages.length - 1 && (
              <div className="flex items-center justify-center space-x-2 py-2">
                <progress
                  className="progress progress-info w-56 border border-info"
                  value={progress}
                  max="100"
                ></progress>
              </div>
            )}
          </div>
        ))) : (
          <div className="flex justify-center items-center h-full w-full">
            <p className="text-gray-300 text-lg">
              Welcome! Choose a model to begin your conversation with ChatMorph
              and explore the possibilities.
            </p>
          </div>
        )}
      </div>
      {/* Scroll to Bottom Button */}
      {showScrollToBottomButton && (
        <div className="w-full flex justify-center">
          <button
            onClick={scrollToBottom}
            className="w-6 h-6 z-50 -mt-10 bg-gray-200 text-gray-800 rounded-full"
          >
            <ArrowDown />
          </button>
        </div>
      )}

      {/* Input Section */}
      <form
        className="sticky bottom-0 mx-4 -mb-3 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl shadow-xl"
        onSubmit={handleSubmit}
      >
        <div className="relative flex flex-col sm:flex-row items-center gap-2 p-2">
          {/* Model Selection */}
          <div className="w-full sm:w-32">
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
            >
              <option value="mistral" className="bg-gray-800">Mistral Lg. Latest</option>
              <option value="gemini" className="bg-gray-800">Gemini 1.5 flash</option>
              {/* <option value="claude" className="bg-gray-800">Claude</option> */}
              {/* <option value="gpt" className="bg-gray-800">GPT</option> */}
            </select>
          </div>

          {/* Input Field Container */}
          <div className="relative flex-1 w-full">
            <textarea
              ref={inputRef}
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows="1"
              disabled={isLoading}
              className="w-full bg-gray-700 text-white rounded-lg pl-4 pr-12 py-2 min-h-[40px] max-h-[200px] resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400 transition-all duration-200"
              style={{
                overflow: 'hidden',
                lineHeight: '1.5'
              }}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!userMessage.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* Character Count */}
        <div className="px-4 py-1 text-right">
          <span className="text-xs text-gray-400">
            {userMessage.length} characters |
            {userMessage.trim().split(/\s+/).filter(Boolean).length} words |
            {userMessage.trim().split(/(?<=[.!?])\s+/).filter(Boolean).length} sentences |
            {userMessage.trim().split(/\n/).filter(Boolean).length} lines
          </span>
        </div>
      </form>
    </div>
  );
};

export default ChatComponent;
