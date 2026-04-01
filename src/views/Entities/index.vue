<template>
  <div class="entities-page">
    <!-- 无小说状态 -->
    <div v-if="!novelStore.hasNovel" class="empty-state">
      <div class="empty-icon">👤</div>
      <h3 class="empty-title">请先创建小说</h3>
      <p class="empty-desc">创建小说后才能管理实体</p>
      <router-link to="/" class="btn btn-primary">去创建小说</router-link>
    </div>
    
    <!-- 有小说状态 -->
    <template v-else>
      <div class="page-container">
        <div class="page-header-row">
          <div>
            <h1 class="page-title">实体库</h1>
            <p class="page-subtitle">管理角色、道具、规则和诡异能力</p>
          </div>
          <button class="btn btn-primary" @click="showCreateModal = true">
            <span>+</span> AI生成实体
          </button>
        </div>
        
        <!-- 实体类型标签 -->
        <div class="type-tabs">
          <button 
            v-for="type in entityTypes" 
            :key="type.key"
            class="type-tab"
            :class="{ active: currentType === type.key }"
            @click="currentType = type.key"
          >
            <span class="tab-icon">{{ type.icon }}</span>
            <span class="tab-name">{{ type.name }}</span>
            <span class="tab-count">{{ getCountByType(type.key) }}</span>
          </button>
        </div>
        
        <!-- 实体列表 -->
        <div class="entities-list">
          <div 
            v-for="entity in filteredEntities" 
            :key="entity.id"
            class="entity-card"
            @click="editEntity(entity)"
          >
            <div class="entity-header">
              <span class="entity-type-badge" :class="entity.type">{{ getTypeName(entity.type) }}</span>
              <span v-if="entity.dangerLevel" class="danger-badge" :class="entity.dangerLevel">
                {{ entity.dangerLevel }}级
              </span>
            </div>
            <h3 class="entity-name">{{ entity.name }}</h3>
            <p class="entity-desc">{{ entity.description || '暂无描述' }}</p>
            <div v-if="entity.ownerId" class="entity-owner">
              所属: {{ getOwnerName(entity.ownerId) }}
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="filteredEntities.length === 0" class="empty-list">
          <p>暂无{{ getTypeName(currentType) }}</p>
          <button class="btn btn-primary btn-sm" @click="showCreateModal = true">
            AI生成{{ getTypeName(currentType) }}
          </button>
        </div>
      </div>
    </template>
    
    <!-- AI生成实体弹窗 -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>AI生成实体</h3>
          <button class="close-btn" @click="showCreateModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>实体类型</label>
            <div class="type-selector">
              <button 
                v-for="type in entityTypes" 
                :key="type.key"
                class="type-btn"
                :class="{ active: createForm.type === type.key }"
                @click="createForm.type = type.key"
              >
                <span class="btn-icon">{{ type.icon }}</span>
                <span>{{ type.name }}</span>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>描述你的想法</label>
            <textarea 
              v-model="createForm.description" 
              rows="4"
              placeholder="描述你想要的实体，例如：一个表面温和但内心阴暗的图书馆管理员..."
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showCreateModal = false">取消</button>
          <button class="btn btn-primary" @click="generateEntity" :disabled="generating || !createForm.description.trim()">
            {{ generating ? '生成中...' : '生成实体' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 编辑实体弹窗 -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>编辑实体</h3>
          <button class="close-btn" @click="showEditModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>名称</label>
            <input v-model="editForm.name" />
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea v-model="editForm.description" rows="3" />
          </div>
          <div class="form-group" v-if="editForm.type === 'role'">
            <label>身份</label>
            <input v-model="editForm.identity" placeholder="如：图书馆管理员" />
          </div>
          <div class="form-group" v-if="editForm.type === 'item'">
            <label>效果</label>
            <input v-model="editForm.effect" placeholder="道具效果" />
          </div>
          <div class="form-group" v-if="editForm.type === 'rule'">
            <label>规则内容</label>
            <textarea v-model="editForm.content" rows="2" placeholder="具体规则内容" />
          </div>
          <div class="form-group" v-if="editForm.type === 'ability'">
            <label>能力效果</label>
            <textarea v-model="editForm.effect" rows="2" placeholder="能力效果" />
          </div>
          <div class="form-group">
            <label>危险等级</label>
            <select v-model="editForm.dangerLevel">
              <option value="S">S级 - 极高</option>
              <option value="A">A级 - 高</option>
              <option value="B">B级 - 中</option>
              <option value="C">C级 - 低</option>
            </select>
          </div>
          <!-- 角色专属：选择拥有的道具和能力 -->
          <div v-if="editForm.type === 'role'" class="form-group">
            <label>拥有的道具</label>
            <div class="checkbox-list">
              <label v-for="item in entityStore.items" :key="item.id" class="checkbox-item">
                <input 
                  type="checkbox" 
                  :value="item.id"
                  v-model="editForm.ownedItems"
                />
                <span>{{ item.name }}</span>
              </label>
            </div>
          </div>
          <div v-if="editForm.type === 'role'" class="form-group">
            <label>拥有的能力</label>
            <div class="checkbox-list">
              <label v-for="ability in entityStore.abilities" :key="ability.id" class="checkbox-item">
                <input 
                  type="checkbox" 
                  :value="ability.id"
                  v-model="editForm.ownedAbilities"
                />
                <span>{{ ability.name }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-danger" @click="deleteCurrentEntity">删除</button>
          <button class="btn btn-ghost" @click="showEditModal = false">取消</button>
          <button class="btn btn-primary" @click="saveEntity">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useNovelStore } from '../../stores/novelStore'
import { useEntityStore, EntityType } from '../../stores/entityStore'
import { generateEntity as generateEntityAI } from '../../services/aiService'

const novelStore = useNovelStore()
const entityStore = useEntityStore()

const currentType = ref('role')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const generating = ref(false)

const entityTypes = [
  { key: 'role', name: '角色', icon: '👤' },
  { key: 'item', name: '道具', icon: '📦' },
  { key: 'rule', name: '规则', icon: '📜' },
  { key: 'ability', name: '诡异能力', icon: '👁️' }
]

const createForm = ref({
  type: 'role',
  description: ''
})

const editForm = ref({
  id: null,
  name: '',
  description: '',
  type: '',
  dangerLevel: 'B',
  identity: '',
  effect: '',
  content: '',
  ownedItems: [],
  ownedAbilities: []
})

const filteredEntities = computed(() => {
  return entityStore.entities.filter(e => e.type === currentType.value)
})

function getCountByType(type) {
  return entityStore.entities.filter(e => e.type === type).length
}

function getTypeName(type) {
  const map = { role: '角色', item: '道具', rule: '规则', ability: '诡异能力' }
  return map[type] || type
}

function getOwnerName(ownerId) {
  const owner = entityStore.entities.find(e => e.id === ownerId)
  return owner?.name || '未知'
}

async function generateEntity() {
  if (!createForm.value.description.trim()) return
  
  generating.value = true
  try {
    const result = await generateEntityAI(createForm.value.type, createForm.value.description)
    
    // 创建实体
    await entityStore.createEntity({
      type: createForm.value.type,
      name: result.name || '未命名',
      description: result.description || '',
      dangerLevel: result.dangerLevel || 'B',
      ...result
    })
    
    showCreateModal.value = false
    createForm.value.description = ''
  } catch (e) {
    alert('生成失败: ' + e.message)
  }
  generating.value = false
}

function editEntity(entity) {
  editForm.value = {
    ...entity,
    ownedItems: entityStore.items.filter(i => i.ownerId === entity.id).map(i => i.id),
    ownedAbilities: entityStore.abilities.filter(a => a.ownerId === entity.id).map(a => a.id)
  }
  showEditModal.value = true
}

async function saveEntity() {
  await entityStore.updateEntity(editForm.value.id, {
    name: editForm.value.name,
    description: editForm.value.description,
    dangerLevel: editForm.value.dangerLevel,
    identity: editForm.value.identity,
    effect: editForm.value.effect,
    content: editForm.value.content
  })
  
  // 更新拥有关系
  if (editForm.value.type === 'role') {
    // 更新道具归属
    for (const itemId of editForm.value.ownedItems) {
      await entityStore.setEntityOwner(itemId, editForm.value.id)
    }
    // 更新能力归属
    for (const abilityId of editForm.value.ownedAbilities) {
      await entityStore.setEntityOwner(abilityId, editForm.value.id)
    }
  }
  
  showEditModal.value = false
}

async function deleteCurrentEntity() {
  if (!confirm('确定删除此实体吗？')) return
  await entityStore.deleteEntity(editForm.value.id)
  showEditModal.value = false
}

onMounted(() => {
  if (novelStore.hasNovel) {
    entityStore.loadEntities()
  }
})
</script>

<style scoped>
.page-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.type-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.type-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s;
}

.type-tab:hover {
  border-color: var(--accent);
}

.type-tab.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.tab-icon {
  font-size: 20px;
}

.tab-count {
  background: var(--bg-tertiary);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.type-tab.active .tab-count {
  background: rgba(255,255,255,0.2);
}

.entities-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.entity-card {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.3s;
}

.entity-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.entity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.entity-type-badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 20px;
  background: var(--bg-tertiary);
}

.entity-type-badge.role { background: rgba(78, 204, 163, 0.2); color: #4ecca3; }
.entity-type-badge.item { background: rgba(255, 193, 7, 0.2); color: #ffc107; }
.entity-type-badge.rule { background: rgba(233, 69, 96, 0.2); color: #ff6b6b; }
.entity-type-badge.ability { background: rgba(156, 39, 176, 0.2); color: #ce93d8; }

.danger-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.danger-badge.S { background: rgba(233, 69, 96, 0.3); color: #ff6b6b; }
.danger-badge.A { background: rgba(255, 193, 7, 0.3); color: #ffc107; }
.danger-badge.B { background: rgba(78, 204, 163, 0.3); color: #4ecca3; }
.danger-badge.C { background: rgba(160, 160, 160, 0.3); color: var(--text-secondary); }

.entity-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.entity-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.entity-owner {
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-secondary);
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.empty-list {
  text-align: center;
  padding: 60px;
  color: var(--text-secondary);
}

/* 创建弹窗 */
.type-selector {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: var(--bg-tertiary);
  border: 2px solid transparent;
  border-radius: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s;
}

.type-btn:hover {
  border-color: var(--accent);
}

.type-btn.active {
  border-color: var(--accent);
  background: rgba(233, 69, 96, 0.1);
  color: var(--accent);
}

.btn-icon {
  font-size: 28px;
}

/* 编辑弹窗 */
.checkbox-list {
  max-height: 150px;
  overflow-y: auto;
  background: var(--bg-tertiary);
  border-radius: 8px;
  padding: 12px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  cursor: pointer;
}

.checkbox-item input {
  width: auto;
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
.form-group textarea,
.form-group select {
  width: 100%;
}

@media (max-width: 768px) {
  .entities-list {
    grid-template-columns: 1fr;
  }
  
  .type-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 8px;
  }
  
  .type-tab {
    white-space: nowrap;
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
