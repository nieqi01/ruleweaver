<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content wide">
      <header class="modal-header">
        <h2>{{ instance.name }}</h2>
        <button class="btn-close" @click="$emit('close')">×</button>
      </header>

      <div class="modal-body">
        <!-- 副本信息 -->
        <div class="instance-info">
          <div class="info-row">
            <span class="info-label">危险等级:</span>
            <span class="danger-badge" :class="instance.dangerLevel">{{ instance.dangerLevel }}级</span>
          </div>
          <div v-if="instance.survivalCondition" class="info-row">
            <span class="info-label">存活条件:</span>
            <span>{{ instance.survivalCondition }}</span>
          </div>
          <div v-if="instance.description" class="info-row">
            <span class="info-label">描述:</span>
            <p class="info-desc">{{ instance.description }}</p>
          </div>
        </div>

        <!-- 标签页切换 -->
        <div class="tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.key"
            class="tab-btn"
            :class="{ active: currentTab === tab.key }"
            @click="currentTab = tab.key"
          >
            {{ tab.label }}
            <span v-if="tab.count !== undefined" class="tab-count">({{ tab.count }})</span>
          </button>
        </div>

        <!-- 实体管理标签页 -->
        <div v-if="currentTab === 'entities'" class="tab-content">
          <div class="section-header">
            <h3>副本实体</h3>
            <button class="btn btn-primary btn-small" @click="showEntitySelector = true">
              + 添加实体
            </button>
          </div>

          <!-- 已关联实体列表 -->
          <div v-if="linkedEntities.length > 0" class="linked-entities">
            <div 
              v-for="entity in linkedEntities" 
              :key="entity.id"
              class="linked-entity-item"
            >
              <div class="entity-info" @click="goToEntity(entity.id)">
                <span class="entity-type-badge">{{ getTypeLabel(entity.type) }}</span>
                <span class="entity-name">{{ entity.name }}</span>
                <span class="entity-status" :class="entity.status">{{ entity.status }}</span>
              </div>
              <button class="btn btn-danger btn-small" @click.stop="removeEntity(entity.id)">
                移除
              </button>
            </div>
          </div>

          <div v-else class="empty-hint">
            <p>暂无关联实体</p>
            <p class="hint">点击"添加实体"从实体库中选择</p>
          </div>
        </div>

        <!-- 地图标签页 -->
        <div v-if="currentTab === 'maps'" class="tab-content">
          <div class="section-header">
            <h3>地图区域</h3>
            <button class="btn btn-primary btn-small" @click="showMapEditor = true">
              + 添加区域
            </button>
          </div>
          <p class="placeholder-text">地图功能开发中...</p>
        </div>

        <!-- 设置标签页 -->
        <div v-if="currentTab === 'settings'" class="tab-content">
          <div class="form-group">
            <label>副本名称</label>
            <input v-model="editForm.name" />
          </div>
          <div class="form-group">
            <label>危险等级</label>
            <select v-model="editForm.dangerLevel">
              <option value="S">S级</option>
              <option value="A">A级</option>
              <option value="B">B级</option>
              <option value="C">C级</option>
            </select>
          </div>
          <div class="form-group">
            <label>存活条件</label>
            <input v-model="editForm.survivalCondition" placeholder="存活条件摘要" />
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea v-model="editForm.description" rows="4" />
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" @click="saveSettings">保存设置</button>
            <button class="btn btn-danger" @click="confirmDelete">删除副本</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 实体选择器模态框 -->
    <EntitySelector
      v-if="showEntitySelector"
      :instance-id="instance.id"
      :linked-entity-ids="linkedEntityIds"
      @close="showEntitySelector = false"
      @select="handleEntitySelect"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useInstanceStore } from '../../stores/instanceStore'
import { useEntityStore } from '../../stores/entityStore'
import { EntityType } from '../../db'
import EntitySelector from './EntitySelector.vue'

const router = useRouter()

const props = defineProps({
  instance: Object
})

const emit = defineEmits(['close', 'updated', 'deleted'])

