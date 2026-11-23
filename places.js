// ============================================================
//  NINH BÌNH AI — Tổng hợp dữ liệu
//  File: places.js — KHÔNG cần chỉnh sửa thủ công
//  Tự động gộp từ: khudiem.js · luutru.js · nhahang.js · anvat.js · cafe.js
// ============================================================

const PLACES = [...ATTRACTIONS, ...HOTELS, ...RESTAURANTS, ...SNACKS, ...CAFES];
const PRIORITY_PLACES = PLACES.filter(p => p.priority);

// ── Phân nhóm dùng chung cho AI và vòng quay ─────────────────
// Dữ liệu có nhiều "type" lẫn giữa các file (food, asian, western, pub, latenight, cafe...).
// Gom theo VAI TRÒ để vòng quay/AI không đưa nhà hàng vào mục "ăn vặt" hay ngược lại,
// không có mục nào bị "vô hình", và các mục trùng (cùng tên/cùng số nhà) chỉ hiện một lần.
const _vn = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
function _addrKey(p) {                       // "343 Đường Lê Thái Tổ, ..." → "343 le thai to"
  const segs = _vn(p.location).split(',');
  let first = segs[0] || '';
  if (/\d/.test(first) && first.trim().length <= 8 && segs[1]) first += ' ' + segs[1]; // "Số 7, Ngõ 43 ..."
  const k = first.replace(/\b(so|duong|pho)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/^0+(?=\d)/, '');
  return /^\d/.test(k) ? k : '';             // chỉ tin địa chỉ có số nhà
}
function _dedupe(list) {
  const names = new Set(), addrs = new Set();
  return list.filter(p => {
    const n = _vn(p.name).replace(/[^a-z0-9]+/g, ' ').trim(), a = _addrKey(p);
    if (names.has(n) || (a && addrs.has(a))) return false;
    names.add(n); if (a) addrs.add(a);
    return true;
  });
}
const _FOOD_TYPES_IN_SNACKS = ['asian', 'western', 'food'];   // nhà hàng đang nằm trong anvat.js
function getAttractionPool() { return ATTRACTIONS.filter(p => p.priority); }
function getHotelPool()      { return HOTELS.filter(p => p.priority); }
function getFoodPool() {
  const cafeNames = new Set(CAFES.map(c => _vn(c.name)));     // quán cafe lỡ nằm trong nhahang.js
  return _dedupe([
    ...RESTAURANTS.filter(p => p.priority && p.type === 'food' && !cafeNames.has(_vn(p.name))),
    ...SNACKS.filter(p => p.priority && _FOOD_TYPES_IN_SNACKS.includes(p.type)),
  ]);
}
function getSnackPool() {                                     // ăn vặt, ăn đêm, quán nhậu
  return _dedupe([
    ...SNACKS.filter(p => p.priority && !_FOOD_TYPES_IN_SNACKS.includes(p.type)),
    ...RESTAURANTS.filter(p => p.priority && p.type === 'latenight'),
  ]);
}
function getCafePool() {
  return _dedupe([...CAFES.filter(p => p.priority), ...RESTAURANTS.filter(p => p.priority && p.type === 'cafe')]);
}

// ── Sinh nội dung ưu tiên cho AI ─────────────────────────
// ── Tính khoảng cách Haversine (km) ─────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ── Shuffle mảng (Fisher-Yates) ──────────────────────────
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Trung tâm Ninh Bình (tọa độ mặc định) ───────────────
const NB_CENTER = { lat: 20.2513, lng: 105.9745 };
const RADIUS_KM = 12; // bán kính gợi ý (km)

