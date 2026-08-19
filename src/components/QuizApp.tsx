"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { QUESTIONS, Question } from "@/data/questions";
import { STUDY_NOTES } from "@/data/studyNotes";
import { TOPICS, TOPIC_LABEL } from "@/data/topics";

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function letter(i: number) {
  return String.fromCharCode(97 + i);
}

interface Answer {
  selected: number;
  correct: boolean;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function QuizApp() {
  const [mode, setMode] = useState<"practice" | "study">("practice");
  const [examTrack, setExamTrack] = useState<"nonfdw" | "standard">("nonfdw");
  const [setFilter, setSetFilter] = useState<"all" | number>(3);
  const [topicFilter, setTopicFilter] = useState("all");
  const [order, setOrder] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [studyExpanded, setStudyExpanded] = useState<Record<string, boolean>>(
    () => {
      const init: Record<string, boolean> = {};
      TOPICS.forEach((t) => {
        if (t.key !== "all") init[t.key] = true;
      });
      return init;
    }
  );
  const [chats, setChats] = useState<Record<number, ChatMessage[]>>({});
  const [chatOpen, setChatOpen] = useState<Record<number, boolean>>({});
  const [chatLoading, setChatLoading] = useState<Record<number, boolean>>({});
  const [chatErrors, setChatErrors] = useState<Record<number, string | null>>(
    {}
  );
  const [chatDrafts, setChatDrafts] = useState<Record<number, string>>({});

  const getPool = useCallback(
    (track: string, sf: "all" | number) => {
      let pool =
        track === "nonfdw"
          ? QUESTIONS.filter((q) => q.topic !== "fdw")
          : QUESTIONS;
      if (sf !== "all") pool = pool.filter((q) => q.set === sf);
      return pool;
    },
    []
  );

  const startRun = useCallback(
    (topic: string, track: string, sf: "all" | number) => {
      const pool = getPool(track, sf);
      const filtered =
        topic === "all" ? pool : pool.filter((q) => q.topic === topic);
      const ids = shuffle(filtered.map((q) => q.id));
      setOrder(ids);
      setPos(0);
      setAnswers({});
    },
    [getPool]
  );

  useEffect(() => {
    startRun("all", "nonfdw", 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleModeChange = (m: "practice" | "study") => {
    setMode(m);
    if (m === "practice" && order.length === 0) {
      startRun(topicFilter, examTrack, setFilter);
    }
  };

  const handleTrackChange = (track: "nonfdw" | "standard") => {
    if (track === examTrack) return;
    setExamTrack(track);
    setTopicFilter("all");
    if (mode === "practice") startRun("all", track, setFilter);
  };

  const handleSetChange = (sf: "all" | number) => {
    if (sf === setFilter) return;
    setSetFilter(sf);
    setTopicFilter("all");
    if (mode === "practice") startRun("all", examTrack, sf);
  };

  const handleTopicChange = (topic: string) => {
    setTopicFilter(topic);
    if (mode === "practice") startRun(topic, examTrack, setFilter);
  };

  const selectOption = (qId: number, idx: number, correct: number) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: { selected: idx, correct: idx === correct },
    }));
  };

  const nextQuestion = () => setPos((p) => p + 1);

  const currentScore = () => {
    const vals = Object.values(answers);
    return { correct: vals.filter((a) => a.correct).length, total: vals.length };
  };

  const pool = getPool(examTrack, setFilter);
  const setNumbers = Array.from(new Set(QUESTIONS.map((q) => q.set))).sort(
    (a, b) => a - b
  );

  const visibleTopics = TOPICS.filter(
    (t) => examTrack === "standard" || t.key !== "fdw"
  );

  const score = currentScore();
  const totalQuestions = pool.length;
  const setLabel = setFilter === "all" ? "all sets" : `Set ${setFilter}`;

