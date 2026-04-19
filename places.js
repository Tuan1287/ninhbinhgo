// ============================================================
//  NINH BÌNH AI — Tổng hợp dữ liệu
//  File: places.js — KHÔNG cần chỉnh sửa thủ công
//  Tự động gộp từ: khudiem.js · luutru.js · nhahang.js · anvat.js
// ============================================================

const PLACES = [...ATTRACTIONS, ...HOTELS, ...RESTAURANTS, ...SNACKS];
const PRIORITY_PLACES = PLACES.filter(p => p.priority);

// ── Sinh nội dung ưu tiên cho AI ─────────────────────────
function buildPriorityContext(lang) {
  const isVi       = lang === 'vi';
  const attractions = ATTRACTIONS.filter(p => p.priority);
  const hotels      = HOTELS.filter(p => p.priority);
  const foods       = RESTAURANTS.filter(p => p.priority && p.type === 'food');
  const shops       = RESTAURANTS.filter(p => p.priority && p.type === 'shop');
  const snacks      = SNACKS.filter(p => p.priority);

  // Giới hạn để system prompt không quá dài
  const MAX_HOTELS = 8;
  const MAX_FOODS  = 14;
  const MAX_SNACKS = 7;

  let out = isVi
    ? '\n\nCÁC ĐỊA ĐIỂM BẠN AM HIỂU VÀ NÊN GỢI Ý KHI PHÙ HỢP:\n(Gợi ý tự nhiên như người địa phương. KHÔNG đề cập "danh sách ưu tiên" hay "đối tác")\n'
    : '\n\nPLACES YOU KNOW WELL — RECOMMEND NATURALLY WHEN RELEVANT:\n(Like a knowledgeable local. NEVER mention "priority list" or "sponsored")\n';

  if (attractions.length) {
    out += isVi ? '\nĐịa điểm tham quan:\n' : '\nAttractions:\n';
    attractions.forEach(p => {
      out += `- ${isVi ? p.name : p.nameEn}: ${isVi ? p.note : p.noteEn}\n`;
    });
  }

  if (hotels.length) {
    out += isVi ? '\nLưu trú (checkin 14h, checkout 12h):\n' : '\nAccommodation (check-in 2pm, check-out 12pm):\n';
    hotels.slice(0, MAX_HOTELS).forEach(p => {
      const stars = p.stars ? ` ${p.stars}★` : '';
      out += `- ${isVi ? p.name : p.nameEn}${stars}: ${isVi ? p.note : p.noteEn} Giá: ${isVi ? p.price : p.priceEn}\n`;
    });
  }

  if (foods.length) {
    out += isVi ? '\nNhà hàng & ăn uống:\n' : '\nRestaurants & dining:\n';
    foods.slice(0, MAX_FOODS).forEach(p => {
      out += `- ${isVi ? p.name : p.nameEn} (${isVi ? p.location : p.locationEn}): ${isVi ? p.note : p.noteEn} Giá: ${isVi ? p.price : p.priceEn}. ${isVi ? 'Thích hợp' : 'Best'}: ${isVi ? p.bestTime : p.bestTimeEn}\n`;
    });
  }

  if (snacks.length) {
    out += isVi ? '\nĂn vặt & street food:\n' : '\nStreet food & snacks:\n';
    snacks.slice(0, MAX_SNACKS).forEach(p => {
      out += `- ${isVi ? p.name : p.nameEn} (${isVi ? p.location : p.locationEn}): ${isVi ? p.note : p.noteEn} Giá: ${isVi ? p.price : p.priceEn}. ${isVi ? 'Thích hợp' : 'Best'}: ${isVi ? p.bestTime : p.bestTimeEn}\n`;
    });
  }

  if (shops.length) {
    out += isVi ? '\nMua sắm & quà lưu niệm:\n' : '\nSouvenirs & shopping:\n';
    shops.forEach(p => {
      out += `- ${isVi ? p.name : p.nameEn} (${isVi ? p.location : p.locationEn}): ${isVi ? p.note : p.noteEn}\n`;
    });
  }

  // ── Foodtour context cho AI ──────────────────────────
  out += isVi
    ? `\nGỢI Ý FOODTOUR NINH BÌNH:\nKhi khách hỏi về foodtour hoặc kết hợp ăn uống + tham quan, gợi ý theo cấu trúc:\n- Sáng: Bún chả quạt Tình Mai (ăn sáng) → Tràng An / Hang Múa / Tam Cốc (tham quan)\n- Trưa: Dê Chính Thư / Ba Cửa / Dũng Phố Núi / Hoàng Giang (ăn trưa gần điểm tham quan)\n- Chiều: Phố cổ Hoa Lư → Bánh rán / Thịt xiên nướng (ăn vặt dạo phố)\n- Tối: Heo Say Xỉn (GC22-23) + Lẩu Gà Lá É (GC57-58) + Trà chanh GC01 tại Phố cổ\n- Đêm: Kem xôi Thanh Hằng / Nem nướng Nha Trang tại công viên Thúy Sơn\nLưu ý: Ưu tiên gợi ý nhà hàng gần điểm tham quan để tiết kiệm di chuyển.\n`
    : `\nNINH BINH FOODTOUR SUGGESTIONS:\nWhen asked about foodtour or combining dining + sightseeing:\n- Morning: Tinh Mai Grilled Pork Noodles (breakfast) → Trang An / Hang Mua / Tam Coc (sightseeing)\n- Lunch: Chinh Thu / Ba Cua / Dung Pho Nui / Hoang Giang (near attractions)\n- Afternoon: Hoa Lu Old Quarter → Fried pancakes / Grilled skewers (street food walk)\n- Evening: Heo Say Xin (GC22-23) + Lau Ga La E (GC57-58) + Tea Stall GC01 at Old Quarter\n- Night: Sticky rice ice cream Thanh Hang / Grilled spring rolls at Thuy Son Park\nNote: Prioritize restaurants near the visited attractions to minimize travel.\n`;

  return out;
}
