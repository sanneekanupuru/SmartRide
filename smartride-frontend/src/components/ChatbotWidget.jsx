// src/components/ChatbotWidget.jsx
import React, { useEffect, useRef, useState } from "react";
import chatbot from "../services/chatbot";

/**
 * ChatbotWidget - scaled/cropped face to fill circle
 *
 * - Scales the remote image up so the face fills the circular avatar
 * - Uses overflow:hidden on parent circle to crop the unwanted colored rim
 * - Keeps single-line input, persisted history, typing indicator, unread dot
 */

const STORAGE_KEY = "smartride_chat_history_v4";

// Use your hosted image URL (preferably a square transparent PNG/SVG).
const BOT_LOGO_URL =
  "https://static.vecteezy.com/system/resources/previews/022/251/699/original/robot-vector-chat-bot-concept-illustration-free-vector.jpg";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(false);
  const [imgError, setImgError] = useState(false);

  const panelRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw));
      else
        setMessages([
          {
            from: "bot",
            text:
              "👋 Hi! I’m SmartRide Assistant — I can help drivers & passengers with posting rides, searching, bookings and payments. Try: 'How to post a ride' or 'How to book a ride'.",
            ts: Date.now(),
          },
        ]);
    } catch {
      setMessages([{ from: "bot", text: "👋 Hi! I’m SmartRide Assistant — how can I help?", ts: Date.now() }]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
    if (open && panelRef.current) {
      setTimeout(() => (panelRef.current.scrollTop = panelRef.current.scrollHeight), 50);
    }
  }, [messages, open]);

  const sendMessage = async (text) => {
    const t = (text || "").trim();
    if (!t) return;
    const userMsg = { from: "user", text: t, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const resp = await Promise.resolve(typeof chatbot.respond === "function" ? chatbot.respond(t) : { reply: "Assistant unavailable." });
      const reply = resp?.reply ?? "Sorry, I didn't understand that.";

      setTimeout(() => {
        setTyping(false);
        setMessages((m) => [...m, { from: "bot", text: reply, ts: Date.now() }]);
        if (!open) setUnread(true);
      }, 400);
    } catch (e) {
      setTyping(false);
      setMessages((m) => [...m, { from: "bot", text: "⚠️ Something went wrong. Try again later.", ts: Date.now() }]);
    }
  };

  const toggleOpen = () => {
    setOpen((v) => {
      if (!v) setUnread(false);
      return !v;
    });
    setTimeout(() => inputRef.current?.focus(), 140);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // BOT LOGO: parent circle crops, image scaled up so face fills circle.
  const BotLogo = ({ size = 44, alt = "Assistant logo" }) => {
    if (imgError) {
      return (
        <div
          role="img"
          aria-label="Assistant"
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: "#e6eefc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0f1724",
            fontWeight: 800,
            fontSize: Math.max(14, size / 2.5),
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.02)",
          }}
        >
          🤖
        </div>
      );
    }

    // Wrapper circle ensures cropping; image is scaled up to fit the face.
    const wrapperStyle = {
      width: size,
      height: size,
      borderRadius: "50%",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "transparent",
    };

    // scaleFactor: tune to push the face inward (increase to hide rim)
    const scaleFactor = 1.55; // increase if more cropping needed

    // position the image centered and scaled
    const imgStyle = {
      width: size * scaleFactor,
      height: size * scaleFactor,
      objectFit: "cover",
      transform: "translateY(0px)",
      display: "block",
      borderRadius: "50%",
      imageRendering: "auto",
    };

    return (
      <div style={wrapperStyle}>
        <img src={BOT_LOGO_URL} alt={alt} loading="lazy" onError={() => setImgError(true)} style={imgStyle} />
      </div>
    );
  };

  const clearHistory = () => {
    if (!window.confirm("Clear chat history?")) return;
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <>
      <style>{`@keyframes sr-float{0%{transform:translateY(0)}50%{transform:translateY(-6px)}100%{transform:translateY(0)}}`}</style>

      {/* FAB */}
      <div style={styles.fabWrap}>
        <button aria-label="Open SmartRide Assistant" title="SmartRide Assistant" onClick={toggleOpen} style={{ ...styles.fab, animation: open ? "none" : "sr-float 3.4s ease-in-out infinite" }}>
          <div style={styles.fabHalo} />
          <div style={styles.fabFace}>
            <BotLogo size={64} />
          </div>
          {unread && <span style={styles.unreadDot} aria-hidden />}
        </button>
      </div>

      {/* Panel */}
      {open && (
        <div style={styles.panelPos} role="dialog" aria-label="SmartRide Assistant">
          <div style={styles.panel}>
            <div style={styles.header}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 46, height: 46, borderRadius: "50%", overflow: "hidden" }}>
                  <BotLogo size={46} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>SmartRide Assistant</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Guided help for drivers & passengers</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={clearHistory} style={styles.iconBtn} title="Clear chat">
                  🗑
                </button>
                <button onClick={toggleOpen} style={styles.closeBtn} aria-label="Close">
                  ✕
                </button>
              </div>
            </div>

            <div ref={panelRef} style={styles.history}>
              {messages.length === 0 && <div style={{ color: "#6b7280", textAlign: "center", paddingTop: 16 }}>No messages yet — ask me anything.</div>}

              {messages.map((m) => (
                <div key={m.ts} style={m.from === "bot" ? styles.botRow : styles.userRow}>
                  {m.from === "bot" && (
                    <div style={styles.msgLogo}>
                      <BotLogo size={34} />
                    </div>
                  )}
                  <div style={m.from === "bot" ? styles.botBubble : styles.userBubble}>
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.45 }}>{m.text}</div>
                  </div>
                </div>
              ))}

              {typing && (
                <div style={styles.botRow}>
                  <div style={styles.msgLogo}>
                    <BotLogo size={34} />
                  </div>
                  <div style={styles.botBubble}>
                    <span style={styles.dot} /> <span style={{ ...styles.dot, opacity: 0.7 }} /> <span style={{ ...styles.dot, opacity: 0.45 }} />
                  </div>
                </div>
              )}
            </div>

            {/* single-line input */}
            <div style={styles.inputRow}>
              <input ref={inputRef} type="text" aria-label="Ask SmartRide Assistant" placeholder="How to post a ride · How to book a ride" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown} style={styles.input} autoComplete="off" />
              <button onClick={() => sendMessage(input)} disabled={!input.trim()} style={{ ...styles.sendBtn, opacity: input.trim() ? 1 : 0.6, cursor: input.trim() ? "pointer" : "not-allowed" }}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Styles ---------- */
