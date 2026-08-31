export const ICONS: Record<string, string> = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/><path d="M14.5 7.5l2 2"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/>',
  chevrondown: '<path d="m6 9 6 6 6-6"/>',
  calendar: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M7.9 2v4.5M16.1 2v4.5M3 9h18"/>',
  ticket:
    '<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.3a1.7 1.7 0 0 0 0 3.4V14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.3a1.7 1.7 0 0 0 0-3.4z"/><path d="M9 6v12" stroke-dasharray="2.2 2.2"/>',
  bookmark: '<path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4.2L5 20V5a1 1 0 0 1 1-1z"/>',
  checksquare: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 12.5l2.5 2.5L16 9"/>',
  check: '<path d="M4.5 12.5l4.7 4.7L19.5 7"/>',
  pin: '<path d="M12 21s-6.5-5.7-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.3-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.2"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M14.8 9.2l-2 5.6-5.6 2 2-5.6z"/>',
  link: '<path d="M9.5 14.5l5-5"/><path d="M12 6l1.5-1.5a3.5 3.5 0 0 1 5 5L17 11"/><path d="M12 18l-1.5 1.5a3.5 3.5 0 0 1-5-5L7 13"/>',
  bed: '<path d="M4 19V7"/><path d="M4 12h15a2.5 2.5 0 0 1 2.5 2.5V19"/><path d="M2 19h20"/><rect x="5.5" y="8.5" width="5" height="4" rx="1.3"/>',
  send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
  bus: '<rect x="4" y="4" width="16" height="12" rx="2.5"/><path d="M4 11.5h16"/><circle cx="8" cy="18" r="1.3"/><circle cx="16" cy="18" r="1.3"/>',
  train:
    '<rect x="5.5" y="3" width="13" height="12.5" rx="4"/><path d="M5.5 10.5h13"/><circle cx="9.2" cy="13.6" r="0.9"/><circle cx="14.8" cy="13.6" r="0.9"/><path d="M8.2 19.2l-2 2.3M15.8 19.2l2 2.3"/>',
  passport: '<rect x="6" y="3" width="12" height="18" rx="2"/><circle cx="12" cy="9" r="2.2"/><path d="M9 13.6h6M9.6 16.6h4.8"/>',
  tag: '<path d="M20.4 11.5L12.4 3.5A2 2 0 0 0 11 3H4.5a1 1 0 0 0-1 1V11a2 2 0 0 0 .6 1.4l8 8a2 2 0 0 0 2.8 0l5.5-5.5a2 2 0 0 0 0-2.9z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
  wrench:
    '<path d="M14.6 6.3a4 4 0 1 0-5.3 5.4L2.5 18.5l3 3 6.8-6.8a4 4 0 0 0 5.3-5.4l-2.7 2.7-2.2-.4-.4-2.2z"/>',
  bulb: '<path d="M9.3 18h5.4M10.2 21h3.6"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.5.35.75.95.75 1.6v.4h5.5v-.4c0-.65.25-1.25.75-1.6A6 6 0 0 0 12 3z"/>',
  phone:
    '<path d="M21 16.5v2.8a1.8 1.8 0 0 1-2 1.8 17.8 17.8 0 0 1-7.8-2.8A17.5 17.5 0 0 1 5.7 13a17.8 17.8 0 0 1-2.8-7.8A1.8 1.8 0 0 1 4.7 3.4h2.8a1.8 1.8 0 0 1 1.8 1.5c.1.9.3 1.8.6 2.6a1.8 1.8 0 0 1-.4 1.9l-1.2 1.2a14.3 14.3 0 0 0 5.4 5.4l1.2-1.2a1.8 1.8 0 0 1 1.9-.4c.8.3 1.7.5 2.6.6a1.8 1.8 0 0 1 1.5 1.9z"/>',
  idcard:
    '<rect x="2.5" y="5.5" width="19" height="13" rx="2"/><circle cx="8.3" cy="12" r="2"/><path d="M6 15.8c.5-1.3 1.5-2.1 2.3-2.1s1.8.8 2.3 2.1M14.5 9.5h5M14.5 12.5h5M14.5 15.5h3"/>',
  plug: '<path d="M9 2v5M15 2v5M7.5 7h9v3a4.5 4.5 0 0 1-9 0z"/><path d="M12 14v4M9 21h6"/>',
  pill: '<path d="M4.7 14.8l5.6-5.6a4.1 4.1 0 1 1 5.8 5.8l-5.6 5.6a4.1 4.1 0 0 1-5.8-5.8z"/><path d="M8.7 8.7l6.6 6.6"/>',
  suitcase: '<rect x="3" y="7" width="18" height="13" rx="2.2"/><path d="M8.5 7V5.3A1.8 1.8 0 0 1 10.3 3.5h3.4A1.8 1.8 0 0 1 15.5 5.3V7"/><path d="M3 12.5h18"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 8.3a3 3 0 0 1 0 5.9"/><path d="M18.5 14.6c2.3.6 3.5 2.4 3.5 5.4"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
  userplus: '<circle cx="9.5" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6.5-5.5s6.5 2.2 6.5 5.5"/><path d="M18.5 8v5M16 10.5h5"/>',
  doorexit: '<path d="M13 4H7a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 7 20h6"/><path d="M10.5 12h9.5"/><path d="M17 9l3 3-3 3"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  download: '<path d="M12 3.5v11"/><path d="M7.5 10.5l4.5 4.5 4.5-4.5"/><path d="M4.5 18.5h15"/>',
  upload: '<path d="M12 19.5v-11"/><path d="M7.5 12.5l4.5-4.5 4.5 4.5"/><path d="M4.5 18.5h15"/>',
  copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 8.5V5.8A1.8 1.8 0 0 0 13.7 4H5.8A1.8 1.8 0 0 0 4 5.8v7.9a1.8 1.8 0 0 0 1.8 1.8h2.7"/>',
}

export const ICONS_FILLED: Record<string, string> = {
  calendar:
    '<rect x="3" y="4" width="18" height="17" rx="3" fill="currentColor"/><rect x="7" y="2" width="1.8" height="4.5" rx="0.9" fill="currentColor"/><rect x="15.2" y="2" width="1.8" height="4.5" rx="0.9" fill="currentColor"/><rect x="3" y="8.6" width="18" height="1.4" class="cutout"/>',
  ticket:
    '<path fill="currentColor" d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.3a1.7 1.7 0 0 0 0 3.4V14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.3a1.7 1.7 0 0 0 0-3.4z"/><rect x="8.2" y="6" width="1.6" height="12" class="cutout"/>',
  bookmark: '<path fill="currentColor" d="M6 4h12a1 1 0 0 1 1 1v15l-7-4.2L5 20V5a1 1 0 0 1 1-1z"/>',
  checksquare:
    '<rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor"/><path class="cutout-stroke" d="M8 12.5l2.5 2.5L16 9"/>',
}

export const CATEGORY_ICON: Record<string, string> = {
  住宿: 'bed',
  機票: 'send',
  交通: 'bus',
  票券: 'ticket',
  火車: 'train',
  簽證: 'passport',
  其他: 'tag',
  工具: 'wrench',
  靈感: 'bulb',
  緊急聯絡: 'phone',
  證件: 'idcard',
  電子用品: 'plug',
  藥品: 'pill',
}
