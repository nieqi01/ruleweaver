<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content" :class="{ 'wide': entityType === EntityType.ROLE }">
      <header class="modal-header">
        <h2>{{ isEdit ? '编辑实体' : '新建实体' }}</h2>
        <button class="btn-close" @click="$emit('close')">×</button>
      </header>

      <form @submit.prevent="handleSubmit" class="entity-form">
        <!-- 基本信息 -->
        <div class="form-section">
          <h3>基本信息</h3>
          
          <!-- 实体类型 -->
          <div class="form-group">
            <label>实体类型</label>
            <div class="type-selector">
              <button
                v-for="type in entityTypes"
                :key="type.value"
                type="button"
                class="type-btn"
                :class="{ active: entityType === type.value }"
                @click="entityType = type.value"
              >
                <span class="type-icon">{{ type.icon }}</span>
                <span>{{ type.label }}</span>
              </button>
            </div>
          </div>

          <!-- 名称 -->
          <div class="form-group">
            <label>名称 *</label>
            <input v-model="form.name" type="text" required placeholder="输入实体名称" />
          </div>

          <!-- 状态 -->
          <div class="form-group">
            <label>状态</label>
            <select v-model="form.status">
              <option v-for="status in availableStatuses" :key="status" :value="status">
                {{ status }}
              </option>
            </select>
          </div>

          <!-- 描述 -->
          <div class="form-group">
            <label>描述</label>
            <textarea v-model="form.description" rows="3" placeholder="实体描述..." />
          </div>
        </div>

        <!-- 类型特定字段 -->
        <div class="form-section">
          <h3>详细信息</h3>

          <!-- 角色特有 -->
          <template v-if="entityType === EntityType.ROLE">
            <div class="form-row">
              <div class="form-group">
                <label>身份</label>
                <input v-model="form.identity" placeholder="如：调查员、诡异" />
              </div>
              <div class="form-group">
                <label>阵营</label>
                <select v-model="form.faction">
                  <option value="守序">守序</option>
                  <option value="中立">中立</option>
                  <option value="混乱">混乱</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>能力</label>
              <textarea v-model="form.abilities" rows="2" placeholder="角色的特殊能力..." />
            </div>
            <div class="form-group">
              <label>背景故事</label>
              <textarea v-model="form.backstory" rows="3" placeholder="角色的背景故事..." />
            </div>
          </template>

          <!-- 道具特有 -->
          <template v-if="entityType === EntityType.ITEM">
            <div class="form-row">
              <div class="form-group">
                <label>类型</label>
                <select v-model="form.itemType">
                  <option value="武器">武器</option>
                  <option value="防具">防具</option>
                  <option value="消耗品">消耗品</option>
                  <option value="线索">线索</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div class="form-group">
                <label>稀有度</label>
                <select v-model="form.rarity">
                  <option value="普通">普通</option>
                  <option value="稀有">稀有</option>
                  <option value="史诗">史诗</option>
                  <option value="传说">传说</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>效果</label>
              <textarea v-model="form.effect" rows="2" placeholder="道具效果描述..." />
            </div>
          </template>

          <!-- 规则特有 -->
          <template v-if="entityType === EntityType.RULE">
            <div class="form-group">
              <label>危险等级</label>
              <div class="danger-selector">
                <button
                  v-for="level in dangerLevels"
                  :key="level"
                  type="button"
                  class="danger-btn"
                  :class="{ active: form.dangerLevel === level }"
                  @click="form.dangerLevel = level"
                >
                  {{ level }}
                </button>
              </div>
            </div>
            <div class="form-group">
              <label>规则内容</label>
              <textarea v-model="form.content" rows="4" placeholder="具体的规则内容..." />
            </div>
            <div class="form-group">
              <label>违反后果</label>
              <textarea v-model="form.violationConsequence" rows="2" placeholder="违反规则的后果..." />
            </div>
            <div class="form-group">
              <label>生效区域（地图）</label>
              <div class="area-selector">
                <div v-for="area in availableAreas" :key="area.id" class="area-option">
                  <label class="checkbox-label">
                    <input 
                      type="checkbox" 
                      :value="area.id"
                      v-model="form.effectiveAreas"
                    />
                    <span>{{ area.name }}</span>
                  </label>
                </div>
                <p v-if="availableAreas.length === 0" class="hint-text">
                  暂无可选区域，可在地图管理中创建
                </p>
              </div>
            </div>
          </template>

          <!-- 诡异能力特有 -->
          <template v-if="entityType === EntityType.ABILITY">
            <div class="form-row">
              <div class="form-group">
                <label>能力类型</label>
                <select v-model="form.abilityType">
                  <option value="主动">主动</option>
                  <option value="被动">被动</option>
                  <option value="诅咒">诅咒</option>
                </select>
              </div>
              <div class="form-group">
                <label>消耗</label>
                <input v-model="form.cost" placeholder="如：10点理智" />
              </div>
            </div>
            <div class="form-group">
              <label>效果描述</label>
              <textarea v-model="form.effectDescription" rows="3" placeholder="能力的具体效果..." />
            </div>
            <div class="form-group">
              <label>副作用</label>
              <textarea v-model="form.sideEffect" rows="2" placeholder="使用能力的副作用..." />
            </div>
          </template>
        </div>

        <!-- 自定义属性 -->
        <div class="form-section">
          <div class="section-header">
            <h3>自定义属性</h3>
            <button type="button" class="btn btn-small" @click="addCustomProp">
              + 添加
            </button>
          </div>
          <div v-for="(prop, index) in customProps" :key="index" class="custom-prop-row">
            <input v-model="prop.key" placeholder="属性名" />
            <input v-model="prop.value" placeholder="属性值" />
            <button type="button" class="btn btn-danger btn-small" @click="removeCustomProp(index)">
              删除
            </button>
          </div>
          <p v-if="customProps.length === 0" class="hint-text">
            点击"添加"按钮添加自定义属性
          </p>
        </div>

        <footer class="modal-footer">
          <button type="button" class="btn" @click="$emit('close')">取消</button>
          <button type="submit" class="btn btn-primary" :disabled="!form.name.trim()">
            {{ isEdit ? '保存' : '创建' }}
          </button>
        </footer>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { EntityType, EntityStatus, DangerLevel } from '../../db'
