<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <header class="modal-header">
        <h2>添加关系</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </header>
      
      <div class="modal-body">
        <div class="form-group">
          <label>实体 A <span class="required">*</span></label>
          <select v-model="form.fromEntityId" required>
            <option value="">选择实体...</option>
            <optgroup v-for="group in groupedEntities" :key="group.type" :label="group.label">
              <option v-for="entity in group.items" :key="entity.id" :value="entity.id">
                {{ entity.name }}
              </option>
            </optgroup>
          </select>
        </div>
        
        <div class="form-group">
          <label>关系类型 <span class="required">*</span></label>
          <div class="relation-types">
            <button 
              v-for="type in relationTypes" 
              :key="type.value"
              class="relation-type-btn"
              :class="{ active: form.type === type.value }"
              @click="form.type = type.value"
            >
              <span class="type-color" :class="type.value.toLowerCase()"></span>
              {{ type.label }}
            </button>
          </div>
        </div>
        
        <div class="form-group">
          <label>实体 B <span class="required">*</span></label>
          <select v-model="form.toEntityId" required>
            <option value="">选择实体...</option>
            <optgroup v-for="group in groupedEntities" :key="group.type" :label="group.label">
              <option v-for="entity in group.items" :key="entity.id" :value="entity.id">
                {{ entity.name }}
              </option>
            </optgroup>
          </select>
        </div>
        
        <div class="form-group">
          <label>关系说明</label>
          <textarea 
            v-model="form.description" 
            rows="2"
            placeholder="描述这两个实体之间的关系..."
          />
        </div>
      </div>
      
      <footer class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="onSubmit" :disabled="!isValid">
          添加
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { RelationType, EntityType } from '../../db'

const props = defineProps({
  entities: Array
})

const emit = defineEmits(['close', 'save'])

const relationTypes = [
  { value: RelationType.CONFLICT, label: '冲突' },
  { value: RelationType.FORESHADOW, label: '伏笔' },
  { value: RelationType.CAUSAL, label: '因果' },
  { value: RelationType.OWNERSHIP, label: '持有' }
]

const form = ref({
  fromEntityId: '',
  toEntityId: '',
  type: RelationType.CONFLICT,
  description: ''
})

const groupedEntities = computed(() => {
  const groups = {}
  const typeLabels = {
    [EntityType.ROLE]: '角色',
    [EntityType.ITEM]: '道具',
    [EntityType.RULE]: '规则',
    [EntityType.MAP]: '地图'
  }
  
  props.entities.forEach(entity => {
    if (!groups[entity.type]) {
      groups[entity.type] = { type: entity.type, label: typeLabels[entity.type] || entity.type, items: [] }
    }
    groups[entity.type].items.push(entity)
  })
  
  return Object.values(groups)
})

const isValid = computed(() => {
  return form.value.fromEntityId && 
         form.value.toEntityId && 
         form.value.fromEntityId !== form.value.toEntityId
})

function onSubmit() {
  if (!isValid.value) return
  emit('save', {
    fromEntityId: Number(form.value.fromEntityId),
    toEntityId: Number(form.value.toEntityId),
    type: form.value.type,
    description: form.value.description
  })
}
</script>

<style scoped>
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
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  font-size: 18px;
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
}

.close-btn:hover {
  background: var(--bg-tertiary);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

.required {
  color: var(--danger);
}

.relation-types {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.relation-type-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--bg-tertiary);
  border: 2px solid transparent;
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s;
}

.relation-type-btn:hover {
  border-color: var(--border);
}

.relation-type-btn.active {
  background: rgba(233, 69, 96, 0.1);
  border-color: var(--accent);
  color: var(--text-primary);
}

.type-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.type-color.conflict { background: #e94560; }
.type-color.foreshadow { background: #64b5f6; }
.type-color.causal { background: #4ecca3; }
.type-color.ownership { background: #a0a0a0; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
}

/* 移动端适配 */
@media (max-width: 768px) {
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
