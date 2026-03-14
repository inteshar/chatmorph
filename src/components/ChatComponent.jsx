import { useState, useRef, useEffect } from "react";
import { Send, ArrowDown, WifiOff, Moon, Sun, Info, Copy, Check, X } from "lucide-react";
import { getMistralResponse } from "../services/mistralService";
import { getGeminiResponse } from "../services/geminiService";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import Cookies from "js-cookie";
import Logo from "../assets/logo.png";
import MistralLogo from "../assets/mistralLogo.svg";
import GeminiLogo from "../assets/geminiLogo.svg";
import GptLogo from "../assets/openaiLogo.svg";

const MODEL_OPTIONS = [
  { id: "mistral", label: "Mistral", sublabel: "Large Latest", logo: MistralLogo, color: "#FF7000" },
  { id: "gemini", label: "Gemini", sublabel: "1.5 Flash", logo: GeminiLogo, color: "#4285F4" },
];

const ChatComponent = () => {
  const [userMessage, setUserMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modelType, setModelType] = useState("mistral");
  const [progress, setProgress] = useState(0);
  const [conversationContext, setConversationContext] = useState([]);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const [copiedId, setCopiedId] = useState(null);
  const [showScrollToBottomButton, setShowScrollToBottomButton] = useState(false);
  const [theme, setTheme] = useState("light");
  const [networkStatus, setNetworkStatus] = useState("checking");
  const [showInfo, setShowInfo] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    Cookies.set("theme", newTheme, { expires: 30, SameSite: "Lax" });
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  useEffect(() => {
    const savedTheme = Cookies.get("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!userMessage.trim() || isLoading) return;

    const newUserMessage = userMessage;
    setUserMessage("");

    const updatedContext = [...conversationContext, { role: "user", content: newUserMessage }];
    setConversationContext(updatedContext);
    setMessages((prev) => [
      ...prev,
      { type: "user", content: newUserMessage },
      { type: "ai", content: "thinking", model: modelType },
    ]);
    setIsLoading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((p) => (p < 88 ? p + 1.2 : p));
    }, 80);

    try {
      let response;
      if (modelType === "mistral") response = await getMistralResponse(updatedContext);
      else if (modelType === "gemini") response = await getGeminiResponse(updatedContext);

      const updatedFullContext = [
        ...updatedContext,
        { role: "assistant", content: response || "No response received" },
      ];
      setConversationContext(updatedFullContext);
      clearInterval(interval);
      setProgress(100);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { type: "ai", content: response || "No response received", model: modelType },
      ]);
    } catch {
      clearInterval(interval);
      setProgress(100);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { type: "ai", content: "Something went wrong. Please try again.", error: true, model: modelType },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleScroll = () => {
    const c = chatContainerRef.current;
    setShowScrollToBottomButton(c.scrollHeight - c.scrollTop > c.clientHeight + 40);
  };

  const scrollToBottom = () => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: "smooth" });
    setShowScrollToBottomButton(false);
  };

  useEffect(() => {
    const c = chatContainerRef.current;
    if (c) { c.addEventListener("scroll", handleScroll); return () => c.removeEventListener("scroll", handleScroll); }
  }, []);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isLoading) inputRef.current?.focus();
  }, [isLoading]);

  useEffect(() => {
    const ta = inputRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`; }
  }, [userMessage]);

  const checkNetworkStatus = async () => {
    if (!navigator.onLine) { setNetworkStatus("offline"); return; }
    try {
      await fetch("https://www.google.com/generate_204", { mode: "no-cors" });
      setNetworkStatus("online");
    } catch { setNetworkStatus("offline"); }
  };

  useEffect(() => {
    checkNetworkStatus();
    const id = setInterval(checkNetworkStatus, 5000);
    return () => clearInterval(id);
  }, []);

  const handleKeyDown = (e) => {
    if (window.innerWidth >= 640 && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const currentModel = MODEL_OPTIONS.find((m) => m.id === modelType);

  const isDark = theme === "dark";

  const renderMessageContent = (content, isAi, msgIndex) => {
    if (content === "thinking") {
      return (
        <div className="flex items-center gap-2 px-1 py-1">
          <span style={{ animationDelay: "0ms" }} className="dot-pulse" />
          <span style={{ animationDelay: "150ms" }} className="dot-pulse" />
          <span style={{ animationDelay: "300ms" }} className="dot-pulse" />
        </div>
      );
    }

    return (
      <div>
        <div className="flex justify-between items-center mb-2 gap-4">
          <span style={{ fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.5 }}>
            {currentModel?.label} · Response
          </span>
          <button
            onClick={() => handleCopy(content, `msg-${msgIndex}`)}
            title="Copy response"
            style={{
              display: "flex", alignItems: "center", gap: "4px",
              fontSize: "0.7rem", opacity: 0.6, transition: "opacity 0.2s",
              background: "none", border: "none", cursor: "pointer", color: "inherit",
              padding: "2px 6px", borderRadius: "4px",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "1"}
            onMouseLeave={e => e.currentTarget.style.opacity = "0.6"}
          >
            {copiedId === `msg-${msgIndex}` ? <Check size={12} /> : <Copy size={12} />}
            {copiedId === `msg-${msgIndex}` ? "Copied" : "Copy"}
          </button>
        </div>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              const codeContent = String(children).replace(/\n$/, "");
              return !inline && match ? (
                <div style={{ position: "relative", borderRadius: "8px", overflow: "hidden", margin: "12px 0" }} className="group">
                  <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" customStyle={{ borderRadius: "8px", fontSize: "0.82rem", margin: 0 }} {...props}>
                    {codeContent}
                  </SyntaxHighlighter>
                  <button
                    onClick={() => handleCopy(codeContent, `code-${msgIndex}-${codeContent.slice(0, 10)}`)}
                    style={{
                      position: "absolute", top: "8px", right: "8px",
                      background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer",
                      color: "#fff", fontSize: "0.7rem", padding: "3px 8px", borderRadius: "4px",
                    }}
                  >
                    {copiedId === `code-${msgIndex}-${codeContent.slice(0, 10)}` ? "Copied!" : "Copy"}
                  </button>
                </div>
              ) : (
                <code style={{ background: "rgba(128,128,128,0.15)", borderRadius: "4px", padding: "1px 5px", fontSize: "0.88em" }} {...props}>
                  {children}
                </code>
              );
            },
            table: ({ children }) => (
              <div style={{ overflowX: "auto", margin: "12px 0", borderRadius: "8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>{children}</table>
              </div>
            ),
            th: ({ children }) => (
              <th style={{ padding: "8px 14px", textAlign: "left", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", borderBottom: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)" }}>
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td style={{ padding: "8px 14px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)" }}>
                {children}
              </td>
            ),
            p: ({ children }) => <p style={{ marginBottom: "0.75em", lineHeight: "1.7" }}>{children}</p>,
            ul: ({ children }) => <ul style={{ paddingLeft: "1.4em", marginBottom: "0.75em", lineHeight: "1.7" }}>{children}</ul>,
            ol: ({ children }) => <ol style={{ paddingLeft: "1.4em", marginBottom: "0.75em", lineHeight: "1.7" }}>{children}</ol>,
            h1: ({ children }) => <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5em", marginTop: "1em" }}>{children}</h1>,
            h2: ({ children }) => <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.4em", marginTop: "0.9em" }}>{children}</h2>,
            h3: ({ children }) => <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.3em", marginTop: "0.8em" }}>{children}</h3>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  /* ─── Design tokens ─── */
  const tokens = {
    bg: isDark ? "#0f1117" : "#f5f4f0",
    surface: isDark ? "#1a1d27" : "#ffffff",
    surfaceHover: isDark ? "#21253a" : "#f0efe9",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    text: isDark ? "#e8e6e0" : "#1a1814",
    muted: isDark ? "rgba(232,230,224,0.45)" : "rgba(26,24,20,0.45)",
    accent: "#e8643a",
    accentMuted: isDark ? "rgba(232,100,58,0.15)" : "rgba(232,100,58,0.08)",
    inputBg: isDark ? "#12141e" : "#f0efe9",
    userBubble: isDark ? "#1e2130" : "#1a1814",
    userText: "#ffffff",
    aiBubble: isDark ? "#1a1d27" : "#ffffff",
    aiText: isDark ? "#e8e6e0" : "#1a1814",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; }

        .chat-root {
          font-family: 'DM Sans', sans-serif;
          background: ${tokens.bg};
          color: ${tokens.text};
          height: 100dvh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: background 0.3s, color 0.3s;
        }

        /* scrollbar */
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: ${tokens.border}; border-radius: 2px; }

        /* thinking dots */
        .dot-pulse {
          display: inline-block;
          width: 7px; height: 7px;
          border-radius: 50%;
          background: ${tokens.accent};
          animation: pulse-dot 1.2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.7); }
          40% { opacity: 1; transform: scale(1); }
        }

        /* progress bar */
        .progress-track {
          height: 2px;
          background: ${tokens.border};
          border-radius: 1px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, ${tokens.accent}, #f5a623);
          border-radius: 1px;
          transition: width 0.15s ease;
        }

        /* fade-in for messages */
        .msg-enter {
          animation: msgIn 0.28s ease both;
        }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* model dropdown */
        .model-dropdown {
          position: absolute;
          bottom: calc(100% + 6px);
          left: 0;
          min-width: 200px;
          background: ${tokens.surface};
          border: 1px solid ${tokens.border};
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          z-index: 100;
          animation: dropIn 0.16s ease both;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .model-opt {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          cursor: pointer;
          transition: background 0.15s;
          font-size: 0.875rem;
        }
        .model-opt:hover { background: ${tokens.surfaceHover}; }
        .model-opt.active { background: ${tokens.accentMuted}; }

        /* info modal backdrop */
        .modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        .modal-box {
          background: ${tokens.surface};
          border: 1px solid ${tokens.border};
          border-radius: 20px;
          max-width: 520px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          padding: 28px;
          animation: slideUp 0.25s ease;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 100px;
          border: 1px solid ${tokens.border};
          background: ${tokens.surface};
          color: ${tokens.text};
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          white-space: nowrap;
        }
        .pill-btn:hover { background: ${tokens.surfaceHover}; border-color: ${tokens.accent}; }

        .send-btn {
          width: 40px; height: 40px;
          border-radius: 12px;
          border: none;
          background: ${tokens.accent};
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
          flex-shrink: 0;
        }
        .send-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .send-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        textarea.chat-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          color: ${tokens.text};
          line-height: 1.5;
          min-height: 24px;
          max-height: 160px;
          overflow-y: auto;
          padding: 0;
        }
        textarea.chat-input::placeholder { color: ${tokens.muted}; }

        .icon-btn {
          width: 36px; height: 36px;
          border-radius: 10px;
          border: 1px solid ${tokens.border};
          background: ${tokens.surface};
          color: ${tokens.text};
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          flex-shrink: 0;
        }
        .icon-btn:hover { background: ${tokens.surfaceHover}; border-color: ${tokens.muted}; }
      `}</style>

      <div className="chat-root">

        {/* ── HEADER ── */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: `1px solid ${tokens.border}`,
          background: tokens.bg,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img src={Logo} alt="ChatMorph" style={{ width: 38, height: 38, borderRadius: "10px" }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: "1.05rem", letterSpacing: "-0.02em" }}>ChatMorph</div>
              <div style={{ fontSize: "0.72rem", color: tokens.muted, marginTop: "1px" }}>
                Multi-model AI chat
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Network indicator */}
            <div style={{
              display: "flex", alignItems: "center", gap: "5px",
              fontSize: "0.72rem", color: networkStatus === "online" ? "#4caf6e" : tokens.muted,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: networkStatus === "online" ? "#4caf6e" : networkStatus === "offline" ? "#e8643a" : tokens.muted,
              }} />
              <span style={{ display: "none" }} className="sm-show">{networkStatus}</span>
            </div>

            <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button className="icon-btn" onClick={() => setShowInfo(true)} title="About">
              <Info size={15} />
            </button>
          </div>
        </header>

        {/* ── MESSAGES ── */}
        <div
          ref={chatContainerRef}
          className="chat-scroll"
          style={{ flex: 1, overflowY: "auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: "16px" }}
        >
          {messages.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", paddingBottom: "40px" }}>
              <img src={Logo} alt="ChatMorph" style={{ width: 56, height: 56, borderRadius: "16px", opacity: 0.6 }} />
              <p style={{ color: tokens.muted, fontSize: "0.9rem", textAlign: "center", maxWidth: "320px", lineHeight: 1.6 }}>
                Choose a model below and start your conversation
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                {["Explain quantum computing", "Write a React hook", "Summarize the news"].map((s) => (
                  <button key={s} className="pill-btn" onClick={() => { setUserMessage(s); inputRef.current?.focus(); }}>{s}</button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className="msg-enter" style={{ display: "flex", flexDirection: "column", alignItems: msg.type === "user" ? "flex-end" : "flex-start" }}>

                {/* avatar row */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
                  {msg.type === "ai" && (
                    <>
                      {(() => {
                        const m = MODEL_OPTIONS.find(o => o.id === msg.model);
                        return m ? (
                          <img src={m.logo} alt={m.label} style={{ width: 18, height: 18, borderRadius: "4px" }} />
                        ) : null;
                      })()}
                      <span style={{ fontSize: "0.72rem", color: tokens.muted, fontWeight: 500 }}>
                        {MODEL_OPTIONS.find(o => o.id === msg.model)?.label ?? msg.model}
                      </span>
                    </>
                  )}
                  {msg.type === "user" && (
                    <span style={{ fontSize: "0.72rem", color: tokens.muted, fontWeight: 500 }}>You</span>
                  )}
                </div>

                {/* bubble */}
                <div style={{
                  maxWidth: "min(680px, 88%)",
                  padding: msg.content === "thinking" ? "10px 14px" : "14px 18px",
                  borderRadius: msg.type === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.type === "user" ? tokens.userBubble : tokens.aiBubble,
                  color: msg.type === "user" ? tokens.userText : tokens.aiText,
                  border: `1px solid ${msg.type === "user" ? "transparent" : tokens.border}`,
                  boxShadow: msg.type === "ai" ? `0 1px 4px rgba(0,0,0,0.06)` : "none",
                  fontSize: "0.9rem",
                  lineHeight: "1.65",
                  transition: "background 0.3s",
                }}>
                  {msg.type === "user"
                    ? <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.content}</span>
                    : renderMessageContent(msg.content, true, i)
                  }
                </div>

                {/* progress bar under last AI message while loading */}
                {isLoading && msg.type === "ai" && i === messages.length - 1 && (
                  <div style={{ width: "min(680px, 88%)", marginTop: "6px" }}>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* scroll to bottom */}
        {showScrollToBottomButton && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "-8px", position: "relative", zIndex: 10 }}>
            <button
              onClick={scrollToBottom}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "5px 12px", borderRadius: "100px",
                background: tokens.surface, border: `1px solid ${tokens.border}`,
                color: tokens.text, fontSize: "0.75rem", cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              }}
            >
              <ArrowDown size={12} /> Scroll to bottom
            </button>
          </div>
        )}

        {/* ── INPUT AREA ── */}
        {networkStatus === "offline" ? (
          <div style={{
            margin: "12px 20px 16px",
            padding: "12px 18px",
            borderRadius: "14px",
            background: isDark ? "rgba(232,100,58,0.12)" : "rgba(232,100,58,0.08)",
            border: `1px solid rgba(232,100,58,0.3)`,
            display: "flex", alignItems: "center", gap: "10px",
            fontSize: "0.85rem", color: tokens.accent,
          }}>
            <WifiOff size={16} />
            You're offline. Please check your internet connection.
          </div>
        ) : (
          <div style={{
            margin: "8px 20px 16px",
            background: tokens.inputBg,
            border: `1px solid ${tokens.border}`,
            borderRadius: "16px",
            padding: "12px 14px 10px",
            transition: "border-color 0.2s",
          }}
            onFocus={() => {}}
          >
            {/* model + input row */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>

              {/* model selector */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <button
                  className="pill-btn"
                  onClick={() => setModelDropdownOpen(o => !o)}
                  style={{ paddingRight: "10px" }}
                >
                  {currentModel && <img src={currentModel.logo} alt={currentModel.label} style={{ width: 14, height: 14 }} />}
                  {currentModel?.label}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5 }}>
                    <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {modelDropdownOpen && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setModelDropdownOpen(false)} />
                    <div className="model-dropdown">
                      {MODEL_OPTIONS.map((m) => (
                        <div
                          key={m.id}
                          className={`model-opt ${modelType === m.id ? "active" : ""}`}
                          onClick={() => { setModelType(m.id); setModelDropdownOpen(false); }}
                        >
                          <img src={m.logo} alt={m.label} style={{ width: 18, height: 18 }} />
                          <div>
                            <div style={{ fontWeight: 500 }}>{m.label}</div>
                            <div style={{ fontSize: "0.72rem", opacity: 0.5 }}>{m.sublabel}</div>
                          </div>
                          {modelType === m.id && <Check size={14} style={{ marginLeft: "auto", color: tokens.accent }} />}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* text input */}
              <textarea
                ref={inputRef}
                className="chat-input"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message ChatMorph…"
                rows={1}
                disabled={isLoading}
              />

              {/* send */}
              <button className="send-btn" onClick={handleSubmit} disabled={!userMessage.trim() || isLoading}>
                <Send size={16} />
              </button>
            </div>

            {/* stats row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", paddingTop: "8px", borderTop: `1px solid ${tokens.border}` }}>
              <span style={{ fontSize: "0.7rem", color: tokens.muted }}>
                {window.innerWidth >= 640 ? "Enter to send · Shift+Enter for new line" : "Tap send to submit"}
              </span>
              <span style={{ fontSize: "0.7rem", color: tokens.muted, fontFamily: "'DM Mono', monospace" }}>
                {userMessage.length}c · {userMessage.trim() ? userMessage.trim().split(/\s+/).length : 0}w
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── INFO MODAL ── */}
      {showInfo && (
        <div className="modal-backdrop" onClick={() => setShowInfo(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <img src={Logo} alt="ChatMorph" style={{ width: 36, height: 36, borderRadius: "10px" }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1rem" }}>ChatMorph</div>
                  <div style={{ fontSize: "0.72rem", color: tokens.muted }}>Multi-model AI chat</div>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setShowInfo(false)}><X size={15} /></button>
            </div>

            <p style={{ fontSize: "0.875rem", color: tokens.muted, lineHeight: 1.7, marginBottom: "20px" }}>
              ChatMorph connects you with top-tier AI models including Mistral and Gemini. Ask questions, explore ideas, and have engaging conversations with AI models tailored to your needs.
            </p>

            <div style={{ fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: tokens.muted, marginBottom: "12px" }}>
              How to use
            </div>
            {[
              ["Choose a model", "Select Mistral or Gemini from the model picker in the input area."],
              ["Type your message", "Enter your question or prompt. Press Enter to send (desktop) or tap the send button."],
              ["Explore responses", "AI responses support rich Markdown, code highlighting, and tables."],
              ["Continue chatting", "Your conversation history is maintained across messages for context."],
            ].map(([title, desc]) => (
              <div key={title} style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: tokens.accent, flexShrink: 0, marginTop: "7px" }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "2px" }}>{title}</div>
                  <div style={{ fontSize: "0.82rem", color: tokens.muted, lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: "20px", padding: "14px", borderRadius: "10px", background: tokens.accentMuted, border: `1px solid rgba(232,100,58,0.15)`, fontSize: "0.8rem", color: tokens.muted }}>
              Made with ❤️ by Mohammad Inteshar Alam (MrXiwlev) · 2024 ·{" "}
              <a href="https://inteshar.github.io/" target="_blank" rel="noreferrer" style={{ color: tokens.accent }}>
                inteshar.github.io
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatComponent;