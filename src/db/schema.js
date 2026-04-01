// 数据库 Schema 定义 - 全新设计

// 小说表
export const novelsTable = {
  name: 'novels',
  schema: '++id, name, author, description, createdAt, updatedAt'
}

// 章节表
export const chaptersTable = {
  name: 'chapters',
  schema: '++id, novelId, number, title, content, wordCount, createdAt, updatedAt'
}

// 实体表 - 全局唯一，属于小说
export const entitiesTable = {
  name: 'entities',
  schema: '++id, novelId, type, name, description, attributes, createdAt, updatedAt'
}

// 实体类型枚举
export const EntityType = {
  ROLE: 'role',      // 角色
  ITEM: 'item',      // 道具
  RULE: 'rule',      // 规则
  ABILITY: 'ability' // 诡异能力
}

// 实体关系表 - 角色拥有道具/能力
export const entityRelationsTable = {
  name: 'entityRelations',
  schema: '++id, novelId, ownerId, ownedId, relationType'
}

// 副本表
export const instancesTable = {
  name: 'instances',
  schema: '++id, novelId, name, dangerLevel, survivalCondition, description, createdAt, updatedAt'
}

// 副本实体关联表
export const instanceEntitiesTable = {
  name: 'instanceEntities',
  schema: '++id, instanceId, entityId, role'
}

// 实体间关系表（用于关系图谱）
export const relationsTable = {
  name: 'relations',
  schema: '++id, novelId, instanceId, fromEntityId, toEntityId, relationType, description'
}

// 关系类型
export const RelationType = {
  OWNS: 'owns',           // 拥有
  CONFLICTS: 'conflicts', // 冲突
  FORESHADOWS: 'foreshadows', // 伏笔
  CAUSES: 'causes',       // 因果
  ALLIES: 'allies',       // 同盟
  ENEMIES: 'enemies'      // 敌对
}

// AI生成历史
export const aiHistoryTable = {
  name: 'aiHistory',
  schema: '++id, novelId, type, prompt, result, createdAt'
}

// 危险等级
export const DangerLevel = {
  S: 'S',
  A: 'A', 
  B: 'B',
  C: 'C'
}