import { useNovelStore } from '../../stores/novelStore'
import { useMapStore } from '../../stores/mapStore'

const props = defineProps({
  entity: Object
})

const emit = defineEmits(['close', 'save'])

const novelStore = useNovelStore()
const mapStore = useMapStore()

const isEdit = computed(() => !!props.entity)

const entityTypes = [
  { value: EntityType.ROLE, label: '角色', icon: '👤' },
  { value: EntityType.ITEM, label: '道具', icon: '📦' },
  { value: EntityType.RULE, label: '规则', icon: '📜' },
  { value: EntityType.ABILITY, label: '诡异能力', icon: '👁️' }
]

const dangerLevels = ['S', 'A', 'B', 'C']

const entityType = ref(EntityType.ROLE)
const availableAreas = ref([])

const form = ref({
  name: '',
  status: EntityStatus.AWAKENED,
  description: '',
  dangerLevel: DangerLevel.B,
  // 角色
  identity: '',
  faction: '中立',
  abilities: '',
  backstory: '',
  // 道具
  itemType: '其他',
  rarity: '普通',
  effect: '',
  // 规则
  content: '',
  violationConsequence: '',
  effectiveAreas: [],
  // 能力
  abilityType: '主动',
  cost: '',
  effectDescription: '',
  sideEffect: ''
})

const customProps = ref([])

const availableStatuses = computed(() => {
  switch (entityType.value) {
    case EntityType.ROLE:
      return [EntityStatus.ALIVE, EntityStatus.DEAD, EntityStatus.MISSING]
    case EntityType.ITEM:
      return [EntityStatus.INTACT, EntityStatus.DAMAGED, EntityStatus.USED]
    case EntityType.RULE:
      return [EntityStatus.ACTIVE, EntityStatus.INACTIVE]
    case EntityType.ABILITY:
      return [EntityStatus.AWAKENED, EntityStatus.DORMANT, EntityStatus.UNSTABLE]
    default:
      return Object.values(EntityStatus)
  }
})

onMounted(async () => {
  // 加载可用区域
  if (novelStore.currentNovel) {
    await mapStore.loadMaps(novelStore.currentNovel.id)
    availableAreas.value = mapStore.maps
  }
  
  if (props.entity) {
    entityType.value = props.entity.type
    form.value = {
      ...form.value,
      ...props.entity
    }
    if (props.entity.customProps) {
      customProps.value = Object.entries(props.entity.customProps).map(([key, value]) => ({
        key,
        value
      }))
    }
  }
})

function addCustomProp() {
  customProps.value.push({ key: '', value: '' })
}

function removeCustomProp(index) {
  customProps.value.splice(index, 1)
}

function handleSubmit() {
  const customPropsObj = {}
  customProps.value.forEach(prop => {
    if (prop.key.trim()) {
      customPropsObj[prop.key.trim()] = prop.value
    }
  })

  const data = {
    type: entityType.value,
    name: form.value.name.trim(),
    status: form.value.status,
    description: form.value.description,
    dangerLevel: form.value.dangerLevel,
    customProps: customPropsObj
  }

  // 根据类型添加特定字段
  switch (entityType.value) {
    case EntityType.ROLE:
      data.identity = form.value.identity
      data.faction = form.value.faction
      data.abilities = form.value.abilities
      data.backstory = form.value.backstory
      break
    case EntityType.ITEM:
      data.itemType = form.value.itemType
      data.rarity = form.value.rarity
      data.effect = form.value.effect
      break
    case EntityType.RULE:
      data.content = form.value.content
      data.violationConsequence = form.value.violationConsequence
      data.effectiveAreas = form.value.effectiveAreas
      break
    case EntityType.ABILITY:
      data.abilityType = form.value.abilityType
      data.cost = form.value.cost
      data.effectDescription = form.value.effectDescription
      data.sideEffect = form.value.sideEffect
      break
  }

  emit('save', data)
}
</script>

<style scoped>
.modal-content {
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  margin: auto;
}

.modal-content.wide {
  max-width: 640px;
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

.entity-form {
  padding: 24px;
}

.form-section {
  margin-bottom: 24px;
}

.form-section h3 {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* 类型选择器 */
.type-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s;
}

.type-btn:hover {
  border-color: var(--accent);
}

.type-btn.active {
  border-color: var(--accent);
  background: rgba(78, 204, 163, 0.1);
  color: var(--accent);
}

.type-icon {
  font-size: 20px;
}

/* 危险等级选择器 */
.danger-selector {
  display: flex;
  gap: 8px;
}

.danger-btn {
  flex: 1;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.danger-btn:hover {
  border-color: var(--accent);
}

.danger-btn.active {
  border-color: var(--accent);
  background: var(--accent);
  color: white;
}

/* 区域选择器 */
.area-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 150px;
  overflow-y: auto;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: 8px;
}

.area-option {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
}

/* 自定义属性 */
.custom-prop-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;
  margin-bottom: 8px;
}

.hint-text {
  font-size: 12px;
  color: var(--text-secondary);
  font-style: italic;
}

/* 底部按钮 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .modal-content {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .type-selector {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .custom-prop-row {
    grid-template-columns: 1fr;
  }
}
</style>
