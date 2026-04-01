<template>
  <div class="instances-page">
    <div v-if="!novelStore.hasNovel" class="empty-state">
      <div class="empty-icon">🗺️</div>
      <h3 class="empty-title">请先创建小说</h3>
      <router-link to="/" class="btn btn-primary">去创建小说</router-link>
    </div>
    <div v-else class="page-container">
      <h1 class="page-title">副本管理</h1>
      <p class="page-subtitle">配置副本并选择实体</p>
      <div class="coming-soon">副本功能开发中...</div>
    </div>
  </div>
</template>

<script setup>
import { useNovelStore } from '../../stores/novelStore'
const novelStore = useNovelStore()
</script>

<style scoped>
.coming-soon {
  text-align: center;
  padding: 100px;
  color: var(--text-secondary);
}
</style>
