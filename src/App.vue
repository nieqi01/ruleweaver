<template>
  <div class="app">
    <!-- 顶部导航 -->
    <header class="app-header">
      <div class="header-brand">
        <span class="brand-icon">🕸️</span>
        <span class="brand-text">RuleWeaver</span>
      </div>
      
      <!-- 小说选择器 - 有小说时显示 -->
      <div v-if="novelStore.hasNovel" class="novel-selector">
        <select :value="novelStore.currentNovel?.id" @change="onNovelChange">
          <option v-for="novel in novelStore.novelList" :key="novel.id" :value="novel.id">
            {{ novel.name }}
          </option>
        </select>
      </div>
      
      <nav class="header-nav">
        <router-link 
          v-for="item in navItems" 
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ active: $route.path === item.path }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-text">{{ item.name }}</span>
        </router-link>
      </nav>
    </header>
    
    <!-- 主内容区 -->
    <main class="app-main">
      <router-view />
    </main>
    
    <!-- 底部导航 - 移动端 -->
    <nav v-if="isMobile" class="mobile-nav">
      <router-link 
        v-for="item in mobileNavItems" 
        :key="item.path"
        :to="item.path"
        class="mobile-nav-link"
        :class="{ active: $route.path === item.path }"
      >
        <span class="mobile-nav-icon">{{ item.icon }}</span>
        <span class="mobile-nav-text">{{ item.name }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useNovelStore } from './stores/novelStore'

const novelStore = useNovelStore()

// 响应式
const isMobile = ref(window.innerWidth < 768)
window.addEventListener('resize', () => {
  isMobile.value = window.innerWidth < 768
})

// 导航项
const navItems = [
  { path: '/', name: '首页', icon: '🏠' },
  { path: '/write', name: '写作', icon: '✍️' },
  { path: '/entities', name: '实体', icon: '👤' },
  { path: '/instances', name: '副本', icon: '🗺️' },
  { path: '/relations', name: '关系', icon: '🕸️' },
  { path: '/ai', name: 'AI', icon: '🤖' }
]

const mobileNavItems = [
  { path: '/', name: '首页', icon: '🏠' },
  { path: '/write', name: '写作', icon: '✍️' },
  { path: '/entities', name: '实体', icon: '👤' },
  { path: '/ai', name: 'AI', icon: '🤖' }
]

function onNovelChange(e) {
  const novel = novelStore.novelList.find(n => n.id === parseInt(e.target.value))
  novelStore.setCurrentNovel(novel)
}

onMounted(() => {
  novelStore.init()
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 24px;
  z-index: 100;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 600;
  color: var(--accent);
}

.brand-icon {
  font-size: 24px;
}

.novel-selector {
  flex: 1;
  max-width: 240px;
}

.novel-selector select {
  padding: 8px 12px;
  font-size: 14px;
}

.header-nav {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.3s;
}

.nav-link:hover,
.nav-link.active {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.nav-link.active {
  color: var(--accent);
}

.app-main {
  flex: 1;
  margin-top: 64px;
  padding-bottom: 80px;
}

/* 移动端底部导航 */
.mobile-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  justify-content: space-around;
  align-items: center;
  z-index: 100;
}

.mobile-nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 12px;
}

.mobile-nav-link.active {
  color: var(--accent);
}

.mobile-nav-icon {
  font-size: 22px;
}

@media (max-width: 768px) {
  .app-header {
    padding: 0 16px;
    gap: 12px;
  }
  
  .header-brand .brand-text {
    display: none;
  }
  
  .header-nav {
    display: none;
  }
  
  .novel-selector {
    max-width: none;
  }
  
  .mobile-nav {
    display: flex;
  }
  
  .app-main {
    margin-top: 56px;
  }
}
</style>
