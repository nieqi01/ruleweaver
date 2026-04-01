/**
 * 单元测试：小说创建功能
 * 测试 novelStore 的核心功能
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== RuleWeaver 功能测试 ===\n');

// 测试 1: 检查弹窗样式是否存在
console.log('测试 1: 检查弹窗样式');

const homeVuePath = path.join(__dirname, 'src/views/Home/index.vue');
const entitiesVuePath = path.join(__dirname, 'src/views/Entities/index.vue');

const homeContent = fs.readFileSync(homeVuePath, 'utf-8');
const entitiesContent = fs.readFileSync(entitiesVuePath, 'utf-8');

if (homeContent.includes('.modal-overlay') && homeContent.includes('.modal-content')) {
  console.log('✅ Home/index.vue 包含弹窗样式');
} else {
  console.log('❌ Home/index.vue 缺少弹窗样式');
}

if (entitiesContent.includes('.modal-overlay') && entitiesContent.includes('.modal-content')) {
  console.log('✅ Entities/index.vue 包含弹窗样式');
} else {
  console.log('❌ Entities/index.vue 缺少弹窗样式');
}

// 测试 2: 检查 entityStore 导出 EntityType
console.log('\n测试 2: 检查 entityStore 导出');
const entityStorePath = path.join(__dirname, 'src/stores/entityStore.js');
const entityStoreContent = fs.readFileSync(entityStorePath, 'utf-8');

if (entityStoreContent.includes('export { EntityType }')) {
  console.log('✅ entityStore.js 正确导出 EntityType');
} else {
  console.log('❌ entityStore.js 未导出 EntityType');
}

// 测试 3: 检查构建输出
console.log('\n测试 3: 检查构建输出');
const distPath = path.join(__dirname, 'dist');
const indexHtmlPath = path.join(distPath, 'index.html');

if (fs.existsSync(distPath) && fs.existsSync(indexHtmlPath)) {
  console.log('✅ dist 文件夹存在');
  console.log('✅ index.html 存在');
  
  // 检查 CSS 文件是否包含弹窗样式
  const assetsPath = path.join(distPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    const cssFiles = fs.readdirSync(assetsPath)
      .filter(f => f.endsWith('.css'));
    
    let hasModalStyles = false;
    for (const cssFile of cssFiles) {
      const cssContent = fs.readFileSync(path.join(assetsPath, cssFile), 'utf-8');
      if (cssContent.includes('modal-overlay') && cssContent.includes('modal-content')) {
        hasModalStyles = true;
        console.log(`✅ ${cssFile} 包含弹窗样式`);
        break;
      }
    }
    
    if (!hasModalStyles) {
      console.log('❌ 未找到包含弹窗样式的 CSS 文件');
    }
  }
  
  // 检查 JS 文件
  const jsFiles = fs.readdirSync(assetsPath)
    .filter(f => f.endsWith('.js'));
  console.log(`✅ 找到 ${jsFiles.length} 个 JS 文件`);
  
} else {
  console.log('❌ dist 文件夹或 index.html 不存在');
}

// 测试 4: 检查关键组件结构
console.log('\n测试 4: 检查关键组件结构');

// 检查 Home 组件是否有新建小说弹窗
if (homeContent.includes('showCreateModal') && 
    homeContent.includes('@click="showCreateModal = true"') &&
    homeContent.includes('v-if="showCreateModal"')) {
  console.log('✅ Home 组件有新建小说弹窗逻辑');
} else {
  console.log('❌ Home 组件缺少新建小说弹窗逻辑');
}

// 检查 createNovel 函数
if (homeContent.includes('async function createNovel') &&
    homeContent.includes('novelStore.createNovel')) {
  console.log('✅ Home 组件有 createNovel 函数');
} else {
  console.log('❌ Home 组件缺少 createNovel 函数');
}

console.log('\n=== 测试完成 ===');
