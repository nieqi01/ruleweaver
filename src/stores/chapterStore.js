import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '../db'
import { useNovelStore } from './novelStore'

// 章节 Store
export const useChapterStore = defineStore('chapter', () => {
  const novelStore = useNovelStore()
  
  // State
  const chapters = ref([])
  const currentChapter = ref(null)
  
  // Getters
  const sortedChapters = computed(() => {
    return [...chapters.value].sort((a, b) => a.number - b.number)
  })
  
  const totalWordCount = computed(() => {
    return chapters.value.reduce((sum, c) => sum + (c.wordCount || 0), 0)
  })
  
  // Actions
  async function loadChapters() {
    if (!novelStore.currentNovel) {
      chapters.value = []
      return
    }
    chapters.value = await db.chapters
      .where('novelId')
      .equals(novelStore.currentNovel.id)
      .toArray()
  }
  
  async function createChapter(data) {
    const novelId = novelStore.currentNovel?.id
    if (!novelId) return
    
    const maxNumber = chapters.value.length > 0 
      ? Math.max(...chapters.value.map(c => c.number))
      : 0
    
    const id = await db.chapters.add({
      ...data,
      novelId,
      number: data.number || maxNumber + 1,
      content: data.content || '',
      wordCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
    
    await loadChapters()
    return id
  }
  
  async function updateChapter(id, data) {
    const chapter = await db.chapters.get(id)
    if (!chapter) return
    
    const wordCount = data.content 
      ? (data.content.match(/[\u4e00-\u9fa5]/g) || []).length + (data.content.match(/[a-zA-Z]+/g) || []).length
      : chapter.wordCount
    
    await db.chapters.update(id, {
      ...data,
      wordCount,
      updatedAt: Date.now()
    })
    await loadChapters()
  }
  
  async function deleteChapter(id) {
    await db.chapters.delete(id)
    if (currentChapter.value?.id === id) {
      currentChapter.value = null
    }
    await loadChapters()
  }
  
  function setCurrentChapter(chapter) {
    currentChapter.value = chapter
  }
  
  return {
    chapters,
    currentChapter,
    sortedChapters,
    totalWordCount,
    loadChapters,
    createChapter,
    updateChapter,
    deleteChapter,
    setCurrentChapter
  }
})
