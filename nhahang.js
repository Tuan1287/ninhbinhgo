// ============================================================
//  NINH BÌNH AI — Nhà hàng & Mua sắm
//  File: nhahang.js
//
//  Hướng dẫn thêm địa điểm mới:
//  - Tọa độ lat/lng: Google Maps → click chuột phải → Sao chép tọa độ
//  - priority: true  → AI chủ động gợi ý khi tư vấn ăn uống / mua sắm
//  - priority: false → Chỉ hiển thị trên bản đồ
//  - type: 'food'  → Nhà hàng / quán ăn (màu vàng #f59e0b)
//  - type: 'shop'  → Mua sắm / quà lưu niệm (màu xanh lá #10b981)
// ============================================================

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
    note: 'Heo nuôi bằng rượu & thảo dược, da giòn thịt mềm. Đặc sản độc đáo "Vietnam\'s Kobe Pork". Nên đến sớm vì hay hết.',
    noteEn: 'Pork raised on rice wine & herbs, crispy skin, tender meat. "Vietnam\'s Kobe Pork". Arrive early — sells out fast.',
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
    noteEn: 'Da Lat-style herb chicken hotpot, fragrant sweet broth. Chill vibe with great Old Quarter night view.',
  },
  {
    name: 'Đại Long Building — Cơm Cháy',
    nameEn: 'Dai Long Building — Burnt Rice',
    lat: 20.2540, lng: 105.9720,
    color: '#10b981',
    type: 'shop',
    priority: true,
    location: '325A Đường Lê Thái Tổ, Ninh Bình',
    locationEn: '325A Le Thai To Street, Ninh Binh',
    price: 'Nhiều mức giá',
    priceEn: 'Various price ranges',
    bestTime: 'Cả ngày',
    bestTimeEn: 'All day',
    note: 'Địa chỉ uy tín mua cơm cháy làm quà. Nhiều loại đóng gói sẵn, có thể ship về.',
    noteEn: 'Trusted address for burnt rice souvenirs. Various pre-packaged options, can be shipped.',
  },
];
