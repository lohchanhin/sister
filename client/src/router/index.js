import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import Login from '../views/Login.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import Dashboard from '../views/Dashboard.vue'
import Account from '../views/Account.vue'
import AssetLibrary from '../views/AssetLibrary.vue'
import ProductLibrary from '../views/ProductLibrary.vue'
import EmployeeManager from '../views/EmployeeManager.vue'
import RoleSettings from '../views/RoleSettings.vue'
import TagManager from '../views/TagManager.vue'
import ReviewSettings from '../views/ReviewSettings.vue'
import AdClients from '../views/AdClients.vue'
import AdPlatforms from '../views/AdPlatforms.vue'
import AdData from '../views/AdData.vue'


const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { public: true }
  },
  {
    path: '/',
    component: DashboardLayout,
    children: [
      { path: 'dashboard', name: 'Dashboard', component: Dashboard, meta: { menu: 'dashboard' } },
      { path: 'account', name: 'Account', component: Account, meta: { menu: 'account' } },
      { path: 'assets', name: 'Assets', component: AssetLibrary, meta: { menu: 'assets' } },
      { path: 'products', name: 'Products', component: ProductLibrary, meta: { menu: 'products' } },

      { path: 'employees', name: 'EmployeeManager', component: EmployeeManager, meta: { menu: 'employees' } },
      { path: 'roles', name: 'RoleSettings', component: RoleSettings, meta: { menu: 'roles' } },
      { path: 'tags', name: 'TagManager', component: TagManager, meta: { menu: 'tags' } },
      { path: 'review-stages', name: 'ReviewSettings', component: ReviewSettings, meta: { menu: 'review-stages' } },
      { path: 'ad-clients', name: 'AdClients', component: AdClients, meta: { menu: 'ad-data' } },
      { path: 'clients/:clientId/platforms', name: 'AdPlatforms', component: AdPlatforms },
      { path: 'clients/:clientId/platforms/:platformId/data', name: 'AdData', component: AdData }
    ]
  },
  // 404
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/* -------- 路由守衛：驗證 JWT & 權限 -------- */
router.beforeEach((to) => {
  const store = useAuthStore()
  if (to.meta.public) return true // 公開頁面

  // 若尚未登入，導向 login
  if (!store.isAuthenticated) return '/login'
  const menus = store.user?.menus || []
  if (to.meta.menu && !menus.includes(to.meta.menu)) return '/'
  return true
})

export default router
