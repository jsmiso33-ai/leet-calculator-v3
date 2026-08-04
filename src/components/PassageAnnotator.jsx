import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { confirmAsync } from '../lib/ui.js';

// 오늘의 지문 — 지문 영역 메모 기능(형광펜·밑줄 + 자유 펜).
// 지문별로 localStorage에 저장한다. (highlights: 문단 내 문자 오프셋 / strokes: 펜 경로)
// - 형광펜/밑줄: 텍스트를 드래그 선택하면 적용. reflow에도 글과 함께 따라감.
// - 펜/지우개: 지문 위에 겹친 canvas에서 그리기/지우기. 좌표는 캔버스 크기 기준으로 정규화한다.

const STORE_KEY = 'leet_daily_annot_v1';
const PEN_COLORS = ['#dc2626', '#2563eb', '#18181b'];
const PEN_WIDTH = 2.5;
const ERASE_R = 13;
const EMPTY = { highlights: [], strokes: [] };
const NORMALIZED_COORDS = 'normalized';
const SR_ONLY_STYLE = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

function loadStore() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch { return {}; }
}
function saveStore(s) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

// 좌표 공간 표식이 없는 선은 이전 버전의 절대 px 좌표로 취급한다.
function canvasPoint(stroke, point, width, height) {
  if (stroke.coordinateSpace === NORMALIZED_COORDS) {
    return [point[0] * width, point[1] * height];
  }
  return point;
}

// 문단 텍스트 + 해당 문단의 하이라이트들 → 하이라이트 span으로 분할 렌더
function renderParagraph(text, pi, highlights) {
  const rel = highlights.filter((a) => a.para === pi);
  if (!rel.length) return text;
  const n = text.length;
  const mask = new Array(n).fill(0); // bit 1 = 형광, bit 2 = 밑줄
  rel.forEach((a) => {
    const s = Math.max(0, a.start), e = Math.min(n, a.end);
    for (let i = s; i < e; i++) mask[i] |= (a.type === 'hl' ? 1 : 2);
  });
  const out = [];
  let i = 0, k = 0;
  while (i < n) {
    let j = i + 1;
    while (j < n && mask[j] === mask[i]) j++;
    const seg = text.slice(i, j), m = mask[i];
    if (m === 0) out.push(seg);
    else out.push(<span key={k++} className={(m & 1 ? 'an-hl ' : '') + (m & 2 ? 'an-ul' : '')}>{seg}</span>);
    i = j;
  }
  return out;
}

// pe(문단 요소) 안에서 node/offset → 문단 시작 기준 문자 오프셋
function paraOffset(pe, node, offsetInNode) {
  let total = 0;
  const walker = document.createTreeWalker(pe, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    if (n === node) return total + offsetInNode;
    total += n.textContent.length;
  }
  return total;
}

