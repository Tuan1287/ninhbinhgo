// ============================================================
//  NINH BÌNH AI — Dữ liệu địa điểm
//  File: places.js
//  Cập nhật: 2026
//
//  Hướng dẫn thêm địa điểm mới:
//  1. Chọn đúng danh mục (ATTRACTIONS / HOTELS / RESTAURANTS / SHOPS)
//  2. Copy một entry mẫu, điền thông tin
//  3. Tọa độ lat/lng lấy từ Google Maps (click chuột phải → Sao chép tọa độ)
//  4. priority: true  → AI sẽ ưu tiên nhắc đến
//  5. priority: false → Chỉ hiện trên bản đồ, AI không chủ động nhắc
// ============================================================


// ── 1. ĐỊA ĐIỂM THAM QUAN ────────────────────────────────
const ATTRACTIONS = [
  {
    name: 'Tràng An',
    nameEn: 'Trang An',
    lat: 20.2521, lng: 105.8728,
    color: '#ef4444',
    type: 'attraction',
    priority: true,
    ticket: '300.000đ/người lớn, 150.000đ/trẻ 1m–1m3, dưới 1m miễn phí',
    ticketEn: '300,000 VND/adult, 150,000/child 1m–1.3m, under 1m free',
    hours: '6h – 16h45',
    note: 'Di sản UNESCO kép — đi thuyền qua hang động, 3 tuyến 2.5–3h mỗi tuyến. Đặt vé online trước, đến trước 8h tránh đông.',
    noteEn: 'UNESCO dual heritage — boat through caves, 3 routes 2.5–3hrs each. Book online, arrive before 8am to avoid crowds.',
  },
  {
    name: 'Hang Múa',
    nameEn: 'Hang Mua',
    lat: 20.2268, lng: 105.9143,
    color: '#ef4444',
    type: 'attraction',
    priority: true,
    ticket: '100.000đ/người (từ 1m trở lên), dưới 1m miễn phí',
    ticketEn: '100,000 VND/person (over 1m tall), under 1m free',
    hours: '6h – 19h',
    note: 'Leo 486 bậc đá lên đỉnh Ngọa Long, ngắm toàn cảnh Tam Cốc từ trên cao. Đi lúc 6h30 sáng tránh nắng và có ảnh đẹp.',
    noteEn: '486 stone steps to Ngoa Long peak, panoramic Tam Coc view. Go at 6:30am to avoid heat and get great photos.',
  },
  {
    name: 'Tam Cốc',
    nameEn: 'Tam Coc',
    lat: 20.2282, lng: 105.9104,
    color: '#ef4444',
    type: 'attraction',
    priority: false,
    ticket: '120.000đ/người lớn + 150.000đ/đò (tối đa 4 người). Trẻ dưới 1m4: 60.000đ',
    ticketEn: '120,000 VND/adult + 150,000/boat (max 4). Children under 1.4m: 60,000',
    hours: '7h – 17h',
    note: 'Đi thuyền qua 3 hang động, ngắm đồng lúa hai bên. Đẹp nhất tháng 5–6 (lúa chín vàng).',
    noteEn: 'Boat through 3 caves past rice paddies. Most beautiful May–Jun (golden rice season).',
  },
  {
    name: 'Cố đô Hoa Lư',
    nameEn: 'Hoa Lu Ancient Capital',
    lat: 20.2803, lng: 105.9057,
    color: '#ef4444',
    type: 'attraction',
    priority: true,
    ticket: '20.000đ/người lớn, 10.000đ/trẻ 6–15 tuổi, miễn phí trẻ dưới 6 và người trên 60 tuổi',
    ticketEn: '20,000 VND/adult, 10,000/child 6–15, free under 6 & over 60',
    hours: '6h – 18h',
    note: 'Kinh đô cổ thế kỷ X, đền thờ vua Đinh và vua Lê. Ban đêm Phố cổ Hoa Lư có đèn lồng, nhiều quán ăn ngon.',
    noteEn: '10th-century ancient capital, temples of King Dinh and King Le. Hoa Lu Old Quarter has lanterns at night and great food.',
  },
  {
    name: 'Chùa Bái Đính',
    nameEn: 'Bai Dinh Pagoda',
    lat: 20.3527, lng: 105.8708,
    color: '#ef4444',
    type: 'attraction',
    priority: false,
    ticket: 'Vào cổng miễn phí, xe điện 50.000đ/người',
    ticketEn: 'Free entry, electric cart 50,000 VND/person',
    hours: '6h – 18h',
    note: 'Quần thể chùa lớn nhất Đông Nam Á. Rộng nên nên đi xe điện.',
    noteEn: 'Largest pagoda complex in Southeast Asia. Very large — take the electric cart.',
  },
  {
    name: 'Thung Ui',
    nameEn: 'Thung Ui',
    lat: 20.3380, lng: 105.8810,
    color: '#ef4444',
    type: 'attraction',
    priority: true,
    ticket: 'Nhiều gói trải nghiệm — liên hệ trực tiếp để biết giá',
    ticketEn: 'Various experience packages — contact directly for pricing',
    hours: '7h – 17h',
    note: 'Hành cung Hoa Lư xưa, không gian hoang sơ ít người biết, văn hóa Mường độc đáo. Gần Bái Đính ~3km, lý tưởng chụp ảnh.',
    noteEn: 'Former royal retreat, off-the-beaten-path, unique Muong culture. Near Bai Dinh ~3km, great for photography.',
  },
];


