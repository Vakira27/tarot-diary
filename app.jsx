import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Plus, X, RotateCw, ChevronLeft, ChevronDown, Sparkles, Download, Upload,
  User, AlertCircle, BarChart2, Menu, ArrowLeft, BookOpen, Star, Moon,
  Trash2, Loader2, Check, ZoomIn, ZoomOut, Maximize2, Flame, Save, Pencil
} from 'lucide-react';

// =====================================================================================
// ИНТЕГРАЦИЯ ФАЙЛОВ — ЧИТАЙТЕ ПЕРЕД ЗАПУСКОМ В ВАШЕМ ПРОЕКТЕ
// =====================================================================================
// 1. Логотип: положите файл  public/assets/logo.png
//
// 2. Картинки карт: создайте папку  public/assets/cards/<id-колоды>/
//    и положите туда файлы вида:
//      00-fool.jpg, 01-magician.jpg, ... (Старшие Арканы)
//      wands-ace.jpg, wands-02.jpg, ... wands-page.jpg, wands-knight.jpg, wands-queen.jpg, wands-king.jpg
//      cups-ace.jpg ... pentacles-king.jpg  (аналогично для cups / swords / pentacles)
//    Пример: public/assets/cards/waite/wands-ace.jpg
//    Если файла нет — показывается декоративная заглушка.
//
// 3. dnd-kit и framer-motion недоступны в песочнице Artifacts (их нет в списке
//    разрешённых пакетов), поэтому drag-and-drop, зум/пан холста и все "живые"
//    анимации (взлёт карты, 3D-переворот, проступающие чернила, переход между
//    страницами) реализованы на нативных pointer-событиях + CSS-переходах/keyframes.
//    В своём проекте это можно один в один заменить на dnd-kit / framer-motion /
//    react-zoom-pan-pinch, сохранив ту же логику состояний.
// =====================================================================================

const DECKS = [
  { id: 'waite', name: 'Уэйт' },
  { id: 'thoth', name: 'Тот' },
  { id: 'shadow', name: 'Таро Теней' },
];

const MAJOR_ARCANA = [
  { id: '00-fool', roman: '0', name: 'Шут', suit: 'major' },
  { id: '01-magician', roman: 'I', name: 'Маг', suit: 'major' },
  { id: '02-priestess', roman: 'II', name: 'Верховная Жрица', suit: 'major' },
  { id: '03-empress', roman: 'III', name: 'Императрица', suit: 'major' },
  { id: '04-emperor', roman: 'IV', name: 'Император', suit: 'major' },
  { id: '05-hierophant', roman: 'V', name: 'Иерофант', suit: 'major' },
  { id: '06-lovers', roman: 'VI', name: 'Влюблённые', suit: 'major' },
  { id: '07-chariot', roman: 'VII', name: 'Колесница', suit: 'major' },
  { id: '08-strength', roman: 'VIII', name: 'Сила', suit: 'major' },
  { id: '09-hermit', roman: 'IX', name: 'Отшельник', suit: 'major' },
  { id: '10-wheel', roman: 'X', name: 'Колесо Фортуны', suit: 'major' },
  { id: '11-justice', roman: 'XI', name: 'Справедливость', suit: 'major' },
  { id: '12-hanged', roman: 'XII', name: 'Повешенный', suit: 'major' },
  { id: '13-death', roman: 'XIII', name: 'Смерть', suit: 'major' },
  { id: '14-temperance', roman: 'XIV', name: 'Умеренность', suit: 'major' },
  { id: '15-devil', roman: 'XV', name: 'Дьявол', suit: 'major' },
  { id: '16-tower', roman: 'XVI', name: 'Башня', suit: 'major' },
  { id: '17-star', roman: 'XVII', name: 'Звезда', suit: 'major' },
  { id: '18-moon', roman: 'XVIII', name: 'Луна', suit: 'major' },
  { id: '19-sun', roman: 'XIX', name: 'Солнце', suit: 'major' },
  { id: '20-judgement', roman: 'XX', name: 'Суд', suit: 'major' },
  { id: '21-world', roman: 'XXI', name: 'Мир', suit: 'major' },
];

const SUITS = [
  { id: 'wands', name: 'Жезлы' },
  { id: 'cups', name: 'Кубки' },
  { id: 'swords', name: 'Мечи' },
  { id: 'pentacles', name: 'Пентакли' },
];
const RANKS = [
  { n: 'ace', label: 'Туз' }, { n: '02', label: 'Двойка' }, { n: '03', label: 'Тройка' },
  { n: '04', label: 'Четвёрка' }, { n: '05', label: 'Пятёрка' }, { n: '06', label: 'Шестёрка' },
  { n: '07', label: 'Семёрка' }, { n: '08', label: 'Восьмёрка' }, { n: '09', label: 'Девятка' },
  { n: '10', label: 'Десятка' }, { n: 'page', label: 'Паж' }, { n: 'knight', label: 'Рыцарь' },
  { n: 'queen', label: 'Королева' }, { n: 'king', label: 'Король' },
];
const MINOR_ARCANA = SUITS.flatMap((s) => RANKS.map((r) => ({
  id: `${s.id}-${r.n}`, roman: '', name: `${r.label} ${s.name.slice(0, -1)}${s.id === 'wands' || s.id === 'pentacles' ? (s.id === 'wands' ? 'а' : 'и') : ''}`.trim(), suit: s.id,
})));
const ALL_CARDS = [...MAJOR_ARCANA, ...MINOR_ARCANA];
const CATEGORIES = [{ id: 'major', name: 'Старшие арканы' }, ...SUITS];

// Базовый набор папок для онбординга — дальше пользователь может добавлять свои
const DEFAULT_SPHERES = ['Отношения', 'Карьера', 'Политика', 'Прогнозы', 'Знаменитости', 'Общее'];

const DEMO_SPREADS = [
  { id: 's1', title: 'Стоит ли менять работу', description: 'Оффер против стабильности на нынешнем месте', sphere: 'Карьера', date: '14 мая', deckId: 'waite', cards: [
    { uid: 'a1', cardId: '09-hermit', x: 80, y: 70, reversed: false, question: 'Какой урок мне нужно извлечь?', interpretation: 'Пора остановиться и подумать в одиночестве.' },
    { uid: 'a2', cardId: '16-tower', x: 320, y: 110, reversed: true, question: 'Что изменится, если я останусь?', interpretation: 'Есть риск внезапного слома привычного уклада.' },
  ], notes: '', reality: '' },
  { id: 's2', title: 'Он позвонит?', description: 'Тишина после третьего свидания', sphere: 'Отношения', date: '2 июня', deckId: 'waite', cards: [
    { uid: 'b1', cardId: '06-lovers', x: 100, y: 100, reversed: false, question: 'Что он чувствует?', interpretation: 'Есть выбор, который он ещё не сделал.' },
  ], notes: '', reality: '' },
  { id: 's3', title: 'Итоги выборов', description: '', sphere: 'Политика', date: '20 июня', deckId: 'thoth', cards: [
    { uid: 'c1', cardId: '10-wheel', x: 120, y: 80, reversed: false, question: 'Чем закончится кампания?', interpretation: 'Резкий поворот событий в последний момент.' },
  ], notes: '', reality: '' },
  { id: 's4', title: 'Атмосфера лета', description: '', sphere: 'Прогнозы', date: '1 июля', deckId: 'waite', cards: [
    { uid: 'd1', cardId: '18-moon', x: 140, y: 90, reversed: false, question: 'Какая атмосфера ждёт нас летом?', interpretation: 'Лето будет тревожным и неопределённым.' },
  ], notes: '', reality: '' },
];

