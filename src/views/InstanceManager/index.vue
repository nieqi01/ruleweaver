<template>
  <div class="instance-manager">
    <header class="page-header">
      <h1>副本管理</h1>
      <div class="header-actions">
        <button class="btn btn-primary" @click="showCreateModal = true">
          <span>+</span> 新建副本
        </button>
      </div>
    </header>

    <!-- 副本列表 -->
    <div v-if="instances.length > 0" class="instances-list">
      <div 
        v-for="instance in instances" 
        :key="instance.id"
        class="instance-card"
        @click="openInstance(instance)"
      >
        <div class="instance-header">
          <h3 class="instance-name">{{ instance.name }}</h3>
          <span class="danger-badge" :class="instance.dangerLevel">
            {{ instance.dangerLevel }}级
          </span>
        </div>
        <p class="instance-desc">{{ instance.description || '暂无描述' }}</p>
        <div class="instance-meta">
          <span>实体: {{ getInstanceEntityCount(instance.id) }}个</span>
          <span>创建: {{ formatDate(instance.createdAt) }}</span>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon" style="font-size: 48px;">🗺️</div>
      <p>暂无副本</p>
      <button class="btn btn-primary" @click="showCreateModal = true" style="margin-top: 16px;">
        创建第一个副本
      </button>
    </div>

    <!-- 新建副本模态框 -->
    <InstanceModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="handleInstanceCreated"
    />

    <!-- 副本详情/编辑模态框 -->
    <InstanceDetailModal
      v-if="selectedInstance"
      :instance="selectedInstance"
      @close="selectedInstance = null"
      @updated="handleInstanceUpdated"
      @deleted="handleInstanceDeleted"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useInstanceStore } from '../../stores/instanceStore'
import { useEntityStore } from '../../stores/entityStore'
import { useNovelStore } from '../../stores/novelStore'
import InstanceModal from './InstanceModal.vue'
import InstanceDetailModal from './InstanceDetailModal.vue'

const instanceStore = useInstanceStore()
const entityStore = useEntityStore()
const novelStore = useNovelStore()

const showCreateModal = ref(false)
const selectedInstance = ref(null)
const instanceEntityCounts = ref({})

const instances = computed(() => {
  if (!novelStore.currentNovel) return []
  return instanceStore.instances.filter(i => i.novelId === novelStore.currentNovel.id)
})

onMounted(async () => {
  await instanceStore.loadInstances()
  await entityStore.loadEntities()
  // 计算每个副本的实体数量
  await updateEntityCounts()
})

async function updateEntityCounts() {
  const counts = {}
  for (const instance of instances.value) {
    const entities = await entityStore.getInstanceEntities(instance.id)
    counts[instance.id] = entities.length
  }
  instanceEntityCounts.value = counts
}

function getInstanceEntityCount(instanceId) {
  return instanceEntityCounts.value[instanceId] || 0
}

function formatDate(timestamp) {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

function openInstance(instance) {
  selectedInstance.value = instance
}

async function handleInstanceCreated() {
  showCreateModal.value = false
  await instanceStore.loadInstances()
  await updateEntityCounts()
}

async function handleInstanceUpdated() {
  await instanceStore.loadInstances()
  await updateEntityCounts()
}

async function handleInstanceDeleted() {
  selectedInstance.value = null
  await instanceStore.loadInstances()
  await updateEntityCounts()
}
</script>

<style scoped>
.instance-manager {
  max-width: 1200px;
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

/* 副本列表 */
.instances-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.instance-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.3s;
}

.instance-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.instance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.instance-name {
  font-size: 18px;
  color: var(--text-primary);
}

.danger-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.danger-badge.S {
  background: rgba(233, 69, 96, 0.2);
  color: #ff6b6b;
}

.danger-badge.A {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.danger-badge.B {
  background: rgba(78, 204, 163, 0.2);
  color: #4ecca3;
}

.danger-badge.C {
  background: rgba(160, 160, 160, 0.2);
  color: var(--text-secondary);
}

.instance-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.instance-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-tertiary);
}

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
  
  .instances-list {
    grid-template-columns: 1fr;
  }
}
</style>