  const trackNote =
    mode === "practice"
      ? examTrack === "nonfdw"
        ? "Non-FDW track: excludes FDW/MDW-specific placement questions."
        : "Standard track: includes FDW/MDW-specific placement questions alongside the general syllabus."
      : examTrack === "nonfdw"
        ? "Non-FDW track: FDW/MDW-specific notes are hidden below."
        : "Standard track: FDW/MDW-specific notes are included below.";

  return (
    <div className="app">
      <div className="docket">
        <div className="docket-top">
          <div>
            <p className="docket-title">CEI (Basic) — Study &amp; Practice</p>
            <p className="docket-sub">
              {mode === "practice"
                ? `${totalQuestions} questions · ${setLabel} · unofficial study aid`
                : "Study notes · unofficial study aid"}
            </p>
          </div>
          {mode === "practice" && (
            <div className="score-chip">
              Score <b>{score.correct}</b>/{score.total}
            </div>
          )}
        </div>

        <div className="mode-row">
          <button
            className={`mode-btn ${mode === "practice" ? "active" : ""}`}
            onClick={() => handleModeChange("practice")}
          >
            Practice Quiz
          </button>
          <button
            className={`mode-btn ${mode === "study" ? "active" : ""}`}
            onClick={() => handleModeChange("study")}
          >
            Study Notes
          </button>
        </div>

        {mode === "practice" && (
          <div className="set-row">
            <button
              className={`set-btn ${setFilter === "all" ? "active" : ""}`}
              onClick={() => handleSetChange("all")}
            >
              All Sets
            </button>
            {setNumbers.map((n) => (
              <button
                key={n}
                className={`set-btn ${setFilter === n ? "active" : ""}`}
                onClick={() => handleSetChange(n)}
              >
                Set {n}
              </button>
            ))}
          </div>
        )}

        <div className="track-row">
          <button
            className={`track-btn ${examTrack === "nonfdw" ? "active" : ""}`}
            onClick={() => handleTrackChange("nonfdw")}
          >
            Basic — Non-FDW
          </button>
          <button
            className={`track-btn ${examTrack === "standard" ? "active" : ""}`}
            onClick={() => handleTrackChange("standard")}
          >
            Basic — Standard (with FDW)
          </button>
        </div>
        <p className="track-note">{trackNote}</p>

        <div className="topic-row">
          {visibleTopics.map((t) => (
            <button
              key={t.key}
              className={`topic-chip ${topicFilter === t.key ? "active" : ""}`}
              onClick={() => handleTopicChange(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "practice" && (
        <>
          <ProgressBar
            pos={pos}
            total={order.length}
            topicFilter={topicFilter}
          />
          {pos >= order.length ? (
            <Results
              order={order}
              answers={answers}
              setFilter={setFilter}
              examTrack={examTrack}
              topicFilter={topicFilter}
              onRestart={() => startRun(topicFilter, examTrack, setFilter)}
              onRetryMissed={() => {
                const missed = order.filter(
                  (id) => !(answers[id] && answers[id].correct)
                );
                setOrder(shuffle(missed));
                setPos(0);
                setAnswers({});
              }}
            />
          ) : (
            <QuestionCard
              question={QUESTIONS.find((q) => q.id === order[pos])!}
              pos={pos}
              answer={answers[order[pos]]}
              onSelect={selectOption}
              onNext={nextQuestion}
              isLast={pos === order.length - 1}
              chats={chats}
              chatOpen={chatOpen}
              chatLoading={chatLoading}
              chatErrors={chatErrors}
              chatDrafts={chatDrafts}
              setChats={setChats}
              setChatOpen={setChatOpen}
              setChatLoading={setChatLoading}
              setChatErrors={setChatErrors}
              setChatDrafts={setChatDrafts}
            />
          )}
        </>
      )}

      {mode === "study" && (
        <StudyNotes
          examTrack={examTrack}
          topicFilter={topicFilter}
          expanded={studyExpanded}
          setExpanded={setStudyExpanded}
        />
      )}

      <p className="footnote">
        Practice questions and study notes for study purposes, based on publicly
        available information about Singapore&apos;s CEI (Basic) syllabus areas.
        Not affiliated with or endorsed by MOM or NTUC LearningHub.
      </p>
    </div>
  );
}

function ProgressBar({
  pos,
  total,
  topicFilter,
}: {
  pos: number;
  total: number;
  topicFilter: string;
}) {
  const idx = Math.min(pos + 1, total);
  const pct = total ? (Math.min(pos, total) / total) * 100 : 0;
  return (
    <div className="progress-wrap">
      <div className="progress-line">
        <span>
          Question {idx} of {total}
        </span>
        <span>{TOPIC_LABEL[topicFilter]}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  pos,
  answer,
  onSelect,
  onNext,
  isLast,
  chats,
  chatOpen,
  chatLoading,
  chatErrors,
  chatDrafts,
  setChats,
  setChatOpen,
  setChatLoading,
  setChatErrors,
  setChatDrafts,
}: {
  question: Question;
  pos: number;
  answer?: Answer;
  onSelect: (qId: number, idx: number, correct: number) => void;
  onNext: () => void;
  isLast: boolean;
  chats: Record<number, ChatMessage[]>;
  chatOpen: Record<number, boolean>;
  chatLoading: Record<number, boolean>;
  chatErrors: Record<number, string | null>;
  chatDrafts: Record<number, string>;
  setChats: React.Dispatch<React.SetStateAction<Record<number, ChatMessage[]>>>;
  setChatOpen: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  setChatLoading: React.Dispatch<
    React.SetStateAction<Record<number, boolean>>
  >;
  setChatErrors: React.Dispatch<
    React.SetStateAction<Record<number, string | null>>
  >;
  setChatDrafts: React.Dispatch<React.SetStateAction<Record<number, string>>>;
}) {
  const answered = !!answer;
  const q = question;

  return (
    <div className="stage">
      <div className="card">
        {answered && (
          <div className={`stamp ${answer.correct ? "correct" : "wrong"}`}>
            {answer.correct ? "Correct" : "Incorrect"}
          </div>
        )}
        <div className="q-head">
          <span className="q-num">Q{pos + 1}.</span>
          <span className="q-topic">&sect; {TOPIC_LABEL[q.topic]}</span>
        </div>
        <p className="q-text">{q.question}</p>
        <div className="options">
          {q.options.map((opt, i) => {
            let cls = "option";
            if (answered) {
              if (i === q.correct) cls += " correct";
              else if (i === answer.selected) cls += " wrong";
              else cls += " dim";
            }
            return (
              <button
                key={i}
                className={cls}
                disabled={answered}
                onClick={() => onSelect(q.id, i, q.correct)}
              >
                <span className="opt-letter">({letter(i)})</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="explain">
            <div className="explain-label">Why</div>
            <p className="explain-text">{q.explain}</p>
            <ChatPanel
              question={q}
              chats={chats}
              chatOpen={chatOpen}
              chatLoading={chatLoading}
              chatErrors={chatErrors}
              chatDrafts={chatDrafts}
              setChats={setChats}
              setChatOpen={setChatOpen}
              setChatLoading={setChatLoading}
              setChatErrors={setChatErrors}
              setChatDrafts={setChatDrafts}
            />
          </div>
        )}

        {answered && (
          <div className="stage-footer">
            <button className="btn btn-primary" onClick={onNext}>
              {isLast ? "See results →" : "Next question →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatPanel({
  question,
  chats,
  chatOpen,
  chatLoading,
  chatErrors,
  chatDrafts,
  setChats,
  setChatOpen,
  setChatLoading,
  setChatErrors,
  setChatDrafts,
}: {
  question: Question;
  chats: Record<number, ChatMessage[]>;
  chatOpen: Record<number, boolean>;
  chatLoading: Record<number, boolean>;
  chatErrors: Record<number, string | null>;
  chatDrafts: Record<number, string>;
  setChats: React.Dispatch<React.SetStateAction<Record<number, ChatMessage[]>>>;
  setChatOpen: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  setChatLoading: React.Dispatch<
    React.SetStateAction<Record<number, boolean>>
  >;
  setChatErrors: React.Dispatch<
    React.SetStateAction<Record<number, string | null>>
  >;
  setChatDrafts: React.Dispatch<React.SetStateAction<Record<number, string>>>;
}) {
  const q = question;
  const isOpen = !!chatOpen[q.id];
  const messages = chats[q.id] || [];
  const loading = !!chatLoading[q.id];
  const error = chatErrors[q.id];
  const draft = chatDrafts[q.id] || "";
  const chatLogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const text = (inputRef.current?.value || draft).trim();
    if (!text || loading) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setChats((prev) => ({ ...prev, [q.id]: newMessages }));
    setChatErrors((prev) => ({ ...prev, [q.id]: null }));
    setChatDrafts((prev) => {
      const next = { ...prev };
      delete next[q.id];
      return next;
    });
    setChatLoading((prev) => ({ ...prev, [q.id]: true }));

    const optionLines = q.options
      .map((o, i) => `(${letter(i)}) ${o}`)
      .join("\n");
    const systemPrompt = `You are a friendly, precise tutor helping someone study for Singapore's CEI (Basic) exam for employment agency personnel.

The person just answered this practice question:
Question: ${q.question}
Options:
${optionLines}
Correct answer: (${letter(q.correct)}) ${q.options[q.correct]}
Explanation shown to them: ${q.explain}

Help them understand this question and related concepts. Keep replies conversational and concise. You are not a lawyer and this isn't official guidance.`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt, messages: newMessages }),
      });

      if (!res.ok) {
        throw new Error(`Status ${res.status}`);
      }

      const data = await res.json();
      setChats((prev) => ({
        ...prev,
        [q.id]: [
          ...newMessages,
          { role: "assistant", content: data.text || "No response." },
        ],
      }));
    } catch {
      setChats((prev) => ({
        ...prev,
        [q.id]: messages,
      }));
      setChatDrafts((prev) => ({ ...prev, [q.id]: text }));
      setChatErrors((prev) => ({
        ...prev,
        [q.id]: "Couldn't reach the assistant — please try again.",
      }));
    } finally {
      setChatLoading((prev) => ({ ...prev, [q.id]: false }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <button
        className="discuss-toggle"
        onClick={() => setChatOpen((prev) => ({ ...prev, [q.id]: !isOpen }))}
      >
        {isOpen ? "Hide discussion" : "Ask a follow-up about this question"}
      </button>

      {isOpen && (
        <div className="chat-panel">
          <div className="chat-log" ref={chatLogRef}>
            {messages.length === 0 && (
              <div className="chat-hint">
                Ask anything about this question — e.g. &quot;why is (b)
                wrong?&quot;
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                {m.content}
              </div>
            ))}
            {loading && <div className="chat-msg loading">Thinking...</div>}
          </div>
          {error && <div className="chat-error-banner">{error}</div>}
          <div className="chat-input-row">
            <input
              ref={inputRef}
              className="chat-input"
              type="text"
              placeholder="Ask a follow-up..."
              defaultValue={draft}
              disabled={loading}
              onKeyDown={handleKeyDown}
            />
            <button
              className="chat-send"
              disabled={loading}
              onClick={sendMessage}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Results({
  order,
  answers,
  setFilter,
  examTrack,
  topicFilter,
  onRestart,
  onRetryMissed,
}: {
  order: number[];
  answers: Record<number, Answer>;
  setFilter: "all" | number;
  examTrack: string;
  topicFilter: string;
  onRestart: () => void;
  onRetryMissed: () => void;
}) {
  const total = order.length;
  const correct = Object.values(answers).filter((a) => a.correct).length;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const pass = pct >= 65;

  const setLabel = setFilter === "all" ? "All sets" : `Set ${setFilter}`;
  const trackLabel = examTrack === "nonfdw" ? "Non-FDW" : "Standard";
  const topicLabel =
    topicFilter === "all" ? "" : ` · ${TOPIC_LABEL[topicFilter]}`;

  const byTopic: Record<string, { correct: number; total: number }> = {};
  order.forEach((id) => {
    const q = QUESTIONS.find((x) => x.id === id)!;
    const a = answers[id];
    if (!byTopic[q.topic]) byTopic[q.topic] = { correct: 0, total: 0 };
    byTopic[q.topic].total += 1;
    if (a && a.correct) byTopic[q.topic].correct += 1;
  });

  return (
    <div className="stage">
      <div className="result-card">
        <div className="result-eyebrow">
          Result slip · {setLabel} · {trackLabel}
          {topicLabel}
        </div>
        <div className="result-score">
          {correct} / {total}
        </div>
        <div className="result-pct">{pct}% correct</div>
        <div className={`result-verdict ${pass ? "pass" : "fail"}`}>
          {pass ? "Likely pass" : "Below likely pass mark"}
        </div>
        <p className="result-note">
          Shown against an unofficial ~65% benchmark sometimes cited for CEI
          exams — MOM does not publish the actual pass mark.
        </p>
        <div className="breakdown">
          {Object.entries(byTopic).map(([key, b]) => {
            const w = b.total ? (b.correct / b.total) * 100 : 0;
            return (
              <div key={key} className="breakdown-row">
                <span className="breakdown-topic">{TOPIC_LABEL[key]}</span>
                <span className="breakdown-bar">
                  <span
                    className="breakdown-fill"
                    style={{ width: `${w}%` }}
                  />
                </span>
                <span className="breakdown-frac">
                  {b.correct}/{b.total}
                </span>
              </div>
            );
          })}
        </div>
        <div className="result-actions">
          <button className="btn btn-primary" onClick={onRestart}>
            Restart this set
          </button>
          <button
            className="btn btn-ghost"
            disabled={correct === total}
            onClick={onRetryMissed}
          >
            Retry missed only
          </button>
        </div>
      </div>
    </div>
  );
}

function StudyNotes({
  examTrack,
  topicFilter,
  expanded,
  setExpanded,
}: {
  examTrack: string;
  topicFilter: string;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const visibleTopics = TOPICS.filter(
    (t) =>
      t.key !== "all" && (examTrack === "standard" || t.key !== "fdw")
  );
  const filtered =
    topicFilter === "all"
      ? visibleTopics
      : visibleTopics.filter((t) => t.key === topicFilter);

  return (
    <div className="stage">
      <div className="study-controls">
        <button
          className="btn btn-ghost"
          onClick={() => {
            const next: Record<string, boolean> = { ...expanded };
            filtered.forEach((t) => (next[t.key] = true));
            setExpanded(next);
          }}
        >
          Expand all
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => {
            const next: Record<string, boolean> = { ...expanded };
            filtered.forEach((t) => (next[t.key] = false));
            setExpanded(next);
          }}
        >
          Collapse all
        </button>
      </div>
      <div className="notes-list">
        {filtered.map((t) => {
          const isExpanded = !!expanded[t.key];
          const bullets = STUDY_NOTES[t.key] || [];
          return (
            <div key={t.key} className="note-card">
              <button
                className="note-header"
                onClick={() =>
                  setExpanded((prev) => ({ ...prev, [t.key]: !isExpanded }))
                }
              >
                <span>{t.label}</span>
                <span className="note-chevron">
                  {isExpanded ? "−" : "+"}
                </span>
              </button>
              {isExpanded && (
                <div className="note-body">
                  <ul>
                    {bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
