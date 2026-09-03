// 範例行程的內容原本寫死在後端 functions/api/sample-travel.ts，現在搬到前端維護

const SAMPLE_ITINERARY = [
  { date: '2026-10-05', time: '09:00', title: '抵達成田機場', map_url: 'https://maps.google.com/?q=成田機場', note: '領取 [JR PASS](旅行文件/交通) 七日券，記得先劃位' },
  { date: '2026-10-05', time: '14:00', title: '淺草寺', map_url: 'https://maps.google.com/?q=淺草寺', note: '' },
  { date: '2026-10-05', time: '18:30', title: '晚餐：雷門今半壽喜燒', map_url: 'https://maps.google.com/?q=今半雷門本店', note: '已訂位，**18:30到**' },
  { date: '2026-10-06', time: '10:00', title: '明治神宮', map_url: 'https://maps.google.com/?q=明治神宮', note: '' },
  { date: '2026-10-06', time: '13:00', title: '原宿逛街', map_url: 'https://maps.google.com/?q=竹下通', note: '買朋友推薦的鬆餅，*假日人潮會很多*' },
  { date: '2026-10-06', time: '19:00', title: '澀谷夜景 + SKY EXPRESS', map_url: 'https://maps.google.com/?q=澀谷Sky', note: '[KKday 票券](旅行文件/票券) 已在旅行文件' },
  { date: '2026-10-07', time: '08:30', title: '搭新幹線前往京都', map_url: 'https://maps.google.com/?q=東京車站', note: '車票在旅行文件' },
  { date: '2026-10-07', time: '12:00', title: '伏見稻荷大社', map_url: 'https://maps.google.com/?q=伏見稻荷大社', note: '' },
  { date: '2026-10-08', time: '09:00', title: '清水寺', map_url: 'https://maps.google.com/?q=清水寺', note: '' },
  { date: '2026-10-08', time: '15:00', title: '祇園散策晚餐', map_url: 'https://maps.google.com/?q=祇園', note: '找間町屋居酒屋吃晚餐' },
  { date: '2026-10-09', time: '09:00', title: '嵐山竹林小徑', map_url: 'https://maps.google.com/?q=嵐山竹林小徑', note: '' },
  { date: '2026-10-09', time: '13:00', title: '金閣寺', map_url: 'https://maps.google.com/?q=金閣寺', note: '' },
  { date: '2026-10-10', time: '09:00', title: '搭新幹線前往大阪', map_url: 'https://maps.google.com/?q=京都車站', note: '車票在旅行文件' },
  { date: '2026-10-10', time: '12:00', title: '大阪城', map_url: 'https://maps.google.com/?q=大阪城公園', note: '' },
  { date: '2026-10-10', time: '18:00', title: '心齋橋逛街晚餐', map_url: 'https://maps.google.com/?q=心齋橋筋商店街', note: '' },
  { date: '2026-10-11', time: '09:00', title: '大阪環球影城', map_url: 'https://maps.google.com/?q=大阪環球影城', note: '已買快速通關票，入場流程：\n1. 出示 QR code\n2. 走 Express 通道\n3. 直接進場' },
  { date: '2026-10-12', time: '09:00', title: '奈良公園餵鹿', map_url: 'https://maps.google.com/?q=奈良公園', note: '記得買鹿仙貝' },
  { date: '2026-10-12', time: '13:00', title: '東大寺', map_url: 'https://maps.google.com/?q=東大寺', note: '' },
  { date: '2026-10-13', time: '10:00', title: '道頓堀散策', map_url: 'https://maps.google.com/?q=道頓堀', note: '' },
  { date: '2026-10-13', time: '15:00', title: '黑門市場', map_url: 'https://maps.google.com/?q=黑門市場', note: '吃海鮮串燒當下午茶' },
  { date: '2026-10-14', time: '08:00', title: '搭新幹線返回東京', map_url: 'https://maps.google.com/?q=新大阪車站', note: '車票在旅行文件' },
  { date: '2026-10-14', time: '15:00', title: '銀座逛街', map_url: 'https://maps.google.com/?q=銀座', note: '' },
  { date: '2026-10-15', time: '10:00', title: '台場自由行', map_url: 'https://maps.google.com/?q=台場海濱公園', note: '' },
  { date: '2026-10-15', time: '18:30', title: '晚餐燒肉', map_url: 'https://maps.google.com/?q=燒肉トラジ六本木店', note: '慶祝旅程最後一晚' },
  { date: '2026-10-16', time: '09:00', title: '退房前往機場', map_url: 'https://maps.google.com/?q=東京喜來登飯店', note: '出發前確認：\n- 護照\n- 登機證\n- 鑰匙卡歸還' },
  { date: '2026-10-16', time: '13:00', title: '成田機場起飛', map_url: 'https://maps.google.com/?q=成田機場', note: '長榮航空 check-in' },
]

