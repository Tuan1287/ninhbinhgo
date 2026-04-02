// ============================================================
//  NINH BÌNH AI — Cơ sở lưu trú
//  File: luutru.js
//
//  Hướng dẫn thêm cơ sở mới:
//  - Tọa độ lat/lng: Google Maps → click chuột phải → Sao chép tọa độ
//  - priority: true  → AI chủ động gợi ý khi tư vấn lưu trú
//  - priority: false → Chỉ hiển thị trên bản đồ
//  - color: '#3b82f6' (xanh dương) cho tất cả cơ sở lưu trú
//  - checkin/checkout: điền đúng giờ thực tế của cơ sở
// ============================================================

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
    note: '4 sao, trung tâm TP Ninh Bình, 153 phòng từ 33m², hồ bơi ngoài trời, spa, nhà hàng buffet, view sông.',
    noteEn: '4-star, city center, 153 rooms from 33m², outdoor pool, spa, buffet restaurant, river view.',
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
    note: '3 sao, 33 Trần Hưng Đạo, đối diện Phố cổ Hoa Lư, ban công view phố cổ, nhân viên nhiệt tình.',
    noteEn: '3-star, 33 Tran Hung Dao, directly opposite Hoa Lu Old Quarter, balcony with Old Quarter view.',
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
