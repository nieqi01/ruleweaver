<template>
  <div class="relation-graph">
    <header class="page-header">
      <h1>关系图谱</h1>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="toggleView">
          {{ isMobile || forceListView ? '切换图谱' : '切换列表' }}
        </button>
        <button class="btn btn-primary" @click="showAddRelation = true">
          <span>+</span> 添加关系
        </button>
      </div>
    </header>

    <div v-if="!entityStore.currentInstance" class="empty-state">
      <div class="empty-icon">🕸️</div>
      <h3>请先选择副本</h3>
      <p>在实体库中创建并选择一个副本后，才能查看关系图谱</p>
    </div>

    <template v-else>
      <!-- 图谱视图 -->
      <div v-if="!isMobile && !forceListView" class="graph-container">
        <div ref="cyContainer" class="cy-container"></div>
        <div class="graph-legend">
          <div class="legend-item">
            <span class="legend-line conflict"></span>
            <span>冲突</span>
          </div>
          <div class="legend-item">
            <span class="legend-line foreshadow"></span>
            <span>伏笔</span>
          </div>
          <div class="legend-item">
            <span class="legend-line causal"></span>
            <span>因果</span>
          </div>
          <div class="legend-item">
            <span class="legend-line ownership"></span>
            <span>持有</span>
          </div>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-else class="list-container">
        <table class="relations-table">
          <thead>
            <tr>
              <th>实体 A</th>
              <th>关系</th>
              <th>实体 B</th>
              <th>说明</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rel in relations" :key="rel.id">
              <td>{{ getEntityName(rel.fromEntityId) }}</td>
              <td>
                <span class="relation-badge" :class="rel.type.toLowerCase()">
                  {{ getRelationLabel(rel.type) }}
                </span>
              </td>
              <td>{{ getEntityName(rel.toEntityId) }}</td>
              <td>{{ rel.description || '-' }}</td>
              <td>
                <button class="btn-icon" @click="deleteRelation(rel.id)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="relations.length === 0" class="empty-state small">
          <p>暂无关系，点击"添加关系"创建</p>
        </div>
      </div>
    </template>

    <!-- 添加关系模态框 -->
    <RelationModal
      v-if="showAddRelation"
      :entities="entityStore.currentInstanceEntities"
      @close="showAddRelation = false"
      @save="addRelation"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useEntityStore } from '../../stores/entityStore'
import { db, RelationType } from '../../db'
import RelationModal from './RelationModal.vue'

const entityStore = useEntityStore()
const isMobile = ref(window.innerWidth < 768)
const forceListView = ref(false)
const showAddRelation = ref(false)
const relations = ref([])
const cyContainer = ref(null)
let cy = null

// 监听窗口大小
window.addEventListener('resize', () => {
  isMobile.value = window.innerWidth < 768
})

// 加载关系
async function loadRelations() {
  if (!entityStore.currentInstance) return
  const entityIds = entityStore.currentInstanceEntities.map(e => e.id)
  relations.value = await db.relations
    .where('fromEntityId').anyOf(entityIds)
    .or('toEntityId').anyOf(entityIds)
    .toArray()
}

// 监听实体变化
watch(() => entityStore.currentInstanceEntities, () => {
  loadRelations()
  if (!isMobile.value && !forceListView.value) {
    nextTick(() => initGraph())
  }
}, { deep: true })

function toggleView() {
  forceListView.value = !forceListView.value
  if (!forceListView.value) {
    nextTick(() => initGraph())
  }
}

function getEntityName(id) {
  const entity = entityStore.entities.find(e => e.id === id)
  return entity?.name || '未知'
}

function getRelationLabel(type) {
  const map = {
    [RelationType.CONFLICT]: '冲突',
    [RelationType.FORESHADOW]: '伏笔',
    [RelationType.CAUSAL]: '因果',
    [RelationType.OWNERSHIP]: '持有'
  }
  return map[type] || type
}

async function addRelation(data) {
  await db.relations.add({
    ...data,
    isManualConflict: data.type === RelationType.CONFLICT
  })
  await loadRelations()
  showAddRelation.value = false
  if (!isMobile.value && !forceListView.value) {
    nextTick(() => initGraph())
  }
}

async function deleteRelation(id) {
  if (!confirm('确定删除此关系？')) return
  await db.relations.delete(id)
  await loadRelations()
  if (!isMobile.value && !forceListView.value) {
    nextTick(() => initGraph())
  }
}

