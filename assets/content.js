// 填入真实链接后，页面按钮自动启用。Demo 的 video / poster 可用相对路径。
window.AURA_CONTENT = {
  resources: [
    {label:'Hugging Face · Aura2.0',url:'https://huggingface.co/aurateam/AURA_2'},
    {label:'Hugging Face · Aura2.0 BF8',url:'https://huggingface.co/aurateam/AURA_2_BF8'},
    {label:'GitHub',url:'https://github.com/aurateam2026/Aura2.0'},
    {label:'Technical Report · arXiv',url:'https://arxiv.org/pdf/2611.17048'}
  ],
  data: [
    {name:'主动服务',percent:35,color:'#557ba7',detail:'事件触发、长时等待、无需回应、任务取消与意图变化'},
    {name:'工具调用',percent:25,color:'#8ba5c5',detail:'工具选择、参数填充、执行结果、失败恢复与无需调用'},
    {name:'Grounding',percent:25,color:'#b7c8dd',detail:'对象指代、空间定位、遮挡重现与时序证据关联'},
    {name:'联合场景',percent:15,color:'#d5deeb',detail:'同一任务内联合标注触发时机、目标对象与行动'}
  ],
  demos: [
    {id:'gallery',title:'逛展',kind:'coupled',tags:['proactive','tool','grounding'],art:'gallery',color:'#e9e1d4',desc:'在展览中围绕作品展开互动。',steps:['观察展品，按需展开交流。','结合用户需求查询相关信息。','关联画面中的作品。'],video:'',poster:''},
    {id:'market',title:'逛超市',kind:'coupled',tags:['proactive','tool','grounding'],art:'market',color:'#dfe6d4',desc:'围绕货架和商品展开互动。',steps:['观察商品与货架。','结合用户需求查询或计算。','指向相关商品。'],video:'',poster:''},
    {id:'airport',title:'机场指导',kind:'coupled',tags:['proactive','tool','grounding'],art:'airport',color:'#dce5e5',desc:'结合现场指示牌与行程信息提供帮助。',steps:['观察现场标识。','按需查询行程信息。','定位相关指示。'],video:'',poster:''},
    {id:'train',title:'坐高铁',kind:'coupled',tags:['proactive','tool','grounding'],art:'airport',color:'#dce5e5',desc:'结合车站画面与行程信息。',steps:['观察车站指示。','按需查询行程。','指向相关标识。'],video:'',poster:''},
    {id:'coffee',title:'做咖啡',kind:'coupled',tags:['proactive','tool','grounding'],art:'coffee',color:'#d9e2d2',desc:'结合操作画面进行交流。',steps:['观察操作过程。','指向相关器具。','按需使用工具。'],video:'',poster:''},
    {id:'furniture',title:'装家具',kind:'coupled',tags:['proactive','tool','grounding'],art:'tool',color:'#e7e3db',desc:'围绕家具部件与组装过程交流。',steps:['观察当前部件。','关联说明与具体对象。','按需查询信息。'],video:'',poster:''},
    {id:'cooking',title:'做饭',kind:'coupled',tags:['proactive','tool','grounding'],art:'coffee',color:'#e6e2d7',desc:'观察食材和操作步骤。',steps:['观察当前食材与步骤。','指向相关物品。','按需换算或查询。'],video:'',poster:''},
    {id:'football',title:'球赛解说',kind:'coupled',tags:['proactive','grounding'],art:'target',color:'#dae5dc',desc:'围绕比赛画面进行实时交流。',steps:['观察球员与比赛进程。','关联相关画面对象。','在适当时机进行交流。'],video:'',poster:''}
  ]
};
