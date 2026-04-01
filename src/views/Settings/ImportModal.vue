<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <header class="modal-header">
        <h2>导入世界设定包</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </header>
      
      <div class="modal-body">
        <!-- 步骤 1：选择文件 -->
        <div v-if="step === 1" class="import-step">
          <div class="upload-area" @click="$refs.fileInput.click()">
            <input 
              ref="fileInput"
              type="file" 
              accept=".json,.enc"
              @change="onFileSelect"
              hidden
            />
            <span class="upload-icon">📁</span>
            <p>点击选择文件</p>
            <small>支持 .json 或 .enc 格式</small>
          </div>
        </div>
        
        <!-- 步骤 2：输入密码 -->
        <div v-if="step === 2" class="import-step">
          <p class="step-desc">检测到加密文件，请输入密码：</p>
          <input 
            v-model="password" 
            type="password" 
            placeholder="请输入密码"
            @keyup.enter="decryptFile"
          />
          <button class="btn btn-primary" @click="decryptFile" :disabled="!password">
            解密
          </button>
        </div>
        
        <!-- 步骤 3：选择导入策略 -->
        <div v-if="step === 3" class="import-step">
          <p class="step-desc">文件解析成功！请选择导入方式：</p>
          
          <div class="strategy-options">
            <label class="strategy-option">
              <input type="radio" v-model="strategy" value="merge" />
              <div class="strategy-info">
                <strong>合并导入</strong>
                <p>保留现有数据，导入新数据（推荐）</p>
              </div>
            </label>
            
            <label class="strategy-option">
              <input type="radio" v-model="strategy" value="replace" />
              <div class="strategy-info">
                <strong>覆盖导入</strong>
                <p>清空现有数据，完全使用导入的数据</p>
              </div>
            </label>
          </div>
          
          <div v-if="preview" class="import-preview">
            <h4>预览</h4>
            <ul>
              <li>副本：{{ preview.instances }} 个</li>
              <li>实体：{{ preview.entities }} 个</li>
              <li>地图：{{ preview.maps }} 个</li>
              <li>关系：{{ preview.relations }} 条</li>
            </ul>
          </div>
        </div>
      </div>
      
      <footer class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">取消</button>
        <button 
          v-if="step === 3" 
          class="btn btn-primary" 
          @click="confirmImport"
        >
          导入
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CryptoJS from 'crypto-js'

const emit = defineEmits(['close', 'import'])

const step = ref(1)
const password = ref('')
const strategy = ref('merge')
const fileContent = ref('')
const preview = ref(null)
const parsedData = ref(null)

function onFileSelect(e) {
  const file = e.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (event) => {
    fileContent.value = event.target.result
    
    // 检查是否加密
    if (file.name.endsWith('.enc')) {
      step.value = 2
    } else {
      // 直接解析 JSON
      try {
        parsedData.value = JSON.parse(fileContent.value)
        generatePreview()
        step.value = 3
      } catch (err) {
        alert('文件解析失败：' + err.message)
      }
    }
  }
  reader.readAsText(file)
}

function decryptFile() {
  try {
    const decrypted = CryptoJS.AES.decrypt(fileContent.value, password.value)
    const text = decrypted.toString(CryptoJS.enc.Utf8)
    
    if (!text) {
      throw new Error('密码错误或文件损坏')
    }
    
    parsedData.value = JSON.parse(text)
    generatePreview()
    step.value = 3
  } catch (err) {
    alert('解密失败：' + err.message)
  }
}

function generatePreview() {
  const data = parsedData.value
  preview.value = {
    instances: data.instances?.length || 0,
    entities: data.entities?.length || 0,
    maps: data.maps?.length || 0,
    relations: data.relations?.length || 0
  }
}

function confirmImport() {
  emit('import', {
    data: parsedData.value,
    strategy: strategy.value
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

.import-step {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step-desc {
  color: var(--text-secondary);
}

.upload-area {
  border: 2px dashed var(--border);
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-area:hover {
  border-color: var(--accent);
  background: rgba(233, 69, 96, 0.05);
}

.upload-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.strategy-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.strategy-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.strategy-option:hover {
  background: var(--bg-secondary);
}

.strategy-option input {
  width: auto;
  margin-top: 2px;
}

.strategy-info strong {
  display: block;
  margin-bottom: 4px;
}

.strategy-info p {
  font-size: 13px;
  color: var(--text-secondary);
}

.import-preview {
  background: var(--bg-tertiary);
  padding: 16px;
  border-radius: 8px;
}

.import-preview h4 {
  margin-bottom: 12px;
}

.import-preview ul {
  list-style: none;
}

.import-preview li {
  padding: 4px 0;
  color: var(--text-secondary);
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
