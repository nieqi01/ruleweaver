const y="sk-b6N57xg7ghoIsOjasujWQMTIyTuvgwZHwoTrEyyjrYaYPuE3",m="https://api.moonshot.cn/v1";async function o(n,t=.7){var a,i,c;const e=await fetch(`${m}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${y}`},body:JSON.stringify({model:"moonshot-v1-8k",messages:n,temperature:t,response_format:{type:"json_object"}})});if(!e.ok){const l=await e.json().catch(()=>({}));throw new Error(((a=l.error)==null?void 0:a.message)||`API 请求失败: ${e.status}`)}const r=(c=(i=(await e.json()).choices[0])==null?void 0:i.message)==null?void 0:c.content;if(!r)throw new Error("API 返回内容为空");try{return JSON.parse(r)}catch{return{text:r}}}async function u(n,t){const e={plot:`作为规则怪谈创作助手，请基于以下背景生成一个剧情灵感：
背景：${t}
请生成包含：标题、核心设定、关键转折、恐怖元素的剧情灵感。`,character:`作为规则怪谈创作助手，请基于以下描述生成一个角色设定：
描述：${t}
请生成包含：姓名、身份、性格特点、隐藏秘密、与怪谈的关联的角色设定。`,rule:`作为规则怪谈创作助手，请基于以下场景生成一条诡异规则：
场景：${t}
请生成包含：规则内容、表面合理性、隐藏危险、违反后果的规则设定。`,scene:`作为规则怪谈创作助手，请基于以下描述生成一个场景设定：
描述：${t}
请生成包含：场景名称、环境描述、诡异氛围、潜在危险点的场景设定。`};return await o([{role:"system",content:"你是一位资深的规则怪谈创作者，擅长设计恐怖氛围和悬疑剧情。请用中文回答，输出格式为 JSON。"},{role:"user",content:e[n]||e.plot}])}async function p(n,t){const e={role:`请生成一个规则怪谈角色，要求：
描述：${t}
输出包含：name(姓名), identity(身份), description(描述), personality(性格), secret(秘密), dangerLevel(危险等级S/A/B/C)`,item:`请生成一个规则怪谈道具，要求：
描述：${t}
输出包含：name(名称), description(描述), effect(效果), dangerLevel(危险等级S/A/B/C)`,rule:`请生成一条规则怪谈规则，要求：
描述：${t}
输出包含：name(规则名), content(规则内容), violation(违反后果), dangerLevel(危险等级S/A/B/C)`,ability:`请生成一个诡异能力，要求：
描述：${t}
输出包含：name(能力名), description(描述), effect(效果), sideEffect(副作用), dangerLevel(危险等级S/A/B/C)`};return await o([{role:"system",content:"你是一位资深的规则怪谈创作者。请用中文回答，输出格式为 JSON。"},{role:"user",content:e[n]||e.role}])}async function h(n,t){const e=t.map(s=>`${s.name}(${s.type})`).join(", ");return await o([{role:"system",content:"你是一位文本分析专家，擅长从小说章节中识别和标注实体。请用中文回答，输出格式为 JSON。"},{role:"user",content:`请分析以下小说章节，识别其中的实体并标注：

章节内容：
${n.substring(0,2e3)}

已有实体列表：${e||"无"}

请输出：
1. detectedEntities: 检测到的实体数组，每个包含 name(名称), type(类型:role/item/rule/ability), positions(出现位置数组)
2. newEntities: 建议创建的新实体数组
3. relations: 实体间的关系数组`}])}async function $(n,t="smooth"){const e={smooth:"让文字更加流畅自然，保持原意",vivid:"增加描写细节，让场景更生动",tense:"增强紧张感和悬疑氛围",concise:"精简文字，去除冗余"};return await o([{role:"system",content:"你是一位资深编辑，擅长润色小说文本。请直接返回润色后的文本，保持原有格式。"},{role:"user",content:`请润色以下文本，要求：${e[t]||e.smooth}

原文：
${n}`}],.8)}async function d(n,t="consistent"){return await o([{role:"system",content:"你是一位小说续写专家，能够根据上下文风格续写故事。请保持原有风格和人物设定。"},{role:"user",content:`请根据以下内容续写（约300字）：

前文：
${n.substring(-500)}

请续写：`}],.8)}export{u as a,d as c,h as d,p as g,$ as p};