const styles = {
  fabWrap: { position: "fixed", right: 22, bottom: 22, zIndex: 9999 },

  fab: {
    width: 76,
    height: 76,
    padding: 0,
    border: "none",
    background: "transparent",
    borderRadius: "50%",
    cursor: "pointer",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 18px 36px rgba(2,6,23,0.18)",
  },

  // Changed halo color away from orange to neutral bluish (professional)
  fabHalo: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: "50%",
    zIndex: 0,
    background: "radial-gradient(circle at 35% 25%, rgba(255,255,255,0.06), rgba(14,165,233,0.06) 32%, transparent 70%)",
    filter: "blur(6px)",
  },

  fabFace: {
    zIndex: 2,
    width: 64,
    height: 64,
    borderRadius: "50%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.03)",
  },

  unreadDot: { position: "absolute", top: 8, right: 8, width: 14, height: 14, borderRadius: "50%", background: "#ef4444", border: "2px solid white", zIndex: 4, boxShadow: "0 6px 14px rgba(239,68,68,0.25)" },

  panelPos: { position: "fixed", right: 22, bottom: 110, zIndex: 9999, width: 420, maxWidth: "calc(100% - 44px)" },

  panel: { width: "100%", height: 520, borderRadius: 14, overflow: "hidden", boxShadow: "0 30px 80px rgba(2,6,23,0.45)", background: "#fff", display: "flex", flexDirection: "column" },

  header: { padding: "12px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" },

  closeBtn: { border: "none", background: "transparent", cursor: "pointer", fontSize: 16, color: "#374151", padding: 6 },

  iconBtn: { border: "none", background: "transparent", cursor: "pointer", fontSize: 14, color: "#6b7280", padding: 6, borderRadius: 8 },

  history: { flex: 1, padding: 14, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", background: "#f7f8fb" },

  botRow: { display: "flex", gap: 10, alignItems: "flex-start" },
  userRow: { display: "flex", gap: 10, alignItems: "flex-start", justifyContent: "flex-end" },

  msgLogo: { width: 34, height: 34, borderRadius: "50%", overflow: "hidden", flexShrink: 0 },

  botBubble: { background: "#fff", padding: "10px 12px", borderRadius: 12, boxShadow: "0 2px 6px rgba(12,15,30,0.06)", maxWidth: "78%", fontSize: 14, color: "#111827" },

  userBubble: { background: "#0ea5e9", color: "#fff", padding: "10px 12px", borderRadius: 12, maxWidth: "78%", fontSize: 14, alignSelf: "flex-end" },

  dot: { display: "inline-block", width: 8, height: 8, borderRadius: 4, background: "#d1d5db", marginRight: 6 },

  inputRow: { padding: 12, borderTop: "1px solid #f1f5f9", display: "flex", gap: 8, alignItems: "center", background: "#fff" },

  input: { flex: 1, height: 44, borderRadius: 10, padding: "10px 14px", border: "1px solid #e6e9ef", fontSize: 14, outline: "none", color: "#111827" },

  sendBtn: { padding: "8px 14px", borderRadius: 10, background: "#0f1724", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700 },
};
