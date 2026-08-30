import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/itinerary' },
    {
      path: '/itinerary',
      name: 'itinerary',
      component: () => import('../views/ItineraryView.vue'),
    },
    {
      path: '/documents',
      name: 'documents',
      component: () => import('../views/DocumentsView.vue'),
    },
    {
      path: '/info',
      name: 'info',
      component: () => import('../views/InfoView.vue'),
    },
    {
      path: '/checklist',
      name: 'checklist',
      component: () => import('../views/ChecklistView.vue'),
    },
  ],
})

export default router
