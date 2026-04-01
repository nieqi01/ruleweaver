// AI 服务 - 内置 API Key
const API_KEY = 'sk-b6N57xg7ghoIsOjasujWQMTIyTuvgwZHwoTrEyyjrYaYPuE3'
const API_BASE = 'https://api.moonshot.cn/v1'

// 通用 API 调用
async function callKimi(messages, temperature = 0.7) {
  const response = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'moonshot-v1-8k',
      messages,
      temperature,
      response_format: { type: 'json_object' }
    })
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `API 请求失败: ${response.status}`)
  }
  
  const data = await response.json()
  const content = data.choices[0]?.message?.content
  
  if (!content) {
    throw new Error('API 返回内容为空')
  }
  
  try {
    return JSON.parse(content)
  } catch (e) {
    return { text: content }
  }
}

// 1. AI 生成灵感
export async function generateInspiration(type, context) {
  const prompts = {
    plot: `作为规则怪谈创作助手，请基于以下背景生成一个剧情灵感：
背景：${context}
请生成包含：标题、核心设定、关键转折、恐怖元素的剧情灵感。`,
    
    character: `作为规则怪谈创作助手，请基于以下描述生成一个角色设定：
描述：${context}
请生成包含：姓名、身份、性格特点、隐藏秘密、与怪谈的关联的角色设定。`,
    
    rule: `作为规则怪谈创作助手，请基于以下场景生成一条诡异规则：
场景：${context}
请生成包含：规则内容、表面合理性、隐藏危险、违反后果的规则设定。`,
    
    scene: `作为规则怪谈创作助手，请基于以下描述生成一个场景设定：
描述：${context}
请生成包含：场景名称、环境描述、诡异氛围、潜在危险点的场景设定。`
  }
  
  return await callKimi([
    {
      role: 'system',
      content: '你是一位资深的规则怪谈创作者，擅长设计恐怖氛围和悬疑剧情。请用中文回答，输出格式为 JSON。'
    },
    {
      role: 'user',
      content: prompts[type] || prompts.plot
    }
  ])
}

// 2. AI 生成实体
export async function generateEntity(type, description) {
  const typePrompts = {
    role: `请生成一个规则怪谈角色，要求：
描述：${description}
输出包含：name(姓名), identity(身份), description(描述), personality(性格), secret(秘密), dangerLevel(危险等级S/A/B/C)`,
    
    item: `请生成一个规则怪谈道具，要求：
描述：${description}
输出包含：name(名称), description(描述), effect(效果), dangerLevel(危险等级S/A/B/C)`,
    
    rule: `请生成一条规则怪谈规则，要求：
描述：${description}
输出包含：name(规则名), content(规则内容), violation(违反后果), dangerLevel(危险等级S/A/B/C)`,
    
    ability: `请生成一个诡异能力，要求：
描述：${description}
输出包含：name(能力名), description(描述), effect(效果), sideEffect(副作用), dangerLevel(危险等级S/A/B/C)`
  }
  
  return await callKimi([
    {
      role: 'system',
      content: '你是一位资深的规则怪谈创作者。请用中文回答，输出格式为 JSON。'
    },
    {
      role: 'user',
      content: typePrompts[type] || typePrompts.role
    }
  ])
}

// 3. AI 识别章节中的实体
export async function detectEntities(chapterContent, existingEntities) {
  const entityList = existingEntities.map(e => `${e.name}(${e.type})`).join(', ')
  
  return await callKimi([
    {
      role: 'system',
      content: '你是一位文本分析专家，擅长从小说章节中识别和标注实体。请用中文回答，输出格式为 JSON。'
    },
    {
      role: 'user',
      content: `请分析以下小说章节，识别其中的实体并标注：

章节内容：
${chapterContent.substring(0, 2000)}

已有实体列表：${entityList || '无'}

请输出：
1. detectedEntities: 检测到的实体数组，每个包含 name(名称), type(类型:role/item/rule/ability), positions(出现位置数组)
2. newEntities: 建议创建的新实体数组
3. relations: 实体间的关系数组`
    }
  ])
}

// 4. AI 润色文章
export async function polishText(text, style = 'smooth') {
  const stylePrompts = {
    smooth: '让文字更加流畅自然，保持原意',
    vivid: '增加描写细节，让场景更生动',
    tense: '增强紧张感和悬疑氛围',
    concise: '精简文字，去除冗余'
  }
  
  return await callKimi([
    {
      role: 'system',
      content: '你是一位资深编辑，擅长润色小说文本。请直接返回润色后的文本，保持原有格式。'
    },
    {
      role: 'user',
      content: `请润色以下文本，要求：${stylePrompts[style] || stylePrompts.smooth}

原文：
${text}`
    }
  ], 0.8)
}

// 5. AI 续写
export async function continueStory(context, style = 'consistent') {
  return await callKimi([
    {
      role: 'system',
      content: '你是一位小说续写专家，能够根据上下文风格续写故事。请保持原有风格和人物设定。'
    },
    {
      role: 'user',
      content: `请根据以下内容续写（约300字）：

前文：
${context.substring(-500)}

请续写：`
    }
  ], 0.8)
}
