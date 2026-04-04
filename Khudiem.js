// ============================================================
//  NINH BÌNH AI — Địa điểm tham quan
//  File: khudiem.js
//
//  Hướng dẫn thêm địa điểm mới:
//  - Tọa độ lat/lng: Google Maps → click chuột phải → Sao chép tọa độ
//  - priority: true  → AI chủ động nhắc đến khi tư vấn
//  - priority: false → Chỉ hiển thị trên bản đồ, AI không chủ động nhắc
//  - color: '#ef4444' (đỏ) cho tất cả điểm tham quan
// ============================================================

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
    note: 'Di sản UNESCO kép — đi thuyền qua hang động, 3 tuyến 2.5–3h. Đặt vé online trước, đến trước 8h tránh đông.',
    noteEn: 'UNESCO dual heritage — boat through caves, 3 routes 2.5–3hrs. Book online, arrive before 8am to avoid crowds.',
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
    note: 'Leo 486 bậc đá lên đỉnh Ngọa Long, ngắm toàn cảnh Tam Cốc. Đi lúc 6h30 sáng tránh nắng và có ảnh đẹp.',
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
    note: 'Đi thuyền qua 3 hang động, ngắm đồng lúa. Đẹp nhất tháng 5–6 lúa chín vàng.',
    noteEn: 'Boat through 3 caves past rice paddies. Most beautiful May–Jun golden rice season.',
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
    note: 'Quần thể chùa lớn nhất Đông Nam Á. Rất rộng, nên đi xe điện.',
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
    note: 'Hành cung Hoa Lư xưa, không gian hoang sơ ít người biết, văn hóa Mường độc đáo. Gần Bái Đính ~3km.',
    noteEn: 'Former royal retreat, off-the-beaten-path, unique Muong culture. Near Bai Dinh ~3km.',
  },
];
