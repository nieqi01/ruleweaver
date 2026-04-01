<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <header class="modal-header">
        <h2>添加标记</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </header>
      
      <div class="modal-body">
        <div class="position-info">
          <span>📍 位置：{{ Math.round(position.x * 100) }}%, {{ Math.round(position.y * 100) }}%</span>
        </div>
        
        <div class="form-group">
          <label>选择实体 <span class="required">*</span></label>
          <select v-model="form.entityId" required>
            <option value="">选择要标记的实体...</option>
            <optgroup v-for="group in groupedEntities" :key="group.type" :label="group.label">
              <option v-for="entity in group.items" :key="entity.id" :value="entity.id">
                {{ entity.name }}
              </option>
            </optgroup>
          </select>
        </div>
        
        <div class="form-group">
          <label>标记类型</label>
          <select v-model="form.markerType">
            <option value="Point">精确点</option>
            <option value="Area">区域</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>标记说明</label>
          <textarea 
            v-model="form.description" 
            rows="2"
            placeholder="可选：添加标记说明..."
          />
        </div>
      </div>
      
      <footer class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="onSubmit" :disabled="!isValid">
          添加标记
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { EntityType } from '../../db'

const props = defineProps({
  mapId: [Number, String],
  position: Object,
  entities: Array
})

const emit = defineEmits(['close', 'save'])

const form = ref({
  entityId: '',
  markerType: 'Point',
  description: ''
})

const groupedEntities = computed(() => {
  const groups = {}
  const typeLabels = {
    [EntityType.ROLE]: '角色',
    [EntityType.ITEM]: '道具',
    [EntityType.RULE]: '规则'
  }
  
  props.entities.forEach(entity => {
    if (entity.type === EntityType.MAP) return // 地图不能标记在地图上
    if (!groups[entity.type]) {
      groups[entity.type] = { type: entity.type, label: typeLabels[entity.type] || entity.type, items: [] }
    }
    groups[entity.type].items.push(entity)
  })
  
  return Object.values(groups)
})

const isValid = computed(() => form.value.entityId)

function onSubmit() {
  if (!isValid.value) return
  emit('save', {
    mapId: props.mapId,
    entityId: Number(form.value.entityId),
    x: props.position.x,
    y: props.position.y,
    markerType: form.value.markerType,
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
  max-width: 400px;
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

.position-info {
  background: var(--bg-tertiary);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--text-secondary);
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

.required {
  color: var(--danger);
}

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
