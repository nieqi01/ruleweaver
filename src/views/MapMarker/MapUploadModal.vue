<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <header class="modal-header">
        <h2>上传平面图</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </header>
      
      <div class="modal-body">
        <div class="form-group">
          <label>地图名称 <span class="required">*</span></label>
          <input v-model="form.name" type="text" placeholder="如：3楼走廊" required />
        </div>
        
        <div class="form-group">
          <label>父地图</label>
          <select v-model="form.parentId">
            <option :value="null">顶级地图</option>
            <option v-for="map in siblingMaps" :key="map.id" :value="map.id">
              {{ map.name }}
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label>危险区域</label>
          <select v-model="form.dangerZone">
            <option value="Safe">安全区</option>
            <option value="Risk">风险区</option>
            <option value="Deadly">致命区</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>平面图 <span class="required">*</span></label>
          <input 
            ref="fileInput"
            type="file" 
            accept="image/jpeg,image/png,image/jpg"
            @change="onFileSelect"
            style="display: none"
          />
          <div 
            class="upload-area"
            :class="{ dragging: isDragging }"
            @dragenter.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @dragover.prevent
            @drop.prevent="onDrop"
            @click="$refs.fileInput.click()"
          >
            <div v-if="!previewUrl" class="upload-placeholder">
              <span class="upload-icon">📤</span>
              <p>点击或拖拽上传图片</p>
              <small>支持 JPG/PNG，建议 1000px 宽度</small>
            </div>
            <img v-else :src="previewUrl" class="upload-preview" @click.stop />
          </div>
        </div>
        
        <div v-if="isCompressing" class="compressing-hint">
          <span class="spinner"></span>
          正在压缩图片...
        </div>
      </div>
      
      <footer class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="onSubmit" :disabled="!isValid || isCompressing">
          上传
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useEntityStore } from '../../stores/entityStore'
import { DangerZone } from '../../db'

const props = defineProps({
  instanceId: [Number, String]
})

const emit = defineEmits(['close', 'save'])
const entityStore = useEntityStore()

const form = ref({
  name: '',
  parentId: null,
  dangerZone: 'Safe',
  backgroundImage: ''
})

const isDragging = ref(false)
const isCompressing = ref(false)
const previewUrl = ref('')
const selectedFile = ref(null)

const siblingMaps = computed(() => entityStore.maps)

const isValid = computed(() => {
  return form.value.name.trim() && form.value.backgroundImage
})

// 调试日志
watch(() => form.value.backgroundImage, (val) => {
  console.log('背景图片已更新:', val ? '已设置' : '未设置', '长度:', val?.length)
})

function onFileSelect(e) {
  const file = e.target.files[0]
  if (file) handleFile(file)
}

function onDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    handleFile(file)
  }
}

async function handleFile(file) {
  selectedFile.value = file
  
  // 预览
  previewUrl.value = URL.createObjectURL(file)
  
  // 压缩
  isCompressing.value = true
  try {
    const compressed = await compressImage(file)
    form.value.backgroundImage = compressed
  } catch (err) {
    alert('图片压缩失败：' + err.message)
  } finally {
    isCompressing.value = false
  }
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    console.log('开始压缩图片:', file.name, '大小:', (file.size / 1024).toFixed(2), 'KB')
    
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    
    img.onload = () => {
      console.log('图片加载成功, 尺寸:', img.width, 'x', img.height)
      
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // 计算新尺寸（最大宽度 1000px）
      let width = img.width
      let height = img.height
      const maxWidth = 1000
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      
      // 转换为 base64，质量 0.8
      let dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      
      // 检查大小
      const sizeInKB = Math.round(dataUrl.length * 0.75 / 1024)
      console.log('压缩后大小:', sizeInKB, 'KB')
      
      if (sizeInKB > 200) {
        // 如果还太大，进一步压缩
        console.log('图片过大，进一步压缩')
        dataUrl = canvas.toDataURL('image/jpeg', 0.5)
        console.log('二次压缩后大小:', Math.round(dataUrl.length * 0.75 / 1024), 'KB')
      }
      
      URL.revokeObjectURL(objectUrl)
      resolve(dataUrl)
    }
    
    img.onerror = (err) => {
      console.error('图片加载失败:', err)
      URL.revokeObjectURL(objectUrl)
      reject(new Error('图片加载失败'))
    }
    
    img.src = objectUrl
  })
}

function onSubmit() {
  if (!isValid.value) return
  emit('save', {
    ...form.value,
    instanceId: props.instanceId
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

.upload-area {
  border: 2px dashed var(--border);
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-area:hover,
.upload-area.dragging {
  border-color: var(--accent);
  background: rgba(233, 69, 96, 0.05);
}

.upload-placeholder {
  color: var(--text-secondary);
}

.upload-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.upload-placeholder p {
  margin-bottom: 4px;
}

.upload-placeholder small {
  opacity: 0.7;
}

.upload-preview {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
}

.compressing-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 14px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
