// ============================================================
//  NINH BÌNH AI — Application Logic
//  File: app.js
//
//  Phụ thuộc (load trước): i18n.js · khudiem.js · khoangcach.js
//                          luutru.js · nhahang.js · anvat.js
//                          places.js · system.js
//
//  Sơ đồ:
//  index.html  — cấu trúc HTML thuần
//  app.css     — toàn bộ style
//  app.js      — toàn bộ logic (file này)
//  i18n.js     — chuỗi UI song ngữ
//  system.js   — system prompt AI
//  places.js   — gộp data + context cho AI
//  khudiem/luutru/nhahang/anvat/khoangcach.js — raw data
// ============================================================

// ═══════════════════════════════════════════════════════
//  NINH BÌNH AI — Main Script
//  Thứ tự: khai báo state → định nghĩa TẤT CẢ functions
//  → INIT cuối cùng (sau khi mọi thứ đã ready)
// ═══════════════════════════════════════════════════════

// ── STATE ────────────────────────────────────────────
let lang         = localStorage.getItem('nb_lang') || 'vi';
let apiKey       = localStorage.getItem('nb_key') || '';
let history      = [];
let lastQuestion = '';
let leafletMap   = null, currentRouteLayer = null, currentMarkers = [];
let _sysCache    = {};
const MAX_TURNS  = 10; // giới hạn turns/phiên
let _weatherState = { temp: null, code: null }; // thời tiết realtime cho system prompt

// ── SYSTEM PROMPT CACHE ──────────────────────────────
function getSystemCached(l) {
  if (!_sysCache[l]) _sysCache[l] = getSystem(l) + getQualityRules(l);
  return _sysCache[l];
}

function getQualityRules(l) {
  return l === 'vi'
    ? `

QUY TẮC CHẤT LƯỢNG TRẢ LỜI:
- KHÔNG bịa đặt: Nếu không có thông tin chính xác về giá, giờ, địa chỉ trong data → nói rõ "tôi không chắc về thông tin này, bạn nên kiểm tra lại trực tiếp" thay vì đoán
- ĐỘ DÀI PHÙ HỢP: Câu hỏi đơn giản (1 địa điểm, 1 thông tin) → trả lời ngắn gọn 2-4 câu. Chỉ trả lời dài khi hỏi lịch trình, so sánh nhiều lựa chọn, hoặc user yêu cầu chi tiết
- KHÔNG lặp lại thông tin đã nói trong cùng đoạn chat
- KHÔNG thêm disclaimer dài dòng cuối mỗi câu trả lời`
    : `

RESPONSE QUALITY RULES:
- NO fabrication: If exact price, hours, or address not in provided data → say "I'm not certain about this, please verify directly" instead of guessing
- CALIBRATE LENGTH: Simple questions (1 place, 1 fact) → short 2-4 sentence answer. Only give long answers for itineraries, comparisons, or when detail is requested
- DO NOT repeat information already given in the same conversation
- DO NOT add lengthy disclaimers at the end of each response`;
}

// ── LỊCH SỬ CHAT ────────────────────────────────────
function saveHistory() {
  try {
    localStorage.setItem('nb_history', JSON.stringify({ history, ts: Date.now() }));
  } catch(e) {}
}

