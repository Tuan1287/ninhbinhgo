/* app.js — Phase 1 improvements
   - Requires: i18n.js, khudiem.js, khoangcach.js, luutru.js, nhahang.js, places.js, system.js loaded BEFORE this file.
   - Requires DOMPurify (loaded from CDN in index.html head).
   - Behaviors:
     * safeHtml() sanitizes model/html before innerHTML
     * showThinking() displays animated 'thinking' messages + dots
     * typewriter() types reply with variable speed and occasional pauses
     * addMsg(), typewriterMsg() adapted to use sanitize + thinking
*/

// === Helpers: sanitize output and small utilities ===
function safeHtml(html) {
  if (typeof DOMPurify === 'undefined') {
    // fallback: escape very basic
    return html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p','br','strong','em','ul','ol','li','a'],
    ALLOWED_ATTR: ['href','target','rel']
  });
  // ensure <a> have safe attributes
  const div = document.createElement('div');
  div.innerHTML = clean;
  div.querySelectorAll('a').forEach(a => {
    if (!a.getAttribute('target')) a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
  });
  return div.innerHTML;
}

function md(text) {
  // minimal markdown -> HTML used previously
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .split('\n\n').map(p => `<p>${p.replace(/\n/g,'<br>')}</p>`).join('');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function randBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// === Thinking animation ===
const THINKING_MSGS = {
  vi: ['Đang suy nghĩ…', 'Đang phân tích tuyến…', 'Đang tổng hợp thông tin…'],
  en: ['Thinking…', 'Analyzing route…', 'Synthesizing info…']
};
let _thinkingInterval = null;
function showThinking(bubbleEl, lang) {
  stopThinking();
  const msgs = THINKING_MSGS[lang] || THINKING_MSGS.vi;
  bubbleEl.innerHTML = `<span class="thinking-text">${msgs[0]}</span> <span class="thinking-dots"></span>`;
  const dotsEl = bubbleEl.querySelector('.thinking-dots');
  let i = 0;
  _thinkingInterval = setInterval(() => {
    // dots
    const dots = (new Date()).getSeconds() % 4; // simple change, still animated
    dotsEl.textContent = '.'.repeat(dots);
    // occasionally rotate message
    if (Math.random() < 0.12) {
      i = (i + 1) % msgs.length;
      bubbleEl.querySelector('.thinking-text').textContent = msgs[i];
    }
  }, 400);
}
function stopThinking() {
  if (_thinkingInterval) { clearInterval(_thinkingInterval); _thinkingInterval = null; }
}

// === Typewriter with variable speed and small pauses ===
let _typeCancelled = false;
function cancelTypewriter() { _typeCancelled = true; }
function typewriter(bubbleEl, fullText, opts = {}) {
  // fullText is raw reply text (we will pass markdown-converted HTML via md)
  // To progressively reveal, we slice the source text and pass through md -> safeHtml
  _typeCancelled = false;
  let i = 0;
  const baseDelay = opts.baseDelay || 20;
  const variance = opts.variance || 50;
  const pauseChance = opts.pauseChance || 0.02;

  function tick() {
    if (_typeCancelled) return;
    if (i >= fullText.length) {
      if (opts.onComplete) opts.onComplete();
      return;
    }
    i = Math.min(i + 1, fullText.length);
    const slice = fullText.slice(0, i);
    bubbleEl.innerHTML = safeHtml(md(slice));
    // compute delay with some variance and occasional pause
    let delay = baseDelay + Math.floor(Math.random() * variance);
    if (Math.random() < pauseChance) delay += 120 + Math.floor(Math.random() * 240);
    setTimeout(tick, delay);
  }
  // small randomized initial delay to simulate thinking->typing handoff
  setTimeout(tick, randBetween(120, 420));
}

// === Message UI helpers (replace previous addMsg/md integration) ===
function removeWelcome() {
  const w = document.getElementById('welcome');
  if (w) w.remove();
}

function addMsg(role, text) {
  removeWelcome();
  const wrap = document.getElementById('messages');
  const el = document.createElement('div');
  el.className = `msg ${role}`;

  const av = document.createElement('div');
  av.className = 'avatar';
  av.textContent = role === 'ai' ? '✦' : (typeof i18n !== 'undefined' ? i18n[lang].userAvatar : 'You');

  const b = document.createElement('div');
  b.className = 'bubble';

  if (role === 'ai') {
    // don't immediately render full HTML — caller will manage showThinking/typewriter
    b.innerHTML = ''; // placeholder
  } else {
    // user text is plain
    b.textContent = text;
  }

  if (role === 'user') { el.appendChild(b); el.appendChild(av); }
  else { el.appendChild(av); el.appendChild(b); }

  wrap.appendChild(el);
  wrap.scrollTop = wrap.scrollHeight;
  return b; // return bubble element for further updates
}

// === Show typing/ thinking placeholder (used before call returns) ===
function showTypingPlaceholder() {
  removeWelcome();
  const wrap = document.getElementById('messages');
  const el = document.createElement('div');
  el.className = 'msg ai'; el.id = 'typing';
  const av = document.createElement('div'); av.className = 'avatar'; av.textContent = '✦';
  const b = document.createElement('div'); b.className = 'bubble';
  b.innerHTML = '<div class="typing-wrap"><span class="dot"></span><span class="dot"></span><span class="dot"></span> <span class="typing-text">đang lên chương trình</span></div>';
  el.appendChild(av); el.appendChild(b);
  wrap.appendChild(el);
  wrap.scrollTop = wrap.scrollHeight;
  return b;
}

// === Typewriter message (integrates thinking + typing + actions like copy/map) ===
async function typewriterMsg(replyText, showMapBtn) {
  // replyText is raw text string (not HTML)
  removeWelcome();
  const wrap = document.getElementById('messages');
  const el = document.createElement('div'); el.className = 'msg ai';
  const av = document.createElement('div'); av.className = 'avatar'; av.textContent = '✦';
  const b  = document.createElement('div'); b.className  = 'bubble';
  el.appendChild(av); el.appendChild(b); wrap.appendChild(el);

  // show thinking animation in bubble first, then wait short randomized time
  showThinking(b, lang);
  await sleep(randBetween(200, 900));
  stopThinking();

  // then run typewriter
  const onComplete = () => {
    // after full text, append actions (copy & map)
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.5rem';

    // copy button
    const copyBtn = document.createElement('button'); copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(replyText).then(() => {
        copyBtn.classList.add('copied');
        copyBtn.textContent = 'Copied';
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyBtn.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
        }, 1600);
      });
    };
    actions.appendChild(copyBtn);

    // map button if requested (keep existing behavior)
    if (showMapBtn) {
      const routePlaces = extractRoutePlaces(replyText);
      const mapBtn = document.createElement('button'); mapBtn.className = 'map-btn';
      mapBtn.textContent = routePlaces.length >= 2
        ? (lang === 'vi' ? `🗺️ Xem lộ trình ${routePlaces.length} điểm` : `🗺️ View route — ${routePlaces.length} stops`)
        : (i18n && i18n[lang] ? i18n[lang].showMap : '🗺️ View map');
      mapBtn.onclick = () => openMap(routePlaces);
      actions.appendChild(mapBtn);
    }

    b.appendChild(actions);
    wrap.scrollTop = wrap.scrollHeight;
  };

  // kick off typewriter
  typewriter(b, replyText, { baseDelay: Math.max(8, Math.floor(1200 / Math.max(50, replyText.length))), variance: 40, onComplete });
  wrap.scrollTop = wrap.scrollHeight;
}

