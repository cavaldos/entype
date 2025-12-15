import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import './App.scss'

const WORD_BANK = [
  'time', 'people', 'way', 'year', 'work', 'day', 'thing', 'man', 'world', 'life', 'hand', 'part', 'child', 'eye', 'woman', 'place', 'week', 'case', 'point', 'government',
  'company', 'number', 'group', 'problem', 'fact', 'be', 'have', 'do', 'say', 'get', 'make', 'go', 'know', 'take', 'see', 'come', 'think', 'look', 'want', 'give',
  'use', 'find', 'tell', 'ask', 'seem', 'feel', 'try', 'leave', 'call', 'good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other', 'old', 'right',
  'big', 'high', 'different', 'small', 'large', 'next', 'early', 'young', 'important', 'few', 'public', 'bad', 'same', 'able', 'to', 'of', 'in', 'for', 'on', 'with',
  'at', 'by', 'from', 'up', 'about', 'into', 'over', 'after', 'beneath', 'under', 'above', 'the', 'and', 'a', 'an', 'that', 'this', 'these', 'those', 'as', 'if',
  'then', 'than', 'when', 'while', 'where', 'because', 'so', 'but', 'or', 'nor', 'yet', 'just', 'also', 'only', 'even', 'almost', 'never', 'always', 'often',
]

function makePrompt(wordCount = 45) {
  const words = []
  for (let i = 0; i < wordCount; i++) {
    const w = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)]
    words.push(w)
  }
  // A little punctuation helps mimic real tests.
  const base = words.join(' ')
  return base.replace(/\b(important|different|always|never)\b/g, '$1,')
}