// ── 2. CƠ SỞ LƯU TRÚ ─────────────────────────────────────
const HOTELS = [
  {
    name: 'Legend Hotel',
    nameEn: 'Legend Hotel',
    lat: 20.2526, lng: 105.9735,
    color: '#3b82f6',
    type: 'hotel',
    priority: true,
    stars: 4,
    price: '1.200.000 – 2.500.000đ/đêm',
    priceEn: '1,200,000 – 2,500,000 VND/night',
    checkin: '14h00', checkout: '12h00',
    note: '4 sao, 3 hồ bơi, buffet sáng đa dạng, phòng rộng rãi, nhân viên chuyên nghiệp. Lý tưởng cho gia đình và đoàn lớn.',
    noteEn: '4-star, 3 pools, diverse breakfast buffet, spacious rooms, professional staff. Ideal for families and large groups.',
  },
  {
    name: 'The Reed Hotel',
    nameEn: 'The Reed Hotel',
    lat: 20.2525, lng: 105.9745,
    color: '#3b82f6',
    type: 'hotel',
    priority: true,
    stars: 4,
    price: '1.090.000 – 2.000.000đ/đêm',
    priceEn: '1,090,000 – 2,000,000 VND/night',
    checkin: '14h00', checkout: '12h00',
    note: '4 sao, trung tâm TP Ninh Bình, 153 phòng từ 33m², hồ bơi ngoài trời, spa, nhà hàng buffet, view sông. Tốt cho cặp đôi.',
    noteEn: '4-star, city center, 153 rooms from 33m², outdoor pool, spa, buffet restaurant, river view. Great for couples.',
  },
  {
    name: 'Milan Hotel',
    nameEn: 'Milan Hotel',
    lat: 20.2489, lng: 105.9772,
    color: '#3b82f6',
    type: 'hotel',
    priority: true,
    stars: 3,
    price: '700.000 – 1.100.000đ/đêm',
    priceEn: '700,000 – 1,100,000 VND/night (~29–30 USD)',
    checkin: '14h00', checkout: '12h00',
    note: '3 sao, 33 Trần Hưng Đạo, đối diện Phố cổ Hoa Lư, ban công view phố cổ, nhân viên nhiệt tình. Vị trí trung tâm vui chơi.',
    noteEn: '3-star, 33 Tran Hung Dao, directly opposite Hoa Lu Old Quarter, balcony with Old Quarter view, helpful staff.',
  },
  {
    name: 'Rêu Coffee & Stay',
    nameEn: 'Reu Coffee & Stay',
    lat: 20.2320, lng: 105.9200,
    color: '#3b82f6',
    type: 'hotel',
    priority: true,
    stars: null,
    price: 'Liên hệ để biết giá',
    priceEn: 'Contact for pricing',
    checkin: '14h00', checkout: '12h00',
    note: 'Không gian xanh mướt độc đáo, vừa là quán cà phê vừa là chỗ nghỉ, check-in cực đẹp. Giới trẻ yêu thích.',
    noteEn: 'Unique lush green space, café and guesthouse combined, very photogenic. Popular with young travelers.',
  },
];


// ── 3. NHÀ HÀNG / ĂN UỐNG ────────────────────────────────
const RESTAURANTS = [
  {
    name: 'Heo Say Xỉn (GC22-23)',
    nameEn: 'Heo Say Xin (GC22-23)',
    lat: 20.2491, lng: 105.9768,
    color: '#f59e0b',
    type: 'food',
    priority: true,
    location: 'Gian hàng GC22-23, Phố cổ Hoa Lư',
    locationEn: 'Stall GC22-23, Hoa Lu Old Quarter',
    price: 'Tầm trung',
    priceEn: 'Mid-range',
    bestTime: 'Buổi tối',
    bestTimeEn: 'Evening',
    note: 'Heo nuôi bằng rượu & thảo dược, da giòn thịt mềm thấm vị. Đặc sản độc đáo "Vietnam\'s Kobe Pork". Nên đến sớm vì hay hết.',
    noteEn: 'Pork raised on rice wine & herbs, crispy skin, tender meat. Unique "Vietnam\'s Kobe Pork" concept. Arrive early — sells out fast.',
  },
  {
    name: 'Lẩu Gà Lá É (GC57-58)',
    nameEn: 'Lau Ga La E (GC57-58)',
    lat: 20.2488, lng: 105.9771,
    color: '#f59e0b',
    type: 'food',
    priority: true,
    location: 'Gian hàng GC57-58, Phố cổ Hoa Lư',
    locationEn: 'Stall GC57-58, Hoa Lu Old Quarter',
    price: '300.000 – 500.000đ/nồi (2–3 người)',
    priceEn: '300,000 – 500,000 VND/pot (2–3 people)',
    bestTime: 'Buổi tối',
    bestTimeEn: 'Evening',
    note: 'Lẩu gà thảo mộc chuẩn vị Đà Lạt, nước dùng ngọt thanh từ lá é. Không gian chill, view phố cổ đẹp về đêm.',
    noteEn: 'Da Lat-style herb chicken hotpot, fragrant sweet broth with lemon basil. Chill vibe with great Old Quarter night view.',
  },
];


