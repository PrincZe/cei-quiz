"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { QUESTIONS, Question } from "@/data/questions";
import { STUDY_NOTES } from "@/data/studyNotes";
import { TOPICS, TOPIC_LABEL } from "@/data/topics";
import { KEY_NUMBERS } from "@/data/keyNumbers";
import { TRICKY_PAIRS, TrickyPair } from "@/data/trickyPairs";

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

type Mode = "practice" | "study" | "numbers" | "pairs";

interface TopicStats {
  correct: number;
  total: number;
}

type TopicHistory = Record<string, TopicStats>;

const HISTORY_KEY = "cei-quiz-topic-history";

function loadHistory(): TopicHistory {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveHistory(history: TopicHistory) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch { /* quota exceeded — ignore */ }
}

export default function QuizApp() {
  const [mode, setMode] = useState<Mode>("practice");
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
  const [pairPos, setPairPos] = useState(0);
  const [pairAnswers, setPairAnswers] = useState<Record<number, number>>({});
  const [numbersFilter, setNumbersFilter] = useState("");
  const [topicHistory, setTopicHistory] = useState<TopicHistory>(loadHistory);

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
    (topic: string | string[], track: string, sf: "all" | number) => {
      const pool = getPool(track, sf);
      let filtered: Question[];
      if (Array.isArray(topic)) {
        filtered = pool.filter((q) => topic.includes(q.topic));
      } else {
        filtered = topic === "all" ? pool : pool.filter((q) => q.topic === topic);
      }
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

  const handleModeChange = (m: Mode) => {
    setMode(m);
    if (m === "practice" && order.length === 0) {
      startRun(topicFilter, examTrack, setFilter);
    }
    if (m === "pairs") {
      setPairPos(0);
      setPairAnswers({});
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

  const recordRunToHistory = useCallback(() => {
    const updated = { ...topicHistory };
    Object.keys(answers).forEach((idStr) => {
      const q = QUESTIONS.find((x) => x.id === Number(idStr));
      if (!q) return;
      if (!updated[q.topic]) updated[q.topic] = { correct: 0, total: 0 };
      updated[q.topic].total += 1;
      if (answers[Number(idStr)].correct) updated[q.topic].correct += 1;
    });
    setTopicHistory(updated);
    saveHistory(updated);
  }, [answers, topicHistory]);

  const resetHistory = () => {
    setTopicHistory({});
    saveHistory({});
  };

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
                : mode === "numbers"
                  ? "Key numbers & thresholds · unofficial study aid"
                  : mode === "pairs"
                    ? "Commonly confused concepts · unofficial study aid"
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
            Practice
          </button>
          <button
            className={`mode-btn ${mode === "study" ? "active" : ""}`}
            onClick={() => handleModeChange("study")}
          >
            Notes
          </button>
          <button
            className={`mode-btn ${mode === "numbers" ? "active" : ""}`}
            onClick={() => handleModeChange("numbers")}
          >
            Numbers
          </button>
          <button
            className={`mode-btn ${mode === "pairs" ? "active" : ""}`}
            onClick={() => handleModeChange("pairs")}
          >
            Tricky Pairs
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
              onDrillWeak={(weakTopics) => {
                startRun(weakTopics, examTrack, setFilter);
              }}
              topicHistory={topicHistory}
              onRecordRun={recordRunToHistory}
              onResetHistory={resetHistory}
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

      {mode === "numbers" && (
        <NumbersView
          examTrack={examTrack}
          topicFilter={topicFilter}
          filter={numbersFilter}
          setFilter={setNumbersFilter}
        />
      )}

      {mode === "pairs" && (
        <PairsView
          examTrack={examTrack}
          pos={pairPos}
          setPos={setPairPos}
          answers={pairAnswers}
          setAnswers={setPairAnswers}
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
  onDrillWeak,
  topicHistory,
  onRecordRun,
  onResetHistory,
}: {
  order: number[];
  answers: Record<number, Answer>;
  setFilter: "all" | number;
  examTrack: string;
  topicFilter: string;
  onRestart: () => void;
  onRetryMissed: () => void;
  onDrillWeak: (weakTopics: string[]) => void;
  topicHistory: TopicHistory;
  onRecordRun: () => void;
  onResetHistory: () => void;
}) {
  const recorded = useRef(false);
  useEffect(() => {
    if (!recorded.current && Object.keys(answers).length > 0) {
      recorded.current = true;
      onRecordRun();
    }
  }, [answers, onRecordRun]);

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

  const weakTopics = Object.entries(byTopic)
    .filter(([, b]) => b.total >= 2 && (b.correct / b.total) < 0.65)
    .map(([key]) => key);

  const allTimeWeak = Object.entries(topicHistory)
    .filter(([, b]) => b.total >= 5 && (b.correct / b.total) < 0.65)
    .map(([key]) => key);
  const hasHistory = Object.keys(topicHistory).length > 0;

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
            const isWeak = weakTopics.includes(key);
            return (
              <div key={key} className={`breakdown-row ${isWeak ? "weak" : ""}`}>
                <span className="breakdown-topic">
                  {isWeak && <span className="weak-indicator">!</span>}
                  {TOPIC_LABEL[key]}
                </span>
                <span className="breakdown-bar">
                  <span
                    className="breakdown-fill"
                    style={{ width: `${w}%`, background: isWeak ? "var(--stamp-red)" : undefined }}
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
          {weakTopics.length > 0 && (
            <button
              className="btn btn-weak"
              onClick={() => onDrillWeak(weakTopics)}
            >
              Drill weak topics ({weakTopics.length})
            </button>
          )}
        </div>

        {hasHistory && (
          <div className="history-section">
            <div className="history-header">
              <span className="history-title">All-time weak topics</span>
              <button className="history-reset" onClick={onResetHistory}>
                Reset history
              </button>
            </div>
            {allTimeWeak.length > 0 ? (
              <>
                <div className="history-weak-list">
                  {allTimeWeak.map((key) => (
                    <span key={key} className="history-weak-chip">
                      {TOPIC_LABEL[key]} ({topicHistory[key].correct}/{topicHistory[key].total})
                    </span>
                  ))}
                </div>
                <button
                  className="btn btn-weak"
                  style={{ marginTop: "10px", width: "100%" }}
                  onClick={() => onDrillWeak(allTimeWeak)}
                >
                  Drill all-time weak topics
                </button>
              </>
            ) : (
              <p className="history-note">No consistently weak topics yet (need 5+ attempts per topic).</p>
            )}
          </div>
        )}
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

function NumbersView({
  examTrack,
  topicFilter,
  filter,
  setFilter,
}: {
  examTrack: string;
  topicFilter: string;
  filter: string;
  setFilter: (v: string) => void;
}) {
  let numbers = KEY_NUMBERS;
  if (examTrack === "nonfdw") {
    numbers = numbers.filter((n) => n.topic !== "fdw");
  }
  if (topicFilter !== "all") {
    numbers = numbers.filter((n) => n.topic === topicFilter);
  }
  if (filter.trim()) {
    const q = filter.toLowerCase();
    numbers = numbers.filter(
      (n) =>
        n.label.toLowerCase().includes(q) ||
        n.value.toLowerCase().includes(q) ||
        n.context.toLowerCase().includes(q)
    );
  }

  const grouped: Record<string, typeof numbers> = {};
  numbers.forEach((n) => {
    if (!grouped[n.topic]) grouped[n.topic] = [];
    grouped[n.topic].push(n);
  });

  return (
    <div className="stage">
      <div className="numbers-search">
        <input
          type="text"
          className="numbers-input"
          placeholder="Filter numbers (e.g. &quot;14 days&quot;, &quot;fine&quot;, &quot;salary&quot;)..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <div className="numbers-list">
        {Object.entries(grouped).map(([topic, items]) => (
          <div key={topic} className="numbers-group">
            <div className="numbers-group-header">{TOPIC_LABEL[topic]}</div>
            {items.map((item, i) => (
              <div key={i} className="numbers-row">
                <span className="numbers-label">{item.label}</span>
                <span className="numbers-value">{item.value}</span>
                <span className="numbers-context">{item.context}</span>
              </div>
            ))}
          </div>
        ))}
        {numbers.length === 0 && (
          <p className="numbers-empty">No matching numbers found.</p>
        )}
      </div>
    </div>
  );
}

function PairsView({
  examTrack,
  pos,
  setPos,
  answers,
  setAnswers,
}: {
  examTrack: string;
  pos: number;
  setPos: (p: number) => void;
  answers: Record<number, number>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>;
}) {
  const pairs = examTrack === "nonfdw"
    ? TRICKY_PAIRS.filter((p) => p.topic !== "fdw")
    : TRICKY_PAIRS;

  if (pairs.length === 0) return null;

  const currentPair: TrickyPair = pairs[pos % pairs.length];
  const answered = answers[currentPair.id] !== undefined;
  const selectedIdx = answers[currentPair.id];
  const isCorrect = selectedIdx === currentPair.quiz.correct;

  const handleSelect = (idx: number) => {
    if (answered) return;
    setAnswers((prev) => ({ ...prev, [currentPair.id]: idx }));
  };

  const handleNext = () => {
    setPos(pos + 1);
  };

  const handleRestart = () => {
    setPos(0);
    setAnswers({});
  };

  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.entries(answers).filter(([id, sel]) => {
    const p = TRICKY_PAIRS.find((x) => x.id === Number(id));
    return p && sel === p.quiz.correct;
  }).length;

  return (
    <div className="stage">
      <div className="pairs-progress">
        <span>Pair {(pos % pairs.length) + 1} of {pairs.length}</span>
        {answeredCount > 0 && (
          <span className="pairs-score">{correctCount}/{answeredCount} correct</span>
        )}
      </div>
      <div className="card pairs-card">
        <div className="q-head">
          <span className="q-topic">&sect; {TOPIC_LABEL[currentPair.topic]}</span>
        </div>
        <p className="pairs-title">{currentPair.title}</p>
        <div className="pairs-comparison">
          <div className="pairs-item">
            <div className="pairs-item-label">{currentPair.itemA.label}</div>
            <div className="pairs-item-detail">{currentPair.itemA.detail}</div>
          </div>
          <div className="pairs-vs">vs</div>
          <div className="pairs-item">
            <div className="pairs-item-label">{currentPair.itemB.label}</div>
            <div className="pairs-item-detail">{currentPair.itemB.detail}</div>
          </div>
        </div>

        <div className="pairs-quiz">
          <p className="pairs-quiz-question">{currentPair.quiz.question}</p>
          <div className="options">
            {currentPair.quiz.options.map((opt, i) => {
              let cls = "option";
              if (answered) {
                if (i === currentPair.quiz.correct) cls += " correct";
                else if (i === selectedIdx) cls += " wrong";
                else cls += " dim";
              }
              return (
                <button
                  key={i}
                  className={cls}
                  disabled={answered}
                  onClick={() => handleSelect(i)}
                >
                  <span className="opt-letter">({letter(i)})</span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {answered && (
          <div className="explain">
            <div className={`stamp ${isCorrect ? "correct" : "wrong"}`}>
              {isCorrect ? "Correct" : "Incorrect"}
            </div>
            <div className="explain-label">Why</div>
            <p className="explain-text">{currentPair.quiz.explain}</p>
          </div>
        )}

        {answered && (
          <div className="stage-footer">
            {pos < pairs.length - 1 ? (
              <button className="btn btn-primary" onClick={handleNext}>
                Next pair →
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleRestart}>
                Restart pairs
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