const SAMPLE_DOCUMENTS = [
  { category: '住宿', title: '東京喜來登飯店', date_start: '2026-10-05', date_end: '2026-10-08', map_url: 'https://booking.com/xxx', note: '訂單號 `BK123456`，Check-in **15:00**' },
  { category: '機票', title: '長榮 BR198 台北→東京', date_start: '2026-10-05', date_end: '', map_url: '', note: '去程 08:00起飛，訂位代號 `ABC123`' },
  { category: '簽證', title: '日本短期簽證', date_start: '', date_end: '', map_url: '', note: '*免簽*，護照效期需**6個月以上**' },
  { category: '票券', title: '澀谷Sky展望台門票', date_start: '2026-10-06', date_end: '', map_url: 'https://kkday.com/xxx', note: '憑 `QR code` 入場，19:00場次' },
  { category: '火車', title: '新幹線 東京→京都', date_start: '2026-10-07', date_end: '', map_url: '', note: '08:30發車，指定席 **車廂8 座位5A**' },
  { category: '交通', title: 'JR PASS 7日券', date_start: '2026-10-05', date_end: '2026-10-11', map_url: '', note: '成田機場領取，適用範圍：\n- JR 在來線\n- 新幹線（不含のぞみ/みずほ）\n- JR巴士部分路線' },
]

const SAMPLE_INFO = [
  { category: '工具', title: '日圓匯率換算', map_url: 'https://www.xe.com', note: '', is_checked: false },
  { category: '工具', title: 'Google翻譯離線包', map_url: '', note: '出發前記得下載日文離線包：\n1. 開啟App\n2. 設定 > 離線翻譯\n3. 下載日文包', is_checked: true },
  { category: '靈感', title: '小紅書推薦的原宿咖啡廳', map_url: 'https://xhslink.com/xxx', note: '朋友說**必吃鬆餅**', is_checked: false },
  { category: '靈感', title: 'IG看到的今治毛巾專賣店', map_url: 'https://instagram.com/xxx', note: '銀座店', is_checked: false },
  { category: '緊急聯絡', title: '駐日台北經濟文化代表處', map_url: '', note: '電話：`03-3280-7811`，地址：東京都港區白金台5-20-2', is_checked: false },
  { category: '緊急聯絡', title: '海外突發傷病險 24hr專線', map_url: '', note: '電話：**0800-xxx-xxx**（24小時）', is_checked: false },
]

const SAMPLE_CHECKLIST = [
  { category: '證件', title: '護照正本', note: '確認效期**6個月以上**，簽證資訊看 [這裡](旅行文件/簽證)', is_checked: false },
  { category: '證件', title: '駕照國際譯本', note: '', is_checked: false },
  { category: '電子用品', title: '萬國轉接頭', note: '', is_checked: true },
  { category: '電子用品', title: '行動電源', note: '*過安檢記得拿出來*', is_checked: true },
  { category: '藥品', title: '腸胃藥、暈車藥', note: '出發前要準備：\n- 腸胃藥\n- 暈車藥\n- 頭痛藥', is_checked: false },
]

export const SAMPLE_TRAVEL_PAYLOAD = {
  title: '東京京都大阪範例行程',
  date_start: '2026-10-05',
  date_end: '2026-10-16',
  itinerary: SAMPLE_ITINERARY,
  documents: SAMPLE_DOCUMENTS,
  info: SAMPLE_INFO,
  checklist: SAMPLE_CHECKLIST,
}