// === Replace original sendMessage flow to use showTypingPlaceholder & typewriterMsg ===
// We'll keep function name sendMessage to match UI handlers
async function sendMessage() {
  const inp  = document.getElementById('userInput');
  const text = inp.value.trim();
  if (!text) return;
  if (!apiKey) {
    document.getElementById('apiSetup').style.display = 'flex';
    alert(lang === 'vi' ? 'Vui lòng nhập Gemini API Key trước.' : 'Please enter your Gemini API Key first.');
    return;
  }
  inp.value = ''; inp.style.height = 'auto';
  document.getElementById('sendBtn').disabled = true;
  addMsg('user', text);
  history.push({ role: 'user', parts: [{ text }] });

  // show typing placeholder (small bubble with dots) while calling API
  const placeholderBubble = showTypingPlaceholder();

  try {
    const res = await callGemini();
    const d   = await res.json();
    document.getElementById('typing')?.remove();

    if (d.error) {
      const msg    = d.error.message || '';
      const isRate = msg.includes('quota') || msg.includes('rate') || msg.includes('429') || msg.includes('limit');
      addMsg('ai', isRate ? i18n[lang].rateLimitMsg : i18n[lang].errorMsg);
    } else {
      const reply   = d.candidates?.[0]?.content?.parts?.[0]?.text || (lang === 'vi' ? 'Xin lỗi, thử lại nhé!' : 'Sorry, please try again!');
      const showMap = isItinerary(text) || isItinerary(reply);
      // Show with improved thinking->typewriter
      await typewriterMsg(reply, showMap);
      history.push({ role: 'model', parts: [{ text: reply }] });
      if (history.length > 20) history = history.slice(-20);
    }
  } catch (e) {
    document.getElementById('typing')?.remove();
    addMsg('ai', i18n[lang].errorMsg);
    console.warn('sendMessage error:', e);
  }
  document.getElementById('sendBtn').disabled = false;
  inp.focus();
}

// --- Keep other functions from original script that were not moved (these are assumed present already):
// getSystemCached, callGemini, loadWeather, openMap, extractRoutePlaces, etc.
// In case those are defined earlier (system.js, other files), they remain as-is.
// If they were inside the inline script that we removed, ensure they are also ported to app.js.
// For safety, if some are undefined, the console will indicate it during testing.


// === Initialization (mirror previous init behavior) ===
document.addEventListener('DOMContentLoaded', () => {
  // preserve existing state loads in original script:
  if (apiKey) document.getElementById('apiSetup').style.display = 'none';
  applyLang();
  // loadWeather defined in original index inline; if moved here, ensure it exists
  if (typeof loadWeather === 'function') loadWeather();
});
