<template>
  <div class="map-marker">
    <header class="page-header">
      <h1>地图标记</h1>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="showUploadModal = true">
          📤 上传平面图
        </button>
      </div>
    </header>

    <div v-if="!entityStore.currentInstance" class="empty-state">
      <div class="empty-icon">🗺️</div>
      <h3>请先选择副本</h3>
      <p>在实体库中创建并选择一个副本后，才能管理地图</p>
    </div>

    <div v-else-if="maps.length === 0" class="empty-state">
      <div class="empty-icon">🗺️</div>
      <h3>暂无地图</h3>
      <p>上传平面图来创建地图，并在上面标记实体位置</p>
      <button class="btn btn-primary" @click="showUploadModal = true">
        上传第一张地图
      </button>
    </div>

    <template v-else>
      <div class="map-layout">
        <!-- 地图列表 -->
        <aside class="map-sidebar">
          <h3>地图列表</h3>
          <div class="map-tree">
            <div 
              v-for="map in maps" 
              :key="map.id"
              class="map-item"
              :class="{ active: currentMap?.id === map.id }"
              @click="selectMap(map)"
            >
              <span class="map-icon">🗺️</span>
              <span class="map-name">{{ map.name }}</span>
              <span class="danger-badge" :class="map.dangerZone">{{ map.dangerZone }}</span>
            </div>
          </div>
          
          <div class="marker-list" v-if="currentMap">
            <h4>当前标记 ({{ currentMarkers.length }})</h4>
            <div 
              v-for="marker in currentMarkers" 
              :key="marker.id"
              class="marker-item"
              @click="highlightMarker(marker)"
            >
              <span class="marker-dot"></span>
              <span>{{ getEntityName(marker.entityId) }}</span>
            </div>
          </div>
        </aside>

        <!-- 地图画布 -->
        <div class="map-canvas-wrapper">
          <div v-if="currentMap" class="map-toolbar">
            <span>{{ currentMap.name }}</span>
            <div class="toolbar-actions">
              <button class="btn btn-sm" @click="isMarking = !isMarking" :class="{ active: isMarking }">
                {{ isMarking ? '取消标记' : '添加标记' }}
              </button>
            </div>
          </div>
          
          <div 
            v-if="currentMap" 
            ref="mapCanvas"
            class="map-canvas"
            @click="onMapClick"
          >
            <img 
              v-if="currentMap.backgroundImage" 
              :src="currentMap.backgroundImage" 
              class="map-image"
              @load="onImageLoad"
            />
            
            <!-- 标记点 -->
            <div 
              v-for="marker in currentMarkers" 
              :key="marker.id"
              class="map-marker-point"
              :style="{ left: marker.x * 100 + '%', top: marker.y * 100 + '%' }"
              :title="getEntityName(marker.entityId)"
              @click.stop="onMarkerClick(marker)"
            >
              <span class="marker-pulse"></span>
            </div>
            
            <!-- 十字准星（移动端） -->
            <div v-if="isMobile && isMarking" class="crosshair">
              <div class="crosshair-h"></div>
              <div class="crosshair-v"></div>
            </div>
          </div>
          
          <div v-if="isMarking" class="marking-hint">
            {{ isMobile ? '拖动准星定位，点击确认' : '点击地图添加标记' }}
          </div>
        </div>
      </div>
    </template>

    <!-- 上传地图模态框 -->
    <MapUploadModal
      v-if="showUploadModal"
      :instance-id="entityStore.currentInstance?.id"
      @close="showUploadModal = false"
      @save="onMapUploaded"
    />

    <!-- 添加标记模态框 -->
    <MarkerModal
      v-if="showMarkerModal"
      :map-id="currentMap?.id"
      :position="pendingPosition"
      :entities="entityStore.currentInstanceEntities"
      @close="closeMarkerModal"
      @save="onMarkerAdded"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useEntityStore } from '../../stores/entityStore'
import { db } from '../../db'
import MapUploadModal from './MapUploadModal.vue'
import MarkerModal from './MarkerModal.vue'

const entityStore = useEntityStore()
const isMobile = ref(window.innerWidth < 768)
const showUploadModal = ref(false)
const showMarkerModal = ref(false)
const currentMap = ref(null)
const maps = ref([])
const currentMarkers = ref([])
const isMarking = ref(false)
const pendingPosition = ref({ x: 0, y: 0 })
const mapCanvas = ref(null)

