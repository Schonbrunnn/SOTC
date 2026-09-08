'use client';

import { useEffect, useRef, useState } from 'react';

type GamePhase = 'ready' | 'playing' | 'ended';

const HOLES = Array.from({ length: 9 }, (_, index) => index);

function playTone(frequency: number, duration = 0.08) {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.12, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      context.currentTime + duration,
    );
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
    oscillator.addEventListener('ended', () => void context.close());
  } catch {
    // Sound is a bonus; some browsers block Web Audio in low-power mode.
  }
}

export default function Home() {
  const [phase, setPhase] = useState<GamePhase>('ready');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [streak, setStreak] = useState(0);
  const [activeHole, setActiveHole] = useState<number | null>(null);
  const [bonkedHole, setBonkedHole] = useState<number | null>(null);
  const [missedHole, setMissedHole] = useState<number | null>(null);
  const [showPony, setShowPony] = useState(false);
  const [hammer, setHammer] = useState({ x: 0, y: 0, key: 0, visible: false });

  const fieldRef = useRef<HTMLDivElement>(null);
  const activeHoleRef = useRef<number | null>(null);
  const hitThisTurnRef = useRef(false);
  const phaseRef = useRef<GamePhase>('ready');
  const ponyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const savedBest = Number(window.localStorage.getItem('factory-bonk-best'));
    if (Number.isFinite(savedBest)) setBestScore(savedBest);
  }, []);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing') return;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          phaseRef.current = 'ended';
          setPhase('ended');
          setActiveHole(null);
          activeHoleRef.current = null;
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing') return;

    const spawn = () => {
      const previous = activeHoleRef.current;
      if (previous !== null && !hitThisTurnRef.current) setStreak(0);

      let next = Math.floor(Math.random() * HOLES.length);
      while (next === previous) next = Math.floor(Math.random() * HOLES.length);

      hitThisTurnRef.current = false;
      setBonkedHole(null);
      setActiveHole(next);
      activeHoleRef.current = next;
    };

    spawn();
    const moleTimer = window.setInterval(spawn, 820);
    return () => window.clearInterval(moleTimer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'ended') return;
    setBestScore((currentBest) => {
      const nextBest = Math.max(currentBest, score);
      window.localStorage.setItem('factory-bonk-best', String(nextBest));
      return nextBest;
    });
  }, [phase, score]);

  useEffect(
    () => () => {
      if (ponyTimerRef.current) window.clearTimeout(ponyTimerRef.current);
    },
    [],
  );

  const startGame = () => {
    if (ponyTimerRef.current) window.clearTimeout(ponyTimerRef.current);
    setScore(0);
    setStreak(0);
    setTimeLeft(30);
    setShowPony(false);
    setBonkedHole(null);
    setMissedHole(null);
    hitThisTurnRef.current = false;
    activeHoleRef.current = null;
    phaseRef.current = 'playing';
    setPhase('playing');
  };

  const positionHammer = (clientX?: number, clientY?: number, index?: number) => {
    const field = fieldRef.current;
    if (!field) return;

    const fieldRect = field.getBoundingClientRect();
    const hole =
      index === undefined
        ? null
        : field.querySelector<HTMLElement>(`[data-hole="${index}"]`);
    const holeRect = hole?.getBoundingClientRect();

    setHammer((current) => ({
      x:
        clientX === undefined
          ? (holeRect?.left ?? fieldRect.left) - fieldRect.left +
            (holeRect?.width ?? 0) / 2
          : clientX - fieldRect.left,
      y:
        clientY === undefined
          ? (holeRect?.top ?? fieldRect.top) - fieldRect.top +
            (holeRect?.height ?? 0) / 2
          : clientY - fieldRect.top,
      key: current.key + 1,
      visible: true,
    }));

    window.setTimeout(
      () => setHammer((current) => ({ ...current, visible: false })),
      260,
    );
  };

  const bonk = (index: number, clientX?: number, clientY?: number) => {
    if (phaseRef.current !== 'playing') return;
    positionHammer(clientX, clientY, index);

    if (index !== activeHoleRef.current || hitThisTurnRef.current) {
      setStreak(0);
      setMissedHole(index);
      playTone(118, 0.06);
      window.setTimeout(() => setMissedHole(null), 220);
      return;
    }

    hitThisTurnRef.current = true;
    setBonkedHole(index);
    playTone(235, 0.1);
    setStreak((currentStreak) => {
      const nextStreak = currentStreak + 1;
      setScore((currentScore) => currentScore + 10 + (nextStreak - 1) * 2);

      if (nextStreak % 5 === 0) {
        setShowPony(true);
        window.setTimeout(() => playTone(392, 0.11), 70);
        window.setTimeout(() => playTone(523, 0.16), 150);
        if (ponyTimerRef.current) window.clearTimeout(ponyTimerRef.current);
        ponyTimerRef.current = window.setTimeout(() => setShowPony(false), 2200);
      }
      return nextStreak;
    });
  };

  return (
    <main className="game-shell">
      <div className="sun" aria-hidden="true" />
      <div className="cloud cloud-one" aria-hidden="true" />
      <div className="cloud cloud-two" aria-hidden="true" />

      <section className="factory-scene" aria-label="奇瑞汽车卡通工厂背景">
        <div className="chimney chimney-one"><i /><i /><i /></div>
        <div className="chimney chimney-two"><i /><i /></div>
        <div className="factory-roof" aria-hidden="true">
          <span /><span /><span /><span />
        </div>
        <div className="factory-body">
          <div className="factory-brand">
            <span className="brand-mark">C</span>
            <span><b>奇瑞智造工厂</b><small>CHERY AUTO FACTORY</small></span>
          </div>
          <div className="factory-windows" aria-hidden="true">
            {Array.from({ length: 8 }, (_, index) => <span key={index} />)}
          </div>
          <div className="factory-door" aria-hidden="true"><i /><i /></div>
        </div>
        <div className="conveyor" aria-hidden="true">
          <div className="car car-one"><i /><b /><span /><span /></div>
          <div className="car car-two"><i /><b /><span /><span /></div>
        </div>
      </section>

      <section className="game-card" aria-labelledby="game-title">
        <header className="game-header">
          <div className="title-lockup">
            <span className="title-kicker">CHERY FACTORY GAME</span>
            <h1 id="game-title">厂区打地鼠</h1>
          </div>

          <div className="hud" aria-live="polite">
            <div className="hud-item"><span>得分</span><strong>{score}</strong></div>
            <div className="hud-item timer"><span>时间</span><strong>{timeLeft}<small>s</small></strong></div>
            <div className="hud-item"><span>最高</span><strong>{bestScore}</strong></div>
          </div>
        </header>

        <div className="combo-row">
          <div className="combo-label"><span>⚡</span> 连击 <strong>{streak}</strong></div>
          <div className="combo-meter" aria-label={`当前 ${streak} 连击，5 连击触发彩蛋`}>
            {Array.from({ length: 5 }, (_, index) => (
              <i key={index} className={index < streak % 5 || (streak > 0 && streak % 5 === 0) ? 'filled' : ''} />
            ))}
          </div>
          <p>{phase === 'playing' ? '瞄准头像 · 别打空！' : '连续命中 5 次有惊喜'}</p>
        </div>

        <div className="field-wrap">
          <div className="grass-edge" aria-hidden="true" />
          <div className="game-field" ref={fieldRef}>
            {HOLES.map((index) => {
              const isActive = activeHole === index;
              const isBonked = bonkedHole === index;
              return (
                <button
                  key={index}
                  type="button"
                  className={`hole ${missedHole === index ? 'missed' : ''}`}
                  data-hole={index}
                  aria-label={isActive ? `第 ${index + 1} 个洞有目标，敲击` : `第 ${index + 1} 个空洞`}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    bonk(index, event.clientX, event.clientY);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      bonk(index);
                    }
                  }}
                >
                  <span className="pit-back" aria-hidden="true" />
                  <span className="mole-window" aria-hidden="true">
                    <img
                      className={`mole-head ${isActive ? 'up' : ''} ${isBonked ? 'bonked' : ''}`}
                      src="/game/mole-person.png"
                      alt=""
                      draggable="false"
                    />
                  </span>
                  {isBonked && <span className="hit-burst" aria-hidden="true">砰!</span>}
                  {missedHole === index && <span className="miss-burst" aria-hidden="true">MISS</span>}
                  <span className="pit-front" aria-hidden="true" />
                </button>
              );
            })}

            {hammer.visible && (
              <span
                key={hammer.key}
                className="hammer"
                style={{ left: hammer.x, top: hammer.y }}
                aria-hidden="true"
              >
                <i>🔨</i>
              </span>
            )}
          </div>

          <aside className={`pony-surprise ${showPony ? 'show' : ''}`} aria-hidden={!showPony}>
            <div className="pony-speech"><b>哈哈哈！</b><span>五连击！</span></div>
            <img src="/game/laughing-pony.png" alt="开心大笑的彩色小马" draggable="false" />
          </aside>

          {phase !== 'playing' && (
            <div className="game-overlay">
              <div className="overlay-card">
                <div className="mini-hammer" aria-hidden="true">🔨</div>
                {phase === 'ready' ? (
                  <>
                    <span className="eyebrow">车间休息时间</span>
                    <h2>准备好开敲了吗？</h2>
                    <p>30 秒内击中越多头像，分数越高。连续 5 次命中会触发隐藏笑声。</p>
                    <button className="start-button" onClick={startGame}>开始游戏 <span>→</span></button>
                  </>
                ) : (
                  <>
                    <span className="eyebrow">本轮结束</span>
                    <h2>{score >= bestScore && score > 0 ? '新的最高分！' : '干得漂亮！'}</h2>
                    <div className="final-score"><strong>{score}</strong><span>分</span></div>
                    <p>最高连击留在下一轮继续挑战，注意别让头像溜走。</p>
                    <button className="start-button" onClick={startGame}>再玩一局 <span>↻</span></button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="game-footer">
        <span><i className="status-dot" /> 车间趣味挑战</span>
        <span>鼠标点击 · 触屏敲击 · 键盘操作</span>
      </footer>
    </main>
  );
}
