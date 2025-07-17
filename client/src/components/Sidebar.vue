<template>
  <aside :class="['layout-sidebar', { 'layout-sidebar-collapsed': isCollapsed }]">
    <div class="sidebar-header">
      <Button
        icon="pi pi-bars"
        class="p-button-text p-button-rounded"
        @click="toggleCollapse"
      />
    </div>

    <div class="sidebar-content">
      <Menu :model="navItems" class="w-full">
        <template #item="{ item, props }">
          <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
            <a :href="href" v-bind="props.action" @click="navigate">
              <span :class="item.icon" />
              <span class="ml-2">{{ item.label }}</span>
            </a>
          </router-link>
        </template>
      </Menu>
    </div>

    <div class="sidebar-footer">
      <Button
        :icon="isCollapsed ? 'pi pi-sign-out' : undefined"
        :label="isCollapsed ? '' : '登出'"
        class="p-button-danger w-full"
        @click="logout"
      />
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, defineEmits } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { MENU_NAMES } from '../menuNames'
import Button from 'primevue/button'
import Menu from 'primevue/menu'

const emit = defineEmits(['toggle-collapse'])
const isCollapsed = ref(false)
const store = useAuthStore()
const router = useRouter()

const allMenus = {
  dashboard: { route: '/dashboard', icon: 'pi pi-home' },
  assets: { route: '/assets', icon: 'pi pi-video' },
  products: { route: '/products', icon: 'pi pi-box' },
  employees: { route: '/employees', icon: 'pi pi-users' },
  roles: { route: '/roles', icon: 'pi pi-shield' },
  tags: { route: '/tags', icon: 'pi pi-tags' },
  'review-stages': { route: '/review-stages', icon: 'pi pi-check-square' },
  'ad-data': { route: '/ad-clients', icon: 'pi pi-chart-bar' },
  account: { route: '/account', icon: 'pi pi-user' }
}

const navItems = computed(() => {
  const codes = store.user?.menus || []
  const perms = store.user?.permissions || []
  return codes
    .filter(c => (c !== 'roles' || perms.includes('role:manage')))
    .map(c => ({
      label: MENU_NAMES[c] || c,
      icon: allMenus[c]?.icon || 'pi pi-question-circle',
      route: allMenus[c]?.route || '/'
    }))
})

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  emit('toggle-collapse', isCollapsed.value)
}

const logout = () => {
  store.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout-sidebar {
  display: flex;
  flex-direction: column;
  width: 250px;
  background-color: var(--surface-a);
  border-right: 1px solid var(--surface-d);
  transition: width 0.2s ease-in-out;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}

.layout-sidebar-collapsed {
  width: 5rem;
}

.layout-sidebar-collapsed .ml-2 {
  display: none;
}

.sidebar-header {
  padding: 1rem;
  display: flex;
  justify-content: flex-end;
}

.sidebar-content {
  flex-grow: 1;
  overflow-y: auto;
}

.sidebar-footer {
  padding: 1rem;
  margin-top: auto;
}

/* PrimeVue Menu Customization */
:deep(.p-menu) {
  border: none;
  background: none;
  width: 100%;
}

:deep(.p-menuitem-content) {
  border-radius: 6px;
  margin: 0 0.5rem;
}

:deep(.p-menuitem-content:hover) {
    background-color: var(--surface-c);
}

:deep(.p-menuitem-link) {
    color: var(--text-color);
    text-decoration: none;
}

:deep(.p-menuitem-link:hover) {
    background-color: transparent;
}
</style>
