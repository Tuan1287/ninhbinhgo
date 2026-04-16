// ============================================================
//  NINH BÌNH AI — Tổng hợp dữ liệu
//  File: places.js — KHÔNG cần chỉnh sửa thủ công
//  Tự động gộp từ: khudiem.js · luutru.js · nhahang.js
// ============================================================

const PLACES = [...ATTRACTIONS, ...HOTELS, ...RESTAURANTS];
const PRIORITY_PLACES = PLACES.filter(p => p.priority);

// ── Sinh nội dung ưu tiên cho AI ─────────────────────────
function buildPriorityContext(lang) {
  const isVi       = lang === 'vi';
  const attractions = ATTRACTIONS.filter(p => p.priority);
  const hotels      = HOTELS.filter(p => p.priority);
  const foods       = RESTAURANTS.filter(p => p.priority && p.type === 'food');
  const shops       = RESTAURANTS.filter(p => p.priority && p.type === 'shop');

  // Giới hạn số lượng để system prompt không quá dài → tránh quá tải API
  const MAX_HOTELS = 8;
  const MAX_FOODS  = 12;

  let out = isVi
    ? '\n\nCÁC ĐỊA ĐIỂM BẠN AM HIỂU VÀ NÊN GỢI Ý KHI PHÙ HỢP:\n(Gợi ý tự nhiên như người địa phương có kinh nghiệm. KHÔNG đề cập "danh sách ưu tiên", "đối tác" hay bất kỳ từ nào gợi ý đây là quảng cáo)\n'
    : '\n\nPLACES YOU KNOW WELL — RECOMMEND NATURALLY WHEN RELEVANT:\n(Like a knowledgeable local. NEVER mention "priority list", "partners", or any wording suggesting paid promotion)\n';

  if (attractions.length) {
    out += isVi ? '\nĐịa điểm tham quan:\n' : '\nAttractions:\n';
    attractions.forEach(p => {
      const name   = isVi ? p.name   : p.nameEn;
      const note   = isVi ? p.note   : p.noteEn;
      out += `- ${name}: ${note}\n`;
    });
  }

  if (hotels.length) {
    out += isVi ? '\nLưu trú (checkin 14h, checkout 12h):\n' : '\nAccommodation (check-in 2pm, check-out 12pm):\n';
    hotels.slice(0, MAX_HOTELS).forEach(p => {
      const name  = isVi ? p.name  : p.nameEn;
      const note  = isVi ? p.note  : p.noteEn;
      const price = isVi ? p.price : p.priceEn;
      const stars = p.stars ? ` ${p.stars}★` : '';
      out += `- ${name}${stars}: ${note} Giá: ${price}\n`;
    });
  }

  if (foods.length) {
    out += isVi ? '\nĂn uống:\n' : '\nFood & Drinks:\n';
    foods.slice(0, MAX_FOODS).forEach(p => {
      const name  = isVi ? p.name     : p.nameEn;
      const note  = isVi ? p.note     : p.noteEn;
      const loc   = isVi ? p.location : p.locationEn;
      const price = isVi ? p.price    : p.priceEn;
      const time  = isVi ? p.bestTime : p.bestTimeEn;
      out += `- ${name} (${loc}): ${note} Giá: ${price}. ${isVi ? 'Thích hợp' : 'Best'}: ${time}\n`;
    });
  }

  if (shops.length) {
    out += isVi ? '\nMua sắm & quà lưu niệm:\n' : '\nSouvenirs & shopping:\n';
    shops.forEach(p => {
      const name = isVi ? p.name     : p.nameEn;
      const note = isVi ? p.note     : p.noteEn;
      const loc  = isVi ? p.location : p.locationEn;
      out += `- ${name} (${loc}): ${note}\n`;
    });
  }

  return out;
}
