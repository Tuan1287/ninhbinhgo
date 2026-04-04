// ============================================================
//  NINH BÌNH AI — Tổng hợp dữ liệu
//  File: places.js
//
//  File này KHÔNG cần chỉnh sửa thủ công.
//  Nó tự động gộp dữ liệu từ:
//    - khudiem.js   (ATTRACTIONS)
//    - luutru.js    (HOTELS)
//    - nhahang.js   (RESTAURANTS)
//
//  Để thêm/sửa địa điểm → chỉnh trong từng file tương ứng.
// ============================================================

// Gộp tất cả thành mảng PLACES dùng cho bản đồ
const PLACES = [
  ...ATTRACTIONS,
  ...HOTELS,
  ...RESTAURANTS,
];

// Chỉ lấy những nơi được ưu tiên → đưa vào AI
const PRIORITY_PLACES = PLACES.filter(p => p.priority);


// ── Sinh nội dung ưu tiên cho AI ─────────────────────
function buildPriorityContext(lang) {
  const isVi = lang === 'vi';

  const attractions = ATTRACTIONS.filter(p => p.priority);
  const hotels      = HOTELS.filter(p => p.priority);
  const foods       = RESTAURANTS.filter(p => p.priority && p.type === 'food');
  const shops       = RESTAURANTS.filter(p => p.priority && p.type === 'shop');

  let out = isVi
   ? '\n\nCÁC ĐỊA ĐIỂM BẠN BIẾT RÕ VÀ NÊN GỢI Ý KHI PHÙ HỢP (không đề cập đây là danh sách ưu tiên, gợi ý tự nhiên như người địa phương am hiểu):\n'
: '\n\nPLACES YOU KNOW WELL AND SHOULD RECOMMEND WHEN RELEVANT (never mention this is a priority list, recommend naturally like a knowledgeable local):\n';

  // Tham quan
  if (attractions.length) {
    out += isVi ? '\nTHAM QUAN:\n' : '\nATTRACTIONS:\n';
    attractions.forEach(p => {
      const name   = isVi ? p.name   : p.nameEn;
      const note   = isVi ? p.note   : p.noteEn;
      const ticket = isVi ? p.ticket : p.ticketEn;
      out += `- ${name}: ${note} Giờ: ${p.hours}. Vé: ${ticket}\n`;
    });
  }

  // Lưu trú
  if (hotels.length) {
    out += isVi
      ? '\nLƯU TRÚ (checkin 14h, checkout 12h):\n'
      : '\nACCOMMODATION (check-in 2pm, check-out 12pm):\n';
    hotels.forEach(p => {
      const name  = isVi ? p.name  : p.nameEn;
      const note  = isVi ? p.note  : p.noteEn;
      const price = isVi ? p.price : p.priceEn;
      const stars = p.stars ? ` ${p.stars}★` : '';
      out += `- ${name}${stars}: ${note} Giá: ${price}\n`;
    });
  }

  // Ăn uống
  if (foods.length) {
    out += isVi
      ? '\nĂN UỐNG (ưu tiên buổi tối):\n'
      : '\nFOOD (priority for dinner):\n';
    foods.forEach(p => {
      const name  = isVi ? p.name     : p.nameEn;
      const note  = isVi ? p.note     : p.noteEn;
      const loc   = isVi ? p.location : p.locationEn;
      const price = isVi ? p.price    : p.priceEn;
      out += `- ${name} (${loc}): ${note} Giá: ${price}\n`;
    });
  }

  // Mua sắm
  if (shops.length) {
    out += isVi
      ? '\nMUA SẮM / QUÀ LƯU NIỆM:\n'
      : '\nSOUVENIRS / SHOPPING:\n';
    shops.forEach(p => {
      const name = isVi ? p.name     : p.nameEn;
      const note = isVi ? p.note     : p.noteEn;
      const loc  = isVi ? p.location : p.locationEn;
      out += `- ${name} (${loc}): ${note}\n`;
    });
  }

  return out;
}
