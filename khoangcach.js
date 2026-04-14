// ============================================================
//  NINH BÌNH AI — Khoảng cách đường bộ thực tế
//  File: khoangcach.js
//
//  Bảng khoảng cách đo từ Google Maps theo đường bộ thực tế.
//  Không gọi API, không làm chậm trang.
//
//  Cập nhật: 2026
//  Đơn vị: km (đường bộ), phút (xe máy tốc độ bình thường)
// ============================================================

// ── BẢNG KHOẢNG CÁCH THỰC TẾ ─────────────────────────────
// Format: 'Điểm A|Điểm B': { km, mins }
// Đường 2 chiều — chỉ cần nhập 1 chiều, hàm tự tra cả 2
const ROAD_TABLE = {

  // ── Hà Nội xuất phát ─────────────────────────────────
  'Hà Nội|TP Ninh Bình':          { km: 93,   mins: 130 }, // cao tốc
  'Hà Nội|Tràng An':              { km: 98,   mins: 140 },
  'Hà Nội|Tam Cốc':              { km: 101,  mins: 145 },
  'Hà Nội|Hang Múa':             { km: 103,  mins: 148 },
  'Hà Nội|Cố đô Hoa Lư':         { km: 99,   mins: 142 },
  'Hà Nội|Chùa Bái Đính':        { km: 108,  mins: 155 },

  // ── Giữa các điểm tham quan ──────────────────────────
  'Tràng An|Hang Múa':            { km: 4.5,  mins: 12  },
  'Tràng An|Tam Cốc':            { km: 6.2,  mins: 16  },
  'Tràng An|Cố đô Hoa Lư':       { km: 3.8,  mins: 10  },
  'Tràng An|Chùa Bái Đính':      { km: 9.5,  mins: 22  },
  'Tràng An|Thung Ui':           { km: 10.2, mins: 25  },
  'Tràng An|Thung Nham':         { km: 7.8,  mins: 20  },
  'Tràng An|Cúc Phương':         { km: 44,   mins: 70  },
  'Tràng An|Vườn quốc gia Cúc Phương': { km: 44, mins: 70 },
  'Hang Múa|Tam Cốc':            { km: 1.9,  mins: 6   },
  'Hang Múa|Cố đô Hoa Lư':       { km: 5.8,  mins: 15  },
  'Hang Múa|Chùa Bái Đính':      { km: 12.5, mins: 28  },
  'Hang Múa|Thung Ui':           { km: 13.2, mins: 30  },
  'Hang Múa|Thung Nham':         { km: 2.8,  mins: 8   },
  'Hang Múa|Khu du lịch sinh thái Thung Nham': { km: 2.8, mins: 8 },
  'Tam Cốc|Cố đô Hoa Lư':        { km: 5.5,  mins: 14  },
  'Tam Cốc|Chùa Bái Đính':       { km: 13.5, mins: 30  },
  'Tam Cốc|Thung Nham':          { km: 2.2,  mins: 7   },
  'Tam Cốc|Khu du lịch sinh thái Thung Nham': { km: 2.2, mins: 7 },
  'Cố đô Hoa Lư|Chùa Bái Đính':  { km: 11.0, mins: 24  },
  'Cố đô Hoa Lư|Thung Ui':       { km: 11.5, mins: 26  },
  'Cố đô Hoa Lư|Thung Nham':     { km: 7.2,  mins: 18  },
  'Chùa Bái Đính|Thung Ui':      { km: 3.2,  mins: 9   },
  'Chùa Bái Đính|Cúc Phương':    { km: 38,   mins: 60  },
  'Chùa Bái Đính|Vườn quốc gia Cúc Phương': { km: 38, mins: 60 },

  // ── Từ TP Ninh Bình ───────────────────────────────────
  'TP Ninh Bình|Tràng An':        { km: 7.5,  mins: 18  },
  'TP Ninh Bình|Hang Múa':        { km: 10.2, mins: 23  },
  'TP Ninh Bình|Tam Cốc':        { km: 9.8,  mins: 21  },
  'TP Ninh Bình|Cố đô Hoa Lư':   { km: 11.5, mins: 25  },
  'TP Ninh Bình|Chùa Bái Đính':  { km: 18.5, mins: 35  },
  'TP Ninh Bình|Thung Ui':       { km: 19.5, mins: 38  },
  'TP Ninh Bình|Cúc Phương':     { km: 47,   mins: 75  },

  // ── Từ khách sạn trung tâm đến điểm tham quan ────────
  'Legend Hotel|Tràng An':        { km: 8.2,  mins: 19  },
  'Legend Hotel|Hang Múa':        { km: 10.8, mins: 24  },
  'Legend Hotel|Tam Cốc':        { km: 10.5, mins: 23  },
  'Legend Hotel|Cố đô Hoa Lư':   { km: 12.0, mins: 26  },
  'Legend Hotel|Chùa Bái Đính':  { km: 19.0, mins: 36  },
  'Legend Hotel|Phố cổ Hoa Lư':  { km: 0.5,  mins: 3   },

  'The Reed Hotel|Tràng An':      { km: 7.8,  mins: 18  },
  'The Reed Hotel|Hang Múa':      { km: 10.5, mins: 23  },
  'The Reed Hotel|Tam Cốc':      { km: 10.2, mins: 22  },
  'The Reed Hotel|Cố đô Hoa Lư': { km: 11.8, mins: 25  },
  'The Reed Hotel|Chùa Bái Đính':{ km: 18.8, mins: 35  },

  'Milan Hotel|Tràng An':         { km: 7.9,  mins: 18  },
  'Milan Hotel|Hang Múa':         { km: 10.5, mins: 23  },
  'Milan Hotel|Tam Cốc':         { km: 10.2, mins: 22  },
  'Milan Hotel|Cố đô Hoa Lư':    { km: 11.8, mins: 25  },
  'Milan Hotel|Phố cổ Hoa Lư':   { km: 0.1,  mins: 2   },

  'Hang Mua Ecolodge|Tràng An':  { km: 4.2,  mins: 11  },
  'Hang Mua Ecolodge|Tam Cốc':   { km: 1.8,  mins: 6   },
  'Hang Mua Ecolodge|Hang Múa':  { km: 0.3,  mins: 2   },
  'Hang Mua Ecolodge|Cố đô Hoa Lư': { km: 5.5, mins: 14 },

  'Tràng An Retreat|Tràng An':   { km: 1.5,  mins: 5   },
  'Tràng An Retreat|Cố đô Hoa Lư': { km: 4.5, mins: 12 },
  'Tràng An Retreat|Hang Múa':   { km: 5.2,  mins: 14  },

  'Rêu Coffee & Stay|Tam Cốc':   { km: 2.5,  mins: 8   },
  'Rêu Coffee & Stay|Hang Múa':  { km: 2.8,  mins: 9   },
  'Rêu Coffee & Stay|Tràng An':  { km: 7.0,  mins: 18  },

  'Emeralda Resort Ninh Bình|Đầm Vân Long': { km: 3.5, mins: 10 },
  'Emeralda Resort Ninh Bình|Tràng An': { km: 14.5, mins: 30 },
  'Emeralda Resort Ninh Bình|Chùa Bái Đính': { km: 8.5, mins: 20 },

  'Tam Coc Garden Resort|Tam Cốc': { km: 1.2, mins: 4  },
  'Tam Coc Garden Resort|Hang Múa': { km: 2.5, mins: 8 },
  'Tam Coc Garden Resort|Tràng An': { km: 7.5, mins: 19 },

  // ── Từ nhà hàng đến điểm tham quan ──────────────────
  'Heo Say Xỉn (GC22-23)|Cố đô Hoa Lư':  { km: 0.4, mins: 3  },
  'Heo Say Xỉn (GC22-23)|Tràng An':       { km: 8.0, mins: 19 },
  'Heo Say Xỉn (GC22-23)|Hang Múa':       { km: 10.5,mins: 24 },
  'Lẩu Gà Lá É (GC57-58)|Cố đô Hoa Lư':  { km: 0.4, mins: 3  },
  'Lẩu Gà Lá É (GC57-58)|Tràng An':      { km: 8.0, mins: 19 },
  'Dê Chính Thư (Tràng An)|Tràng An':     { km: 1.5, mins: 5  },
  'Dê Chính Thư (Tràng An)|Hang Múa':     { km: 4.5, mins: 12 },
  'Nhà hàng Thăng Long|Tràng An':         { km: 2.0, mins: 6  },
  'Nhà hàng Thăng Long|Chùa Bái Đính':   { km: 7.5, mins: 18 },
  'Đại Long Building — Cơm Cháy|TP Ninh Bình': { km: 1.2, mins: 4 },
};

