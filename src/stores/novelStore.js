import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '../db'

// 小说 Store - 管理当前小说状态
export const useNovelStore = defineStore('novel', () => {
  // State
  const novels = ref([])
  const currentNovel = ref(null)
  const loading = ref(false)
  
  // Getters
  const hasNovel = computed(() => !!currentNovel.value)
  const novelList = computed(() => novels.value)
  
  // Actions
  async function loadNovels() {
    loading.value = true
    novels.value = await db.novels.toArray()
    loading.value = false
  }
  
  async function createNovel(data) {
    const id = await db.novels.add({
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
    await loadNovels()
    return id
  }
  
  function setCurrentNovel(novel) {
    currentNovel.value = novel
  }
  
  async function deleteNovel(id) {
    await db.novels.delete(id)
    await db.chapters.where('novelId').equals(id).delete()
    await db.entities.where('novelId').equals(id).delete()
    await db.instances.where('novelId').equals(id).delete()
    await db.relations.where('novelId').equals(id).delete()
    
    if (currentNovel.value?.id === id) {
      currentNovel.value = null
    }
    await loadNovels()
  }
  
  // 初始化
  async function init() {
    await loadNovels()
    if (novels.value.length > 0 && !currentNovel.value) {
      setCurrentNovel(novels.value[0])
    }
  }
  
  return {
    novels,
    currentNovel,
    loading,
    hasNovel,
    novelList,
    loadNovels,
    createNovel,
    setCurrentNovel,
    deleteNovel,
    init
  }
})