// 初始化 Cytoscape 图谱
async function initGraph() {
  if (!cyContainer.value || isMobile.value || forceListView.value) return
  
  // 动态导入 Cytoscape
  const cytoscape = (await import('cytoscape')).default
  
  const entities = entityStore.currentInstanceEntities
  const nodes = entities.map(e => ({
    data: {
      id: String(e.id),
      label: e.name,
      type: e.type
    }
  }))
  
  const edges = relations.value.map(r => ({
    data: {
      id: String(r.id),
      source: String(r.fromEntityId),
      target: String(r.toEntityId),
      type: r.type
    }
  }))
  
  const typeColors = {
    Role: '#4ecca3',
    Item: '#ffc107',
    Rule: '#e94560',
    Map: '#64b5f6'
  }
  
  const edgeStyles = {
    [RelationType.CONFLICT]: { lineColor: '#e94560', lineStyle: 'solid', width: 3 },
    [RelationType.FORESHADOW]: { lineColor: '#64b5f6', lineStyle: 'dashed', width: 2 },
    [RelationType.CAUSAL]: { lineColor: '#4ecca3', lineStyle: 'solid', width: 2 },
    [RelationType.OWNERSHIP]: { lineColor: '#a0a0a0', lineStyle: 'solid', width: 1 }
  }
  
  if (cy) {
    cy.destroy()
  }
  
  cy = cytoscape({
    container: cyContainer.value,
    elements: [...nodes, ...edges],
    style: [
      {
        selector: 'node',
        style: {
          'background-color': ele => typeColors[ele.data('type')] || '#888',
          'label': 'data(label)',
          'color': '#fff',
          'font-size': '12px',
          'text-valign': 'center',
          'text-halign': 'center',
          'width': 60,
          'height': 60,
          'border-width': 2,
          'border-color': '#fff'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': ele => edgeStyles[ele.data('type')]?.width || 2,
          'line-color': ele => edgeStyles[ele.data('type')]?.lineColor || '#888',
          'line-style': ele => edgeStyles[ele.data('type')]?.lineStyle || 'solid',
          'target-arrow-shape': 'triangle',
          'target-arrow-color': ele => edgeStyles[ele.data('type')]?.lineColor || '#888',
          'curve-style': 'bezier'
        }
      }
    ],
    layout: {
      name: 'cose',
      padding: 20,
      animate: true,
      animationDuration: 500,
      componentSpacing: 100,
      nodeOverlap: 20,
      refresh: 20,
      fit: true,
      randomize: false
    }
  })
  
  // 双击节点查看详情
  cy.on('dbltap', 'node', (evt) => {
    const nodeId = evt.target.id()
    const entity = entities.find(e => String(e.id) === nodeId)
    if (entity) {
      alert(`实体详情：\n名称：${entity.name}\n类型：${entity.type}\n状态：${entity.status}`)
    }
  })
}

onMounted(() => {
  loadRelations()
  if (!isMobile.value && !forceListView.value) {
    nextTick(() => initGraph())
  }
})
</script>

<style scoped>
.relation-graph {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.graph-container {
  flex: 1;
  position: relative;
  background: var(--bg-secondary);
  border-radius: 12px;
  overflow: hidden;
}

.cy-container {
  width: 100%;
  height: 100%;
  min-height: 500px;
}

.graph-legend {
  position: absolute;
  bottom: 16px;
  left: 16px;
  background: rgba(26, 26, 46, 0.9);
  padding: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.legend-line {
  width: 24px;
  height: 3px;
  border-radius: 2px;
}

.legend-line.conflict { background: #e94560; }
.legend-line.foreshadow { 
  background: repeating-linear-gradient(90deg, #64b5f6 0px, #64b5f6 4px, transparent 4px, transparent 8px);
  height: 2px;
}
.legend-line.causal { background: #4ecca3; }
.legend-line.ownership { background: #a0a0a0; }

.list-container {
  flex: 1;
  overflow: auto;
}

.relations-table {
  width: 100%;
  border-collapse: collapse;
}

.relations-table th,
.relations-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.relations-table th {
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 13px;
}

.relation-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.relation-badge.conflict {
  background: rgba(233, 69, 96, 0.2);
  color: var(--danger);
}

.relation-badge.foreshadow {
  background: rgba(100, 181, 246, 0.2);
  color: #64b5f6;
}

.relation-badge.causal {
  background: rgba(78, 204, 163, 0.2);
  color: var(--success);
}

.relation-badge.ownership {
  background: rgba(160, 160, 160, 0.2);
  color: var(--text-secondary);
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-state.small {
  padding: 40px 20px;
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
  
  .header-actions {
    width: 100%;
  }
  
  .header-actions button {
    flex: 1;
  }
  
  .relations-table {
    font-size: 13px;
  }
  
  .relations-table th,
  .relations-table td {
    padding: 8px;
  }
}
</style>
