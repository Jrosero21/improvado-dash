import { useState, useRef, useEffect } from 'react';

const STARTERS = [
  'Which platform has the best CPA?',
  'Why is TikTok underperforming?',
  "What's the Thursday insight?",
  'Where should we reallocate budget?',
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[#4B4D5E] animate-bounce"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function send(text) {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setMessages([...next, { role: 'assistant', content: data.content }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#6E3BFF] flex items-center justify-center shadow-xl hover:bg-[#5c2fe8] transition-all z-50 hover:scale-105"
        aria-label="Toggle AI analyst"
      >
        {open ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 2.5h14v10H9l-4 3.5V12.5H2V2.5z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
            <circle cx="6" cy="7.5" r="1" fill="white" />
            <circle cx="9" cy="7.5" r="1" fill="white" />
            <circle cx="12" cy="7.5" r="1" fill="white" />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 w-[360px] h-[500px] bg-[#111217] border border-[#1E1F28] rounded-2xl shadow-2xl flex flex-col z-40 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#1E1F28]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#6E3BFF]/20 border border-[#6E3BFF]/30 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#6E3BFF]" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-[#E8E9EF]">AI Analyst</p>
                <p className="text-[10px] text-[#4B4D5E]">Ask about your ad data</p>
              </div>
            </div>
            <button
              onClick={() => setMessages([])}
              className="text-[11px] text-[#4B4D5E] hover:text-[#9899A8] transition-colors px-2 py-1 rounded-lg hover:bg-[#1A1B24]"
            >
              Clear
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-[12px] text-[#4B4D5E] text-center py-2">Ask me anything about January 2024 performance.</p>
                <div className="flex flex-col gap-1.5">
                  {STARTERS.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="text-left text-[12px] text-[#9899A8] border border-[#1E1F28] rounded-xl px-3 py-2.5 hover:border-[#6E3BFF]/40 hover:text-[#E8E9EF] hover:bg-[#6E3BFF]/5 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed"
                  style={{
                    background: m.role === 'user' ? '#6E3BFF' : '#1A1B24',
                    color: m.role === 'user' ? 'white' : '#E8E9EF',
                    borderBottomRightRadius: m.role === 'user' ? 4 : undefined,
                    borderBottomLeftRadius: m.role === 'assistant' ? 4 : undefined,
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#1A1B24] rounded-2xl rounded-bl-sm">
                  <TypingIndicator />
                </div>
              </div>
            )}
            {error && <p className="text-[12px] text-[#FF4D6A] text-center">{error}</p>}
            <div ref={bottomRef} />
          </div>

          <div className="px-3 py-3 border-t border-[#1E1F28]">
            <div className="flex gap-2 bg-[#1A1B24] border border-[#1E1F28] rounded-xl p-1 focus-within:border-[#6E3BFF]/40 transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send(input)}
                placeholder="Ask a question..."
                className="flex-1 bg-transparent px-2 py-1.5 text-[13px] text-[#E8E9EF] placeholder-[#4B4D5E] outline-none"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="px-3 py-1.5 bg-[#6E3BFF] rounded-lg text-[13px] text-white disabled:opacity-30 hover:bg-[#5c2fe8] transition-all disabled:cursor-not-allowed"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7h12M8 3l5 4-5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
