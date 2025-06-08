import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import Login from '../views/Login.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import Dashboard from '../views/Dashboard.vue'
import Account from '../views/Account.vue'
import Progress from '../views/Progress.vue'
import AssetLibrary from '../views/AssetLibrary.vue'
import ProductLibrary from '../views/ProductLibrary.vue'
import EmployeeManager from '../views/EmployeeManager.vue'

import RoleSettings from '../views/RoleSettings.vue'


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
      { path: '', name: 'Dashboard', component: Dashboard },
      { path: 'account', name: 'Account', component: Account },
      { path: 'progress', name: 'Progress', component: Progress },
      { path: 'assets', name: 'Assets', component: AssetLibrary },
      { path: 'products', name: 'Products', component: ProductLibrary },

      { path: 'employees', name: 'EmployeeManager', component: EmployeeManager, meta: { role: 'manager' } },
      { path: 'roles', name: 'RoleSettings', component: RoleSettings, meta: { role: 'manager' } }
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
  if (to.meta.role && store.role !== to.meta.role) return '/'
  return true
})

export default router