function buildPriorityContext(lang, centerLat, centerLng) {
  const S = v => (v === undefined || v === null) ? '' : v; // trường thiếu → rỗng, không in "undefined"
  // Khi biết địa điểm khách vừa nhắc tới: chỉ gợi ý các quán ≤ FILTER_MINUTES phút đường bộ.
  // Nếu khu vực ít quán thì lấy N quán GẦN NHẤT (không quay về danh sách đầy đủ).
  const FILTER_MINUTES = 10;
  function travelMinutes(p) {
    const k = `${p.lat},${p.lng}`;
    if (typeof _roadTimeCache !== 'undefined' && _roadTimeCache[k] !== undefined) return _roadTimeCache[k]; // số liệu OSRM
    return haversine(centerLat, centerLng, p.lat, p.lng) * 2.4; // ước lượng ~25km/h khi chưa có OSRM
  }
  function pickNear(list, minKeep) {
    if (!centerLat || !centerLng) return shuffleArray(list);
    const scored = list.map(p => ({ p, m: travelMinutes(p) })).sort((x, y) => x.m - y.m);
    const near = scored.filter(x => x.m <= FILTER_MINUTES);
    return shuffleArray((near.length >= minKeep ? near : scored.slice(0, minKeep)).map(x => x.p));
  }
  const isVi       = lang === 'vi';
  const attractions = ATTRACTIONS.filter(p => p.priority);
  // hotels đã được khai báo bên dưới với shuffle
  // Lọc theo priority + khoảng cách tới địa điểm vừa nhắc, rồi xáo ngẫu nhiên
  const foods   = pickNear(getFoodPool(), 6);
  const shops   = RESTAURANTS.filter(p => p.priority && p.type === 'shop');
  const snacks  = pickNear(getSnackPool(), 4);
  const cafes   = pickNear(getCafePool(), 4);
  const hotels  = pickNear(getHotelPool(), 3);

  // Giới hạn để system prompt không quá dài
  const MAX_HOTELS = 6;
  const MAX_FOODS  = 25;
  const MAX_SNACKS = 8;
  const MAX_CAFES  = 8;

  let out = isVi
    ? '\n\nCÁC ĐỊA ĐIỂM BẠN AM HIỂU VÀ NÊN GỢI Ý KHI PHÙ HỢP:\n(Gợi ý tự nhiên như người địa phương. KHÔNG đề cập "danh sách ưu tiên" hay "đối tác")\n'
    : '\n\nPLACES YOU KNOW WELL — RECOMMEND NATURALLY WHEN RELEVANT:\n(Like a knowledgeable local. NEVER mention "priority list" or "sponsored")\n';

  if (attractions.length) {
    out += isVi ? '\nĐịa điểm tham quan:\n' : '\nAttractions:\n';
    attractions.forEach(p => {
      out += `- ${S(isVi ? p.name : p.nameEn)}: ${S(isVi ? p.note : p.noteEn)}\n`;
    });
  }

  if (hotels.length) {
    out += isVi ? '\nLưu trú (checkin 14h, checkout 12h):\n' : '\nAccommodation (check-in 2pm, check-out 12pm):\n';
    hotels.slice(0, MAX_HOTELS).forEach(p => {
      out += `- ${S(isVi ? p.name : p.nameEn)}: ${S(isVi ? p.note : p.noteEn)} Giá: ${S(isVi ? p.price : p.priceEn)}\n`;
    });
  }

  if (foods.length) {
    out += isVi ? '\nNhà hàng & ăn uống:\n' : '\nRestaurants & dining:\n';
    foods.slice(0, MAX_FOODS).forEach(p => {
      out += `- ${S(isVi ? p.name : p.nameEn)} (${S(isVi ? p.location : p.locationEn)}): ${S(isVi ? p.note : p.noteEn)} Giá: ${S(isVi ? p.price : p.priceEn)}. ${isVi ? 'Thích hợp' : 'Best'}: ${S(isVi ? p.bestTime : p.bestTimeEn)}\n`;
    });
  }

  if (snacks.length) {
    out += isVi ? '\nĂn vặt & street food:\n' : '\nStreet food & snacks:\n';
    snacks.slice(0, MAX_SNACKS).forEach(p => {
      out += `- ${S(isVi ? p.name : p.nameEn)} (${S(isVi ? p.location : p.locationEn)}): ${S(isVi ? p.note : p.noteEn)} Giá: ${S(isVi ? p.price : p.priceEn)}. ${isVi ? 'Thích hợp' : 'Best'}: ${S(isVi ? p.bestTime : p.bestTimeEn)}\n`;
    });
  }

  if (cafes.length) {
    out += isVi ? '\nQuán cafe & không gian thư giãn:\n' : '\nCafes & relaxation spots:\n';
    cafes.slice(0, MAX_CAFES).forEach(p => {
      out += `- ${S(isVi ? p.name : p.nameEn)} (${S(isVi ? p.location : p.locationEn)}): ${S(isVi ? p.note : p.noteEn)} Giá: ${S(isVi ? p.price : p.priceEn)}. ${p.style ? (isVi ? 'Phong cách' : 'Style') + ': ' + p.style : ''}\n`;
    });
  }

  if (shops.length) {
    out += isVi ? '\nMua sắm & quà lưu niệm:\n' : '\nSouvenirs & shopping:\n';
    shops.forEach(p => {
      out += `- ${S(isVi ? p.name : p.nameEn)} (${S(isVi ? p.location : p.locationEn)}): ${S(isVi ? p.note : p.noteEn)}\n`;
    });
  }

  // ── Foodtour context cho AI ──────────────────────────
  out += isVi
    ? `\nGỢI Ý FOODTOUR NINH BÌNH:\nKhi khách hỏi về foodtour hoặc kết hợp ăn uống + tham quan, gợi ý theo cấu trúc:\n- Sáng: Bún chả quạt Tình Mai (ăn sáng) → Tràng An / Hang Múa / Tam Cốc (tham quan)\n- Trưa: Dê Chính Thư / Ba Cửa / Dũng Phố Núi / Hoàng Giang (ăn trưa gần điểm tham quan)\n- Chiều: Phố cổ Hoa Lư → Bánh rán / Thịt xiên nướng (ăn vặt dạo phố)\n- Tối: Heo Say Xỉn (GC22-23) + Lẩu Gà Lá É (GC57-58) + Trà chanh GC01 tại Phố cổ\n- Đêm: Kem xôi Thanh Hằng / Nem nướng Nha Trang tại công viên Thúy Sơn\nLưu ý: Ưu tiên gợi ý nhà hàng gần điểm tham quan để tiết kiệm di chuyển.\n`
    : `\nNINH BINH FOODTOUR SUGGESTIONS:\nWhen asked about foodtour or combining dining + sightseeing:\n- Morning: Tinh Mai Grilled Pork Noodles (breakfast) → Trang An / Hang Mua / Tam Coc (sightseeing)\n- Lunch: Chinh Thu / Ba Cua / Dung Pho Nui / Hoang Giang (near attractions)\n- Afternoon: Hoa Lu Old Quarter → Fried pancakes / Grilled skewers (street food walk)\n- Evening: Heo Say Xin (GC22-23) + Lau Ga La E (GC57-58) + Tea Stall GC01 at Old Quarter\n- Night: Sticky rice ice cream Thanh Hang / Grilled spring rolls at Thuy Son Park\nNote: Prioritize restaurants near the visited attractions to minimize travel.\n`;

  return out;
}