// 监听窗口大小
window.addEventListener('resize', () => {
  isMobile.value = window.innerWidth < 768
})

// 加载地图
async function loadMaps() {
  if (!entityStore.currentInstance) return
  maps.value = await db.maps.where('instanceId').equals(entityStore.currentInstance.id).toArray()
  if (maps.value.length > 0 && !currentMap.value) {
    selectMap(maps.value[0])
  }
}

// 加载标记
async function loadMarkers() {
  if (!currentMap.value) {
    currentMarkers.value = []
    return
  }
  currentMarkers.value = await db.mapMarkers.where('mapId').equals(currentMap.value.id).toArray()
}

// 监听实例变化
watch(() => entityStore.currentInstance, () => {
  loadMaps()
}, { immediate: true })

watch(() => currentMap.value, () => {
  loadMarkers()
})

function selectMap(map) {
  currentMap.value = map
  isMarking.value = false
}

function getEntityName(entityId) {
  const entity = entityStore.entities.find(e => e.id === entityId)
  return entity?.name || '未知实体'
}

function onMapUploaded() {
  showUploadModal.value = false
  loadMaps()
}

function onImageLoad() {
  // 图片加载完成
}

function onMapClick(e) {
  if (!isMarking.value || !mapCanvas.value) return
  
  const rect = mapCanvas.value.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width
  const y = (e.clientY - rect.top) / rect.height
  
  pendingPosition.value = { x, y }
  showMarkerModal.value = true
}

function onMarkerClick(marker) {
  if (confirm(`删除标记 "${getEntityName(marker.entityId)}"？`)) {
    db.mapMarkers.delete(marker.id).then(loadMarkers)
  }
}

function closeMarkerModal() {
  showMarkerModal.value = false
  pendingPosition.value = { x: 0, y: 0 }
}

function onMarkerAdded() {
  closeMarkerModal()
  loadMarkers()
  isMarking.value = false
}

function highlightMarker(marker) {
  // 高亮标记点
}

onMounted(() => {
  loadMaps()
})
</script>

<style scoped>
.map-marker {
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

.map-layout {
  display: flex;
  flex: 1;
  gap: 16px;
  min-height: 0;
}

.map-sidebar {
  width: 240px;
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 16px;
  overflow-y: auto;
}

.map-sidebar h3,
.map-sidebar h4 {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.map-tree {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 20px;
}

.map-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.map-item:hover {
  background: var(--bg-tertiary);
}

.map-item.active {
  background: var(--accent);
}

.map-icon {
  font-size: 16px;
}

.map-name {
  flex: 1;
  font-size: 14px;
}

.danger-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

.danger-badge.Safe { background: rgba(78, 204, 163, 0.2); color: var(--success); }
.danger-badge.Risk { background: rgba(255, 193, 7, 0.2); color: var(--warning); }
.danger-badge.Deadly { background: rgba(233, 69, 96, 0.2); color: var(--danger); }

.marker-list {
  border-top: 1px solid var(--border);
  padding-top: 16px;
}

.marker-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.marker-item:hover {
  background: var(--bg-tertiary);
}

.marker-dot {
  width: 8px;
  height: 8px;
  background: var(--accent);
  border-radius: 50%;
}

.map-canvas-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border-radius: 12px;
  overflow: hidden;
}

.map-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

.btn-sm.active {
  background: var(--accent);
}

.map-canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
  cursor: crosshair;
}

.map-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: var(--bg-tertiary);
}

.map-marker-point {
  position: absolute;
  width: 20px;
  height: 20px;
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: 10;
}

.marker-pulse {
  display: block;
  width: 16px;
  height: 16px;
  background: var(--accent);
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 10px var(--accent);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

.crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  pointer-events: none;
}

.crosshair-h,
.crosshair-v {
  position: absolute;
  background: var(--accent);
}

.crosshair-h {
  width: 100%;
  height: 2px;
  top: 50%;
  transform: translateY(-50%);
}

.crosshair-v {
  width: 2px;
  height: 100%;
  left: 50%;
  transform: translateX(-50%);
}

.marking-hint {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  color: var(--text-primary);
  margin-bottom: 8px;
}

.empty-state p {
  margin-bottom: 24px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .map-layout {
    flex-direction: column;
  }
  
  .map-sidebar {
    width: 100%;
    max-height: 200px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