// Analytics chip — đếm lần nhấn, lưu local (không gửi server)
function trackChip(label) {
  try {
    const key  = 'nb_chip_stats';
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    data[label] = (data[label] || 0) + 1;
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}
function loadHistory() {
  try {
    const raw = localStorage.getItem('nb_history');
    if (!raw) return;
    const { history: h, ts } = JSON.parse(raw);
    if (!h || !h.length) return;
    if (Date.now() - ts > 2 * 86400000) { localStorage.removeItem('nb_history'); return; }
    history = h;
    document.getElementById('welcome')?.remove();
    // Badge báo đây là lịch sử chat cũ
    const wrap = document.getElementById('messages');
    const badge = document.createElement('div');
    badge.style.cssText = 'text-align:center;font-size:.7rem;color:var(--muted);padding:.4rem 0 .6rem;font-style:italic;opacity:.7';
    badge.textContent = lang === 'vi' ? '── Cuộc trò chuyện trước ──' : '── Previous conversation ──';
    wrap.appendChild(badge);
    history.forEach(m => {
      if (m.role === 'user')  addMsgRaw('user', m.parts[0].text);
      if (m.role === 'model') addMsgRaw('ai',   m.parts[0].text);
    });
  } catch(e) { localStorage.removeItem('nb_history'); }
  updateTurnCounter();
}

// ── LAZY LEAFLET ─────────────────────────────────────
function ensureLeaflet() {
  return new Promise(resolve => {
    if (typeof L !== 'undefined') { resolve(); return; }
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const js = document.createElement('script');
    js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    js.onload = resolve;
    document.head.appendChild(js);
  });
}

// ── WEATHER (cache 1h) ───────────────────────────────
async function loadWeather() {
  try {
    const raw = localStorage.getItem('nb_weather');
    if (raw) {
      const { temp, code, ts } = JSON.parse(raw);
      if (Date.now() - ts < 3600000) { renderWeather(temp, code); return; }
    }
    const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=20.2513&longitude=105.9745&current=temperature_2m,weather_code&timezone=Asia%2FBangkok');
    const d = await r.json();
    const temp = Math.round(d.current.temperature_2m), code = d.current.weather_code;
    localStorage.setItem('nb_weather', JSON.stringify({ temp, code, ts: Date.now() }));
    renderWeather(temp, code);
  } catch {
    document.getElementById('weatherIcon').textContent = '🌤️';
    document.getElementById('weatherTemp').textContent = '--°C';
  }
}
function renderWeather(temp, code) {
  _weatherState = { temp, code };
  _sysCache = {}; // reset cache để system prompt cập nhật thời tiết mới
  const { icon, desc } = weatherInfo(code, lang);
  document.getElementById('weatherIcon').textContent = icon;
  document.getElementById('weatherTemp').textContent = `${temp}°C`;
  document.getElementById('weatherDesc').textContent = desc;
}
function weatherInfo(code, l) {
  const map = l === 'vi'
    ? [[0,'☀️','Trời quang'],[1,'🌤️','Ít mây'],[2,'⛅','Có mây'],[3,'☁️','Nhiều mây'],
       [45,'🌫️','Sương mù'],[51,'🌦️','Mưa phùn'],[61,'🌧️','Mưa nhẹ'],[71,'🌨️','Mưa tuyết'],
       [80,'🌦️','Mưa rào'],[95,'⛈️','Giông bão']]
    : [[0,'☀️','Clear'],[1,'🌤️','Mainly clear'],[2,'⛅','Partly cloudy'],[3,'☁️','Overcast'],
       [45,'🌫️','Foggy'],[51,'🌦️','Drizzle'],[61,'🌧️','Light rain'],[71,'🌨️','Snow'],
       [80,'🌦️','Showers'],[95,'⛈️','Thunderstorm']];
  const found = map.slice().reverse().find(([c]) => code >= c);
  return found ? { icon: found[1], desc: found[2] } : { icon: '🌤️', desc: 'OK' };
}

// ── MAP ──────────────────────────────────────────────
function openMap(routePlaces) {
  document.getElementById('mapModal').classList.add('open');
  document.getElementById('mapTitle').textContent = i18n[lang].mapTitle;
  ensureLeaflet().then(() => {
    if (!leafletMap) {
      leafletMap = L.map('map').setView([20.27, 105.93], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(leafletMap);
    } else { leafletMap.invalidateSize(); }

    currentMarkers.forEach(m => leafletMap.removeLayer(m)); currentMarkers = [];
    if (currentRouteLayer) { leafletMap.removeLayer(currentRouteLayer); currentRouteLayer = null; }

    const list    = (routePlaces && routePlaces.length) ? routePlaces : PLACES;
    const isRoute = routePlaces && routePlaces.length > 0;

    list.forEach((p, idx) => {
      const size = isRoute ? 26 : 14;
      const html = isRoute
        ? `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${p.color};border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;font-family:sans-serif">${idx+1}</div>`
        : `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${p.color};border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`;
      const marker = L.marker([p.lat, p.lng], {
        icon: L.divIcon({ className:'', html, iconSize:[size,size], iconAnchor:[size/2,size/2] })
      }).addTo(leafletMap)
        .bindPopup(`<strong>${isRoute ? `${idx+1}. ` : ''}${p.name}</strong><br><span style="font-size:.85em;color:#666">${p.note||''}</span>`);
      currentMarkers.push(marker);
    });

    if (list.length) leafletMap.fitBounds(L.latLngBounds(list.map(p => [p.lat, p.lng])), { padding:[40,40] });
    if (isRoute && list.length >= 2) drawRoute(list);
  });
}
async function drawRoute(places) {
  try {
    const coords = places.map(p => `${p.lng},${p.lat}`).join(';');
    const data = await (await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`)).json();
    if (data.code !== 'Ok' || !data.routes[0]) return;
    const dist = (data.routes[0].distance / 1000).toFixed(1);
    const mins = Math.round(data.routes[0].duration / 60);
    currentRouteLayer = L.geoJSON(data.routes[0].geometry, {
      style: { color:'#3b82f6', weight:4, opacity:.8 }
    }).addTo(leafletMap);
    leafletMap.fitBounds(currentRouteLayer.getBounds(), { padding:[40,40] });
    const leg = document.querySelector('.map-legend');
    if (leg) {
      let ri = document.getElementById('routeInfo');
      if (!ri) { ri = document.createElement('span'); ri.id = 'routeInfo'; ri.style.cssText = 'color:#3b82f6;font-weight:500;margin-left:auto'; leg.appendChild(ri); }
      ri.textContent = `🚗 ${dist} km · ~${mins} ${lang === 'vi' ? 'phút' : 'min'}`;
    }
  } catch(e) { console.warn('OSRM:', e); }
}
function extractRoutePlaces(text) {
  const lower = text.toLowerCase();
  const map = {
    // Tham quan
    'tràng an':'Tràng An','trang an':'Tràng An',
    'hang múa':'Hang Múa','hang mua':'Hang Múa',
    'tam cốc':'Tam Cốc','tam coc':'Tam Cốc',
    'cố đô hoa lư':'Cố đô Hoa Lư','phố cổ hoa lư':'Cố đô Hoa Lư',
    'hoa lư':'Cố đô Hoa Lư','hoa lu':'Cố đô Hoa Lư',
    'chùa bái đính':'Chùa Bái Đính','bái đính':'Chùa Bái Đính','bai dinh':'Chùa Bái Đính',
    'thung ui':'Thung Ui','thung nham':'Khu du lịch sinh thái Thung Nham',
    // Nhà hàng
    'heo say xỉn':'Heo Say Xỉn (GC22-23)','heo say xin':'Heo Say Xỉn (GC22-23)',
    'lẩu gà':'Lẩu Gà Lá É (GC57-58)','lau ga':'Lẩu Gà Lá É (GC57-58)',
    'đại long':'Đại Long Building — Cơm Cháy','dai long':'Đại Long Building — Cơm Cháy',
    'dê chính thư':'Dê Chính Thư (Tràng An)','chính thư':'Dê Chính Thư (Tràng An)',
    'ba cửa':'Nhà hàng Ba Cửa','ba cua':'Nhà hàng Ba Cửa',
    'dũng phố núi':'Dũng Phố Núi','hoàng giang':'Nhà hàng Hoàng Giang',
    'chookie':"Chookie's Beer Garden",
    'mona lisa':'Mona Lisa Tam Coc',
    'heli coffee':'Tầng 6 Heli Coffee',
    'the aria':'The Aria Cafe','aria cafe':'The Aria Cafe',
    // Ăn vặt
    'kem xôi thanh hằng':'Kem Xôi Thanh Hằng','kem xôi':'Kem Xôi Thanh Hằng',
    'bánh mì cố đô':'Bánh Mì Cố Đô',
    'đức trọc':'Thịt Xiên Nướng Đức Trọc','xiên nướng':'Thịt Xiên Nướng Đức Trọc',
    'chè bưởi an giang':'Chè Bưởi An Giang',
    'bánh rán phố cổ':'Bánh Rán Phố Cổ',
    'nem nướng nha trang':'Nem Nướng Nha Trang',
    // Khách sạn
    'legend hotel':'Legend Hotel','the reed':'The Reed Hotel',
    'milan hotel':'Milan Hotel','rêu coffee':'Rêu Coffee & Stay','reu coffee':'Rêu Coffee & Stay',
    'hang mua ecolodge':'Hang Mua Ecolodge','tràng an retreat':'Tràng An Retreat',
  };
  const pos = [], seen = new Set();
  for (const [key, name] of Object.entries(map)) {
    const idx = lower.indexOf(key);
    if (idx !== -1 && !seen.has(name)) { pos.push({ idx, name }); seen.add(name); }
  }
  return pos.sort((a,b) => a.idx - b.idx)
    .map(({ name }) => PLACES.find(p => p.name === name)).filter(Boolean);
}
function closeMap() {
  document.getElementById('mapModal').classList.remove('open');
  document.getElementById('routeInfo')?.remove();
}
document.getElementById('mapModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeMap();
});

// ── ACTIONS ──────────────────────────────────────────
function clearChat() {
  if (!confirm(i18n[lang].clearConfirm)) return;
  history = []; localStorage.removeItem('nb_history'); rebuildWelcome(); updateTurnCounter();
}
function resetKey() {
  if (!confirm(i18n[lang].keyConfirm)) return;
  apiKey = ''; localStorage.removeItem('nb_key');
  document.getElementById('apiKeyInput').value = '';
  document.getElementById('apiSetup').style.display = 'flex';
}
function resetChat() { history = []; localStorage.removeItem('nb_history'); rebuildWelcome(); updateTurnCounter(); }
function rebuildWelcome() {
  document.getElementById('messages').innerHTML = `<div class="welcome" id="welcome"><h1 class="welcome-heading" id="welcomeHeading"></h1><p class="welcome-sub" id="welcomeSub"></p><div class="suggestions" id="sugGrid"></div></div>`;
  applyLang();
}

// ── LANG ─────────────────────────────────────────────
function toggleLang() {
  lang = lang === 'vi' ? 'en' : 'vi';
  localStorage.setItem('nb_lang', lang);
  _sysCache = {};
  applyLang(); loadWeather(); updateTurnCounter();
}
function applyLang() {
  const t = i18n[lang];
  document.getElementById('brandTag').textContent      = t.brandTag;
  document.getElementById('disclaimer').textContent    = t.disclaimer;
  document.getElementById('langBtn').textContent       = t.langBtn;
  document.getElementById('userInput').placeholder     = t.placeholder;
  document.getElementById('hintText').textContent      = t.hint;
  document.getElementById('apiText').innerHTML         = t.apiText;
  document.getElementById('apiConnectBtn').textContent = t.apiBtn;
  document.getElementById('clearBtn').setAttribute('data-tip', t.clearTip);
  document.getElementById('keyBtn').setAttribute('data-tip', t.keyTip);
  document.getElementById('mapTitle').textContent      = t.mapTitle;
  const wh = document.getElementById('welcomeHeading'); if (wh) wh.innerHTML = t.welcomeH;
  const ws = document.getElementById('welcomeSub');     if (ws) ws.textContent = t.welcomeSub;
  const nav = document.getElementById('topicsNav'); nav.innerHTML = '';
  t.chips.forEach((label, i) => {
    const btn = document.createElement('button'); btn.className = 'chip';
    btn.textContent = label;
    btn.onclick = () => { trackChip(label); quickAsk(t.chipQ[i], label); };
    nav.appendChild(btn);
  });
  const grid = document.getElementById('sugGrid');
  if (grid) {
    grid.innerHTML = '';
    t.sug.forEach(s => {
      const btn = document.createElement('button'); btn.className = 'sug-btn';
      btn.innerHTML = `<span class="sug-icon">${s.icon}</span><span class="sug-text">${s.text}</span><span class="sug-label">${s.label}</span>`;
      btn.onclick = () => { trackChip(s.text); quickAsk(s.q, s.text); }; grid.appendChild(btn);
    });
  }
}

// ── API KEY ──────────────────────────────────────────
function saveKey() {
  const v = document.getElementById('apiKeyInput').value.trim();
  if (!v.startsWith('AIza')) {
    alert(lang === 'vi' ? 'Key không hợp lệ (phải bắt đầu bằng AIza...)' : 'Invalid key (must start với AIza...)');
    return;
  }
  apiKey = v;
  localStorage.setItem('nb_key', v);
  document.getElementById('apiSetup').style.display = 'none';
}

// ── SCROLL TO BOTTOM ─────────────────────────────────
function scrollToBottom() {
  const msg = document.getElementById('messages');
  msg.scrollTop = msg.scrollHeight;
  document.getElementById('scrollBtn').classList.remove('show');
}

// ── TURN COUNTER ─────────────────────────────────────
function updateTurnCounter() {
  const turns    = history.filter(m => m.role === 'user').length;
  const el       = document.getElementById('turnCounter');
  const bar      = document.getElementById('turnBar');
  const fill     = document.getElementById('turnBarFill');
  const remaining = MAX_TURNS - turns;
  const pct      = Math.min((turns / MAX_TURNS) * 100, 100);

  // Progress bar trên header
  if (fill) fill.style.width = pct + '%';
  if (bar)  bar.className = remaining <= 0 ? 'full' : remaining <= 3 ? 'warn' : '';

  if (!el) return;
  if (remaining <= 0) {
    el.textContent = lang === 'vi' ? '🔒 Đã đủ 10 câu — nhấn 🗑️ để chat mới' : '🔒 10/10 — press 🗑️ for new chat';
    el.className = 'turn-counter full';
    document.getElementById('sendBtn').disabled = true;
    document.getElementById('userInput').disabled = true;
    document.getElementById('userInput').placeholder = lang === 'vi' ? 'Nhấn 🗑️ để bắt đầu đoạn chat mới' : 'Press 🗑️ to start a new chat';
  } else if (remaining <= 3) {
    el.textContent = lang === 'vi' ? `Còn ${remaining} câu hỏi` : `${remaining} left`;
    el.className = 'turn-counter warn';
    document.getElementById('sendBtn').disabled = false;
    document.getElementById('userInput').disabled = false;
  } else if (turns > 0) {
    el.textContent = lang === 'vi' ? `${turns}/10 câu hỏi` : `${turns}/10`;
    el.className = 'turn-counter';
    document.getElementById('sendBtn').disabled = false;
    document.getElementById('userInput').disabled = false;
  } else {
    el.textContent = '';  // ẩn counter khi chưa hỏi gì
    el.className = 'turn-counter';
    document.getElementById('sendBtn').disabled = false;
    document.getElementById('userInput').disabled = false;
  }
}
document.getElementById('messages').addEventListener('scroll', function() {
  const atBottom = this.scrollHeight - this.scrollTop - this.clientHeight < 60;
  document.getElementById('scrollBtn').classList.toggle('show', !atBottom);
});

// Ẩn scroll hint khi user scroll topics lần đầu
(function() {
  const nav = document.getElementById('topicsNav');
  const hint = document.getElementById('scrollHint');
  if (!nav || !hint) return;
  // Ẩn hint nếu topics không overflow (không cần scroll)
  setTimeout(() => {
    if (nav.scrollWidth <= nav.clientWidth) hint.classList.add('hide');
  }, 500);
  nav.addEventListener('scroll', function onScroll() {
    hint.classList.add('hide');
    nav.removeEventListener('scroll', onScroll);
  }, { once: true });
})();

// ── HELPERS ──────────────────────────────────────────
function quickAsk(promptText, displayText) {
  // displayText: hiển thị ngắn gọn lên chat (ví dụ: "Lịch trình 2 ngày 1 đêm")
  // promptText:  prompt đầy đủ gửi AI (ngầm, không hiện)
  document.getElementById('userInput').value = promptText;
  sendMessage(null, displayText || promptText);
}
function handleKey(e)    { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }
function autoResize(el)  { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 100) + 'px'; }
function removeWelcome() {
  const w = document.getElementById('welcome');
  if (!w) return;
  w.classList.add('fading');
  setTimeout(() => w.remove(), 260); // khớp với transition .25s
}
function isItinerary(t)  {
  return ['lịch trình','itinerary','ngày 1','ngày 2','day 1','day 2','checkin','check-in',
          'tham quan','schedule','trốn phố','escape','foodtour','food tour','ăn vặt','đặc sản']
    .some(k => t.toLowerCase().includes(k));
}
function md(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .split('\n\n').map(p => `<p>${p.replace(/\n/g,'<br>')}</p>`).join('');
}

// ── RENDER MESSAGE ───────────────────────────────────
const SVG_COPY  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
const SVG_CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

function _buildMsgEl(role, text) {
  const el = document.createElement('div'); el.className = `msg ${role}`;
  const av = document.createElement('div'); av.className = 'avatar';
  av.textContent = role === 'ai' ? '✦' : i18n[lang].userAvatar;
  const b  = document.createElement('div'); b.className  = 'bubble';
  if (role === 'ai') b.innerHTML = md(text); else b.textContent = text;
  if (role === 'user') { el.appendChild(b); el.appendChild(av); }
  else                 { el.appendChild(av); el.appendChild(b); }
  return el;
}
// Chat đang diễn ra — xóa welcome, scroll xuống
function addMsg(role, text) {
  removeWelcome();
  const wrap = document.getElementById('messages');
  wrap.appendChild(_buildMsgEl(role, text));
  wrap.scrollTop = wrap.scrollHeight;
}
// Render lịch sử — welcome đã xóa trước, không scroll
function addMsgRaw(role, text) {
  document.getElementById('messages').appendChild(_buildMsgEl(role, text));
}
// Lỗi — kèm nút Thử lại
function addMsgWithRetry(role, text, showRetry) {
  removeWelcome();
  const wrap = document.getElementById('messages');
  const el   = _buildMsgEl(role, text);
  if (showRetry && lastQuestion) {
    const b = el.querySelector('.bubble');
    const retryBtn = document.createElement('button');
    retryBtn.className = 'copy-btn';
    retryBtn.style.marginTop = '.5rem';
    retryBtn.textContent = lang === 'vi' ? '↺ Thử lại' : '↺ Retry';
    retryBtn.onclick = () => {
      el.remove();
      if (history.length && history[history.length - 1].role === 'user') history.pop();
      sendMessage(lastQuestion);
    };
    b.appendChild(retryBtn);
  }
  wrap.appendChild(el);
  wrap.scrollTop = wrap.scrollHeight;
}

function showTyping() {
  removeWelcome();
  const wrap = document.getElementById('messages');
  const el = document.createElement('div'); el.className = 'msg ai'; el.id = 'typing';
  const av = document.createElement('div'); av.className = 'avatar'; av.textContent = '✦';
  const b  = document.createElement('div'); b.className  = 'bubble';
  const typingPhrases = {
    vi: ['đang lên chương trình...', 'đang tra cứu thông tin...', 'đang xem xét...', 'để mình nghĩ xem...'],
    en: ['planning your trip...', 'looking up info...', 'thinking it through...', 'let me check...'],
  };
  const phrase = typingPhrases[lang][Math.floor(Math.random() * typingPhrases[lang].length)];
  b.innerHTML = `<div class="typing-indicator"><div class="typing-dots"><i></i><i></i><i></i></div><span>${phrase}</span></div>`;
  el.appendChild(av); el.appendChild(b);
  wrap.appendChild(el); wrap.scrollTop = wrap.scrollHeight;
}

// ── ACTION BUTTONS ────────────────────────────────────
function makeCopyBtn(text) {
  const btn = document.createElement('button'); btn.className = 'copy-btn';
  btn.innerHTML = SVG_COPY; btn.title = lang === 'vi' ? 'Sao chép' : 'Copy';
  btn.onclick = () => {
    navigator.clipboard.writeText(text).then(() => {
      btn.classList.add('copied'); btn.innerHTML = SVG_CHECK;
      setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = SVG_COPY; }, 2000);
    });
  };
  return btn;
}

// -- HELPER: them action buttons vao bubble ---
function addMsgActions(bubble, text, showMapBtn) {
  const actions = document.createElement('div');
  actions.className = 'msg-actions';
  actions.appendChild(makeCopyBtn(text));
  if (showMapBtn) {
    const rp     = extractRoutePlaces(text);
    const mapBtn = document.createElement('button');
    mapBtn.className   = 'map-btn';
    mapBtn.textContent = rp.length >= 2
      ? (lang === 'vi' ? `🗺️ Xem lo trinh ${rp.length} diem` : `🗺️ View route -- ${rp.length} stops`)
      : i18n[lang].showMap;
    mapBtn.onclick = () => openMap(rp);
    actions.appendChild(mapBtn);
  }
  bubble.appendChild(actions);
}

// -- TYPEWRITER --
function typewriterMsg(text, showMapBtn) {
  removeWelcome();
  const wrap = document.getElementById('messages');
  const el   = document.createElement('div'); el.className = 'msg ai';
  const av   = document.createElement('div'); av.className = 'avatar'; av.textContent = '\u2756';
  const b    = document.createElement('div'); b.className  = 'bubble';
  el.appendChild(av); el.appendChild(b); wrap.appendChild(el);

  if (document.hidden) {
    b.innerHTML = md(text);
    addMsgActions(b, text, showMapBtn);
    return;
  }

  let i = 0;
  const step = text.length < 200 ? 4 : Math.max(6, Math.ceil(text.length / 200));

  function tick() {
    if (document.hidden || i >= text.length) {
      b.innerHTML = md(text);
      addMsgActions(b, text, showMapBtn);
      wrap.scrollTop = wrap.scrollHeight;
      return;
    }
    i = Math.min(i + step, text.length);
    b.innerHTML = md(text.slice(0, i)) + '<span class="tw-cursor">\u25CB</span>';
    wrap.scrollTop = wrap.scrollHeight;
    setTimeout(tick, 18);
  }
  setTimeout(tick, 0);
}

// -- STREAM BUBBLE: chi tao khi co chunk dau tien --
function createStreamBubble() {
  removeWelcome();
  const wrap = document.getElementById('messages');
  const el   = document.createElement('div'); el.className = 'msg ai';
  const av   = document.createElement('div'); av.className = 'avatar'; av.textContent = '\u2756';
  const b    = document.createElement('div'); b.className  = 'bubble';
  el.appendChild(av); el.appendChild(b); wrap.appendChild(el);
  return { wrap, b };
}

// ── GEMINI API CONFIG ─────────────────────────────────
const MODELS   = ['gemini-2.5-flash', 'gemini-2.0-flash'];
let _modelIdx  = 0;

function getApiUrl(stream = true) {
  const model  = MODELS[_modelIdx] || MODELS[0];
  const action = stream ? 'streamGenerateContent?alt=sse' : 'generateContent';
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:${action}&key=${apiKey}`;
}

function buildBody() {
  // Chỉ gửi 8 turns gần nhất — giảm token, tăng tốc
  const MAX_CTX  = 8;
  const ctx      = history.slice(-MAX_CTX);
  const startIdx = ctx.findIndex(m => m.role === 'user');
  const contents = startIdx > 0 ? ctx.slice(startIdx) : ctx;
  return JSON.stringify({
    system_instruction: { parts: [{ text: getSystemCached(lang) }] },
    contents,
    generationConfig: { temperature: 0.8, maxOutputTokens: 8192 },
  });
}

async function sendMessage(retryText, displayText) {
  const inp  = document.getElementById('userInput');
  const text = retryText || inp.value.trim();
  if (!text) return;

  if (history.filter(m => m.role === 'user').length >= MAX_TURNS) { updateTurnCounter(); return; }
  if (!apiKey) {
    document.getElementById('apiSetup').style.display = 'flex';
    alert(lang === 'vi' ? 'Vui lòng nhập Gemini API Key trước.' : 'Please enter your Gemini API Key first.');
    return;
  }

  lastQuestion = text;
  inp.value = ''; inp.style.height = 'auto';
  document.getElementById('sendBtn').disabled = true;
  addMsg('user', displayText || text);
  history.push({ role:'user', parts:[{ text }] });
  updateTurnCounter();
  showTyping();

  const reply = await fetchWithStream(text);

  document.getElementById('typing')?.remove();

  if (reply === null) {
    addMsgWithRetry('ai', i18n[lang].errorMsg, true);
  } else if (reply === 'RATE') {
    addMsgWithRetry('ai', i18n[lang].rateLimitMsg, false);
  }

  document.getElementById('sendBtn').disabled = false;
  inp.focus();
}

// Gọi Gemini API (non-streaming ổn định + typewriter effect giả lập)
async function fetchWithStream(userText) {
  // Thử tối đa 3 lần, đổi model sau mỗi lần 503
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      _modelIdx = Math.min(_modelIdx + 1, MODELS.length - 1);
      await new Promise(r => setTimeout(r, 1500));
    }
    try {
      const res = await fetch(getApiUrl(false), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: buildBody(),
      });
      if (res.status === 429) return 'RATE';
      if (res.status === 503) continue;
      if (!res.ok) continue;
      const d = await res.json();
      if (d.error) {
        const isRate = (d.error.message||'').match(/quota|rate|429|limit/i);
        return isRate ? 'RATE' : null;
      }
      const reply = d.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) {
        document.getElementById('typing')?.remove();
        typewriterMsg(reply, isItinerary(userText) || isItinerary(reply));
        history.push({ role:'model', parts:[{ text: reply }] });
        if (history.length > 20) history = history.slice(-20);
        saveHistory(); updateTurnCounter();
        _modelIdx = 0;
        return 'DONE';
      }
    } catch(e) { console.warn('Attempt', attempt, e); }
  }
  return null;
}

// ══════════════════════════════════════════════════════
//  INIT — chạy SAU KHI tất cả functions đã định nghĩa
// ══════════════════════════════════════════════════════
if (apiKey) document.getElementById('apiSetup').style.display = 'none';
applyLang();
loadWeather();
loadHistory();
setTimeout(() => getSystemCached(lang), 2000); // pre-warm system prompt
updateTurnCounter();
