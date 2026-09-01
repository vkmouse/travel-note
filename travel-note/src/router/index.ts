import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 沒有 travelId：顯示旅行選擇畫面。實際畫面由 AppShell 依 route 是否帶 travelId 直接判斷顯示，
    // 這裡掛上 component 只是為了滿足路由型別與可獨立導覽到這個 name。
    { path: '/', name: 'picker', component: () => import('../views/TravelPickerView.vue') },
    // 只給了 travelId、沒指定分頁時，預設導去每日行程
    { path: '/travels/:travelId', redirect: (to) => ({ name: 'itinerary', params: to.params }) },
    {
      path: '/travels/:travelId/itinerary',
      name: 'itinerary',
      component: () => import('../views/ItineraryView.vue'),
    },
    {
      path: '/travels/:travelId/documents',
      name: 'documents',
      component: () => import('../views/DocumentsView.vue'),
    },
    {
      path: '/travels/:travelId/info',
      name: 'info',
      component: () => import('../views/InfoView.vue'),
    },
    {
      path: '/travels/:travelId/checklist',
      name: 'checklist',
      component: () => import('../views/ChecklistView.vue'),
    },
    // 舊網址或未知路徑一律回到旅行選擇畫面
    { path: '/:pathMatch(.*)*', redirect: { name: 'picker' } },
  ],
})

export default router