const uid = () => Math.random().toString(36).slice(2, 10);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

async function askMentor(system, prompt) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, system, messages: [{ role: 'user', content: prompt }] }),
    });
    const data = await res.json();
    return (data.content || []).map((b) => b.text || '').join('\n').trim();
  } catch (e) {
    return null;
  }
}
function tryParseJSON(text) {
  if (!text) return null;
  try { return JSON.parse(text.replace(/```json|```/g, '').trim()); } catch { return null; }
}

function useDiaryStorage() {
  const [spreads, setSpreads] = useState(DEMO_SPREADS);
  const [spheres, setSpheres] = useState(DEFAULT_SPHERES);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage?.get('diary-data', false);
        if (result?.value) {
          const parsed = JSON.parse(result.value);
          if (parsed.spreads) setSpreads(parsed.spreads);
          if (parsed.spheres) setSpheres(parsed.spheres);
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(async () => {
      try { await window.storage?.set('diary-data', JSON.stringify({ spreads, spheres }), false); } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [spreads, spheres, loaded]);
  return { spreads, setSpreads, spheres, setSpheres };
}

function MysticBackdrop() {
  return (
    <svg className="mystic-backdrop" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice">
      <g stroke="var(--ink)" fill="none" strokeWidth="1" opacity="0.06">
        <circle cx="120" cy="110" r="42" />
        <path d="M150 90 a40 40 0 1 0 0 60 a32 32 0 1 1 0 -60" />
        <path d="M860 90 L880 130 L920 135 L890 162 L898 202 L860 182 L822 202 L830 162 L800 135 L840 130 Z" />
        <circle cx="500" cy="60" r="16" />
        <path d="M60 500 q40 -60 90 -20 q10 40 -30 60 q-50 10 -60 -40" />
        <path d="M900 520 c0 -40 40 -60 60 -30 c10 40 -20 70 -60 30 Z" />
      </g>
    </svg>
  );
}

function SketchX() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
      <path d="M2 2.5 Q7.5 7 12 12" stroke="var(--ruby)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12.2 2.2 Q7 6.8 1.8 11.8" stroke="var(--ruby)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function Logo() {
  const [broken, setBroken] = useState(false);
  return (
    <div className="logo-box">
      {!broken ? <img src="/assets/logo.png" alt="Логотип" onError={() => setBroken(true)} /> : <span className="logo-fallback">ВД</span>}
    </div>
  );
}

function CardFace({ card, deckId, reversed, size = 'md' }) {
  const [broken, setBroken] = useState(false);
  const src = `/assets/cards/${deckId}/${card.id}.jpg`;
  return (
    <div className={`card-face-perspective card-face-${size}`}>
      <div className="card-face-flip" style={{ transform: reversed ? 'rotateX(180deg)' : 'rotateX(0deg)' }}>
        <div className="card-face">
          {!broken ? (
            <img src={src} alt={card.name} onError={() => setBroken(true)} className="card-img" draggable={false} />
          ) : (
            <div className="card-placeholder">
              {card.roman && <span className="card-roman">{card.roman}</span>}
              <Star size={size === 'sm' ? 12 : 18} strokeWidth={1.2} />
              <span className="card-name">{card.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function cardById(id) { return ALL_CARDS.find((c) => c.id === id) || MAJOR_ARCANA[0]; }

// =====================================================================================
function AuthModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn modal-close" onClick={onClose}><X size={18} /></button>
        <h3 className="script-title">Личный кабинет таролога</h3>
        <p className="muted-text">Это интерфейсная заглушка — подключите свою систему авторизации.</p>
        <label className="field-label">Электронная почта</label>
        <input className="lined-input" placeholder="you@example.com" />
        <label className="field-label">Пароль</label>
        <input className="lined-input" type="password" placeholder="••••••••" />
        <div className="modal-actions">
          <button className="btn-outline" onClick={onClose}>Войти</button>
          <button className="btn-accent" onClick={onClose}>Зарегистрироваться</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ spread, onCancel, onConfirm }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card parchment-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="script-title">Сжечь страницу дневника?</h3>
        <p className="confirm-text">
          Вы точно хотите удалить расклад «{spread?.title}»? Эту страницу дневника нельзя будет восстановить.
        </p>
        <div className="modal-actions">
          <button className="btn-accent" onClick={onCancel}>Сохранить страницу</button>
          <button className="btn-danger-outline" onClick={onConfirm}><Flame size={14} /> Сжечь страницу</button>
        </div>
      </div>
    </div>
  );
}

function CardStatsModal({ card, spreads, onClose }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const occurrences = spreads.flatMap((s) => s.cards.filter((c) => c.cardId === card.id).map((c) => ({ ...c, spreadTitle: s.title, sphere: s.sphere })));
  const reversedCount = occurrences.filter((c) => c.reversed).length;

  const getInsight = async () => {
    if (occurrences.length === 0) return;
    setLoading(true);
    const summary = occurrences.map((o) => `Сфера: ${o.sphere}; Вопрос: ${o.question || '—'}; Трактовка: ${o.interpretation || '—'}; Положение: ${o.reversed ? 'перевёрнутая' : 'прямая'}`).join('\n');
    const text = await askMentor(
      'Ты — тёплый, наблюдательный ИИ-наставник по Таро. Отвечай по-русски, 2-4 предложения, без markdown-разметки.',
      `Карта "${card.name}" выпадала у таролога вот в таких раскладах:\n${summary}\n\nСделай короткий вывод о том, какой архетипический сюжет чаще всего стоит за этой картой конкретно у этого человека.`
    );
    setInsight(text || 'Не удалось получить инсайт — попробуйте ещё раз.');
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn modal-close" onClick={onClose}><X size={18} /></button>
        <div className="stats-header">
          <CardFace card={card} deckId="waite" reversed={false} size="sm" />
          <div><h3 className="script-title">{card.name}</h3><p className="muted-text">{CATEGORIES.find(c => c.id === card.suit)?.name}</p></div>
        </div>
        <div className="stats-grid">
          <div className="stats-cell"><span className="stats-num">{occurrences.length}</span><span className="stats-label">раз выпадала</span></div>
          <div className="stats-cell"><span className="stats-num">{occurrences.length ? Math.round((reversedCount / occurrences.length) * 100) : 0}%</span><span className="stats-label">перевёрнутой</span></div>
          <div className="stats-cell"><span className="stats-num">{new Set(occurrences.map((o) => o.sphere)).size}</span><span className="stats-label">сфер</span></div>
        </div>
        {occurrences.length === 0 ? <p className="muted-text">Эта карта пока не встречалась в ваших раскладах.</p> : (
          <>
            <button className="btn-outline stats-insight-btn" onClick={getInsight} disabled={loading}>
              {loading ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}
              {loading ? 'Анализирую…' : 'Получить ИИ-инсайт'}
            </button>
            {insight && <p className="insight-text ink-fade-in">{insight}</p>}
          </>
        )}
      </div>
    </div>
  );
}

// =====================================================================================
// СОСТОЯНИЕ А — ГЛАВНЫЙ ЭКРАН (ПРИХОЖАЯ)
// =====================================================================================
function Lobby({ spreads, spheres, onAddSphere, onRenameSphere, onDeleteSphere, onOpenSpread, onNewSpread, onOpenAuth, onOpenCardStats, onExport, onImport, onRequestDelete }) {
  const [query, setQuery] = useState('');
  const [activeSphere, setActiveSphere] = useState(null);
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingSphere, setEditingSphere] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const fileRef = useRef(null);
  const newFolderInputRef = useRef(null);

  useEffect(() => { if (addingFolder) newFolderInputRef.current?.focus(); }, [addingFolder]);

  const filtered = spreads.filter((s) => {
    const matchesQuery = !query || s.title.toLowerCase().includes(query.toLowerCase());
    const matchesSphere = !activeSphere || s.sphere === activeSphere;
    return matchesQuery && matchesSphere;
  });
  const grouped = spheres.map((sphere) => ({ sphere, items: filtered.filter((s) => s.sphere === sphere) })).filter((g) => g.items.length > 0);

  const commitNewFolder = () => {
    const name = newFolderName.trim();
    if (name) onAddSphere(name);
    setNewFolderName('');
    setAddingFolder(false);
  };
  const cancelNewFolder = () => { setNewFolderName(''); setAddingFolder(false); };

  const startRename = (sphere) => { setEditingSphere(sphere); setEditingValue(sphere); };
  const commitRename = () => {
    const name = editingValue.trim();
    if (editingSphere && name && name !== editingSphere) onRenameSphere(editingSphere, name);
    setEditingSphere(null);
  };
  const handleDeleteSphere = (sphere) => {
    if (window.confirm(`Удалить папку «${sphere}»? Расклады внутри неё переедут в «Общее».`)) {
      if (activeSphere === sphere) setActiveSphere(null);
      onDeleteSphere(sphere);
    }
  };

  return (
    <div className="lobby">
      <MysticBackdrop />
      <header className="lobby-header">
        <div className="lobby-header-left">
          <Logo />
          <div>
            <h1 className="script-title app-title">Волшебный дневник таролога</h1>
            <p className="muted-text">Алхимический скрапбукинг ваших раскладов</p>
          </div>
        </div>
        <div className="lobby-header-right">
          <button className="icon-btn" onClick={() => fileRef.current?.click()} title="Загрузить резервную копию"><Upload size={18} /></button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden-input" onChange={onImport} />
          <button className="icon-btn" onClick={onExport} title="Скачать резервную копию"><Download size={18} /></button>
          <button className="icon-btn" onClick={onOpenAuth} title="Профиль"><User size={18} /></button>
        </div>
      </header>

      <div className="search-row">
        <div className="search-box"><Search size={16} /><input placeholder="Поиск по раскладам…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <div className="tag-row">
          <button className={`tag-chip ${!activeSphere ? 'tag-chip-active' : ''}`} onClick={() => setActiveSphere(null)}>Все</button>
          {spheres.map((s) => <button key={s} className={`tag-chip ${activeSphere === s ? 'tag-chip-active' : ''}`} onClick={() => setActiveSphere(s)}>{s}</button>)}
          {!addingFolder ? (
            <button className="tag-chip tag-chip-new" onClick={() => setAddingFolder(true)}>
              <Plus size={12} /> Свой раздел
            </button>
          ) : (
            <span className="new-folder-tape">
              <input
                ref={newFolderInputRef}
                className="new-folder-input"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') commitNewFolder(); if (e.key === 'Escape') cancelNewFolder(); }}
                onBlur={() => (newFolderName.trim() ? commitNewFolder() : cancelNewFolder())}
                placeholder="Название папки…"
              />
              <button className="mini-icon-btn new-folder-confirm" onMouseDown={(e) => e.preventDefault()} onClick={commitNewFolder}><Check size={12} /></button>
            </span>
          )}
        </div>
        <button className="btn-accent new-spread-btn" onClick={onNewSpread}><Plus size={16} /> Новый расклад</button>
      </div>

      <div className="gallery">
        {grouped.length === 0 && <p className="muted-text empty-state">Раскладов не найдено — начните новый.</p>}
        {grouped.map((group, gi) => (
          <section key={group.sphere} className="gallery-group">
            <div className="group-title-row">
              {editingSphere === group.sphere ? (
                <input
                  className="group-title-input"
                  value={editingValue}
                  autoFocus
                  onChange={(e) => setEditingValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingSphere(null); }}
                  onBlur={commitRename}
                />
              ) : (
                <h2 className="group-title">{group.sphere}</h2>
              )}
              <span className="group-title-actions">
                <button className="sketch-icon-btn" title="Переименовать папку" onClick={() => startRename(group.sphere)}><Pencil size={12} /></button>
                <button className="sketch-icon-btn" title="Удалить папку" onClick={() => handleDeleteSphere(group.sphere)}><SketchX /></button>
              </span>
            </div>
            <div className="polaroid-row">
              {group.items.map((s, i) => (
                <div key={s.id} className="polaroid" style={{ transform: `rotate(${((i + gi) % 5 - 2) * 2.2}deg)` }}>
                  <button className="polaroid-delete" title="Удалить расклад" onClick={(e) => { e.stopPropagation(); onRequestDelete(s.id); }}>
                    <SketchX />
                  </button>
                  <button className="polaroid-open" onClick={() => onOpenSpread(s.id)}>
                    <span className="tape" />
                    <div className="polaroid-cards">
                      {s.cards.slice(0, 3).map((c) => <div key={c.uid} className="polaroid-card"><CardFace card={cardById(c.cardId)} deckId={s.deckId} reversed={c.reversed} size="sm" /></div>)}
                    </div>
                    <div className="polaroid-caption">
                      <span className="polaroid-title">{s.title}</span>
                      <span className="polaroid-date">{s.date}</span>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="deck-gallery">
        <h2 className="group-title">Карты колоды — статистика</h2>
        <div className="deck-grid">
          {MAJOR_ARCANA.map((c) => (
            <button key={c.id} className="deck-mini-card" onClick={() => onOpenCardStats(c)}>
              <CardFace card={c} deckId="waite" reversed={false} size="sm" />
              <BarChart2 size={12} className="deck-mini-icon" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// =====================================================================================
// СОСТОЯНИЕ Б — ИНТЕРАКТИВНЫЙ ХОЛСТ (МАСТЕРСКАЯ, Miro-style)
// =====================================================================================
function SideGallery({ deckId }) {
  const [openCat, setOpenCat] = useState('major');
  const [query, setQuery] = useState('');
  const matches = query ? ALL_CARDS.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())) : null;

  const renderMini = (c) => (
    <div key={c.id} className="side-gallery-card" draggable onDragStart={(e) => e.dataTransfer.setData('text/card-id', c.id)} title="Перетащите на холст">
      <CardFace card={c} deckId={deckId} reversed={false} size="sm" />
    </div>
  );

  return (
    <aside className="side-gallery">
      <div className="side-search"><Search size={13} /><input placeholder="Найти карту…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
      {matches ? (
        <div className="side-gallery-grid ink-fade-in">{matches.length ? matches.map(renderMini) : <p className="muted-text">Ничего не найдено</p>}</div>
      ) : (
        CATEGORIES.map((cat) => (
          <div className="accordion-section" key={cat.id}>
            <button className="accordion-header" onClick={() => setOpenCat(openCat === cat.id ? null : cat.id)}>
              {cat.name}
              <ChevronDown size={14} className={`accordion-chevron ${openCat === cat.id ? 'accordion-chevron-open' : ''}`} />
            </button>
            {openCat === cat.id && <div className="side-gallery-grid ink-fade-in">{ALL_CARDS.filter((c) => c.suit === cat.id).map(renderMini)}</div>}
          </div>
        ))
      )}
    </aside>
  );
}

// Стикер-закладка с ИИ-подсказкой: в свёрнутом виде "дышит" и реагирует на hover,
// по клику разворачивается в крупный лист с текстом (плавный unfold + проступающие чернила).
// Примечание: framer-motion недоступен в песочнице Artifacts, поэтому пружинистые
// эффекты и "дыхание" реализованы через CSS keyframes/cubic-bezier с перелётом —
// в вашем проекте это можно один в один заменить на motion.div + spring-transition.
function MentorSticker({ icon, label, content, loading, tone, top }) {
  const [open, setOpen] = useState(false);
  if (!content && !loading) return null;
  return (
    <>
      <button
        className={`mentor-sticker mentor-sticker-${tone} ${open ? 'mentor-sticker-hidden' : ''}`}
        style={{ top }}
        onClick={() => setOpen(true)}
        title={label}
      >
        <span className="mentor-sticker-tape" />
        {loading ? <Loader2 size={15} className="spin" /> : icon}
        <span className="mentor-sticker-label">{label}</span>
      </button>
      {open && (
        <div className="mentor-overlay" onClick={() => setOpen(false)}>
          <div className={`mentor-sheet mentor-sheet-${tone}`} onClick={(e) => e.stopPropagation()}>
            <button className="icon-btn modal-close" onClick={() => setOpen(false)}><X size={18} /></button>
            <h3 className="script-title mentor-sheet-title">{label}</h3>
            <p className="mentor-sheet-text ink-fade-in">{content}</p>
          </div>
        </div>
      )}
    </>
  );
}

function Workshop({ spread, setSpread, onBack, onOpenCardStats }) {
  const [galleryOpen, setGalleryOpen] = useState(true);
  const [dragging, setDragging] = useState(null);
  const [panning, setPanning] = useState(false);
  const [view, setView] = useState({ scale: 1, tx: 40, ty: 30 });
  const [synthesis, setSynthesis] = useState('');
  const [synthLoading, setSynthLoading] = useState(false);
  const [errorAnalysis, setErrorAnalysis] = useState('');
  const [errorLoading, setErrorLoading] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const wrapperRef = useRef(null);
  const viewRef = useRef(view);
  useEffect(() => { viewRef.current = view; }, [view]);

  const patch = (fields) => setSpread((s) => ({ ...s, ...fields }));
  const patchCard = (cuid, fields) => setSpread((s) => ({ ...s, cards: s.cards.map((c) => (c.uid === cuid ? { ...c, ...fields } : c)) }));
  const removeCard = (cuid) => setSpread((s) => ({ ...s, cards: s.cards.filter((c) => c.uid !== cuid) }));

  const screenToCanvas = (clientX, clientY) => {
    const rect = wrapperRef.current.getBoundingClientRect();
    const { scale, tx, ty } = viewRef.current;
    return { x: (clientX - rect.left - tx) / scale, y: (clientY - rect.top - ty) / scale };
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/card-id');
    if (!cardId) return;
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    setSpread((s) => ({ ...s, cards: [...s.cards, { uid: uid(), cardId, x: Math.max(0, x - 55), y: Math.max(0, y - 80), reversed: false, question: '', interpretation: '' }] }));
  };

  const onCardPointerDown = (e, c) => {
    if (e.target.closest('button, textarea, input')) return;
    e.stopPropagation();
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    setDragging({ uid: c.uid, offsetX: x - c.x, offsetY: y - c.y, rot: Math.random() * 6 - 3 });
  };
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      patchCard(dragging.uid, { x: Math.max(0, x - dragging.offsetX), y: Math.max(0, y - dragging.offsetY) });
    };
    const onUp = () => setDragging(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [dragging]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSurfacePointerDown = (e) => {
    if (e.target.closest('.canvas-card')) return;
    const start = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty };
    setPanning(true);
    const onMove = (ev) => setView((v) => ({ ...v, tx: start.tx + (ev.clientX - start.x), ty: start.ty + (ev.clientY - start.y) }));
    const onUp = () => { setPanning(false); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
      setView((t) => {
        const factor = e.deltaY < 0 ? 1.08 : 0.93;
        const newScale = clamp(t.scale * factor, 0.4, 2.5);
        const worldX = (cx - t.tx) / t.scale, worldY = (cy - t.ty) / t.scale;
        return { scale: newScale, tx: cx - worldX * newScale, ty: cy - worldY * newScale };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const zoomBy = (factor) => setView((t) => ({ ...t, scale: clamp(t.scale * factor, 0.4, 2.5) }));
  const resetView = () => setView({ scale: 1, tx: 40, ty: 30 });

  const checkMismatch = async (cuid, question, interpretation) => {
    if (!question || !interpretation) return;
    patchCard(cuid, { checking: true });
    const text = await askMentor(
      'Ты — внимательный редактор дневника таролога. Сравни "Вопрос" и "Текст трактовки" пользователя. ' +
      'Ответь СТРОГО в формате JSON без пояснений вокруг: {"mismatch": true/false, "hint": "короткая подсказка по-русски, 1 предложение"}. ' +
      'mismatch=true, если трактовка явно уходит от темы вопроса.',
      `Вопрос: "${question}"\nТекст трактовки: "${interpretation}"`
    );
    const parsed = tryParseJSON(text);
    patchCard(cuid, { checking: false, mismatch: parsed?.mismatch || false, mismatchHint: parsed?.hint || '' });
  };

  const runSynthesis = async () => {
    setSynthLoading(true);
    const body = spread.cards.map((c) => { const card = cardById(c.cardId); return `Карта: ${card.name} (${c.reversed ? 'перевёрнутая' : 'прямая'}); Вопрос: ${c.question || '—'}; Трактовка пользователя: ${c.interpretation || '—'}`; }).join('\n');
    const text = await askMentor(
      'Ты — опытный ИИ-наставник по Таро. Дай связный синтез расклада по-русски (4-6 предложений), а в конце отдельной строкой отметь возможные упущения, начав её со слова "Заметка:".',
      `Общий вопрос: "${spread.title}". Суть ситуации: "${spread.description || '—'}". Сфера: ${spread.sphere}\nКарты:\n${body}`
    );
    setSynthesis(text || 'Не удалось получить трактовку — попробуйте ещё раз.');
    setSynthLoading(false);
  };

  const runErrorAnalysis = async () => {
    setErrorLoading(true);
    const body = spread.cards.map((c) => { const card = cardById(c.cardId); return `Карта: ${card.name} (${c.reversed ? 'перевёрнутая' : 'прямая'}); Трактовка пользователя: ${c.interpretation || '—'}`; }).join('\n');
    const text = await askMentor(
      'Ты — мягкий, но точный ИИ-наставник по Таро. Сравни трактовку пользователя с тем, как расклад сыграл в реальности. По-русски, 3-5 предложений.',
      `Карты и трактовки:\n${body}\n\nКак расклад сыграл в реальности: "${spread.reality}"`
    );
    setErrorAnalysis(text || 'Не удалось получить анализ — попробуйте ещё раз.');
    setErrorLoading(false);
  };

  const handleSave = () => { setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1400); };

  return (
    <div className="workshop">
      <MysticBackdrop />
      <header className="workshop-header">
        <button className="icon-btn" onClick={onBack}><ArrowLeft size={18} /></button>
        <input className="workshop-title-input" value={spread.title} onChange={(e) => patch({ title: e.target.value })} placeholder="Название расклада" />
        <input className="lined-input workshop-desc-input" value={spread.description || ''} onChange={(e) => patch({ description: e.target.value })} placeholder="Суть / описание ситуации…" />
        <select className="deck-select" value={spread.deckId} onChange={(e) => patch({ deckId: e.target.value })}>
          {DECKS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button className="icon-btn" onClick={() => setGalleryOpen((v) => !v)} title="Показать/скрыть галерею карт"><Menu size={18} /></button>
        <button className="btn-emerald save-btn" onClick={handleSave}>{savedFlash ? <Check size={15} /> : <Save size={15} />} {savedFlash ? 'Сохранено' : '💾 Сохранить расклад'}</button>
      </header>

      <div className="workshop-body">
        <div
          ref={wrapperRef}
          className={`canvas-viewport ${panning ? 'panning' : ''}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onPointerDown={onSurfacePointerDown}
        >
          <div className="canvas-surface" style={{ transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})` }}>
            {spread.cards.length === 0 && <p className="canvas-hint">Перетащите карту из галереи справа сюда, на холст.</p>}
            {spread.cards.map((c) => {
              const card = cardById(c.cardId);
              const isDragging = dragging?.uid === c.uid;
              return (
                <div
                  key={c.uid}
                  className={`canvas-card ${isDragging ? 'dragging' : ''}`}
                  style={{ left: c.x, top: c.y, '--drag-rot': `${dragging?.rot || 0}deg` }}
                  onPointerDown={(e) => onCardPointerDown(e, c)}
                >
                  <div className="canvas-card-top">
                    <CardFace card={card} deckId={spread.deckId} reversed={c.reversed} size="md" />
                    <div className="canvas-card-buttons">
                      <button className="mini-icon-btn" title="Перевернуть карту" onClick={() => patchCard(c.uid, { reversed: !c.reversed })}><RotateCw size={13} /></button>
                      <button className="mini-icon-btn" title="Статистика карты" onClick={() => onOpenCardStats(card)}><BarChart2 size={13} /></button>
                      <button className="mini-icon-btn" title="Удалить" onClick={() => removeCard(c.uid)}><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <input className="lined-input canvas-question" placeholder="Вопрос к карте…" value={c.question} onChange={(e) => patchCard(c.uid, { question: e.target.value })} />
                  <div className="canvas-interp-wrap">
                    <textarea className="lined-textarea" placeholder="Ваша трактовка…" value={c.interpretation} onChange={(e) => patchCard(c.uid, { interpretation: e.target.value })} onBlur={() => checkMismatch(c.uid, c.question, c.interpretation)} />
                    {c.checking && <Loader2 size={14} className="spin interp-flag" />}
                    {!c.checking && c.mismatch && (
                      <div className="interp-flag-wrap ink-fade-in">
                        <AlertCircle size={16} className="interp-flag pulse" />
                        <div className="interp-tooltip">{c.mismatchHint}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="zoom-controls">
            <button className="zoom-btn" onClick={() => zoomBy(0.85)}><ZoomOut size={13} /></button>
            <span className="zoom-pct">{Math.round(view.scale * 100)}%</span>
            <button className="zoom-btn" onClick={() => zoomBy(1.18)}><ZoomIn size={13} /></button>
            <button className="zoom-btn" onClick={resetView} title="Сбросить вид"><Maximize2 size={12} /></button>
          </div>
        </div>

        {galleryOpen && <SideGallery deckId={spread.deckId} />}
      </div>

      <MentorSticker icon={<Sparkles size={15} />} label="✨ Подсказка Ментора" content={synthesis} loading={synthLoading} tone="sage" top={90} />
      <MentorSticker icon={<Search size={15} />} label="🔍 Анализ ошибок" content={errorAnalysis} loading={errorLoading} tone="ruby" top={160} />

      <footer className="floating-panel">
        <div className="floating-panel-row">
          <button className="btn-ruby" onClick={runSynthesis} disabled={synthLoading || spread.cards.length === 0}>
            {synthLoading ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />} Трактовать расклад
          </button>
          <input className="lined-input floating-input" placeholder="Личные заметки…" value={spread.notes} onChange={(e) => patch({ notes: e.target.value })} />
          <input className="lined-input floating-input" placeholder="Как проигралось в реальности…" value={spread.reality} onChange={(e) => patch({ reality: e.target.value })} />
          <button className="btn-outline" onClick={runErrorAnalysis} disabled={errorLoading || !spread.reality}>
            {errorLoading ? <Loader2 size={15} className="spin" /> : <Check size={15} />} Работа над ошибками
          </button>
        </div>
        <p className="mentor-hint">{(synthesis || errorAnalysis) ? 'Подсказки ждут справа, на полях холста — нажмите на закладку.' : 'Подсказки ИИ появятся закладками на полях холста.'}</p>
      </footer>
    </div>
  );
}

// =====================================================================================
export default function TarotDiaryApp() {
  const { spreads, setSpreads, spheres, setSpheres } = useDiaryStorage();
  const [view, setView] = useState('lobby');
  const [activeSpreadId, setActiveSpreadId] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [statsCard, setStatsCard] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const activeSpread = spreads.find((s) => s.id === activeSpreadId) || null;
  const setActiveSpread = (updater) => setSpreads((prev) => prev.map((s) => (s.id === activeSpreadId ? (typeof updater === 'function' ? updater(s) : updater) : s)));
  const openSpread = (id) => { setActiveSpreadId(id); setView('workshop'); };

  const newSpread = () => {
    const defaultSphere = spheres.includes('Общее') ? 'Общее' : (spheres[0] || 'Общее');
    const s = { id: uid(), title: 'Новый расклад', description: '', sphere: defaultSphere, date: 'сегодня', deckId: 'waite', cards: [], notes: '', reality: '' };
    setSpreads((prev) => [s, ...prev]);
    openSpread(s.id);
  };

  const addSphere = (name) => {
    const trimmed = name.trim();
    if (!trimmed || spheres.includes(trimmed)) return;
    setSpheres((prev) => [...prev, trimmed]);
  };
  const renameSphere = (oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName || spheres.includes(trimmed)) return;
    setSpheres((prev) => prev.map((s) => (s === oldName ? trimmed : s)));
    setSpreads((prev) => prev.map((s) => (s.sphere === oldName ? { ...s, sphere: trimmed } : s)));
  };
  const deleteSphere = (name) => {
    setSpheres((prev) => prev.filter((s) => s !== name));
    setSpreads((prev) => prev.map((s) => (s.sphere === name ? { ...s, sphere: 'Общее' } : s)));
  };

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({ spreads }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'tarot-diary-backup.json'; a.click();
    URL.revokeObjectURL(url);
  };
  const importBackup = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { try { const parsed = JSON.parse(reader.result); if (parsed.spreads) setSpreads(parsed.spreads); } catch {} };
    reader.readAsText(file);
  };

  const confirmDelete = () => {
    setSpreads((prev) => prev.filter((s) => s.id !== confirmDeleteId));
    if (activeSpreadId === confirmDeleteId) { setActiveSpreadId(null); setView('lobby'); }
    setConfirmDeleteId(null);
  };

  return (
    <div className="tarot-app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Caveat:wght@500;600;700&display=swap');
        :root{
          --parchment:#F9F6F0; --parchment-dark:#efe6d2; --parchment-darker:#e6dabf;
          --ink:#381301; --ink-soft:#6a4527;
          --sage:#74b498; --sage-dark:#588d76;
          --ruby:#8a2e34; --ruby-dark:#6e2028;
          --emerald:#1f5c46; --emerald-dark:#164636;
        }
        .tarot-app{ font-family:'EB Garamond', serif; color:var(--ink); position:relative; min-height:640px; background:var(--parchment); border-radius:8px; overflow:hidden; }
        .script-title{ font-family:'Caveat', cursive; }
        .app-title{ font-size:1.9rem; line-height:1.1; margin:0; }
        .muted-text{ color:var(--ink-soft); font-size:0.85rem; margin:2px 0 0; }
        .hidden-input{ display:none; }
        .spin{ animation: spin 1s linear infinite; }
        @keyframes spin{ to{ transform:rotate(360deg); } }
        .pulse{ animation: pulse 1.4s ease-in-out infinite; }
        @keyframes pulse{ 0%,100%{ opacity:1; transform:scale(1);} 50%{ opacity:0.55; transform:scale(1.15);} }
        @keyframes inkFadeIn{ from{opacity:0; transform:translateY(6px);} to{opacity:1; transform:translateY(0);} }
        .ink-fade-in{ animation: inkFadeIn .35s ease both; }
        @keyframes pageIn{ from{opacity:0; transform:translateY(8px) scale(0.99);} to{opacity:1; transform:translateY(0) scale(1);} }
        .page-transition{ animation: pageIn .45s ease both; }

        .mystic-backdrop{ position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:0; }

        .btn-accent,.btn-outline,.btn-ruby,.btn-emerald,.btn-danger-outline{ display:inline-flex; align-items:center; gap:6px; font-family:'EB Garamond',serif; font-size:0.9rem; padding:8px 16px; border-radius:3px; cursor:pointer; transition:all .15s ease; white-space:nowrap; }
        .btn-accent{ background:var(--sage); color:#fff; border:1px solid var(--sage-dark); }
        .btn-accent:hover{ background:var(--sage-dark); }
        .btn-outline{ background:transparent; color:var(--ink); border:1px solid var(--ink); }
        .btn-outline:hover{ background:var(--ink); color:var(--parchment); }
        .btn-outline:disabled,.btn-ruby:disabled{ opacity:0.45; cursor:not-allowed; }
        .btn-ruby{ background:var(--ruby); color:#fff; border:1px solid var(--ruby-dark); box-shadow:0 2px 6px rgba(138,46,52,0.35); }
        .btn-ruby:hover{ background:var(--ruby-dark); }
        .btn-emerald{ background:var(--emerald); color:#fff; border:1px solid var(--emerald-dark); box-shadow:0 2px 6px rgba(31,92,70,0.35); }
        .btn-emerald:hover{ background:var(--emerald-dark); }
        .btn-danger-outline{ background:transparent; color:var(--ruby); border:1px solid var(--ruby); }
        .btn-danger-outline:hover{ background:var(--ruby); color:#fff; }
        .icon-btn{ background:transparent; border:1px solid transparent; color:var(--ink); padding:7px; border-radius:50%; cursor:pointer; display:flex; }
        .icon-btn:hover{ background:var(--parchment-dark); border-color:var(--ink-soft); }
        .mini-icon-btn{ background:var(--parchment); border:1px solid var(--ink-soft); color:var(--ink); border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
        .mini-icon-btn:hover{ background:var(--sage); color:#fff; }

        .lined-input,.lined-textarea{ font-family:'EB Garamond', serif; font-size:0.85rem; color:var(--ink); background:linear-gradient(var(--parchment) 0%, var(--parchment) 100%), repeating-linear-gradient(var(--parchment) 0px, var(--parchment) 21px, var(--ink-soft) 22px); background-size:100%, 100% 22px; border:none; border-bottom:1px solid var(--ink-soft); padding:4px 2px; width:100%; outline:none; }
        .lined-input:focus,.lined-textarea:focus{ border-bottom-color:var(--sage-dark); }
        .lined-textarea{ resize:vertical; min-height:44px; }
        .field-label{ font-size:0.75rem; color:var(--ink-soft); display:block; margin:10px 0 2px; }

        .lobby{ position:relative; padding:22px 26px 40px; z-index:1; }
        .lobby-header{ display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px; }
        .lobby-header-left{ display:flex; gap:12px; align-items:center; }
        .logo-box{ width:52px; height:52px; border:1.5px solid var(--ink); border-radius:50%; display:flex; align-items:center; justify-content:center; background:var(--parchment-dark); overflow:hidden; flex-shrink:0; }
        .logo-box img{ width:100%; height:100%; object-fit:cover; }
        .logo-fallback{ font-family:'Caveat',cursive; font-size:1.3rem; }
        .lobby-header-right{ display:flex; gap:4px; }

        .search-row{ display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin-bottom:22px; }
        .search-box{ display:flex; align-items:center; gap:6px; border:1px solid var(--ink-soft); border-radius:20px; padding:6px 12px; background:var(--parchment-dark); }
        .search-box input{ border:none; background:transparent; outline:none; font-family:'EB Garamond',serif; color:var(--ink); font-size:0.85rem; }
        .tag-row{ display:flex; gap:6px; flex-wrap:wrap; }
        .tag-chip{ font-size:0.78rem; padding:5px 12px; border-radius:14px; border:1px solid var(--ink-soft); background:transparent; color:var(--ink-soft); cursor:pointer; }
        .tag-chip-active{ background:var(--sage); border-color:var(--sage-dark); color:#fff; }
        .tag-chip-new{ display:inline-flex; align-items:center; gap:3px; border-style:dashed; border-color:var(--ink-soft); color:var(--ink-soft); background:transparent; }
        .tag-chip-new:hover{ color:var(--sage-dark); border-color:var(--sage-dark); background:rgba(116,180,152,0.08); }
        .new-folder-tape{ display:inline-flex; align-items:center; gap:4px; background:rgba(249,246,240,0.9); border:1px dashed var(--ink-soft); border-radius:3px; padding:3px 4px 3px 10px; transform:rotate(-1deg); box-shadow:0 1px 3px rgba(56,19,1,0.12); }
        .new-folder-input{ font-family:'EB Garamond',serif; font-size:0.78rem; background:transparent; border:none; outline:none; color:var(--ink); width:110px; }
        .new-folder-confirm{ flex-shrink:0; }
        .new-spread-btn{ margin-left:auto; }

        .gallery-group{ margin-bottom:26px; }
        .group-title-row{ display:flex; align-items:center; gap:8px; margin:0 0 10px; }
        .group-title{ font-family:'Caveat',cursive; font-size:1.3rem; margin:0; }
        .group-title-input{ font-family:'Caveat',cursive; font-size:1.3rem; background:transparent; border:none; border-bottom:1px dashed var(--ink-soft); outline:none; color:var(--ink); }
        .group-title-actions{ display:flex; gap:4px; opacity:0; transform:translateX(-4px); transition:opacity .18s ease, transform .18s ease; }
        .group-title-row:hover .group-title-actions{ opacity:1; transform:translateX(0); }
        .sketch-icon-btn{ background:transparent; border:none; color:var(--ink-soft); cursor:pointer; display:flex; padding:2px; border-radius:3px; }
        .sketch-icon-btn:hover{ color:var(--ruby); background:var(--parchment-dark); }
        .polaroid-row{ display:flex; gap:22px; flex-wrap:wrap; }
        .polaroid{ position:relative; }
        .polaroid-open{ background:#fffdf8; border:1px solid #ded2b3; border-radius:2px; padding:10px 10px 14px; width:150px; box-shadow:0 3px 8px rgba(56,19,1,0.18), 0 1px 2px rgba(56,19,1,0.1); cursor:pointer; text-align:left; display:block; transition:transform .15s ease; }
        .polaroid-open:hover{ transform:scale(1.03); }
        .polaroid-delete{ position:absolute; top:-8px; right:-8px; width:22px; height:22px; border-radius:50%; background:#fffdf8; border:1px solid var(--ruby); display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity .18s ease, transform .18s ease; cursor:pointer; z-index:2; }
        .polaroid:hover .polaroid-delete{ opacity:1; }
        .polaroid-delete:hover{ transform:scale(1.15); }
        .tape{ position:absolute; top:-8px; left:50%; transform:translateX(-50%) rotate(-3deg); width:46px; height:16px; background:rgba(116,180,152,0.35); border:1px solid rgba(56,19,1,0.08); }
        .polaroid-cards{ display:flex; gap:4px; justify-content:center; margin-bottom:8px; }
        .polaroid-caption{ display:flex; flex-direction:column; gap:1px; }
        .polaroid-title{ font-size:0.78rem; font-weight:600; }
        .polaroid-date{ font-size:0.68rem; color:var(--ink-soft); }
        .empty-state{ padding:30px 0; }

        .deck-gallery{ margin-top:10px; }
        .deck-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(58px,1fr)); gap:8px; max-width:640px; }
        .deck-mini-card{ position:relative; background:transparent; border:none; cursor:pointer; padding:0; }
        .deck-mini-icon{ position:absolute; bottom:2px; right:2px; background:var(--parchment); border-radius:50%; padding:1px; color:var(--ink-soft); }

        .card-face-perspective{ perspective:700px; }
        .card-face-sm{ width:44px; height:66px; }
        .card-face-md{ width:110px; height:165px; }
        .card-face-flip{ width:100%; height:100%; transform-style:preserve-3d; transition:transform .6s cubic-bezier(.4,.2,.2,1); }
        .card-face{ width:100%; height:100%; border:1px solid var(--ink-soft); border-radius:4px; background:#fffdf8; box-shadow:1px 2px 4px rgba(56,19,1,0.2); overflow:hidden; }
        .card-img{ width:100%; height:100%; object-fit:cover; display:block; }
        .card-placeholder{ width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; background:repeating-linear-gradient(135deg, var(--parchment), var(--parchment) 6px, var(--parchment-dark) 6px, var(--parchment-dark) 7px); padding:4px; text-align:center; }
        .card-roman{ font-family:'Cormorant Garamond',serif; font-weight:700; font-size:0.95em; }
        .card-name{ font-size:0.5rem; line-height:1.05; }
        .card-face-md .card-name{ font-size:0.62rem; }

        .workshop{ position:relative; min-height:660px; display:flex; flex-direction:column; z-index:1; }
        .workshop-header{ display:flex; align-items:center; gap:8px; padding:10px 14px; border-bottom:1px solid var(--parchment-darker); background:var(--parchment); z-index:2; flex-wrap:wrap; }
        .workshop-title-input{ font-family:'Cormorant Garamond',serif; font-size:1.1rem; font-weight:600; background:transparent; border:none; outline:none; color:var(--ink); width:200px; border-bottom:1px dashed var(--ink-soft); }
        .workshop-desc-input{ width:220px; }
        .deck-select{ font-family:'EB Garamond',serif; background:var(--parchment-dark); border:1px solid var(--ink-soft); border-radius:3px; padding:4px 8px; color:var(--ink); }
        .save-btn{ margin-left:auto; }

        .workshop-body{ position:relative; flex:1; display:flex; overflow:hidden; }
        .canvas-viewport{ position:relative; flex:1; overflow:hidden; cursor:grab; background:var(--parchment); }
        .canvas-viewport.panning{ cursor:grabbing; }
        .canvas-surface{ position:absolute; top:0; left:0; width:3400px; height:2200px; transform-origin:0 0; background-image:radial-gradient(rgba(56,19,1,0.16) 1px, transparent 1.4px); background-size:26px 26px; }
        .canvas-hint{ position:absolute; top:220px; left:260px; color:var(--ink-soft); font-family:'Caveat',cursive; font-size:1.4rem; text-align:center; width:280px; }
        .canvas-card{ position:absolute; width:190px; background:rgba(255,253,248,0.9); border:1px solid var(--parchment-darker); border-radius:5px; padding:8px; box-shadow:0 4px 10px rgba(56,19,1,0.15); cursor:grab; touch-action:none; transition:box-shadow .3s cubic-bezier(.34,1.56,.64,1), transform .3s cubic-bezier(.34,1.56,.64,1); }
        .canvas-card:active{ cursor:grabbing; }
        .canvas-card.dragging{ box-shadow:0 0 0 2px rgba(212,175,55,0.55), 0 14px 28px rgba(212,175,55,0.4), 0 6px 14px rgba(56,19,1,0.3); transform:scale(1.06) rotate(var(--drag-rot,-2deg)); z-index:10; transition:none; }
        .canvas-card-top{ display:flex; gap:8px; align-items:flex-start; margin-bottom:6px; }
        .canvas-card-buttons{ display:flex; flex-direction:column; gap:4px; margin-left:auto; }
        .canvas-question{ margin-bottom:4px; }
        .canvas-interp-wrap{ position:relative; }
        .interp-flag{ position:absolute; top:4px; right:4px; color:var(--ruby); }
        .interp-flag-wrap{ position:absolute; top:4px; right:4px; }
        .interp-flag-wrap:hover .interp-tooltip{ display:block; }
        .interp-tooltip{ display:none; position:absolute; right:0; top:20px; width:180px; background:var(--ink); color:var(--parchment); font-size:0.72rem; padding:6px 8px; border-radius:4px; z-index:5; }

        .zoom-controls{ position:absolute; bottom:16px; right:16px; display:flex; align-items:center; gap:4px; background:#fffdf8; border:1px solid var(--parchment-darker); border-radius:20px; padding:4px 6px; box-shadow:0 2px 6px rgba(56,19,1,0.18); z-index:3; }
        .zoom-btn{ width:26px; height:26px; border-radius:50%; border:1px solid var(--ink-soft); background:transparent; cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .zoom-btn:hover{ background:var(--parchment-dark); }
        .zoom-pct{ font-size:0.72rem; min-width:36px; text-align:center; }

        .side-gallery{ width:200px; border-left:1px solid var(--parchment-darker); background:var(--parchment-dark); padding:10px; overflow-y:auto; z-index:2; }
        .side-search{ display:flex; align-items:center; gap:6px; border:1px solid var(--ink-soft); border-radius:16px; padding:5px 10px; background:var(--parchment); margin-bottom:10px; }
        .side-search input{ border:none; background:transparent; outline:none; font-family:'EB Garamond',serif; font-size:0.8rem; color:var(--ink); width:100%; }
        .accordion-section{ border-bottom:1px solid var(--parchment-darker); }
        .accordion-header{ width:100%; display:flex; justify-content:space-between; align-items:center; background:transparent; border:none; padding:8px 2px; font-family:'Cormorant Garamond',serif; font-weight:600; font-size:0.9rem; color:var(--ink); cursor:pointer; }
        .accordion-chevron{ transition:transform .25s ease; }
        .accordion-chevron-open{ transform:rotate(180deg); }
        .side-gallery-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:8px; padding-bottom:10px; }
        .side-gallery-card{ cursor:grab; display:flex; justify-content:center; transition:transform .18s ease; }
        .side-gallery-card:hover{ transform:scale(1.1) translateY(-2px); }

        .floating-panel{ background:#fffdf8; border-top:1px solid var(--parchment-darker); padding:12px 16px; box-shadow:0 -4px 10px rgba(56,19,1,0.08); z-index:2; }
        .floating-panel-row{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
        .floating-input{ flex:1; min-width:160px; }
        .insight-text{ margin-top:8px; font-size:0.83rem; background:var(--parchment-dark); border-left:3px solid var(--sage); padding:8px 10px; border-radius:3px; }

        .modal-overlay{ position:fixed; inset:0; background:rgba(56,19,1,0.4); display:flex; align-items:center; justify-content:center; z-index:50; animation:overlayIn .2s ease; }
        @keyframes overlayIn{ from{opacity:0;} to{opacity:1;} }
        .modal-card{ position:relative; background:var(--parchment); border:1px solid var(--ink-soft); border-radius:10px; padding:22px 24px; width:340px; max-width:88vw; box-shadow:0 14px 34px rgba(56,19,1,0.32), 0 2px 8px rgba(56,19,1,0.2); animation:pageIn .25s ease; }
        .parchment-modal{ text-align:center; }
        .confirm-text{ font-size:0.9rem; line-height:1.5; color:var(--ink); margin:10px 0 4px; }
        .modal-close{ position:absolute; top:8px; right:8px; }
        .modal-actions{ display:flex; gap:8px; margin-top:16px; justify-content:center; flex-wrap:wrap; }
        .stats-header{ display:flex; gap:12px; align-items:center; margin-bottom:14px; }
        .stats-grid{ display:flex; gap:14px; margin-bottom:14px; }
        .stats-cell{ display:flex; flex-direction:column; align-items:center; background:var(--parchment-dark); border-radius:4px; padding:8px 12px; flex:1; }
        .stats-num{ font-family:'Cormorant Garamond',serif; font-weight:700; font-size:1.3rem; }
        .stats-label{ font-size:0.68rem; color:var(--ink-soft); text-align:center; }
        .stats-insight-btn{ width:100%; justify-content:center; }

        .mentor-hint{ margin-top:8px; font-size:0.8rem; color:var(--ink-soft); font-style:italic; }

        /* --- Стикеры-закладки ИИ-ментора --- */
        .mentor-sticker{
          position:absolute; right:0; display:flex; align-items:center; gap:7px;
          padding:10px 16px 10px 14px; border:1px solid var(--ink-soft); border-right:none;
          border-radius:8px 2px 2px 8px; font-family:'Caveat',cursive; font-weight:700; font-size:1.05rem;
          color:var(--ink); cursor:pointer; z-index:6; white-space:nowrap;
          box-shadow:-2px 3px 8px rgba(56,19,1,0.18);
          transition:transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .25s ease, opacity .2s ease;
          animation:mentorBreathe 4.4s ease-in-out infinite;
        }
        .mentor-sticker-sage{ background:linear-gradient(135deg,#eef7f1,#dcefe3); }
        .mentor-sticker-ruby{ background:linear-gradient(135deg,#fbeeec,#f5dcd9); }
        .mentor-sticker-tape{ position:absolute; top:-7px; left:14px; width:30px; height:12px; background:rgba(255,255,255,0.55); border:1px solid rgba(56,19,1,0.1); transform:rotate(-4deg); }
        .mentor-sticker:hover{ transform:translateX(-12px) scale(1.05); box-shadow:-5px 7px 16px rgba(56,19,1,0.3); animation-play-state:paused; }
        .mentor-sticker-hidden{ opacity:0; pointer-events:none; }
        @keyframes mentorBreathe{
          0%,100%{ transform:translateX(0) scale(1); box-shadow:-2px 3px 8px rgba(56,19,1,0.18); }
          50%{ transform:translateX(-4px) scale(1.02); box-shadow:-3px 6px 14px rgba(56,19,1,0.28); }
        }

        .mentor-overlay{ position:fixed; inset:0; background:rgba(56,19,1,0.38); display:flex; align-items:center; justify-content:center; z-index:60; animation:overlayIn .2s ease; }
        .mentor-sheet{
          position:relative; background:#fffdf7; border:1px solid var(--ink-soft); border-radius:6px;
          padding:30px 32px 26px; width:500px; max-width:90vw; max-height:78vh; overflow-y:auto;
          box-shadow:0 30px 55px -12px rgba(56,19,1,0.5), 0 10px 22px rgba(56,19,1,0.32);
          background-image:repeating-linear-gradient(var(--parchment) 0px, var(--parchment) 27px, var(--parchment-darker) 28px);
          transform-origin:right center;
          animation:inkUnfold .45s cubic-bezier(.34,1.56,.64,1) both;
        }
        .mentor-sheet-sage{ border-left:4px solid var(--sage); }
        .mentor-sheet-ruby{ border-left:4px solid var(--ruby); }
        .mentor-sheet-title{ font-size:1.6rem; margin:0 0 14px; padding-right:20px; }
        .mentor-sheet-text{ font-size:1.15rem; line-height:1.7; color:var(--ink); white-space:pre-wrap; }
        @keyframes inkUnfold{
          from{ opacity:0; transform:scale(0.55) rotate(-3deg); }
          65%{ opacity:1; transform:scale(1.03) rotate(0.5deg); }
          to{ opacity:1; transform:scale(1) rotate(0deg); }
        }
      `}</style>

      <div key={view} className="page-transition">
        {view === 'lobby' && (
          <Lobby
            spreads={spreads}
            spheres={spheres}
            onAddSphere={addSphere}
            onRenameSphere={renameSphere}
            onDeleteSphere={deleteSphere}
            onOpenSpread={openSpread}
            onNewSpread={newSpread}
            onOpenAuth={() => setAuthOpen(true)}
            onOpenCardStats={setStatsCard}
            onExport={exportBackup}
            onImport={importBackup}
            onRequestDelete={setConfirmDeleteId}
          />
        )}
        {view === 'workshop' && activeSpread && (
          <Workshop spread={activeSpread} setSpread={setActiveSpread} onBack={() => setView('lobby')} onOpenCardStats={setStatsCard} />
        )}
      </div>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {statsCard && <CardStatsModal card={statsCard} spreads={spreads} onClose={() => setStatsCard(null)} />}
      {confirmDeleteId && <ConfirmDeleteModal spread={spreads.find((s) => s.id === confirmDeleteId)} onCancel={() => setConfirmDeleteId(null)} onConfirm={confirmDelete} />}
    </div>
  );
}