function App() {
  const [promptKey, setPromptKey] = useState(0)
  const prompt = useMemo(() => makePrompt(50), [promptKey])

  const [typed, setTyped] = useState('')
  const typedRef = useRef(typed)
  typedRef.current = typed

  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [endedAt, setEndedAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const [isFocused, setIsFocused] = useState(false)
  const [shakeNonce, setShakeNonce] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<number | null>(null)
  const [cursorSpeed, setCursorSpeed] = useState(200)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const hiddenInputRef = useRef<HTMLTextAreaElement | null>(null)
  const charRefs = useRef<Array<HTMLSpanElement | null>>([])
  const endMarkerRef = useRef<HTMLSpanElement | null>(null)
  const [caret, setCaret] = useState({ x: 0, y: 0, h: 20, visible: false })

  const isDone = endedAt != null

  const stats = useMemo(() => {
    const len = prompt.length
    const t = typed
    const within = t.slice(0, len)
    let correct = 0
    let incorrect = 0
    for (let i = 0; i < within.length; i++) {
      if (within[i] === prompt[i]) correct++
      else incorrect++
    }
    const extra = Math.max(0, t.length - len)
    incorrect += extra

    const hasStarted = startedAt != null
    const end = endedAt ?? (hasStarted ? now : null)
    const elapsedMs = hasStarted && end != null ? Math.max(0, end - startedAt) : 0
    const minutes = elapsedMs / 60000
    const wpm = minutes > 0 ? (correct / 5) / minutes : 0
    const total = correct + incorrect
    const accuracy = total > 0 ? (correct / total) * 100 : 100

    return {
      correct,
      incorrect,
      extra,
      total,
      accuracy,
      elapsedMs,
      wpm,
      progress: len > 0 ? Math.min(1, within.length / len) : 0,
    }
  }, [endedAt, now, prompt, startedAt, typed])

  useEffect(() => {
    // Keep a smooth-ish timer without burning the CPU.
    if (startedAt == null || endedAt != null) return

    let raf = 0
    const tick = () => {
      setNow(Date.now())
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [endedAt, startedAt])

  const focusInput = () => {
    hiddenInputRef.current?.focus()
  }

  const restart = () => {
    setTyped('')
    setStartedAt(null)
    setEndedAt(null)
    setNow(Date.now())
    setPromptKey((k) => k + 1)
    setShakeNonce((n) => n + 1)
    requestAnimationFrame(() => focusInput())
  }

  const onChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value
    const prev = typedRef.current

    // While the caret is moving, don't let blink hide it.
    setIsTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 450)

    // Start timer on first input.
    if (startedAt == null && next.length > 0) {
      setStartedAt(Date.now())
    }

    // Monkeytype-style: stop when we've reached the end of the prompt.
    if (endedAt == null && next.length >= prompt.length) {
      setEndedAt(Date.now())
    }

    // Allow user to delete and continue typing after reaching the end.
    if (endedAt != null && next.length < prompt.length) {
      setEndedAt(null)
    }

    // Trigger a subtle shake when a new wrong character is entered.
    if (next.length > prev.length) {
      const i = next.length - 1
      const expected = prompt[i]
      const got = next[i]
      if (expected != null && got != null && got !== expected) {
        setShakeNonce((n) => n + 1)
      }
    }

    setTyped(next)
  }

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Quick restart like Monkeytype.
      if (e.key === 'Escape') {
        e.preventDefault()
        restart()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptKey])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const caretIndex = Math.min(typed.length, prompt.length)
    const targetEl = caretIndex === prompt.length ? endMarkerRef.current : charRefs.current[caretIndex]
    if (!targetEl) {
      setCaret((c) => ({ ...c, visible: false }))
      return
    }

    const target = targetEl.getBoundingClientRect()
    const box = container.getBoundingClientRect()
    const x = target.left - box.left - 2
    const y = target.top - box.top
    const h = Math.max(14, target.height)

    setCaret({ x, y, h, visible: true })
  }, [prompt, typed])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => {
      // Recompute caret on wrap/resizes.
      const caretIndex = Math.min(typedRef.current.length, prompt.length)
      const targetEl = caretIndex === prompt.length ? endMarkerRef.current : charRefs.current[caretIndex]
      if (!targetEl) return
      const target = targetEl.getBoundingClientRect()
      const box = container.getBoundingClientRect()
      setCaret({
        x: target.left - box.left - 2,
        y: target.top - box.top,
        h: Math.max(14, target.height),
        visible: true,
      })
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [prompt])

  return (
    <div className="min-h-screen p-6 flex flex-col gap-[18px]">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.15)]" />
          <span className="font-bold tracking-wide">typeflow</span>
        </div>

        <div className="flex gap-3.5 items-baseline flex-wrap">
          <div className="grid gap-0.5">
            <div className="text-xs text-white/55">WPM</div>
            <div className="tabular-nums text-lg font-semibold">{Math.round(stats.wpm)}</div>
          </div>
          <div className="grid gap-0.5">
            <div className="text-xs text-white/55">Acc</div>
            <div className="tabular-nums text-lg font-semibold">{stats.accuracy.toFixed(0)}%</div>
          </div>
          <div className="grid gap-0.5">
            <div className="text-xs text-white/55">Time</div>
            <div className="tabular-nums text-lg font-semibold">{(stats.elapsedMs / 1000).toFixed(1)}s</div>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2.5">
            <label htmlFor="cursor-speed" className="text-[13px] text-white/70 tabular-nums min-w-[85px]">
              Cursor: {cursorSpeed}ms
            </label>
            <input
              id="cursor-speed"
              type="range"
              min="50"
              max="300"
              step="10"
              value={cursorSpeed}
              onChange={(e) => setCursorSpeed(Number(e.target.value))}
              className="slider"
              title="Adjust cursor animation speed"
            />
          </div>
          <button
            className="rounded-[10px] border border-white/10 bg-white/[0.06] px-3 py-2.5 hover:border-white/20 transition-colors"
            onClick={restart}
            title="Restart (Esc)"
          >
            Restart
          </button>
        </div>
      </header>

      <main className="flex justify-center">
        <section className="w-full max-w-[980px] border border-white/10 bg-white/[0.03] rounded-2xl overflow-hidden" aria-label="Typing test">
          <div className="h-[3px] bg-white/[0.07]" aria-hidden="true">
            <div
              className="h-full w-full origin-left bg-gradient-to-r from-amber-400 to-blue-400 transition-transform duration-[120ms] ease-in-out"
              style={{ transform: `scaleX(${stats.progress})` }}
            />
          </div>

          <div
            className={`relative pt-5 px-5 pb-3 ${shakeNonce ? 'shake' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault()
              focusInput()
            }}
          >
            <div
              ref={containerRef}
              className={`relative rounded-[14px] p-[18px] border cursor-text select-none transition-all duration-[110ms]
                ${isFocused
                  ? 'border-amber-400/45 shadow-[0_0_0_4px_rgba(251,191,36,0.10)]'
                  : 'border-white/10'
                } bg-black/[0.18]`}
              onClick={focusInput}
              role="textbox"
              aria-label="Type the text shown"
              aria-multiline="false"
              tabIndex={-1}
            >
              <div
                className={`caret ${isTyping ? 'typing' : ''}`}
                style={{
                  opacity: caret.visible && isFocused && !isDone ? 1 : 0,
                  height: `${caret.h}px`,
                  transform: `translate3d(${caret.x}px, ${caret.y}px, 0)`,
                  transition: `transform ${cursorSpeed}ms cubic-bezier(0.25, 0.1, 0.25, 1)`,
                }}
                aria-hidden="true"
              >
                <div className="caretInner" />
              </div>

              <div className="font-mono text-xl leading-[1.8] tracking-[0.2px] text-white/60 whitespace-pre-wrap break-words" aria-hidden="true">
                {Array.from(prompt).map((ch, i) => {
                  const t = typed[i]
                  const isSpace = ch === ' '
                  let state = 'pending'
                  if (t != null) state = t === ch ? 'correct' : 'incorrect'
                  const hasTyped = t != null

                  return (
                    <span
                      key={i}
                      ref={(el) => {
                        charRefs.current[i] = el
                      }}
                      className={`ch ${state} ${isSpace ? 'space' : ''} ${hasTyped ? 'hasTyped' : ''}`}
                      data-tooltip={hasTyped ? 'hello' : undefined}
                    >
                      {ch}
                    </span>
                  )
                })}
                <span ref={endMarkerRef} className="inline-block w-0">{'\u200b'}</span>
              </div>

              {!isFocused && (
                <div className="focusHint" aria-hidden="true">
                  Click to focus
                </div>
              )}
              {isDone && (
                <div className="doneHint" aria-hidden="true">
                  Done — press Esc to restart
                </div>
              )}
            </div>

            <textarea
              ref={hiddenInputRef}
              className="ghostInput"
              value={typed}
              onChange={onChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onPaste={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
            />
          </div>

          <div className="flex justify-between gap-3 px-5 pt-3 pb-[18px]">
            <div className="flex gap-3.5 flex-wrap text-white/55 text-[13px]">
              <span className="inline-flex items-center gap-2">
                <span className="dot ok" /> correct: {stats.correct}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="dot bad" /> errors: {stats.incorrect}
              </span>
              <span className="inline-flex items-center gap-2">Esc to restart</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