const instanceStore = useInstanceStore()
const entityStore = useEntityStore()

const currentTab = ref('entities')
const showEntitySelector = ref(false)
const showMapEditor = ref(false)
const linkedEntities = ref([])

const tabs = computed(() => [
  { key: 'entities', label: '实体', count: linkedEntities.value.length },
  { key: 'maps', label: '地图' },
  { key: 'settings', label: '设置' }
])

const linkedEntityIds = computed(() => linkedEntities.value.map(e => e.id))

const editForm = ref({
  name: props.instance.name,
  dangerLevel: props.instance.dangerLevel,
  survivalCondition: props.instance.survivalCondition || '',
  description: props.instance.description || ''
})

onMounted(async () => {
  await loadLinkedEntities()
})

async function loadLinkedEntities() {
  linkedEntities.value = await entityStore.getInstanceEntities(props.instance.id)
}

function getTypeLabel(type) {
  const map = {
    [EntityType.ROLE]: '角色',
    [EntityType.ITEM]: '道具',
    [EntityType.RULE]: '规则',
    [EntityType.ABILITY]: '能力'
  }
  return map[type] || type
}

async function handleEntitySelect(entityIds) {
  // 添加新关联
  for (const entityId of entityIds) {
    if (!linkedEntityIds.value.includes(entityId)) {
      await entityStore.addEntityToInstance(entityId, props.instance.id)
    }
  }
  await loadLinkedEntities()
  showEntitySelector.value = false
}

async function removeEntity(entityId) {
  if (!confirm('确定要从副本中移除此实体吗？实体本身不会被删除。')) return
  await entityStore.removeEntityFromInstance(entityId, props.instance.id)
  await loadLinkedEntities()
}

async function saveSettings() {
  await instanceStore.updateInstance(props.instance.id, {
    name: editForm.value.name,
    dangerLevel: editForm.value.dangerLevel,
    survivalCondition: editForm.value.survivalCondition,
    description: editForm.value.description
  })
  emit('updated')
}

async function confirmDelete() {
  if (!confirm('确定要删除此副本吗？关联的实体不会被删除。')) return
  await instanceStore.deleteInstance(props.instance.id)
  emit('deleted')
}

function goToEntity(entityId) {
  emit('close')
  router.push({
    path: '/entities',
    query: { highlight: entityId }
  })
}
</script>

<style scoped>
.modal-content.wide {
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  font-size: 20px;
  color: var(--text-primary);
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
}

.modal-body {
  padding: 24px;
}

/* 副本信息 */
.instance-info {
  background: var(--bg-tertiary);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  color: var(--text-secondary);
  min-width: 80px;
}

.info-desc {
  flex: 1;
  line-height: 1.5;
  color: var(--text-primary);
}

.danger-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.danger-badge.S { background: rgba(233, 69, 96, 0.2); color: #ff6b6b; }
.danger-badge.A { background: rgba(255, 193, 7, 0.2); color: #ffc107; }
.danger-badge.B { background: rgba(78, 204, 163, 0.2); color: #4ecca3; }
.danger-badge.C { background: rgba(160, 160, 160, 0.2); color: var(--text-secondary); }

/* 标签页 */
.tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 20px;
}

.tab-btn {
  padding: 12px 20px;
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.tab-count {
  font-size: 12px;
  opacity: 0.7;
}

/* 标签页内容 */
.tab-content {
  min-height: 200px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 16px;
  color: var(--text-primary);
}

/* 已关联实体列表 */
.linked-entities {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.linked-entity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.entity-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  flex: 1;
  padding: 4px 0;
}

.entity-info:hover .entity-name {
  color: var(--accent);
  text-decoration: underline;
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

.empty-hint {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.empty-hint .hint {
  font-size: 13px;
  margin-top: 8px;
  opacity: 0.7;
}

.placeholder-text {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
  font-style: italic;
}

/* 设置表单 */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .modal-content.wide {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .tabs {
    overflow-x: auto;
  }
  
  .linked-entity-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .entity-info {
    flex-wrap: wrap;
  }
}
</style>
