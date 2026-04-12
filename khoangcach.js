// ============================================================
//  NINH BÌNH AI — Khoảng cách đường bộ thực tế
//  File: khoangcach.js
//
//  Dùng OSRM Table API (miễn phí) để tính ma trận khoảng cách
//  giữa tất cả địa điểm chỉ bằng 1 request duy nhất.
//  Kết quả được cache vào localStorage 7 ngày.
//
//  Tự động cập nhật khi bạn thêm địa điểm mới vào các file data.
// ============================================================

const DISTANCE_CACHE_KEY = 'nb_distances';
const DISTANCE_CACHE_DAYS = 7;

// Kết quả tính toán — được gán sau khi load xong
let DISTANCE_MATRIX = null; // { 'NameA|NameB': { km, mins } }
let distanceContextVI = '';
let distanceContextEN = '';

// ── KHỞI ĐỘNG ────────────────────────────────────────────
async function initDistances() {
  // Thử dùng cache trước
  const cached = localStorage.getItem(DISTANCE_CACHE_KEY);
  if (cached) {
    try {
      const { matrix, ts } = JSON.parse(cached);
      if (Date.now() - ts < DISTANCE_CACHE_DAYS * 86400000) {
        DISTANCE_MATRIX = matrix;
        buildContextFromMatrix();
        return;
      }
    } catch {}
  }

  // Gọi OSRM Table API
  await fetchOSRMMatrix();
}

// ── LẤY TẤT CẢ ĐIỂM CẦN TÍNH ────────────────────────────
function getAllPoints() {
  const points = [];

  // Tham quan (priority)
  ATTRACTIONS.filter(p => p.priority).forEach(p => {
    points.push({ name: p.name, nameEn: p.nameEn, lat: p.lat, lng: p.lng, type: 'attraction' });
  });

  // Lưu trú (priority)
  HOTELS.filter(p => p.priority).forEach(p => {
    points.push({ name: p.name, nameEn: p.nameEn, lat: p.lat, lng: p.lng, type: 'hotel' });
  });

  // Nhà hàng & Shop (priority)
  RESTAURANTS.filter(p => p.priority).forEach(p => {
    points.push({ name: p.name, nameEn: p.nameEn, lat: p.lat, lng: p.lng, type: p.type });
  });

  // Thêm điểm xuất phát Hà Nội
  points.push({ name: 'Hà Nội (trung tâm)', nameEn: 'Hanoi (center)', lat: 21.0285, lng: 105.8542, type: 'origin' });

  return points;
}

// ── GỌI OSRM TABLE API ───────────────────────────────────
async function fetchOSRMMatrix() {
  const points = getAllPoints();
  const coords = points.map(p => `${p.lng},${p.lat}`).join(';');

  try {
    const url = `https://router.project-osrm.org/table/v1/driving/${coords}?annotations=duration,distance`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.code !== 'Ok') {
      console.warn('OSRM Table API error:', data.code);
      return;
    }

    // Xây dựng ma trận
    const matrix = {};
    const n = points.length;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const distM = data.distances[i][j];   // mét
        const durS  = data.durations[i][j];   // giây
        if (!distM || !durS) continue;

        const key = `${points[i].name}|${points[j].name}`;
        matrix[key] = {
          km:   Math.round(distM / 100) / 10,       // làm tròn 0.1km
          mins: Math.ceil(durS / 60 / 5) * 5,       // làm tròn lên 5 phút
        };
      }
    }

    // Lưu cache
    localStorage.setItem(DISTANCE_CACHE_KEY, JSON.stringify({
      matrix,
      ts: Date.now(),
      pointCount: n,
    }));

    DISTANCE_MATRIX = matrix;
    buildContextFromMatrix();

  } catch (e) {
    console.warn('OSRM fetch failed, skipping distance context:', e);
  }
}

// ── XÂY DỰNG CONTEXT CHO AI ──────────────────────────────
function buildContextFromMatrix() {
  if (!DISTANCE_MATRIX) return;

  const attractions = ATTRACTIONS.filter(p => p.priority);
  const hotels      = HOTELS.filter(p => p.priority);
  const foods       = RESTAURANTS.filter(p => p.priority && p.type === 'food');

  // Tiếng Việt
  distanceContextVI = buildContext('vi', attractions, hotels, foods);
  // Tiếng Anh
  distanceContextEN = buildContext('en', attractions, hotels, foods);
}

