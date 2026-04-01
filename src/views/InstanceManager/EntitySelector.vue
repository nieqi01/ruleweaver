<template>
  <div class="modal-overlay selector-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <header class="modal-header">
        <h2>选择实体</h2>
        <button class="btn-close" @click="$emit('close')">×</button>
      </header>

      <div class="selector-body">
        <!-- 筛选 -->
        <div class="selector-filters">
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

        <!-- 可选实体列表 -->
        <div class="entities-list">
          <div 
            v-for="entity in availableEntities" 
            :key="entity.id"
            class="entity-option"
            :class="{ selected: selectedIds.includes(entity.id) }"
            @click="toggleSelection(entity.id)"
          >
            <div class="checkbox">
              <input 
                type="checkbox" 
                :checked="selectedIds.includes(entity.id)"
                @click.stop
              />
            </div>
            <div class="entity-info">
              <span class="entity-type-badge">{{ getTypeLabel(entity.type) }}</span>
              <span class="entity-name">{{ entity.name }}</span>
              <span v-if="entity.dangerLevel" class="danger-tag" :class="entity.dangerLevel">
                {{ entity.dangerLevel }}
              </span>
            </div>
            <p class="entity-desc">{{ entity.description || '暂无描述' }}</p>
          </div>

          <div v-if="availableEntities.length === 0" class="empty-state">
            <p>没有可选的实体</p>
            <p class="hint">
              {{ allEntities.length === 0 ? '请先前往实体库创建实体' : '当前筛选条件下没有实体' }}
            </p>
          </div>
        </div>

        <!-- 已选计数 -->
        <div class="selection-summary">
          已选择 {{ selectedIds.length }} 个实体
        </div>
      </div>

      <footer class="modal-footer">
        <button class="btn" @click="$emit('close')">取消</button>
        <button 
          class="btn btn-primary" 
          :disabled="selectedIds.length === 0"
          @click="confirmSelection"
        >
          确认添加
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useEntityStore } from '../../stores/entityStore'
import { useNovelStore } from '../../stores/novelStore'
import { EntityType } from '../../db'

const props = defineProps({
  instanceId: Number,
  linkedEntityIds: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'select'])

const entityStore = useEntityStore()
const novelStore = useNovelStore()

const currentFilter = ref('all')
const searchQuery = ref('')
const selectedIds = ref([])

const entityTypes = [
  { value: 'all', label: '全部' },
  { value: EntityType.ROLE, label: '角色' },
  { value: EntityType.ITEM, label: '道具' },
  { value: EntityType.RULE, label: '规则' },
  { value: EntityType.ABILITY, label: '能力' }
]

// 当前小说的所有实体（排除已关联的）
const allEntities = computed(() => {
  return entityStore.entities.filter(e => e.novelId === novelStore.currentNovel?.id)
})

const availableEntities = computed(() => {
  // 排除已关联的实体
  let list = allEntities.value.filter(e => !props.linkedEntityIds.includes(e.id))
  
  // 类型筛选
  if (currentFilter.value !== 'all') {
    list = list.filter(e => e.type === currentFilter.value)
  }
  
  // 搜索筛选
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
    [EntityType.ABILITY]: '能力'
  }
  return map[type] || type
}

function toggleSelection(entityId) {
  const index = selectedIds.value.indexOf(entityId)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(entityId)
  }
}

function confirmSelection() {
  emit('select', [...selectedIds.value])
}
</script>

<style scoped>
.selector-overlay {
  z-index: 1100;
}

.modal-content {
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.modal-header h2 {
  font-size: 18px;
  color: var(--text-primary);
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
}

.selector-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 筛选器 */
.selector-filters {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  overflow-x: auto;
}

.filter-tab {
  padding: 6px 14px;
  border: none;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border-radius: 16px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s;
}

.filter-tab:hover {
  background: var(--border);
}

.filter-tab.active {
  background: var(--accent);
  color: white;
}

.search-input {
  width: 100%;
}

/* 实体列表 */
.entities-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px;
}

.entity-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.entity-option:hover {
  background: var(--bg-tertiary);
}

.entity-option.selected {
  background: rgba(78, 204, 163, 0.1);
  border-color: var(--accent);
}

.checkbox {
  padding-top: 2px;
}

.checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.entity-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.entity-type-badge {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
  color: var(--text-secondary);
}

.entity-name {
  font-weight: 500;
  color: var(--text-primary);
}

.danger-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.danger-tag.S { background: rgba(233, 69, 96, 0.2); color: #ff6b6b; }
.danger-tag.A { background: rgba(255, 193, 7, 0.2); color: #ffc107; }
.danger-tag.B { background: rgba(78, 204, 163, 0.2); color: #4ecca3; }
.danger-tag.C { background: rgba(160, 160, 160, 0.2); color: var(--text-secondary); }

.entity-desc {
  width: 100%;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
  margin-left: 30px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.empty-state .hint {
  font-size: 13px;
  margin-top: 8px;
  opacity: 0.7;
}

/* 选择摘要 */
.selection-summary {
  padding: 12px 20px;
  border-top: 1px solid var(--border);
  font-size: 13px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

/* 底部按钮 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .modal-content {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .entity-option {
    flex-wrap: wrap;
  }
  
  .entity-desc {
    margin-left: 30px;
  }
}
</style>
