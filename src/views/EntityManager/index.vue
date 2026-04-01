<template>
  <div class="entity-manager">
    <header class="page-header">
      <h1>实体库</h1>
      <div class="header-actions">
        <button class="btn btn-primary" @click="openCreateModal">
          <span>+</span> 新建实体
        </button>
      </div>
    </header>

    <!-- 筛选器 -->
    <div class="filter-bar">
      <div class="filter-tabs">
        <button 
          v-for="type in entityTypes" 
          :key="type.value"
          class="filter-tab"
          :class="{ active: currentFilter === type.value }"
          @click="currentFilter = type.value"
        >
          {{ type.label }}
        </button>
      </div>
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="搜索实体..." 
        class="search-input"
      />
    </div>

    <!-- 实体列表 -->
    <div v-if="filteredEntities.length > 0" class="entities-grid">
      <div 
        v-for="entity in filteredEntities" 
        :key="entity.id"
        class="entity-card"
        :class="`type-${entity.type.toLowerCase()}`"
        @click="editEntity(entity)"
      >
        <div class="entity-header">
          <span class="entity-type-badge">{{ getTypeLabel(entity.type) }}</span>
          <span class="entity-status" :class="entity.status">{{ entity.status }}</span>
        </div>
        <h3 class="entity-name">{{ entity.name }}</h3>
        <p class="entity-desc">{{ entity.description || '暂无描述' }}</p>
        <div class="entity-meta">
          <span v-if="entity.dangerLevel" class="danger-level" :class="entity.dangerLevel">
            {{ entity.dangerLevel }}级
          </span>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon" style="font-size: 48px;">📦</div>
      <p>暂无实体</p>
      <p style="font-size: 13px; color: var(--text-secondary); margin: 8px 0;">
        实体是独立的，可以在多个副本中引用
      </p>
      <button class="btn btn-primary" @click="openCreateModal" style="margin-top: 16px;">
        创建第一个实体
      </button>
    </div>

    <!-- 新建/编辑实体模态框 -->
    <EntityModal 
      v-if="showEntityModal"
      :entity="editingEntity"
      @close="closeEntityModal"
      @save="saveEntity"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useEntityStore } from '../../stores/entityStore'
import { useNovelStore } from '../../stores/novelStore'
import { EntityType, EntityStatus } from '../../db'
import EntityModal from './EntityModal.vue'

const entityStore = useEntityStore()
const novelStore = useNovelStore()

const entityTypes = [
  { value: 'all', label: '全部' },
  { value: EntityType.ROLE, label: '角色' },
  { value: EntityType.ITEM, label: '道具' },
  { value: EntityType.RULE, label: '规则' },
  { value: EntityType.ABILITY, label: '诡异能力' }
]

const currentFilter = ref('all')
const searchQuery = ref('')
const showEntityModal = ref(false)
const editingEntity = ref(null)

const filteredEntities = computed(() => {
  // 只显示当前小说的实体
  let list = entityStore.entities.filter(e => e.novelId === novelStore.currentNovel?.id)
  
  if (currentFilter.value !== 'all') {
    list = list.filter(e => e.type === currentFilter.value)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    list = list.filter(e => 
      e.name.toLowerCase().includes(query) ||
      (e.description && e.description.toLowerCase().includes(query))
    )
  }
  
  return list
})

function getTypeLabel(type) {
  const map = {
    [EntityType.ROLE]: '角色',
    [EntityType.ITEM]: '道具',
    [EntityType.RULE]: '规则',
    [EntityType.ABILITY]: '诡异能力'
  }
  return map[type] || type
}

function openCreateModal() {
  if (!novelStore.currentNovel) {
    alert('请先选择或创建小说')
    return
  }
  editingEntity.value = null
  showEntityModal.value = true
}

function editEntity(entity) {
  editingEntity.value = { ...entity }
  showEntityModal.value = true
}

function closeEntityModal() {
  showEntityModal.value = false
  editingEntity.value = null
}

async function saveEntity(data) {
  if (editingEntity.value) {
    await entityStore.updateEntity(editingEntity.value.id, data)
  } else {
    await entityStore.createEntity({
      ...data,
      novelId: novelStore.currentNovel.id
    })
  }
  closeEntityModal()
}
</script>

<style scoped>
.entity-manager {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 28px;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-tabs {
  display: flex;
  gap: 8px;
}

.filter-tab {
  padding: 8px 16px;
  border: none;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-tab:hover {
  background: var(--bg-tertiary);
}

.filter-tab.active {
  background: var(--accent);
  color: white;
}

.search-input {
  width: 240px;
}

/* 实体网格 */
.entities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.entity-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.3s;
}

.entity-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.entity-card.type-role {
  border-left: 4px solid #4ecca3;
}

.entity-card.type-item {
  border-left: 4px solid #ffc107;
}

.entity-card.type-rule {
  border-left: 4px solid #e94560;
}

.entity-card.type-ability {
  border-left: 4px solid #9c27b0;
}

.entity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.entity-type-badge {
  font-size: 11px;
  padding: 4px 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  color: var(--text-secondary);
}

.entity-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}

.entity-status.存活, .entity-status.完好, .entity-status.生效, .entity-status.已觉醒 {
  background: rgba(78, 204, 163, 0.2);
  color: var(--success);
}

.entity-status.死亡, .entity-status.破损, .entity-status.失效 {
  background: rgba(233, 69, 96, 0.2);
  color: var(--danger);
}

.entity-status.失踪, .entity-status.已使用, .entity-status.沉睡中 {
  background: rgba(160, 160, 160, 0.2);
  color: var(--text-secondary);
}

.entity-status.不稳定 {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.entity-name {
  font-size: 16px;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.entity-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 12px;
}

.entity-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.danger-level {
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.danger-level.S { background: rgba(233, 69, 96, 0.3); color: #ff6b6b; }
.danger-level.A { background: rgba(255, 193, 7, 0.3); color: #ffc107; }
.danger-level.B { background: rgba(78, 204, 163, 0.3); color: #4ecca3; }
.danger-level.C { background: rgba(160, 160, 160, 0.3); color: var(--text-secondary); }

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    width: 100%;
  }
  
  .entities-grid {
    grid-template-columns: 1fr;
  }
}
</style>
