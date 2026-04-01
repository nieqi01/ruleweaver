/**
 * 单元测试：小说创建功能
 * 测试 novelStore 的核心功能
 */

// 模拟测试
console.log('=== RuleWeaver 功能测试 ===\n');

// 测试 1: 检查 novelStore 导出
console.log('测试 1: 检查 stores 导出');
try {
  const novelStore = require('./src/stores/novelStore.js');
  console.log('✅ novelStore 可以正常导入');
} catch (e) {
  console.log('❌ novelStore 导入失败:', e.message);
}

// 测试 2: 检查 entityStore 导出
console.log('\n测试 2: 检查 entityStore 导出');
try {
  const entityStore = require('./src/stores/entityStore.js');
  console.log('✅ entityStore 可以正常导入');
  if (entityStore.EntityType) {
    console.log('✅ EntityType 已正确导出');
  } else {
    console.log('❌ EntityType 未导出');
  }
} catch (e) {
  console.log('❌ entityStore 导入失败:', e.message);
}

// 测试 3: 检查弹窗样式是否存在
console.log('\n测试 3: 检查弹窗样式');
const fs = require('fs');
const path = require('path');

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

// 测试 4: 检查构建输出
console.log('\n测试 4: 检查构建输出');
const distPath = path.join(__dirname, 'dist');
const indexHtmlPath = path.join(distPath, 'index.html');

if (fs.existsSync(distPath) && fs.existsSync(indexHtmlPath)) {
  console.log('✅ dist 文件夹存在');
  console.log('✅ index.html 存在');
  
  // 检查 CSS 文件是否包含弹窗样式
  const cssFiles = fs.readdirSync(path.join(distPath, 'assets'))
    .filter(f => f.endsWith('.css'));
  
  let hasModalStyles = false;
  for (const cssFile of cssFiles) {
    const cssContent = fs.readFileSync(path.join(distPath, 'assets', cssFile), 'utf-8');
    if (cssContent.includes('modal-overlay') && cssContent.includes('modal-content')) {
      hasModalStyles = true;
      console.log(`✅ ${cssFile} 包含弹窗样式`);
      break;
    }
  }
  
  if (!hasModalStyles) {
    console.log('❌ 未找到包含弹窗样式的 CSS 文件');
  }
} else {
  console.log('❌ dist 文件夹或 index.html 不存在');
}

console.log('\n=== 测试完成 ===');
