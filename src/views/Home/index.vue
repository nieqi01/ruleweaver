<template>
  <div class="home">
    <!-- 未创建小说状态 -->
    <div v-if="!novelStore.hasNovel" class="welcome">
      <div class="welcome-content">
        <div class="welcome-icon">🕸️</div>
        <h1 class="welcome-title">RuleWeaver</h1>
        <p class="welcome-desc">规则怪谈创作辅助工具</p>
        <p class="welcome-sub">创建你的第一本小说，开始创作之旅</p>
        <button class="btn btn-primary btn-lg" @click="showCreateModal = true">
          <span>+</span> 新建小说
        </button>
      </div>
    </div>
    
    <!-- 已有小说状态 - 显示概览 -->
    <div v-else class="overview">
      <div class="page-container">
        <h1 class="page-title">{{ novelStore.currentNovel?.name }}</h1>
        <p class="page-subtitle">{{ novelStore.currentNovel?.description || '暂无描述' }}</p>
        
        <!-- 统计卡片 -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ chapterStore.sortedChapters.length }}</div>
            <div class="stat-label">章节</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ chapterStore.totalWordCount }}</div>
            <div class="stat-label">字数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ entityStore.entities.length }}</div>
            <div class="stat-label">实体</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ instanceStore.instances.length }}</div>
            <div class="stat-label">副本</div>
          </div>
        </div>
        
        <!-- 快捷操作 -->
        <div class="quick-actions">
          <h3>快捷操作</h3>
          <div class="action-grid">
            <router-link to="/write" class="action-card">
              <span class="action-icon">✍️</span>
              <span class="action-name">继续写作</span>
            </router-link>
            <router-link to="/entities" class="action-card">
              <span class="action-icon">👤</span>
              <span class="action-name">管理实体</span>
            </router-link>
            <router-link to="/instances" class="action-card">
              <span class="action-icon">🗺️</span>
              <span class="action-name">编辑副本</span>
            </router-link>
            <router-link to="/ai" class="action-card">
              <span class="action-icon">🤖</span>
              <span class="action-name">AI助手</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 新建小说弹窗 -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>新建小说</h3>
          <button class="close-btn" @click="showCreateModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>小说名称 *</label>
            <input v-model="novelForm.name" placeholder="如：规则怪谈：我在诡异世界求生" />
          </div>
          <div class="form-group">
            <label>作者</label>
            <input v-model="novelForm.author" placeholder="作者名" />
          </div>
          <div class="form-group">
            <label>简介</label>
            <textarea v-model="novelForm.description" rows="3" placeholder="小说简介..." />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showCreateModal = false">取消</button>
          <button class="btn btn-primary" @click="createNovel" :disabled="!novelForm.name.trim()">
            创建
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNovelStore } from '../../stores/novelStore'
import { useChapterStore } from '../../stores/chapterStore'
import { useEntityStore } from '../../stores/entityStore'
import { useInstanceStore } from '../../stores/instanceStore'

const router = useRouter()
const novelStore = useNovelStore()
const chapterStore = useChapterStore()
const entityStore = useEntityStore()
const instanceStore = useInstanceStore()

const showCreateModal = ref(false)
const novelForm = ref({
  name: '',
  author: '',
  description: ''
})

async function createNovel() {
  if (!novelForm.value.name.trim()) return
  
  const id = await novelStore.createNovel({
    name: novelForm.value.name.trim(),
    author: novelForm.value.author.trim(),
    description: novelForm.value.description.trim()
  })
  
  const novel = novelStore.novelList.find(n => n.id === id)
  novelStore.setCurrentNovel(novel)
  
  showCreateModal.value = false
  novelForm.value = { name: '', author: '', description: '' }
  
  // 自动跳转到写作页面
  router.push('/write')
}

onMounted(() => {
  if (novelStore.hasNovel) {
    chapterStore.loadChapters()
    entityStore.loadEntities()
    instanceStore.loadInstances()
  }
})
</script>

<style scoped>
.welcome {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.welcome-content {
  text-align: center;
  max-width: 400px;
}

.welcome-icon {
  font-size: 80px;
  margin-bottom: 16px;
}

.welcome-title {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 8px;
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.welcome-desc {
  font-size: 18px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.welcome-sub {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 32px;
}

/* 概览页面 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  border: 1px solid var(--border);
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.quick-actions h3 {
  margin-bottom: 16px;
  font-size: 18px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.action-card {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  text-decoration: none;
  color: var(--text-primary);
  border: 1px solid var(--border);
  transition: all 0.3s;
}

.action-card:hover {
  border-color: var(--accent);
  transform: translateY(-4px);
}

.action-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 12px;
}

.action-name {
  font-size: 15px;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  border: 1px solid var(--border);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.3s;
}

.close-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  max-height: 60vh;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

.form-group input,
.form-group textarea {
  width: 100%;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .modal-overlay {
    align-items: flex-end;
    padding: 0;
  }
  
  .modal-content {
    border-radius: 16px 16px 0 0;
    max-height: 85vh;
  }
}
</style>