// ── TRA CỨU KHOẢNG CÁCH ──────────────────────────────────
function getDistance(nameA, nameB) {
  const key1 = `${nameA}|${nameB}`;
  const key2 = `${nameB}|${nameA}`;
  return ROAD_TABLE[key1] || ROAD_TABLE[key2] || null;
}

// ── SINH CONTEXT CHO AI ───────────────────────────────────
function buildDistanceContext(lang) {
  const isVi = lang === 'vi';

  const attractions = ATTRACTIONS.filter(p => p.priority);
  const hotels      = HOTELS.filter(p => p.priority);
  const foods       = RESTAURANTS.filter(p => p.priority && p.type === 'food');

  let out = isVi
    ? '\n\nKHOẢNG CÁCH ĐƯỜNG BỘ THỰC TẾ (dùng để lập lịch trình chính xác, tránh đi lại không cần thiết):\n'
    : '\n\nACTUAL ROAD DISTANCES (use for accurate itinerary planning, avoid unnecessary backtracking):\n';

  // 1. Từ Hà Nội
  out += isVi
    ? '\nTừ Hà Nội đến Ninh Bình:\n- Hà Nội → TP Ninh Bình: ~93km, ~130 phút (xe máy/ô tô qua cao tốc)\n- Hà Nội → Tràng An: ~98km, ~140 phút\n'
    : '\nFrom Hanoi to Ninh Binh:\n- Hanoi → Ninh Binh city: ~93km, ~130 min (motorbike/car via highway)\n- Hanoi → Trang An: ~98km, ~140 min\n';

  // 2. Giữa các điểm tham quan
  out += isVi ? '\nGiữa các điểm tham quan:\n' : '\nBetween attractions:\n';
  for (let i = 0; i < attractions.length; i++) {
    for (let j = i + 1; j < attractions.length; j++) {
      const d = getDistance(attractions[i].name, attractions[j].name);
      if (!d) continue;
      const na = isVi ? attractions[i].name : attractions[i].nameEn;
      const nb = isVi ? attractions[j].name : attractions[j].nameEn;
      out += `- ${na} ↔ ${nb}: ~${d.km}km, ~${d.mins} ${isVi ? 'phút' : 'min'}\n`;
    }
  }

  // 3. Khách sạn → điểm tham quan gần nhất
  out += isVi
    ? '\nTừ cơ sở lưu trú đến điểm tham quan:\n'
    : '\nFrom accommodation to attractions:\n';
  hotels.slice(0, 8).forEach(h => { // giới hạn 8 khách sạn để prompt không quá dài
    const near = [];
    attractions.forEach(a => {
      const d = getDistance(h.name, a.name);
      if (d) near.push({ name: isVi ? a.name : a.nameEn, ...d });
    });
    near.sort((a, b) => a.km - b.km);
    if (!near.length) return;
    const hn = isVi ? h.name : h.nameEn;
    const top = near.slice(0, 3).map(x => `${x.name}(~${x.km}km,~${x.mins}${isVi ? 'p' : 'm'})`).join(', ');
    out += `- ${hn}: ${top}\n`;
  });

  // 4. Cụm gần nhau
  out += isVi
    ? '\nCụm nên đi cùng 1 buổi (< 5km):\n'
    : '\nClusters for one session (< 5km apart):\n';
  const seen = new Set();
  for (let i = 0; i < attractions.length; i++) {
    for (let j = i + 1; j < attractions.length; j++) {
      const d = getDistance(attractions[i].name, attractions[j].name);
      if (d && d.km < 5) {
        const na = isVi ? attractions[i].name : attractions[i].nameEn;
        const nb = isVi ? attractions[j].name : attractions[j].nameEn;
        const k = `${na}|${nb}`;
        if (!seen.has(k)) {
          seen.add(k);
          out += `- ${na} & ${nb}: ~${d.km}km\n`;
        }
      }
    }
  }

  // 5. Nhà hàng gần điểm tham quan
  out += isVi
    ? '\nNhà hàng gần điểm tham quan:\n'
    : '\nRestaurants near attractions:\n';
  attractions.forEach(a => {
    const near = [];
    foods.forEach(f => {
      const d = getDistance(f.name, a.name);
      if (d && d.km <= 8) near.push({ name: isVi ? f.name : f.nameEn, km: d.km });
    });
    near.sort((x, y) => x.km - y.km);
    if (!near.length) return;
    const na = isVi ? a.name : a.nameEn;
    out += `- Gần ${na}: ${near.slice(0, 2).map(x => `${x.name}(~${x.km}km)`).join(', ')}\n`;
  });

  return out;
}
