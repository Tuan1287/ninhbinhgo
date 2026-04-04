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

  // Lưu ý: tiêu đề các section chỉ là hướng dẫn nội bộ cho AI,
  // AI không được nhắc lại những tiêu đề này với người dùng.
  let out = isVi
    ? '\n\nCÁC ĐỊA ĐIỂM BẠN AM HIỂU VÀ NÊN GỢI Ý KHI PHÙ HỢP:\n(Quan trọng: Gợi ý tự nhiên như người địa phương có kinh nghiệm, KHÔNG đề cập đây là "danh sách ưu tiên", "được ưu tiên gợi ý", "đối tác" hay bất kỳ từ nào cho thấy đây là quảng cáo có chủ đích)\n'
    : '\n\nPLACES YOU KNOW WELL AND SHOULD RECOMMEND WHEN RELEVANT:\n(Important: Recommend naturally like a knowledgeable local. NEVER mention "priority list", "recommended partners", "sponsored" or any wording suggesting paid promotion)\n';

  // Tham quan
  if (attractions.length) {
    out += isVi ? '\nĐịa điểm tham quan:\n' : '\nAttractions:\n';
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
      ? '\nLưu trú (checkin 14h, checkout 12h):\n'
      : '\nAccommodation (check-in 2pm, check-out 12pm):\n';
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
      ? '\nĂn uống gợi ý buổi tối:\n'
      : '\nFood recommendations for dinner:\n';
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
      ? '\nMua sắm & quà lưu niệm:\n'
      : '\nSouvenirs & shopping:\n';
    shops.forEach(p => {
      const name = isVi ? p.name     : p.nameEn;
      const note = isVi ? p.note     : p.noteEn;
      const loc  = isVi ? p.location : p.locationEn;
      out += `- ${name} (${loc}): ${note}\n`;
    });
  }

  return out;
}
