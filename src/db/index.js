import Dexie from 'dexie'
import {
  novelsTable,
  chaptersTable,
  entitiesTable,
  entityRelationsTable,
  instancesTable,
  instanceEntitiesTable,
  relationsTable,
  aiHistoryTable
} from './schema'

export * from './schema'

export class RuleWeaverDB extends Dexie {
  constructor() {
    super('RuleWeaverDB_v2')
    
    this.version(1).stores({
      [novelsTable.name]: novelsTable.schema,
      [chaptersTable.name]: chaptersTable.schema,
      [entitiesTable.name]: entitiesTable.schema,
      [entityRelationsTable.name]: entityRelationsTable.schema,
      [instancesTable.name]: instancesTable.schema,
      [instanceEntitiesTable.name]: instanceEntitiesTable.schema,
      [relationsTable.name]: relationsTable.schema,
      [aiHistoryTable.name]: aiHistoryTable.schema
    })
    
    this.novels = this.table(novelsTable.name)
    this.chapters = this.table(chaptersTable.name)
    this.entities = this.table(entitiesTable.name)
    this.entityRelations = this.table(entityRelationsTable.name)
    this.instances = this.table(instancesTable.name)
    this.instanceEntities = this.table(instanceEntitiesTable.name)
    this.relations = this.table(relationsTable.name)
    this.aiHistory = this.table(aiHistoryTable.name)
  }
}

export const db = new RuleWeaverDB()