export default function PassageAnnotator({ passageId, paragraphs }) {
  const [tool, setTool] = useState('none'); // none | hl | ul | pen | erase
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const [touchDrawing, setTouchDrawing] = useState(false);
  const [data, setData] = useState(EMPTY);
  const dataRef = useRef(EMPTY);
  const passageRef = useRef(null);
  const canvasRef = useRef(null);
  const drawing = useRef(null);
  const activePointer = useRef(null);

  // 지문 로드/전환 시 메모 불러오기
  useEffect(() => {
    const d = loadStore()[passageId] || EMPTY;
    const safe = { highlights: d.highlights || [], strokes: d.strokes || [] };
    setData(safe); dataRef.current = safe; setTool('none'); setTouchDrawing(false);
    drawing.current = null; activePointer.current = null;
  }, [passageId]);

  const persist = useCallback((next) => {
    setData(next); dataRef.current = next;
    const s = loadStore(); s[passageId] = next; saveStore(s);
  }, [passageId]);

  // ── 캔버스 사이즈 + 펜 경로 다시 그리기 ──
  const redraw = useCallback(() => {
    const cv = canvasRef.current, host = passageRef.current;
    if (!cv || !host) return;
    const w = host.offsetWidth, h = host.offsetHeight;
    const dpr = window.devicePixelRatio || 1;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      cv.style.width = w + 'px'; cv.style.height = h + 'px';
    }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const all = drawing.current ? [...data.strokes, drawing.current] : data.strokes;
    for (const st of all) {
      ctx.strokeStyle = st.color; ctx.lineWidth = st.width;
      ctx.beginPath();
      st.points.forEach((p, i) => {
        const [x, y] = canvasPoint(st, p, w, h);
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      });
      if (st.points.length === 1) {
        const [x, y] = canvasPoint(st, st.points[0], w, h);
        ctx.lineTo(x + 0.1, y);
      }
      ctx.stroke();
    }
  }, [data.strokes]);

  useLayoutEffect(() => { redraw(); }, [redraw, paragraphs, data.highlights]);
  useEffect(() => {
    const onResize = () => redraw();
    window.addEventListener('resize', onResize);
    let ro;
    if (window.ResizeObserver && passageRef.current) {
      ro = new ResizeObserver(() => redraw());
      ro.observe(passageRef.current);
    }
    return () => { window.removeEventListener('resize', onResize); if (ro) ro.disconnect(); };
  }, [redraw]);

  // ── 펜 / 지우개 (canvas pointer) ──
  const drawMode = tool === 'pen' || tool === 'erase';
  const xy = (e) => {
    const cv = canvasRef.current;
    const r = cv.getBoundingClientRect();
    const width = cv.clientWidth || r.width;
    const height = cv.clientHeight || r.height;
    const x = r.width ? (e.clientX - r.left) * (width / r.width) : 0;
    const y = r.height ? (e.clientY - r.top) * (height / r.height) : 0;
    const nx = Math.max(0, Math.min(1, x / Math.max(width, 1)));
    const ny = Math.max(0, Math.min(1, y / Math.max(height, 1)));
    return { x, y, width, height, point: [nx, ny] };
  };
  const eraseStrokeAt = (x, y, width, height) => {
    const cur = dataRef.current;
    const kept = cur.strokes.filter((st) => !st.points.some((p) => {
      const [px, py] = canvasPoint(st, p, width, height);
      return Math.hypot(px - x, py - y) <= ERASE_R;
    }));
    if (kept.length !== cur.strokes.length) persist({ ...cur, strokes: kept });
  };
  const onCanvasDown = (e) => {
    if (!drawMode || !e.isPrimary || e.button !== 0) return;
    // 손가락 입력은 사용자가 별도로 켠 경우에만 캡처한다. 기본 상태에서는 세로 스크롤/핀치 줌을 넘긴다.
    if (e.pointerType === 'touch' && !touchDrawing) return;
    e.preventDefault();
    activePointer.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y, width, height, point } = xy(e);
    if (tool === 'pen') {
      drawing.current = {
        color: penColor,
        width: PEN_WIDTH,
        coordinateSpace: NORMALIZED_COORDS,
        points: [point],
      };
      redraw();
    } else eraseStrokeAt(x, y, width, height);
  };
  const onCanvasMove = (e) => {
    if (activePointer.current !== e.pointerId) return;
    const { x, y, width, height, point } = xy(e);
    if (tool === 'pen' && drawing.current) { drawing.current.points.push(point); redraw(); }
    else if (tool === 'erase') eraseStrokeAt(x, y, width, height);
  };
  const finishCanvasPointer = (e, commit) => {
    if (activePointer.current !== e.pointerId) return;
    activePointer.current = null;
    const stroke = drawing.current;
    drawing.current = null;
    if (stroke && commit) persist({ ...dataRef.current, strokes: [...dataRef.current.strokes, stroke] });
    else if (stroke) redraw();
  };

  // ── 형광펜 / 밑줄 (텍스트 선택) ──
  const onPassagePointerUp = () => {
    if (tool !== 'hl' && tool !== 'ul') return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const host = passageRef.current;
    const adds = [];
    host.querySelectorAll('p[data-pi]').forEach((pe) => {
      if (!range.intersectsNode(pe)) return;
      const pi = Number(pe.getAttribute('data-pi'));
      const full = paragraphs[pi].length;
      let start = 0, end = full;
      if (pe.contains(range.startContainer)) start = paraOffset(pe, range.startContainer, range.startOffset);
      if (pe.contains(range.endContainer)) end = paraOffset(pe, range.endContainer, range.endOffset);
      start = Math.max(0, Math.min(start, full));
      end = Math.max(0, Math.min(end, full));
      if (end > start) adds.push({ para: pi, start, end, type: tool });
    });
    if (adds.length) persist({ ...dataRef.current, highlights: [...dataRef.current.highlights, ...adds] });
    sel.removeAllRanges();
  };

  // 지우개로 하이라이트 클릭 → 제거
  const onPassageClick = (e) => {
    if (tool !== 'erase') return;
    let node, off;
    if (document.caretRangeFromPoint) {
      const r = document.caretRangeFromPoint(e.clientX, e.clientY);
      if (r) { node = r.startContainer; off = r.startOffset; }
    } else if (document.caretPositionFromPoint) {
      const r = document.caretPositionFromPoint(e.clientX, e.clientY);
      if (r) { node = r.offsetNode; off = r.offset; }
    }
    if (!node) return;
    const pe = (node.nodeType === 3 ? node.parentElement : node)?.closest('p[data-pi]');
    if (!pe) return;
    const pi = Number(pe.getAttribute('data-pi'));
    const at = paraOffset(pe, node, off);
    const cur = dataRef.current;
    const kept = cur.highlights.filter((h) => !(h.para === pi && at >= h.start && at < h.end));
    if (kept.length !== cur.highlights.length) persist({ ...cur, highlights: kept });
  };

  const clearAll = async () => {
    if (!data.highlights.length && !data.strokes.length) return;
    if (await confirmAsync('이 지문의 메모(형광펜·밑줄·펜)를 모두 지울까요?', { title: '메모 전체 지우기', okLabel: '지우기', danger: true })) {
      persist({ highlights: [], strokes: [] });
    }
  };

  const selectTool = (id) => {
    setTool(id);
    if (id !== 'pen' && id !== 'erase') setTouchDrawing(false);
  };

  const btn = (id, label) => (
    <button type="button" className={'an-btn' + (tool === id ? ' on' : '')}
      onClick={() => selectTool(id)} aria-pressed={tool === id}>{label}</button>
  );

  const toolLabel = { none: '보기', hl: '형광펜', ul: '밑줄', pen: '펜', erase: '지우개' }[tool];
  const statusMessage = drawMode
    ? `${toolLabel} 도구 선택됨. ${touchDrawing ? '손가락 입력 켜짐.' : '손가락 입력 꺼짐. 화면을 스크롤할 수 있습니다.'}`
    : `${toolLabel} 도구 선택됨.`;

  return (
    <div className="exam-passage-col">
      <div className="an-bar" role="toolbar" aria-label="지문 메모 도구">
        {btn('none', '보기')}
        {btn('hl', '형광펜')}
        {btn('ul', '밑줄')}
        {btn('pen', '펜')}
        {tool === 'pen' && (
          <span className="an-colors">
            {PEN_COLORS.map((c) => (
              <button key={c} type="button" className={'an-color' + (penColor === c ? ' on' : '')}
                style={{ background: c }} aria-label={'펜 색상 ' + c} aria-pressed={penColor === c}
                onClick={() => setPenColor(c)} />
            ))}
          </span>
        )}
        {btn('erase', '지우개')}
        {drawMode && (
          <button type="button" className={'an-btn' + (touchDrawing ? ' on' : '')}
            onClick={() => setTouchDrawing((enabled) => !enabled)} aria-pressed={touchDrawing}
            aria-label={`손가락으로 ${tool === 'erase' ? '지우기' : '그리기'} ${touchDrawing ? '끄기' : '켜기'}`}>
            손가락 입력
          </button>
        )}
        <span className="an-spacer" />
        <button type="button" className="an-clear" onClick={clearAll}>전체 지우기</button>
      </div>

      <span role="status" aria-live="polite" aria-atomic="true" style={SR_ONLY_STYLE}>{statusMessage}</span>

      <div className={'an-stage' + (drawMode ? ' an-draw' : tool === 'hl' || tool === 'ul' ? ' an-mark' : '')}>
        <div className="exam-passage" ref={passageRef}
          onPointerUp={onPassagePointerUp} onClick={onPassageClick}>
          {paragraphs.map((p, i) => <p key={i} data-pi={i}>{renderParagraph(p, i, data.highlights)}</p>)}
        </div>
        <canvas ref={canvasRef} className="an-canvas"
          aria-hidden="true"
          style={{ pointerEvents: drawMode ? 'auto' : 'none', touchAction: touchDrawing ? 'none' : 'pan-y pinch-zoom' }}
          onPointerDown={onCanvasDown} onPointerMove={onCanvasMove}
          onPointerUp={(e) => finishCanvasPointer(e, true)}
          onPointerCancel={(e) => finishCanvasPointer(e, false)} />
      </div>
    </div>
  );
}