function buildContext(lang, attractions, hotels, foods) {
  const isVi = lang === 'vi';

  let out = isVi
    ? '\n\nKHOẢNG CÁCH ĐƯỜNG BỘ THỰC TẾ (tính từ OSRM, dùng để lập lịch trình chính xác):\n'
    : '\n\nACTUAL ROAD DISTANCES (calculated by OSRM, use for accurate itinerary planning):\n';

  // 1. Khoảng cách từ Hà Nội đến TP Ninh Bình
  const hn = 'Hà Nội (trung tâm)';
  const checkFirst = attractions[0];
  if (checkFirst) {
    const d = DISTANCE_MATRIX[`${hn}|${checkFirst.name}`];
    if (d) {
      out += isVi
        ? `- Hà Nội → Ninh Bình: ~${d.km}km, ~${d.mins} phút (xe máy/ô tô)\n`
        : `- Hanoi → Ninh Binh: ~${d.km}km, ~${d.mins} min (motorbike/car)\n`;
    }
  }

  // 2. Khoảng cách giữa các điểm tham quan
  out += isVi ? '\nGiữa các điểm tham quan:\n' : '\nBetween attractions:\n';
  for (let i = 0; i < attractions.length; i++) {
    for (let j = i + 1; j < attractions.length; j++) {
      const a = attractions[i];
      const b = attractions[j];
      const key = `${a.name}|${b.name}`;
      const d = DISTANCE_MATRIX[key];
      if (!d) continue;
      const na = isVi ? a.name : a.nameEn;
      const nb = isVi ? b.name : b.nameEn;
      out += `- ${na} ↔ ${nb}: ~${d.km}km, ~${d.mins} ${isVi ? 'phút' : 'min'}\n`;
    }
  }

  // 3. Khoảng cách từ khách sạn đến các điểm tham quan gần nhất
  out += isVi
    ? '\nTừ cơ sở lưu trú đến điểm tham quan gần nhất:\n'
    : '\nFrom accommodation to nearest attractions:\n';

  hotels.forEach(h => {
    const nearest = [];
    attractions.forEach(a => {
      const d = DISTANCE_MATRIX[`${h.name}|${a.name}`];
      if (d) nearest.push({ name: isVi ? a.name : a.nameEn, ...d });
    });
    nearest.sort((a, b) => a.km - b.km);
    const top3 = nearest.slice(0, 3);
    if (!top3.length) return;

    const hn = isVi ? h.name : h.nameEn;
    const list = top3.map(x => `${x.name} (~${x.km}km, ~${x.mins}${isVi ? 'p' : 'min'})`).join(', ');
    out += `- ${hn}: gần ${list}\n`;
  });

  // 4. Khoảng cách từ nhà hàng đến điểm tham quan (để gợi ý ăn sau khi tham quan)
  out += isVi
    ? '\nNhà hàng gần điểm tham quan:\n'
    : '\nRestaurants near attractions:\n';

  attractions.forEach(a => {
    const nearFoods = [];
    foods.forEach(f => {
      const d = DISTANCE_MATRIX[`${a.name}|${f.name}`];
      if (d && d.km <= 10) nearFoods.push({ name: isVi ? f.name : f.nameEn, ...d });
    });
    nearFoods.sort((x, y) => x.km - y.km);
    if (!nearFoods.length) return;
    const na = isVi ? a.name : a.nameEn;
    const list = nearFoods.slice(0, 2).map(x => `${x.name} (~${x.km}km)`).join(', ');
    out += `- Gần ${na}: ${list}\n`;
  });

  // 5. Gom cụm thông minh
  out += isVi
    ? '\nCỤM ĐỊA ĐIỂM NÊN ĐI CÙNG 1 BUỔI (cách nhau dưới 5km):\n'
    : '\nCLUSTERS TO VISIT IN ONE SESSION (within 5km of each other):\n';

  const listed = new Set();
  for (let i = 0; i < attractions.length; i++) {
    for (let j = i + 1; j < attractions.length; j++) {
      const a = attractions[i];
      const b = attractions[j];
      const d = DISTANCE_MATRIX[`${a.name}|${b.name}`];
      if (d && d.km <= 5) {
        const na = isVi ? a.name : a.nameEn;
        const nb = isVi ? b.name : b.nameEn;
        const k = `${na}|${nb}`;
        if (!listed.has(k)) {
          listed.add(k);
          out += `- ${na} & ${nb}: ~${d.km}km\n`;
        }
      }
    }
  }

  out += isVi
    ? '\nLưu ý: Khoảng cách tính theo đường bộ thực tế từ OSRM routing engine.\n'
    : '\nNote: Distances based on actual road routing from OSRM engine.\n';

  return out;
}

// ── HÀM TRUY XUẤT CHO getSystem() ────────────────────────
function buildDistanceContext(lang) {
  if (!DISTANCE_MATRIX) return '';
  return lang === 'vi' ? distanceContextVI : distanceContextEN;
}
