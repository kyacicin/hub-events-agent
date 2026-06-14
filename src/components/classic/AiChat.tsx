import React from "react";
import { Send, Trash2, Sparkles } from "lucide-react";
import { AppChatMessage, UserProfile } from "../../lib/classic-firebase";
import { Hub } from "../../lib/classic-data";
import { TRANSLATIONS } from "../../lib/classic-translations";
import { ShineBorder } from "./ShineBorder";

interface AiChatProps {
  chatHistory: AppChatMessage[];
  chatInput: string;
  setChatInput: (val: string) => void;
  isGenerating: boolean;
  activeHub: Hub;
  suggestionsList: string[];
  handleSendChatMessage: (presetText?: string) => void;
  handleClearChatLogs: () => void;
  currentUser: UserProfile | null;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  lang: "RU" | "KZ" | "EN";
}

export function AiChat({
  chatHistory,
  chatInput,
  setChatInput,
  isGenerating,
  activeHub,
  suggestionsList,
  handleSendChatMessage,
  handleClearChatLogs,
  currentUser,
  chatEndRef,
  lang
}: AiChatProps) {
  return (
    <ShineBorder
      borderRadius={12}
      borderWidth={1}
      duration={16}
      color={["rgba(0,98,57,0.18)", "#006239", "#72e3ad"]}
      className="h-[580px] lg:h-[840px] w-full"
    >
      <div id="ai-chat-console" className="flex h-full flex-col bg-slate-900/20 border border-slate-900 hover:border-emerald-500/25 rounded-3xl p-5 relative overflow-hidden backdrop-blur-sm shadow-2xl transition-all">
        {/* Ambient Background visualizer */}
        <div className="absolute -top-10 -right-10 h-32 w-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header branding block */}
        <div className="pb-3 border-b border-slate-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl p-[1px] flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center text-emerald-400">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
                <span>{TRANSLATIONS[lang].aiAssistantTitle}</span>
              </h2>
            </div>
          </div>

          {/* Reset History Action */}
          {currentUser && chatHistory.length > 1 && (
            <button
              onClick={handleClearChatLogs}
              className="p-1 px-2 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
              title={TRANSLATIONS[lang].clearHistoryTitle}
            >
              <Trash2 className="h-3.8 w-3.8" />
            </button>
          )}
        </div>

        {/* MESSAGE THREAD FEED (Scrollable) */}
        <div className="flex-1 overflow-y-auto my-4 pr-1 space-y-4 scroll-smooth min-h-[160px] scrollbar-thin">
          {chatHistory.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <div className={`max-w-[90%] rounded-2xl px-4 py-3.5 shadow-md ${
                m.role === "user"
                  ? "bg-emerald-600 text-slate-950 font-semibold rounded-tr-none text-[15px] md:text-base leading-7"
                  : "bg-slate-900/60 border border-slate-850 text-slate-100 rounded-tl-none whitespace-pre-wrap text-[15px] md:text-base leading-7"
              }`}>
                {m.role === "assistant" ? (
                  <div className="space-y-1">
                    {m.content.split("\n").map((line, lidx) => {
                      const trimmed = line.trim();
                      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                        return (
                          <li key={lidx} className="list-disc list-inside ml-2.5 text-slate-100 mt-1 first:mt-0 leading-7 font-sans">
                            {trimmed.substring(2)}
                          </li>
                        );
                      }
                      if (line.includes("**")) {
                        const segments = line.split("**");
                        return (
                          <p key={lidx} className="mt-1 first:mt-0 font-sans leading-7">
                            {segments.map((seg, sidx) => sidx % 2 === 1 ? <strong key={sidx} className="text-emerald-455 font-bold" style={{ color: '#34d399' }}>{seg}</strong> : seg)}
                          </p>
                        );
                      }
                      return <p key={lidx} className="mt-1 first:mt-0 font-sans leading-7">{line}</p>;
                    })}
                  </div>
                ) : (
                  <p className="font-sans">{m.content}</p>
                )}
              </div>

              <span className="text-[11px] text-slate-500 font-mono mt-1 px-1">
                {m.role === "user" ? (lang === "KZ" ? "Сіз" : lang === "EN" ? "You" : "Вы") : (lang === "KZ" ? "ЖИ" : lang === "EN" ? "AI" : "ИИ")} • {m.timestamp}
              </span>
            </div>
          ))}

          {isGenerating && (
            <div className="flex flex-col items-start gap-1">
              <div className="bg-slate-900/60 border border-slate-850 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5 shadow">
                <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce" />
              </div>
              <span className="text-[11px] text-emerald-400/70 font-mono ml-1.5">
                {lang === "KZ" ? "Ассистент жауап дайындауда..." : lang === "EN" ? "Assistant is typing..." : "Ассистент генерирует ответ..."}
              </span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* QUICK AI CHIP QUESTIONS */}
        <div className="pb-3.5 border-t border-slate-900/80 pt-3.5 shrink-0">
          <p className="text-[11px] text-slate-500 font-mono uppercase mb-2 px-1 tracking-wider leading-none">
            {lang === "KZ"
              ? `${TRANSLATIONS[lang].fastQuestionsTitle}: ${activeHub.city} қ.`
              : `${TRANSLATIONS[lang].fastQuestionsTitle} ${activeHub.city}:`}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestionsList.map((suggest, sIdx) => (
              <button
                key={sIdx}
                onClick={() => handleSendChatMessage(suggest)}
                disabled={isGenerating}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-emerald-950/20 border border-slate-850 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 truncate max-w-full text-left font-medium select-none transition-all disabled:opacity-50 cursor-pointer"
              >
                {suggest}
              </button>
            ))}
          </div>
        </div>

        {/* COMPACT CHAT FORM */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendChatMessage();
          }}
          className="pt-3 border-t border-slate-900/80 shrink-0"
        >
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder={TRANSLATIONS[lang].placeholderInputChat}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isGenerating}
              className="w-full text-[15px] bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500/40 rounded-xl px-4 py-3.5 pr-11 text-slate-100 transition-colors focus:outline-none placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-500/10 font-sans"
              required
            />

            <button
              type="submit"
              disabled={!chatInput.trim() || isGenerating}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-emerald-500 text-slate-955 hover:bg-emerald-400 hover:scale-105 active:scale-95 disabled:bg-slate-850 disabled:text-slate-600 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>

        </form>
      </div>
    </ShineBorder>
  );
}
