// ============================================================
//  NINH BÌNH AI — Khoảng cách & Thời gian di chuyển
//  File: khoangcach.js
//
//  File này tự động tính khoảng cách giữa các điểm tham quan
//  dựa trên tọa độ trong khudiem.js, sau đó đưa vào system
//  prompt để AI gợi ý lịch trình hợp lý theo vị trí địa lý.
//
//  KHÔNG cần chỉnh sửa thủ công — mọi thứ tự động từ khudiem.js
//  Chỉ chỉnh phần SPEED_KMH nếu muốn thay đổi tốc độ ước tính.
// ============================================================

// Tốc độ di chuyển trung bình (km/h)
const SPEED_KMH = {
  motorbike: 30,  // xe máy trong thành phố / đường tỉnh
  car: 40,        // ô tô
};

// Tính khoảng cách giữa 2 điểm (km) theo công thức Haversine
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2
    + Math.cos(lat1 * Math.PI / 180)
    * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Tính thời gian di chuyển (phút), làm tròn lên 5 phút
function travelMinutes(distKm, speed = SPEED_KMH.motorbike) {
  return Math.ceil((distKm / speed * 60) / 5) * 5;
}

// Chỉ tính cho các điểm tham quan priority: true
// (điểm AI sẽ nhắc đến nhiều nhất)
function buildDistanceContext(lang) {
  const isVi = lang === 'vi';
  const points = ATTRACTIONS.filter(p => p.priority);

  if (points.length < 2) return '';

  let out = isVi
    ? '\n\nKHOẢNG CÁCH & THỜI GIAN DI CHUYỂN (dùng để lập lịch trình hợp lý):\n'
    : '\n\nDISTANCES & TRAVEL TIMES (use to plan logical itineraries):\n';

  // Tính ma trận khoảng cách giữa tất cả cặp điểm
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const a = points[i];
      const b = points[j];
      const dist = haversine(a.lat, a.lng, b.lat, b.lng);
      const mins = travelMinutes(dist);
      const distStr = dist < 1
        ? (dist * 1000).toFixed(0) + 'm'
        : dist.toFixed(1) + 'km';

      const nameA = isVi ? a.name : a.nameEn;
      const nameB = isVi ? b.name : b.nameEn;

      out += isVi
        ? `- ${nameA} → ${nameB}: ~${distStr}, ~${mins} phút xe máy\n`
        : `- ${nameA} → ${nameB}: ~${distStr}, ~${mins} min by motorbike\n`;
    }
  }

  // Thêm gợi ý về cụm địa điểm gần nhau
  out += isVi
    ? '\nGỢI Ý GOM CỤM (các điểm gần nhau nên đi cùng 1 buổi):\n'
    : '\nCLUSTER SUGGESTIONS (nearby places to visit in one session):\n';

  // Tìm các cụm điểm cách nhau < 5km
  const clusters = {};
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dist = haversine(points[i].lat, points[i].lng, points[j].lat, points[j].lng);
      if (dist < 5) {
        const nameA = isVi ? points[i].name : points[i].nameEn;
        const nameB = isVi ? points[j].name : points[j].nameEn;
        out += isVi
          ? `- ${nameA} & ${nameB} chỉ cách nhau ${dist.toFixed(1)}km — nên đi cùng 1 buổi\n`
          : `- ${nameA} & ${nameB} are only ${dist.toFixed(1)}km apart — visit together in one session\n`;
      }
    }
  }

  out += isVi
    ? '\nLưu ý: Khoảng cách tính theo đường chim bay, thực tế có thể dài hơn 10–20%.\n'
    : '\nNote: Distances are straight-line; actual road distance may be 10–20% longer.\n';

  return out;
}