// ── 4. MUA SẮM / KHÁC ────────────────────────────────────
const SHOPS = [
  {
    name: 'Đại Long Building — Cơm Cháy',
    nameEn: 'Dai Long Building — Burnt Rice',
    lat: 20.2540, lng: 105.9720,
    color: '#10b981',
    type: 'shop',
    priority: true,
    address: '325A Đường Lê Thái Tổ, Ninh Bình',
    addressEn: '325A Le Thai To Street, Ninh Binh',
    price: 'Nhiều mức giá',
    priceEn: 'Various price ranges',
    note: 'Địa chỉ uy tín mua cơm cháy làm quà. Nhiều loại đóng gói sẵn, có thể ship về.',
    noteEn: 'Trusted address for burnt rice souvenirs. Various pre-packaged options, can be shipped.',
  },
];


// ── TỔNG HỢP ─────────────────────────────────────────────
// Gộp tất cả cho bản đồ
const PLACES = [...ATTRACTIONS, ...HOTELS, ...RESTAURANTS, ...SHOPS];

// Chỉ lấy những nơi được ưu tiên → đưa vào system prompt cho AI
const PRIORITY_PLACES = PLACES.filter(p => p.priority);


// ── SINH SYSTEM PROMPT TỰ ĐỘNG ───────────────────────────
function buildPriorityContext(lang) {
  const isVi = lang === 'vi';

  const attractions = ATTRACTIONS.filter(p => p.priority);
  const hotels = HOTELS.filter(p => p.priority);
  const restaurants = RESTAURANTS.filter(p => p.priority);
  const shops = SHOPS.filter(p => p.priority);

  let out = isVi
    ? '\n\nĐỊA ĐIỂM & CƠ SỞ ƯU TIÊN GỢI Ý (nhắc tự nhiên khi phù hợp):\n'
    : '\n\nPRIORITY PLACES TO RECOMMEND (mention naturally when relevant):\n';

  // Tham quan
  if (attractions.length) {
    out += isVi ? '\nTHAM QUAN:\n' : '\nATTRACTIONS:\n';
    attractions.forEach(p => {
      const name = isVi ? p.name : p.nameEn;
      const note = isVi ? p.note : p.noteEn;
      const ticket = isVi ? p.ticket : p.ticketEn;
      out += `- ${name}: ${note} Giờ mở cửa: ${p.hours}. Vé: ${ticket}\n`;
    });
  }

  // Lưu trú
  if (hotels.length) {
    out += isVi
      ? '\nLƯU TRÚ (checkin 14h, checkout 12h):\n'
      : '\nACCOMMODATION (check-in 2pm, check-out 12pm):\n';
    hotels.forEach(p => {
      const name = isVi ? p.name : p.nameEn;
      const note = isVi ? p.note : p.noteEn;
      const price = isVi ? p.price : p.priceEn;
      const stars = p.stars ? ` ${p.stars}★` : '';
      out += `- ${name}${stars}: ${note} Giá: ${price}\n`;
    });
  }

  // Ăn uống
  if (restaurants.length) {
    out += isVi ? '\nĂN UỐNG (ưu tiên buổi tối):\n' : '\nFOOD (priority for dinner):\n';
    restaurants.forEach(p => {
      const name = isVi ? p.name : p.nameEn;
      const note = isVi ? p.note : p.noteEn;
      const loc = isVi ? p.location : p.locationEn;
      const price = isVi ? p.price : p.priceEn;
      out += `- ${name} (${loc}): ${note} Giá: ${price}\n`;
    });
  }

  // Mua sắm
  if (shops.length) {
    out += isVi ? '\nMUA SẮM / QUÀ LƯU NIỆM:\n' : '\nSOUVENIRS / SHOPPING:\n';
    shops.forEach(p => {
      const name = isVi ? p.name : p.nameEn;
      const note = isVi ? p.note : p.noteEn;
      const addr = isVi ? p.address : p.addressEn;
      out += `- ${name} (${addr}): ${note}\n`;
    });
  }

  return out;
}
