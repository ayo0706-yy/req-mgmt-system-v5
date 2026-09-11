/* ========== 全局数据 ========== */
var allData = { ir: [], sr: [], ar: [], baselines: [] };
var expandedRows = {};
var selectedItems = { ir: new Set(), sr: new Set() };
var currentDrawer = null; // 'ir' or 'sr'
var currentDetailId = null;
var currentLockType = null; // 'ir' or 'sr' for lock modal
var currentLockSelection = null; // 'demand' or 'demand-plan'
var currentBaselineType = null;
var currentBaselineSelection = null;
var isEditing = false;

/* ========== 下拉选项配置 ========== */
var dropdownOptions = {
    '状态': ['需求评审', '开发中', '已验收', '已发布'],
    '需求来源': ['技术规划', '客户需求', '产品规划', '合规要求'],
    '需求分类': ['迭代优化', '新增功能'],
    '价值主张': ['提升用户体验', '提升充电速度', '提升夜拍质量', '改善交互体验', '降低成本', '增加收入', '技术竞争力', '合规达标'],
    '需求等级': ['S', 'A', 'B', 'C'],
    '需求差异类型': ['无差异', '部分差异', '全量差异'],
    '事业部锁定': ['事业部A锁定', '事业部B锁定', '未锁定']
};
var multiSelectOptions = {
    '适用品牌': ['Infinix', 'TECNO'],
    '适用产品线': ['X系列', 'S系列', 'G系列', '折叠系列', '全系列'],
    '适用市场': ['东南亚', '中东', '非洲', '全球', '欧洲', '南亚', '拉美'],
    '适用版本': ['Full', 'Slim', 'Go']
};
var fieldLabelToProp = {
    '需求编码':'code','标题':'title','描述':'desc','状态':'status','需求来源':'source',
    '需求分类':'category','价值主张':'value','需求等级':'level','责任人':'owner','系统工程师':'se',
    '需求差异类型':'diffType','适用品牌':'brands','适用产品线':'productLine','适用市场':'markets',
    '适用版本':'versions','适配品类':'categories','事业部锁定':'bizLock',
    '预估工作量':'workload','开发工作量':'devWork','测试工作量':'testWork','设计工作量':'designWork','产品工作量':'productWork',
    '所属特性':'feature','标签':'tags','需求分析':'analysis','评审决策':'decision',
    '计划评审':'planReview','技术评审':'techReview','UED评审':'uedReview',
    '计划需求评审完成时间':'planReviewDate','实际需求评审完成时间':'actualReviewDate',
    '计划技术评审完成时间':'planTechReviewDate','实际技术评审完成时间':'actualTechReviewDate',
    '计划开发开始时间':'planDevStart','实际开发开始时间':'actualDevStart',
    '计划开发完成时间':'planDevEnd','实际开发完成时间':'actualDevEnd',
    '系统级需求':'sysLevel','优先级':'priority','开发代表':'devRep','UX代表':'uxRep',
    '测试代表':'testRep','处理人':'handler','归属领域':'domain','开发部门二级':'dept2',
    '开发部门三级':'dept3','开发责任人':'devOwner','责任田':'field','责任田主':'fieldOwner',
    '归属项目':'project','自检结果说明':'selfCheckResult','UI检视结果说明':'uiCheckResult',
    '测试结果说明':'testResult','计划验收完成时间':'planAcceptDate','实际验收完成时间':'actualAcceptDate',
    '验收结果':'acceptResult','验收结果说明':'acceptResultNote'
};
var arrayProps = ['brands','versions','categories'];

/* ========== 导航配置 ========== */
var navConfig = [
    { id:'dashboard', label:'工作台', icon:'&#127968;', pageId:'page-dashboard' },
    { id:'rr-list', label:'原始需求RR', icon:'&#128221;', pageId:'page-rr-list' },
    { id:'feature-tree', label:'特性树', icon:'&#127795;', expandable:true, children:[
        { id:'tree-full', label:'整机特性树', pageId:'page-tree-full' },
        { id:'tree-all', label:'全集特性树', pageId:'page-tree-all' },
        { id:'tree-tos', label:'tOS版本特性树', pageId:'page-tree-tos' }
    ]},
    { id:'phone-lib', label:'手机基本需求库', icon:'&#128241;', pageId:'page-phone-lib' },
    { id:'project-space', label:'项目空间', icon:'&#128193;', expandable:true, children:[
        { id:'ir-list', label:'初始需求IR', pageId:'page-ir-list' },
        { id:'sr-list', label:'系统需求SR', pageId:'page-sr-list' },
        { id:'ar-list', label:'分配需求AR', pageId:'page-ar-list' },
        { id:'version-mgmt', label:'版本管理', pageId:'page-version-mgmt' },
        { id:'baseline-mgmt', label:'基线管理', pageId:'page-baseline-mgmt' },
        { id:'test-mgmt', label:'测试管理', pageId:'page-test-mgmt' },
        { id:'change-mgmt', label:'变更管理', pageId:'page-change-mgmt' }
    ]},
    { id:'project-config', label:'项目配置', icon:'&#9881;', expandable:true, children:[
        { id:'config-basic', label:'基本信息', pageId:'page-config-basic' },
        { id:'config-app', label:'应用管理', pageId:'page-config-app' },
        { id:'config-team', label:'团队角色', pageId:'page-config-team' }
    ]}
];

/* ========== 初始化 ========== */
function initPage() {
    generateSampleData();
    renderSidebar();
    showPage('page-dashboard');
    renderTodoList();
    document.getElementById('stat-ir').textContent = allData.ir.length;
    document.getElementById('stat-sr').textContent = allData.sr.length;
    document.getElementById('stat-ar').textContent = allData.ar.length;
    renderBaselineList();
}

/* ========== 生成示例数据 ========== */
function generateSampleData() {
    allData.ir = [];
    allData.sr = [];
    allData.ar = [];

    // ---- 8条IR数据 ----
    var irData = [
        {
            id:'IR-001', code:'IR-2026-001', title:'AI夜景算法优化',
            source:'技术规划', category:'迭代优化', level:'S', domain:'影像',
            desc:'提升夜间拍照的AI降噪和色彩还原效果，通过深度学习算法优化暗光环境下的图像质量，降低噪点并提升细节保留。',
            status:'开发中', brands:['Infinix','TECNO'], versions:['Full','Slim'],
            diffType:'无差异', markets:'东南亚,中东,非洲', productLine:'X系列,S系列',
            owner:'张明', se:'李华', workload:120, devWork:60, testWork:40, designWork:10, productWork:10,
            feature:'影像-夜景优化', tags:'AI,影像,夜景',
            analysis:'需调研竞品夜拍方案，分析Google Night Sight、华为夜景模式等竞品的技术路径，确定差异化优化方向。重点关注暗光场景下的人脸保护和色彩还原准确性。',
            decision:'S级需求，优先排期。评审通过，纳入tOS17.1核心影像能力。',
            planReview:'通过', techReview:'通过', uedReview:'通过', bizLock:'事业部A锁定',
            createdDate:'2026-01-10', updatedDate:'2026-08-15',
            planReviewDate:'2026-01-25', actualReviewDate:'2026-01-24',
            planTechReviewDate:'2026-02-10', actualTechReviewDate:'2026-02-08',
            planDevStart:'2026-02-15', actualDevStart:'2026-02-14',
            planDevEnd:'2026-06-30', actualDevEnd:'',
            srIds:['SR-001','SR-002']
        },
        {
            id:'IR-002', code:'IR-2026-002', title:'超级闪充快充协议升级',
            source:'技术规划', category:'新增功能', level:'S', domain:'充电',
            desc:'支持最新的快充协议，提升充电功率至120W，兼容主流快充标准，优化充电安全策略和温控方案。',
            status:'需求评审', brands:['Infinix','TECNO'], versions:['Full'],
            diffType:'全量差异', markets:'全球', productLine:'X系列',
            owner:'刘洋', se:'王伟', workload:80, devWork:40, testWork:20, designWork:10, productWork:10,
            feature:'充电-快充升级', tags:'快充,电源管理,120W',
            analysis:'需评估硬件支持能力，确认充电IC和电池规格。对比小米120W、OPPO 100W快充方案的技术路线。',
            decision:'S级需求，待技术评审确认硬件方案后排期。',
            planReview:'通过', techReview:'待评审', uedReview:'通过', bizLock:'未锁定',
            createdDate:'2026-01-20', updatedDate:'2026-08-10',
            planReviewDate:'2026-02-05', actualReviewDate:'2026-02-04',
            planTechReviewDate:'2026-02-25', actualTechReviewDate:'',
            planDevStart:'2026-03-01', actualDevStart:'',
            planDevEnd:'2026-07-15', actualDevEnd:'',
            srIds:['SR-003']
        },
        {
            id:'IR-003', code:'IR-2026-003', title:'折叠屏铰链寿命优化',
            source:'客户需求', category:'迭代优化', level:'A', domain:'结构',
            desc:'提升折叠屏铰链使用寿命至30万次，优化铰链材料工艺和结构设计，增强长期可靠性。',
            status:'开发中', brands:['TECNO'], versions:['Full'],
            diffType:'部分差异', markets:'全球', productLine:'折叠系列',
            owner:'陈明', se:'李华', workload:200, devWork:120, testWork:40, designWork:20, productWork:20,
            feature:'结构-折叠优化', tags:'折叠屏,结构,铰链',
            analysis:'需联合供应链进行材料测试，对比三星Galaxy Z系列铰链寿命方案。重点优化铰链受力点和润滑材料。',
            decision:'A级需求，优先排期。材料验证已通过，进入结构设计阶段。',
            planReview:'通过', techReview:'通过', uedReview:'-', bizLock:'事业部B锁定',
            createdDate:'2026-01-15', updatedDate:'2026-09-01',
            planReviewDate:'2026-02-01', actualReviewDate:'2026-01-30',
            planTechReviewDate:'2026-02-20', actualTechReviewDate:'2026-02-18',
            planDevStart:'2026-03-01', actualDevStart:'2026-02-28',
            planDevEnd:'2026-09-30', actualDevEnd:'',
            srIds:['SR-004']
        },
        {
            id:'IR-004', code:'IR-2026-004', title:'AI语音助手多语言支持',
            source:'产品规划', category:'新增功能', level:'A', domain:'AI',
            desc:'支持阿拉伯语、斯瓦希里语等小语种语音交互，扩展AI语音助手的语言覆盖范围，适配中东和非洲市场需求。',
            status:'开发中', brands:['Infinix','TECNO'], versions:['Full','Slim','Go'],
            diffType:'部分差异', markets:'中东,非洲', productLine:'全系列',
            owner:'张明', se:'王伟', workload:150, devWork:80, testWork:30, designWork:20, productWork:20,
            feature:'AI-语音助手', tags:'AI,语音,多语言',
            analysis:'需调研小语种NLP模型可用性，评估端侧推理性能。重点关注阿拉伯语RTL文本处理和斯瓦希里语语音识别准确率。',
            decision:'A级需求，优先排期。NLP引擎适配方案已确认。',
            planReview:'通过', techReview:'通过', uedReview:'通过', bizLock:'未锁定',
            createdDate:'2026-02-01', updatedDate:'2026-08-20',
            planReviewDate:'2026-02-15', actualReviewDate:'2026-02-14',
            planTechReviewDate:'2026-03-01', actualTechReviewDate:'2026-02-28',
            planDevStart:'2026-03-10', actualDevStart:'2026-03-08',
            planDevEnd:'2026-08-31', actualDevEnd:'',
            srIds:['SR-005','SR-006']
        },
        {
            id:'IR-005', code:'IR-2026-005', title:'游戏空间性能模式优化',
            source:'客户需求', category:'迭代优化', level:'B', domain:'性能',
            desc:'优化游戏空间性能调度策略，提升游戏帧率稳定性，降低温升，改善长时间游戏体验。',
            status:'已验收', brands:['Infinix'], versions:['Full','Slim'],
            diffType:'无差异', markets:'东南亚', productLine:'G系列',
            owner:'赵磊', se:'李华', workload:60, devWork:30, testWork:15, designWork:5, productWork:10,
            feature:'性能-游戏优化', tags:'性能,游戏,帧率',
            analysis:'分析竞品游戏模式性能策略，优化CPU/GPU调度算法和温控阈值。',
            decision:'B级需求，已完成验收。性能提升15%，温升降低3度。',
            planReview:'通过', techReview:'通过', uedReview:'-', bizLock:'事业部A锁定',
            createdDate:'2026-01-05', updatedDate:'2026-07-20',
            planReviewDate:'2026-01-20', actualReviewDate:'2026-01-19',
            planTechReviewDate:'2026-02-05', actualTechReviewDate:'2026-02-03',
            planDevStart:'2026-02-10', actualDevStart:'2026-02-09',
            planDevEnd:'2026-06-30', actualDevEnd:'2026-06-25',
            srIds:['SR-007']
        },
        {
            id:'IR-006', code:'IR-2026-006', title:'隐私空间安全增强',
            source:'合规要求', category:'新增功能', level:'S', domain:'安全',
            desc:'增强隐私空间的数据加密和访问控制，支持应用隐藏、文件加密、生物识别二次验证等安全功能。',
            status:'开发中', brands:['Infinix','TECNO'], versions:['Full','Slim'],
            diffType:'全量差异', markets:'全球', productLine:'全系列',
            owner:'陈明', se:'王伟', workload:100, devWork:50, testWork:30, designWork:10, productWork:10,
            feature:'安全-隐私空间', tags:'安全,隐私,加密',
            analysis:'需符合GDPR和数据安全法规要求，设计端到端加密方案。评估TEE环境下的密钥管理方案。',
            decision:'S级需求，合规驱动，必须排期。安全评审通过。',
            planReview:'通过', techReview:'通过', uedReview:'通过', bizLock:'未锁定',
            createdDate:'2026-02-10', updatedDate:'2026-08-25',
            planReviewDate:'2026-02-25', actualReviewDate:'2026-02-24',
            planTechReviewDate:'2026-03-10', actualTechReviewDate:'2026-03-08',
            planDevStart:'2026-03-15', actualDevStart:'2026-03-14',
            planDevEnd:'2026-09-30', actualDevEnd:'',
            srIds:['SR-008','SR-009']
        },
        {
            id:'IR-007', code:'IR-2026-007', title:'相机多摄协同拍摄',
            source:'技术规划', category:'新增功能', level:'A', domain:'影像',
            desc:'支持多摄像头同时拍摄并融合图像，实现超广角+主摄+长焦的实时融合成像，提升拍照体验。',
            status:'需求评审', brands:['TECNO'], versions:['Full'],
            diffType:'部分差异', markets:'全球', productLine:'S系列',
            owner:'刘洋', se:'李华', workload:180, devWork:100, testWork:40, designWork:20, productWork:20,
            feature:'影像-多摄协同', tags:'影像,多摄,融合',
            analysis:'需评估ISP处理能力和多摄同步时延，设计图像融合算法。参考iPhone和华为多摄方案。',
            decision:'A级需求，待技术评审确认ISP方案。',
            planReview:'通过', techReview:'待评审', uedReview:'通过', bizLock:'事业部B锁定',
            createdDate:'2026-02-15', updatedDate:'2026-08-30',
            planReviewDate:'2026-03-01', actualReviewDate:'2026-02-28',
            planTechReviewDate:'2026-03-20', actualTechReviewDate:'',
            planDevStart:'2026-04-01', actualDevStart:'',
            planDevEnd:'2026-10-31', actualDevEnd:'',
            srIds:['SR-010']
        },
        {
            id:'IR-008', code:'IR-2026-008', title:'系统流畅度全面提升',
            source:'产品规划', category:'迭代优化', level:'B', domain:'系统',
            desc:'全面优化系统动画和响应速度，提升帧率稳定性，优化内存管理和后台进程调度。',
            status:'已规划', brands:['Infinix','TECNO'], versions:['Full','Slim','Go'],
            diffType:'无差异', markets:'全球', productLine:'全系列',
            owner:'赵磊', se:'王伟', workload:120, devWork:60, testWork:30, designWork:10, productWork:20,
            feature:'系统-流畅度', tags:'系统,流畅,优化',
            analysis:'需全面分析系统性能瓶颈，制定动画框架优化方案和内存管理策略。',
            decision:'B级需求，已规划，待排期确认。',
            planReview:'通过', techReview:'待评审', uedReview:'-', bizLock:'未锁定',
            createdDate:'2026-03-01', updatedDate:'2026-09-05',
            planReviewDate:'2026-03-15', actualReviewDate:'2026-03-14',
            planTechReviewDate:'2026-04-01', actualTechReviewDate:'',
            planDevStart:'', actualDevStart:'',
            planDevEnd:'', actualDevEnd:'',
            srIds:['SR-011','SR-012']
        }
    ];
    allData.ir = irData;

    // ---- 12条SR数据 ----
    var srData = [
        {
            id:'SR-001', parentId:'IR-001', code:'SR-2026-001-01', title:'AI降噪算法集成',
            desc:'将AI降噪算法集成到相机ISP管线中，实现实时降噪处理。',
            status:'开发中', source:'技术规划', category:'迭代优化', value:'提升夜拍质量',
            sysLevel:'系统级', priority:'P0', owner:'王强', devRep:'刘总监', uxRep:'陈静', testRep:'周涛', handler:'王强',
            workload:60, devWork:40, testWork:10, designWork:5, productWork:5,
            domain:'影像', dept2:'影像算法部', dept3:'算法开发组', devOwner:'王强',
            field:'影像算法', fieldOwner:'王强', project:'tOS17.1', tags:'AI,降噪,ISP',
            versions:['Full','Slim'], platform:'骁龙8Gen3', diffType:'无差异', brands:['Infinix','TECNO'],
            markets:'东南亚,中东,非洲', productLine:'X系列,S系列',
            selfCheckResult:'自检通过，降噪效果满足预期指标',
            uiCheckResult:'UI交互符合设计规范',
            testResult:'测试进行中，基础功能验证通过',
            acceptResult:'待验收', acceptResultNote:'',
            planAcceptDate:'2026-06-25', actualAcceptDate:'',
            arIds:['AR-001']
        },
        {
            id:'SR-002', parentId:'IR-001', code:'SR-2026-001-02', title:'夜拍UI交互优化',
            desc:'优化夜景模式UI交互，增加AI场景识别提示和拍摄建议。',
            status:'开发中', source:'技术规划', category:'迭代优化', value:'改善夜拍体验',
            sysLevel:'模块级', priority:'P1', owner:'陈静', devRep:'刘总监', uxRep:'陈静', testRep:'周涛', handler:'陈静',
            workload:40, devWork:20, testWork:10, designWork:5, productWork:5,
            domain:'影像', dept2:'UI设计部', dept3:'交互设计组', devOwner:'陈静',
            field:'UI交互', fieldOwner:'陈静', project:'tOS17.1', tags:'UI,夜拍,交互',
            versions:['Full','Slim'], platform:'通用', diffType:'无差异', brands:['Infinix','TECNO'],
            markets:'东南亚,中东,非洲', productLine:'X系列,S系列',
            selfCheckResult:'自检通过',
            uiCheckResult:'检视通过，交互流程确认',
            testResult:'测试通过',
            acceptResult:'待验收', acceptResultNote:'',
            planAcceptDate:'2026-06-25', actualAcceptDate:'',
            arIds:['AR-002']
        },
        {
            id:'SR-003', parentId:'IR-002', code:'SR-2026-002-01', title:'快充协议适配',
            desc:'适配最新120W快充协议，实现充电功率动态调节和安全保护。',
            status:'需求评审', source:'技术规划', category:'新增功能', value:'提升充电速度',
            sysLevel:'系统级', priority:'P0', owner:'赵强', devRep:'孙总监', uxRep:'陈静', testRep:'林芳', handler:'赵强',
            workload:80, devWork:40, testWork:20, designWork:10, productWork:10,
            domain:'充电', dept2:'电源管理部', dept3:'充电开发组', devOwner:'赵强',
            field:'电源管理', fieldOwner:'赵强', project:'tOS17.1', tags:'快充,120W,电源',
            versions:['Full'], platform:'骁龙8Gen3', diffType:'全量差异', brands:['Infinix','TECNO'],
            markets:'全球', productLine:'X系列',
            selfCheckResult:'待自检',
            uiCheckResult:'待检视',
            testResult:'待测试',
            acceptResult:'待验收', acceptResultNote:'',
            planAcceptDate:'2026-07-10', actualAcceptDate:'',
            arIds:['AR-003']
        },
        {
            id:'SR-004', parentId:'IR-003', code:'SR-2026-003-01', title:'铰链材料优化',
            desc:'优化折叠屏铰链材料和结构设计，提升使用寿命至30万次。',
            status:'开发中', source:'客户需求', category:'迭代优化', value:'提升产品可靠性',
            sysLevel:'系统级', priority:'P1', owner:'周伟', devRep:'吴总监', uxRep:'陈静', testRep:'周涛', handler:'周伟',
            workload:120, devWork:80, testWork:20, designWork:10, productWork:10,
            domain:'结构', dept2:'结构设计部', dept3:'铰链设计组', devOwner:'周伟',
            field:'结构设计', fieldOwner:'周伟', project:'tOS17.1', tags:'折叠,铰链,结构',
            versions:['Full'], platform:'折叠平台', diffType:'部分差异', brands:['TECNO'],
            markets:'全球', productLine:'折叠系列',
            selfCheckResult:'材料测试通过',
            uiCheckResult:'-',
            testResult:'可靠性测试进行中',
            acceptResult:'待验收', acceptResultNote:'',
            planAcceptDate:'2026-09-25', actualAcceptDate:'',
            arIds:['AR-004']
        },
        {
            id:'SR-005', parentId:'IR-004', code:'SR-2026-004-01', title:'多语言NLP引擎',
            desc:'开发支持阿拉伯语、斯瓦希里语等多语言NLP处理引擎。',
            status:'开发中', source:'产品规划', category:'新增功能', value:'扩展语音助手语言覆盖',
            sysLevel:'系统级', priority:'P0', owner:'黄浩', devRep:'郑总监', uxRep:'陈静', testRep:'林芳', handler:'黄浩',
            workload:80, devWork:50, testWork:15, designWork:5, productWork:10,
            domain:'AI', dept2:'AI算法部', dept3:'NLP开发组', devOwner:'黄浩',
            field:'AI算法', fieldOwner:'黄浩', project:'tOS17.1', tags:'AI,NLP,多语言',
            versions:['Full','Slim','Go'], platform:'通用', diffType:'部分差异', brands:['Infinix','TECNO'],
            markets:'中东,非洲', productLine:'全系列',
            selfCheckResult:'NLP模型推理准确率达标',
            uiCheckResult:'语音交互UI适配RTL布局',
            testResult:'多语言场景测试通过',
            acceptResult:'待验收', acceptResultNote:'',
            planAcceptDate:'2026-08-25', actualAcceptDate:'',
            arIds:['AR-005']
        },
        {
            id:'SR-006', parentId:'IR-004', code:'SR-2026-004-02', title:'语音识别模型适配',
            desc:'适配小语种语音识别模型，优化识别准确率和响应速度。',
            status:'开发中', source:'产品规划', category:'新增功能', value:'提升语音识别准确率',
            sysLevel:'模块级', priority:'P1', owner:'林芳', devRep:'郑总监', uxRep:'陈静', testRep:'林芳', handler:'林芳',
            workload:70, devWork:40, testWork:15, designWork:5, productWork:10,
            domain:'AI', dept2:'AI算法部', dept3:'语音开发组', devOwner:'林芳',
            field:'AI算法', fieldOwner:'黄浩', project:'tOS17.1', tags:'AI,语音,识别',
            versions:['Full','Slim','Go'], platform:'通用', diffType:'部分差异', brands:['Infinix','TECNO'],
            markets:'中东,非洲', productLine:'全系列',
            selfCheckResult:'识别准确率95%以上',
            uiCheckResult:'检视通过',
            testResult:'测试通过',
            acceptResult:'待验收', acceptResultNote:'',
            planAcceptDate:'2026-08-25', actualAcceptDate:'',
            arIds:['AR-006']
        },
        {
            id:'SR-007', parentId:'IR-005', code:'SR-2026-005-01', title:'游戏帧率优化',
            desc:'优化游戏空间帧率调度策略，提升帧率稳定性。',
            status:'已验收', source:'客户需求', category:'迭代优化', value:'提升游戏体验',
            sysLevel:'系统级', priority:'P2', owner:'孙杰', devRep:'吴总监', uxRep:'陈静', testRep:'周涛', handler:'孙杰',
            workload:40, devWork:20, testWork:10, designWork:0, productWork:10,
            domain:'性能', dept2:'性能优化部', dept3:'性能调优组', devOwner:'孙杰',
            field:'性能优化', fieldOwner:'孙杰', project:'tOS17.1', tags:'性能,游戏,帧率',
            versions:['Full','Slim'], platform:'通用', diffType:'无差异', brands:['Infinix'],
            markets:'东南亚', productLine:'G系列',
            selfCheckResult:'自检通过，帧率提升15%',
            uiCheckResult:'-',
            testResult:'测试通过，性能达标',
            acceptResult:'已验收', acceptResultNote:'验收通过，帧率稳定性达标，温升降低3度',
            planAcceptDate:'2026-06-20', actualAcceptDate:'2026-06-25',
            arIds:['AR-007']
        },
        {
            id:'SR-008', parentId:'IR-006', code:'SR-2026-006-01', title:'加密算法升级',
            desc:'升级隐私空间数据加密算法，支持AES-256端到端加密。',
            status:'开发中', source:'合规要求', category:'新增功能', value:'增强数据安全',
            sysLevel:'系统级', priority:'P0', owner:'周涛', devRep:'孙总监', uxRep:'陈静', testRep:'林芳', handler:'周涛',
            workload:50, devWork:30, testWork:15, designWork:0, productWork:5,
            domain:'安全', dept2:'安全开发部', dept3:'加密开发组', devOwner:'周涛',
            field:'安全加密', fieldOwner:'周涛', project:'tOS17.1', tags:'安全,加密,AES',
            versions:['Full','Slim'], platform:'通用', diffType:'全量差异', brands:['Infinix','TECNO'],
            markets:'全球', productLine:'全系列',
            selfCheckResult:'加密算法实现符合规范',
            uiCheckResult:'-',
            testResult:'安全测试通过',
            acceptResult:'待验收', acceptResultNote:'',
            planAcceptDate:'2026-09-25', actualAcceptDate:'',
            arIds:['AR-008','AR-009']
        },
        {
            id:'SR-009', parentId:'IR-006', code:'SR-2026-006-02', title:'权限管理优化',
            desc:'优化隐私空间权限管理，支持生物识别二次验证。',
            status:'开发中', source:'合规要求', category:'新增功能', value:'增强访问控制',
            sysLevel:'模块级', priority:'P1', owner:'陈静', devRep:'孙总监', uxRep:'陈静', testRep:'林芳', handler:'陈静',
            workload:40, devWork:20, testWork:10, designWork:5, productWork:5,
            domain:'安全', dept2:'安全开发部', dept3:'权限管理组', devOwner:'陈静',
            field:'安全权限', fieldOwner:'周涛', project:'tOS17.1', tags:'安全,权限,生物识别',
            versions:['Full','Slim'], platform:'通用', diffType:'全量差异', brands:['Infinix','TECNO'],
            markets:'全球', productLine:'全系列',
            selfCheckResult:'权限控制逻辑自检通过',
            uiCheckResult:'生物识别交互检视通过',
            testResult:'测试进行中',
            acceptResult:'待验收', acceptResultNote:'',
            planAcceptDate:'2026-09-25', actualAcceptDate:'',
            arIds:[]
        },
        {
            id:'SR-010', parentId:'IR-007', code:'SR-2026-007-01', title:'多摄融合算法',
            desc:'开发多摄像头同时拍摄并融合图像的算法。',
            status:'需求评审', source:'技术规划', category:'新增功能', value:'提升拍照体验',
            sysLevel:'系统级', priority:'P0', owner:'王强', devRep:'刘总监', uxRep:'陈静', testRep:'周涛', handler:'王强',
            workload:100, devWork:60, testWork:20, designWork:10, productWork:10,
            domain:'影像', dept2:'影像算法部', dept3:'融合算法组', devOwner:'王强',
            field:'影像算法', fieldOwner:'王强', project:'tOS17.1', tags:'影像,多摄,融合',
            versions:['Full'], platform:'骁龙8Gen3', diffType:'部分差异', brands:['TECNO'],
            markets:'全球', productLine:'S系列',
            selfCheckResult:'待自检',
            uiCheckResult:'待检视',
            testResult:'待测试',
            acceptResult:'待验收', acceptResultNote:'',
            planAcceptDate:'2026-10-25', actualAcceptDate:'',
            arIds:['AR-010']
        },
        {
            id:'SR-011', parentId:'IR-008', code:'SR-2026-008-01', title:'动画引擎优化',
            desc:'优化系统动画引擎，提升帧率和响应速度。',
            status:'已规划', source:'产品规划', category:'迭代优化', value:'提升系统流畅度',
            sysLevel:'系统级', priority:'P2', owner:'孙杰', devRep:'吴总监', uxRep:'陈静', testRep:'周涛', handler:'孙杰',
            workload:60, devWork:30, testWork:15, designWork:5, productWork:10,
            domain:'系统', dept2:'系统开发部', dept3:'动画引擎组', devOwner:'孙杰',
            field:'系统框架', fieldOwner:'孙杰', project:'tOS17.1', tags:'系统,动画,流畅',
            versions:['Full','Slim','Go'], platform:'通用', diffType:'无差异', brands:['Infinix','TECNO'],
            markets:'全球', productLine:'全系列',
            selfCheckResult:'待自检',
            uiCheckResult:'待检视',
            testResult:'待测试',
            acceptResult:'待验收', acceptResultNote:'',
            planAcceptDate:'', actualAcceptDate:'',
            arIds:['AR-011','AR-012']
        },
        {
            id:'SR-012', parentId:'IR-008', code:'SR-2026-008-02', title:'内存管理优化',
            desc:'优化系统内存管理和后台进程调度策略。',
            status:'已规划', source:'产品规划', category:'迭代优化', value:'降低内存占用',
            sysLevel:'系统级', priority:'P2', owner:'黄浩', devRep:'吴总监', uxRep:'陈静', testRep:'周涛', handler:'黄浩',
            workload:60, devWork:30, testWork:15, designWork:5, productWork:10,
            domain:'系统', dept2:'系统开发部', dept3:'内存管理组', devOwner:'黄浩',
            field:'系统框架', fieldOwner:'孙杰', project:'tOS17.1', tags:'系统,内存,优化',
            versions:['Full','Slim','Go'], platform:'通用', diffType:'无差异', brands:['Infinix','TECNO'],
            markets:'全球', productLine:'全系列',
            selfCheckResult:'待自检',
            uiCheckResult:'-',
            testResult:'待测试',
            acceptResult:'待验收', acceptResultNote:'',
            planAcceptDate:'', actualAcceptDate:'',
            arIds:['AR-013','AR-014']
        }
    ];
    allData.sr = srData;

    // ---- 14条AR数据 ----
    var arData = [
        { id:'AR-001', parentId:'SR-001', code:'AR-2026-001-01-01', title:'AI降噪模型训练与部署', domain:'影像', owner:'王强', handler:'李明', status:'开发中', dept:'影像算法部', field:'影像算法', versions:['Full','Slim'], platform:'骁龙8Gen3' },
        { id:'AR-002', parentId:'SR-002', code:'AR-2026-001-02-01', title:'夜拍模式UI组件开发', domain:'影像', owner:'陈静', handler:'赵芳', status:'开发中', dept:'UI设计部', field:'UI交互', versions:['Full','Slim'], platform:'通用' },
        { id:'AR-003', parentId:'SR-003', code:'AR-2026-002-01-01', title:'120W快充驱动开发', domain:'充电', owner:'赵强', handler:'钱伟', status:'需求评审', dept:'电源管理部', field:'电源管理', versions:['Full'], platform:'骁龙8Gen3' },
        { id:'AR-004', parentId:'SR-004', code:'AR-2026-003-01-01', title:'铰链结构仿真与验证', domain:'结构', owner:'周伟', handler:'吴刚', status:'开发中', dept:'结构设计部', field:'结构设计', versions:['Full'], platform:'折叠平台' },
        { id:'AR-005', parentId:'SR-005', code:'AR-2026-004-01-01', title:'阿拉伯语NLP模型集成', domain:'AI', owner:'黄浩', handler:'刘敏', status:'开发中', dept:'AI算法部', field:'AI算法', versions:['Full','Slim','Go'], platform:'通用' },
        { id:'AR-006', parentId:'SR-006', code:'AR-2026-004-02-01', title:'斯瓦希里语语音模型适配', domain:'AI', owner:'林芳', handler:'刘敏', status:'开发中', dept:'AI算法部', field:'AI算法', versions:['Full','Slim','Go'], platform:'通用' },
        { id:'AR-007', parentId:'SR-007', code:'AR-2026-005-01-01', title:'游戏帧率调度模块开发', domain:'性能', owner:'孙杰', handler:'赵芳', status:'已验收', dept:'性能优化部', field:'性能优化', versions:['Full','Slim'], platform:'通用' },
        { id:'AR-008', parentId:'SR-008', code:'AR-2026-006-01-01', title:'AES-256加密模块开发', domain:'安全', owner:'周涛', handler:'孙丽', status:'开发中', dept:'安全开发部', field:'安全加密', versions:['Full','Slim'], platform:'通用' },
        { id:'AR-009', parentId:'SR-008', code:'AR-2026-006-01-02', title:'TEE密钥管理模块开发', domain:'安全', owner:'周涛', handler:'孙丽', status:'开发中', dept:'安全开发部', field:'安全加密', versions:['Full','Slim'], platform:'通用' },
        { id:'AR-010', parentId:'SR-009', code:'AR-2026-006-02-01', title:'生物识别权限模块开发', domain:'安全', owner:'陈静', handler:'孙丽', status:'开发中', dept:'安全开发部', field:'安全权限', versions:['Full','Slim'], platform:'通用' },
        { id:'AR-011', parentId:'SR-010', code:'AR-2026-007-01-01', title:'多摄同步采集模块开发', domain:'影像', owner:'王强', handler:'李明', status:'需求评审', dept:'影像算法部', field:'影像算法', versions:['Full'], platform:'骁龙8Gen3' },
        { id:'AR-012', parentId:'SR-011', code:'AR-2026-008-01-01', title:'动画引擎渲染优化', domain:'系统', owner:'孙杰', handler:'赵芳', status:'已规划', dept:'系统开发部', field:'系统框架', versions:['Full','Slim','Go'], platform:'通用' },
        { id:'AR-013', parentId:'SR-011', code:'AR-2026-008-01-02', title:'动画插值算法优化', domain:'系统', owner:'孙杰', handler:'赵芳', status:'已规划', dept:'系统开发部', field:'系统框架', versions:['Full','Slim','Go'], platform:'通用' },
        { id:'AR-014', parentId:'SR-012', code:'AR-2026-008-02-01', title:'内存回收策略优化', domain:'系统', owner:'黄浩', handler:'赵芳', status:'已规划', dept:'系统开发部', field:'系统框架', versions:['Full','Slim','Go'], platform:'通用' }
    ];
    allData.ar = arData;

    // 为所有IR/SR添加lockType和categories字段
    allData.ir.forEach(function(ir) {
        if (!ir.lockType) ir.lockType = null;
        if (!ir.categories) ir.categories = ['手机','平板'];
    });
    allData.sr.forEach(function(sr) {
        if (!sr.lockType) sr.lockType = null;
        if (!sr.categories) sr.categories = ['手机','平板'];
    });
    allData.baselines = [];
}

/* ========== 渲染侧边栏 ========== */
function renderSidebar() {
    var nav = document.getElementById('sidebarNav');
    nav.innerHTML = '';
    var html = '';
    navConfig.forEach(function(item) {
        if (item.expandable) {
            html += '<div class="nav-item">';
            html += '<div class="nav-link" onclick="toggleNavGroup(this, \''+item.id+'\')">';
            html += '<span class="nav-icon">'+item.icon+'</span>';
            html += '<span>'+item.label+'</span>';
            html += '<span class="nav-arrow">&#9654;</span>';
            html += '</div>';
            html += '<div class="nav-children" id="nav-children-'+item.id+'">';
            item.children.forEach(function(child) {
                html += '<div class="nav-child-link" id="nav-'+child.id+'" onclick="selectNav(this,\''+child.pageId+'\')">'+child.label+'</div>';
            });
            html += '</div>';
            html += '</div>';
        } else {
            html += '<div class="nav-item">';
            html += '<div class="nav-link" id="nav-'+item.id+'" onclick="selectNav(this,\''+item.pageId+'\')">';
            html += '<span class="nav-icon">'+item.icon+'</span>';
            html += '<span>'+item.label+'</span>';
            html += '</div>';
            html += '</div>';
        }
    });
    nav.innerHTML = html;
}

function toggleNavGroup(el, groupId) {
    el.classList.toggle('expanded');
    var children = document.getElementById('nav-children-'+groupId);
    if (children) {
        children.classList.toggle('open');
    }
}

/* ========== 导航切换 ========== */
function selectNav(el, pageId) {
    // 清除所有active
    document.querySelectorAll('.nav-link.active, .nav-child-link.active').forEach(function(e) {
        e.classList.remove('active');
    });
    if (el) {
        el.classList.add('active');
    } else {
        // 通过id查找
        var links = document.querySelectorAll('.nav-link, .nav-child-link');
        links.forEach(function(link) {
            if (link.getAttribute('onclick') && link.getAttribute('onclick').indexOf(pageId) >= 0) {
                link.classList.add('active');
            }
        });
    }
    showPage(pageId);
    // 如果是IR/SR列表，渲染数据
    if (pageId === 'page-ir-list') {
        renderIRList();
    } else if (pageId === 'page-sr-list') {
        renderSRList();
    } else if (pageId === 'page-ar-list') {
        renderARList();
    } else if (pageId === 'page-baseline-mgmt') {
        renderBaselineList();
    }
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(function(p) {
        p.classList.remove('active');
    });
    var page = document.getElementById(pageId);
    if (page) {
        page.classList.add('active');
    }
}

/* ========== 渲染工作台待办 ========== */
function renderTodoList() {
    var todos = [
        { priority:'high', text:'IR-2026-002 超级闪充快充协议升级 - 待技术评审', time:'今天' },
        { priority:'high', text:'IR-2026-007 相机多摄协同拍摄 - 待技术评审', time:'今天' },
        { priority:'medium', text:'SR-2026-003-01 快充协议适配 - 需求评审中', time:'明天' },
        { priority:'medium', text:'SR-2026-007-01 多摄融合算法 - 需求评审中', time:'本周' },
        { priority:'low', text:'IR-2026-008 系统流畅度全面提升 - 待排期确认', time:'下周' }
    ];
    var html = '';
    todos.forEach(function(todo) {
        html += '<div class="todo-item">';
        html += '<input type="checkbox" class="todo-checkbox">';
        html += '<div class="todo-content">';
        html += '<span class="todo-priority '+todo.priority+'">'+(todo.priority==='high'?'紧急':todo.priority==='medium'?'重要':'一般')+'</span>';
        html += '<span>'+todo.text+'</span>';
        html += ' <span class="text-sm text-muted">('+todo.time+')</span>';
        html += '</div>';
        html += '</div>';
    });
    document.getElementById('todoList').innerHTML = html;
}

/* ========== HTML转义 ========== */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* ========== Badge生成 ========== */
function getLevelBadge(level) {
    return '<span class="badge badge-level-'+escapeHtml(level)+'">'+escapeHtml(level)+'</span>';
}
function getStatusBadge(status) {
    var cls = 'badge-status-pending';
    if (status === '开发中') cls = 'badge-status-dev';
    else if (status === '需求评审') cls = 'badge-status-review';
    else if (status === '已验收') cls = 'badge-status-accepted';
    else if (status === '已规划') cls = 'badge-status-planned';
    return '<span class="badge '+cls+'">'+escapeHtml(status)+'</span>';
}
function getDomainBadge(domain) {
    return '<span class="badge badge-domain">'+escapeHtml(domain)+'</span>';
}
function getVersionBadges(versions) {
    if (!versions || versions.length === 0) return '<span class="text-muted">-</span>';
    var html = '<div class="cell-badge-wrap">';
    versions.forEach(function(v) {
        html += '<span class="badge badge-version '+escapeHtml(v)+'">'+escapeHtml(v)+'</span>';
    });
    html += '</div>';
    return html;
}
function getPriorityBadge(p) {
    return '<span class="badge-priority badge-priority-'+escapeHtml(p)+'">'+escapeHtml(p)+'</span>';
}

/* ========== 停留时长 ========== */
function getStayDuration(item) {
    var now = new Date('2026-09-11');
    var refDate = item.actualDevStart || item.actualReviewDate || item.createdDate || item.planReviewDate;
    if (!refDate) return '-';
    var d = new Date(refDate);
    var diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diff < 0) diff = 0;
    if (diff === 0) return '今天';
    if (diff < 30) return diff + '天';
    var months = Math.floor(diff / 30);
    var days = diff % 30;
    if (days === 0) return months + '个月';
    return months + '个月' + days + '天';
}

/* ========== 渲染IR列表 ========== */
function renderIRList() {
    var table = document.getElementById('irTable');
    var html = '';
    // 表头
    html += '<thead><tr>';
    html += '<th class="col-cb"><input type="checkbox" onchange="toggleSelectAll(this,\'ir\')"></th>';
    html += '<th class="col-expand"></th>';
    html += '<th>标题</th>';
    html += '<th>需求编码</th>';
    html += '<th>适配版本</th>';
    html += '<th>适配品类</th>';
    html += '<th>需求来源</th>';
    html += '<th>需求等级</th>';
    html += '<th>归属领域</th>';
    html += '<th>状态</th>';
    html += '<th>停留时长</th>';
    html += '<th class="col-action">操作</th>';
    html += '</tr></thead>';
    html += '<tbody id="irTableBody">';
    allData.ir.forEach(function(ir) {
        var srs = allData.sr.filter(function(s) { return s.parentId === ir.id; });
        var hasChildren = srs.length > 0;
        var expanded = expandedRows['ir-'+ir.id];
        html += '<tr id="ir-row-'+ir.id+'">';
        html += '<td class="col-cb"><input type="checkbox" data-type="ir" data-id="'+ir.id+'" onchange="toggleItemSelect(this,\'ir\')"></td>';
        html += '<td class="col-expand">';
        if (hasChildren) {
            html += '<span class="expand-btn" onclick="toggleRow(\''+ir.id+'\')">'+(expanded?'&#9660;':'&#9654;')+'</span>';
        }
        html += '</td>';
        html += '<td>'+(ir.lockType?'<span class="lock-icon">&#128274;</span>':'')+'<span class="link-title" onclick="openIRDetail(\''+ir.id+'\')">'+escapeHtml(ir.title)+'</span>'+getLockHint(ir,'IR')+'</td>';
        html += '<td class="text-sm">'+escapeHtml(ir.code)+'</td>';
        html += '<td>'+getVersionBadges(ir.versions)+'</td>';
        html += '<td class="text-sm">'+(ir.categories ? escapeHtml(ir.categories.join(', ')) : '-')+'</td>';
        html += '<td class="text-sm">'+escapeHtml(ir.source)+'</td>';
        html += '<td>'+getLevelBadge(ir.level)+'</td>';
        html += '<td>'+getDomainBadge(ir.domain)+'</td>';
        html += '<td>'+getStatusBadge(ir.status)+'</td>';
        html += '<td class="text-sm">'+getStayDuration(ir)+'</td>';
        html += '<td class="col-action"><button class="toolbar-btn" style="padding:4px 8px;font-size:12px;" onclick="openIRDetail(\''+ir.id+'\')">详情</button></td>';
        html += '</tr>';
        // 子SR行
        srs.forEach(function(sr, srIdx) {
            var ars = allData.ar.filter(function(a) { return a.parentId === sr.id; });
            var srExpanded = expandedRows['sr-'+sr.id];
            html += '<tr class="child-row'+(expanded?' open':'')+'" id="sr-row-'+sr.id+'" style="'+(expanded?'':'display:none;')+'">';
            html += '<td class="col-cb"></td>';
            html += '<td class="col-expand">';
            if (ars.length > 0) {
                html += '<span class="expand-btn" onclick="toggleRow(\''+sr.id+'\')">'+(srExpanded?'&#9660;':'&#9654;')+'</span>';
            }
            html += '</td>';
            html += '<td class="indent-1 text-sm"><span style="color:#8b5cf6;">[SR]</span> '+(sr.lockType?'<span class="lock-icon">&#128274;</span>':'')+'<span class="link-title" onclick="openSRDetail(\''+sr.id+'\')">'+escapeHtml(sr.title)+'</span>'+getLockHint(sr,'SR')+'</td>';
            html += '<td class="text-sm">'+escapeHtml(sr.code)+'</td>';
            html += '<td>'+getVersionBadges(sr.versions)+'</td>';
            html += '<td class="text-sm">'+escapeHtml(sr.dept2)+'</td>';
            html += '<td class="text-sm">'+escapeHtml(sr.source)+'</td>';
            html += '<td>'+getPriorityBadge(sr.priority)+'</td>';
            html += '<td>'+getDomainBadge(sr.domain)+'</td>';
            html += '<td>'+getStatusBadge(sr.status)+'</td>';
            html += '<td class="text-sm">'+getStayDuration(sr)+'</td>';
            html += '<td class="col-action"><button class="toolbar-btn" style="padding:4px 8px;font-size:12px;" onclick="openSRDetail(\''+sr.id+'\')">详情</button></td>';
            html += '</tr>';
            // 子AR行
            ars.forEach(function(ar) {
                html += '<tr class="grandchild-row'+(expanded&&srExpanded?' open':'')+'" id="ar-row-'+ar.id+'" style="'+(expanded&&srExpanded?'':'display:none;')+'">';
                html += '<td class="col-cb"></td>';
                html += '<td class="col-expand"></td>';
                html += '<td class="indent-2 text-sm"><span style="color:#f59e0b;">[AR]</span> '+escapeHtml(ar.title)+'</td>';
                html += '<td class="text-sm">'+escapeHtml(ar.code)+'</td>';
                html += '<td>'+getVersionBadges(ar.versions)+'</td>';
                html += '<td class="text-sm">'+escapeHtml(ar.dept)+'</td>';
                html += '<td class="text-sm">-</td>';
                html += '<td>-</td>';
                html += '<td>'+getDomainBadge(ar.domain)+'</td>';
                html += '<td>'+getStatusBadge(ar.status)+'</td>';
                html += '<td class="text-sm">-</td>';
                html += '<td class="col-action">-</td>';
                html += '</tr>';
            });
        });
    });
    html += '</tbody>';
    table.innerHTML = html;
}

/* ========== 渲染SR列表 ========== */
function renderSRList() {
    var table = document.getElementById('srTable');
    var html = '';
    // 表头
    html += '<thead><tr>';
    html += '<th class="col-cb"><input type="checkbox" onchange="toggleSelectAll(this,\'sr\')"></th>';
    html += '<th class="col-expand"></th>';
    html += '<th>标题</th>';
    html += '<th>优先级</th>';
    html += '<th>开发部门(二级)</th>';
    html += '<th>责任人</th>';
    html += '<th>开发代表</th>';
    html += '<th>处理人</th>';
    html += '<th>状态</th>';
    html += '<th>停留时长</th>';
    html += '<th class="col-action">操作</th>';
    html += '</tr></thead>';
    html += '<tbody id="srTableBody">';
    allData.sr.forEach(function(sr) {
        var ars = allData.ar.filter(function(a) { return a.parentId === sr.id; });
        var hasChildren = ars.length > 0;
        var expanded = expandedRows['sr2-'+sr.id];
        html += '<tr id="sr2-row-'+sr.id+'">';
        html += '<td class="col-cb"><input type="checkbox" data-type="sr" data-id="'+sr.id+'" onchange="toggleItemSelect(this,\'sr\')"></td>';
        html += '<td class="col-expand">';
        if (hasChildren) {
            html += '<span class="expand-btn" onclick="toggleSRRow(\''+sr.id+'\')">'+(expanded?'&#9660;':'&#9654;')+'</span>';
        }
        html += '</td>';
        html += '<td>'+(sr.lockType?'<span class="lock-icon">&#128274;</span>':'')+'<span class="link-title" onclick="openSRDetail(\''+sr.id+'\')">'+escapeHtml(sr.title)+'</span>'+getLockHint(sr,'SR')+'</td>';
        html += '<td>'+getPriorityBadge(sr.priority)+'</td>';
        html += '<td class="text-sm">'+escapeHtml(sr.dept2)+'</td>';
        html += '<td class="text-sm">'+escapeHtml(sr.owner)+'</td>';
        html += '<td class="text-sm">'+escapeHtml(sr.devRep)+'</td>';
        html += '<td class="text-sm">'+escapeHtml(sr.handler)+'</td>';
        html += '<td>'+getStatusBadge(sr.status)+'</td>';
        html += '<td class="text-sm">'+getStayDuration(sr)+'</td>';
        html += '<td class="col-action"><button class="toolbar-btn" style="padding:4px 8px;font-size:12px;" onclick="openSRDetail(\''+sr.id+'\')">详情</button></td>';
        html += '</tr>';
        // 子AR行
        ars.forEach(function(ar) {
            html += '<tr class="child-row'+(expanded?' open':'')+'" id="sr2-ar-row-'+ar.id+'" style="'+(expanded?'':'display:none;')+'">';
            html += '<td class="col-cb"></td>';
            html += '<td class="col-expand"></td>';
            html += '<td class="indent-1 text-sm"><span style="color:#f59e0b;">[AR]</span> '+escapeHtml(ar.title)+'</td>';
            html += '<td>-</td>';
            html += '<td class="text-sm">'+escapeHtml(ar.dept)+'</td>';
            html += '<td class="text-sm">'+escapeHtml(ar.owner)+'</td>';
            html += '<td class="text-sm">-</td>';
            html += '<td class="text-sm">'+escapeHtml(ar.handler)+'</td>';
            html += '<td>'+getStatusBadge(ar.status)+'</td>';
            html += '<td class="text-sm">-</td>';
            html += '<td class="col-action">-</td>';
            html += '</tr>';
        });
    });
    html += '</tbody>';
    table.innerHTML = html;
}

/* ========== 渲染AR列表 ========== */
function renderARList() {
    var table = document.getElementById('arTable');
    var html = '';
    html += '<thead><tr>';
    html += '<th>标题</th>';
    html += '<th>需求编码</th>';
    html += '<th>归属领域</th>';
    html += '<th>责任人</th>';
    html += '<th>处理人</th>';
    html += '<th>状态</th>';
    html += '<th>部门</th>';
    html += '<th>责任田</th>';
    html += '<th>适配版本</th>';
    html += '<th>平台</th>';
    html += '</tr></thead>';
    html += '<tbody>';
    allData.ar.forEach(function(ar) {
        html += '<tr>';
        html += '<td class="text-sm">'+escapeHtml(ar.title)+'</td>';
        html += '<td class="text-sm">'+escapeHtml(ar.code)+'</td>';
        html += '<td>'+getDomainBadge(ar.domain)+'</td>';
        html += '<td class="text-sm">'+escapeHtml(ar.owner)+'</td>';
        html += '<td class="text-sm">'+escapeHtml(ar.handler)+'</td>';
        html += '<td>'+getStatusBadge(ar.status)+'</td>';
        html += '<td class="text-sm">'+escapeHtml(ar.dept)+'</td>';
        html += '<td class="text-sm">'+escapeHtml(ar.field)+'</td>';
        html += '<td>'+getVersionBadges(ar.versions)+'</td>';
        html += '<td class="text-sm">'+escapeHtml(ar.platform)+'</td>';
        html += '</tr>';
    });
    html += '</tbody>';
    table.innerHTML = html;
}

/* ========== 行展开/折叠 ========== */
function toggleRow(id) {
    if (id.indexOf('IR-') === 0) {
        var key = 'ir-'+id;
        expandedRows[key] = !expandedRows[key];
        renderIRList();
    } else {
        var key2 = 'sr-'+id;
        expandedRows[key2] = !expandedRows[key2];
        renderIRList();
    }
}

function toggleSRRow(id) {
    var key = 'sr2-'+id;
    expandedRows[key] = !expandedRows[key];
    renderSRList();
}

/* ========== 全选 ========== */
function toggleSelectAll(cb, type) {
    var checked = cb.checked;
    selectedItems[type] = new Set();
    document.querySelectorAll('input[type="checkbox"][data-type="'+type+'"]').forEach(function(c) {
        c.checked = checked;
        if (checked) {
            selectedItems[type].add(c.getAttribute('data-id'));
        }
    });
    updateBulkBar(type);
}

function toggleItemSelect(cb, type) {
    var id = cb.getAttribute('data-id');
    if (cb.checked) {
        selectedItems[type].add(id);
    } else {
        selectedItems[type].delete(id);
    }
    updateBulkBar(type);
}

function updateBulkBar(type) {
    var count = selectedItems[type].size;
    var bar = document.getElementById(type+'BulkBar');
    var countEl = document.getElementById(type+'SelectedCount');
    if (!bar) return;
    if (count > 0) {
        bar.classList.add('show');
        if (countEl) countEl.textContent = '已选 ' + count + ' 项';
    } else {
        bar.classList.remove('show');
    }
}

function bulkDelete(type) {
    alert('删除操作：已选中 ' + selectedItems[type].size + ' 条记录');
}
function bulkLock(type) {
    if (selectedItems[type].size === 0) { alert('请先选择需要锁定的需求'); return; }
    showLockModal(type);
}
function bulkBaseline(type) {
    if (selectedItems[type].size === 0) { alert('请先选择需要生成基线的需求'); return; }
    showBaselineModal(type);
}

function bulkUnlock(type) {
    if (selectedItems[type].size === 0) { alert('请先选择需要解锁的需求'); return; }
    var ids = Array.from(selectedItems[type]);
    var prefix = type === 'ir' ? 'IR' : 'SR';
    var unlockedCount = 0;
    ids.forEach(function(id) {
        var item = allData[type].find(function(d) { return d.id === id; });
        if (item && item.lockType) {
            item.lockType = null;
            unlockedCount++;
        }
    });
    if (unlockedCount === 0) {
        alert('选中的需求均未锁定，无需解锁');
        return;
    }
    selectedItems[type].clear();
    updateBulkBar(type);
    if (type === 'ir') renderIRList(); else renderSRList();
    if (currentDrawer === type && currentDetailId) {
        isEditing = false;
        var item = allData[type].find(function(d) { return d.id === currentDetailId; });
        if (item) {
            document.getElementById('drawerTitle').innerHTML = getDrawerTitleHTML(item, prefix);
            var activeTabEl = document.querySelector('.tab-l1.active');
            var tabId = activeTabEl ? activeTabEl.getAttribute('data-tab') : 'basic';
            if (type === 'ir') renderIRDrawerContent(item, tabId);
            else renderSRDrawerContent(item, tabId);
            updateEditBar();
        }
    }
    alert('已解锁 ' + unlockedCount + ' 条' + prefix + '需求');
}

/* ========== 搜索 ========== */
function handleSearch(val) {
    var keyword = val.trim().toLowerCase();
    if (!keyword) {
        // 重置显示
        if (document.getElementById('page-ir-list').classList.contains('active')) {
            renderIRList();
        } else if (document.getElementById('page-sr-list').classList.contains('active')) {
            renderSRList();
        }
        return;
    }
    // 过滤显示
    if (document.getElementById('page-ir-list').classList.contains('active')) {
        var tbody = document.getElementById('irTableBody');
        if (tbody) {
            tbody.querySelectorAll('tr').forEach(function(tr) {
                var text = tr.textContent.toLowerCase();
                tr.style.display = text.indexOf(keyword) >= 0 ? '' : 'none';
            });
        }
    } else if (document.getElementById('page-sr-list').classList.contains('active')) {
        var tbody2 = document.getElementById('srTableBody');
        if (tbody2) {
            tbody2.querySelectorAll('tr').forEach(function(tr) {
                var text = tr.textContent.toLowerCase();
                tr.style.display = text.indexOf(keyword) >= 0 ? '' : 'none';
            });
        }
    }
}

/* ========== 项目选择器 ========== */
function toggleProjectMenu() {
    alert('项目切换功能\n当前项目: tOS17.1\n可用项目: tOS16.5, tOS17.0, tOS17.1');
}

/* ========== IR详情抽屉 ========== */
function openIRDetail(id) {
    var ir = allData.ir.find(function(i) { return i.id === id; });
    if (!ir) return;
    isEditing = false;
    currentDrawer = 'ir';
    currentDetailId = id;
    document.getElementById('drawerTitle').innerHTML = getDrawerTitleHTML(ir, 'IR');
    renderIRDrawerTabs(ir);
    renderIRDrawerContent(ir, 'basic');
    updateEditBar();
    document.getElementById('drawerMask').classList.add('show');
    document.getElementById('drawer').classList.add('show');
}

function renderIRDrawerTabs(ir) {
    var l1 = document.getElementById('drawerTabsL1');
    l1.innerHTML = '';
    var tabs = [
        {id:'basic', label:'基本信息'},
        {id:'feature', label:'关联特性'},
        {id:'parent', label:'父需求'},
        {id:'child', label:'子需求'},
        {id:'depend', label:'依赖需求'},
        {id:'log', label:'操作日志'},
        {id:'comment', label:'评论'}
    ];
    tabs.forEach(function(t, i) {
        var tab = document.createElement('div');
        tab.className = 'tab-l1' + (i === 0 ? ' active' : '');
        tab.setAttribute('data-tab', t.id);
        tab.onclick = function() { switchL1Tab(t.id); };
        tab.textContent = t.label;
        l1.appendChild(tab);
    });
}

function renderIRDrawerContent(ir, l1Tab) {
    var body = document.getElementById('drawerBody');
    var l2bar = document.getElementById('drawerTabsL2');
    var html = '';

    if (l1Tab === 'basic') {
        // L2 tabs
        l2bar.style.display = 'flex';
        l2bar.innerHTML = '';
        var l2tabs = [
            {id:'detail', label:'需求详情'},
            {id:'schedule', label:'计划排期'}
        ];
        l2tabs.forEach(function(t, i) {
            var tab = document.createElement('div');
            tab.className = 'tab-l2' + (i === 0 ? ' active' : '');
            tab.setAttribute('data-tab', t.id);
            tab.onclick = function() { switchL2Tab(t.id); };
            tab.textContent = t.label;
            l2bar.appendChild(tab);
        });
        html += '<div class="tab-content active" id="l2-detail">';
        html += renderIRDetailSection(ir);
        html += '</div>';
        html += '<div class="tab-content" id="l2-schedule">';
        html += renderIRScheduleSection(ir);
        html += '</div>';
    } else if (l1Tab === 'feature') {
        l2bar.style.display = 'none';
        html += '<div class="detail-section">';
        html += '<div class="detail-section-title">关联特性</div>';
        html += '<div class="detail-grid">';
        html += '<div class="detail-field"><div class="detail-label">所属特性</div><div class="detail-value">'+escapeHtml(ir.feature)+'</div></div>';
        html += '<div class="detail-field"><div class="detail-label">特性路径</div><div class="detail-value">'+escapeHtml(ir.domain)+' / '+escapeHtml(ir.feature)+'</div></div>';
        html += '</div></div>';
    } else if (l1Tab === 'parent') {
        l2bar.style.display = 'none';
        html += '<div class="empty-state">当前IR为顶层需求，无父需求</div>';
    } else if (l1Tab === 'child') {
        l2bar.style.display = 'none';
        var srs = allData.sr.filter(function(s) { return s.parentId === ir.id; });
        if (srs.length === 0) {
            html += '<div class="empty-state">暂无子需求</div>';
        } else {
            html += '<div class="table-wrap"><table class="data-table"><thead><tr><th>编码</th><th>标题</th><th>优先级</th><th>状态</th></tr></thead><tbody>';
            srs.forEach(function(s) {
                html += '<tr><td class="text-sm">'+escapeHtml(s.code)+'</td><td><span class="link-title" onclick="closeDrawer();openSRDetail(\''+s.id+'\')">'+escapeHtml(s.title)+'</span></td><td>'+getPriorityBadge(s.priority)+'</td><td>'+getStatusBadge(s.status)+'</td></tr>';
            });
            html += '</tbody></table></div>';
        }
    } else if (l1Tab === 'depend') {
        l2bar.style.display = 'none';
        html += '<div class="empty-state">暂无依赖需求</div>';
    } else if (l1Tab === 'log') {
        l2bar.style.display = 'none';
        html += '<div class="detail-section">';
        html += '<div class="detail-section-title">操作日志</div>';
        var logs = [
            {time:'2026-09-11 10:30', text:'赵磊 更新了状态为 "开发中"'},
            {time:'2026-08-15 14:20', text:escapeHtml(ir.owner)+' 更新了需求描述'},
            {time:'2026-03-10 09:15', text:escapeHtml(ir.se)+' 完成技术评审'},
            {time:'2026-02-25 16:00', text:escapeHtml(ir.owner)+' 完成需求评审'},
            {time:'2026-01-10 11:00', text:escapeHtml(ir.owner)+' 创建了需求'}
        ];
        logs.forEach(function(l) {
            html += '<div class="log-item"><span class="log-time">'+l.time+'</span><span class="log-text">'+l.text+'</span></div>';
        });
        html += '</div>';
    } else if (l1Tab === 'comment') {
        l2bar.style.display = 'none';
        html += '<div class="detail-section">';
        html += '<div class="detail-section-title">评论</div>';
        var comments = [
            {author:'张明', time:'2026-08-15 10:00', text:'AI降噪算法已完成初步集成，需要联调测试。'},
            {author:'李华', time:'2026-08-10 15:30', text:'技术方案评审已通过，可以进入开发阶段。'},
            {author:'王强', time:'2026-02-20 09:00', text:'已开始AI模型训练，预计两周内完成。'}
        ];
        comments.forEach(function(c) {
            html += '<div class="comment-item">';
            html += '<div class="comment-header"><div class="comment-avatar">'+c.author.charAt(0)+'</div><span class="comment-author">'+c.author+'</span><span class="comment-time">'+c.time+'</span></div>';
            html += '<div class="comment-body">'+c.text+'</div>';
            html += '</div>';
        });
        html += '</div>';
    }
    body.innerHTML = html;
}

function renderIRDetailSection(ir) {
    var html = '';
    var editable = isDetailLocked(ir) ? false : (isEditing ? true : undefined);
    // 基础信息
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">基础信息</div>';
    html += '<div class="detail-grid">';
    html += field('所属父级', '无(顶层需求)', false, editable);
    html += field('需求编码', ir.code, false, editable);
    html += field('标题', ir.title, true, editable);
    html += textareaField('描述', ir.desc, true, editable);
    html += selectField('状态', ir.status, dropdownOptions['状态'], false, editable);
    html += selectField('需求来源', ir.source, dropdownOptions['需求来源'], false, editable);
    html += selectField('需求分类', ir.category, dropdownOptions['需求分类'], false, editable);
    html += selectField('价值主张', ir.value || '提升用户体验', dropdownOptions['价值主张'], false, editable);
    html += selectField('需求等级', ir.level, dropdownOptions['需求等级'], false, editable);
    html += field('责任人', ir.owner, false, editable);
    html += field('系统工程师', ir.se, false, editable);
    html += '</div></div>';
    // 适配策略
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">适配策略</div>';
    html += '<div class="detail-grid">';
    html += selectField('需求差异类型', ir.diffType, dropdownOptions['需求差异类型'], false, editable);
    html += multiSelectField('适用品牌', ir.brands, multiSelectOptions['适用品牌'], false, editable);
    html += multiSelectField('适用产品线', ir.productLine, multiSelectOptions['适用产品线'], false, editable);
    html += multiSelectField('适用市场', ir.markets, multiSelectOptions['适用市场'], false, editable);
    html += multiSelectField('适用版本', ir.versions, multiSelectOptions['适用版本'], false, editable);
    html += categoryField('适配品类', ir.categories, editable);
    html += selectField('事业部锁定', ir.bizLock, dropdownOptions['事业部锁定'], false, editable);
    html += '</div></div>';
    // 工作量评估
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">工作量评估</div>';
    html += '<div class="detail-grid three-col">';
    html += field('预估工作量', ir.workload + ' 人时', false, editable);
    html += field('开发工作量', ir.devWork + ' 人时', false, editable);
    html += field('测试工作量', ir.testWork + ' 人时', false, editable);
    html += field('设计工作量', ir.designWork + ' 人时', false, editable);
    html += field('产品工作量', ir.productWork + ' 人时', false, editable);
    html += '</div></div>';
    // 特征信息
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">特征信息</div>';
    html += '<div class="detail-grid">';
    html += field('所属特性', ir.feature, false, editable);
    html += field('标签', ir.tags, false, editable);
    html += '</div></div>';
    // 分析与决策
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">分析与决策</div>';
    html += '<div class="detail-grid">';
    html += textareaField('需求分析', ir.analysis, true, editable);
    html += textareaField('评审决策', ir.decision, true, editable);
    html += '</div></div>';
    // 计划排期评审
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">计划排期评审</div>';
    html += '<div class="detail-grid three-col">';
    html += field('计划评审', ir.planReview, false, editable);
    html += field('技术评审', ir.techReview, false, editable);
    html += field('UED评审', ir.uedReview, false, editable);
    html += '</div></div>';
    return html;
}

function renderIRScheduleSection(ir) {
    var html = '';
    var editable = isScheduleLocked(ir) ? false : (isEditing ? true : undefined);
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">计划排期</div>';
    html += '<div class="detail-grid">';
    html += dateField('计划需求评审完成时间', ir.planReviewDate, false, editable);
    html += dateField('实际需求评审完成时间', ir.actualReviewDate, false, editable);
    html += dateField('计划技术评审完成时间', ir.planTechReviewDate, false, editable);
    html += dateField('实际技术评审完成时间', ir.actualTechReviewDate, false, editable);
    html += dateField('计划开发开始时间', ir.planDevStart, false, editable);
    html += dateField('实际开发开始时间', ir.actualDevStart, false, editable);
    html += dateField('计划开发完成时间', ir.planDevEnd, false, editable);
    html += dateField('实际开发完成时间', ir.actualDevEnd, false, editable);
    html += '</div></div>';
    return html;
}

/* ========== SR详情抽屉 ========== */
function openSRDetail(id) {
    var sr = allData.sr.find(function(s) { return s.id === id; });
    if (!sr) return;
    isEditing = false;
    currentDrawer = 'sr';
    currentDetailId = id;
    document.getElementById('drawerTitle').innerHTML = getDrawerTitleHTML(sr, 'SR');
    renderSRDrawerTabs(sr);
    renderSRDrawerContent(sr, 'basic');
    updateEditBar();
    document.getElementById('drawerMask').classList.add('show');
    document.getElementById('drawer').classList.add('show');
}

function renderSRDrawerTabs(sr) {
    var l1 = document.getElementById('drawerTabsL1');
    l1.innerHTML = '';
    var tabs = [
        {id:'basic', label:'基本信息'},
        {id:'feature', label:'关联特性'},
        {id:'parent', label:'父需求'},
        {id:'child', label:'子需求'},
        {id:'depend', label:'依赖需求'},
        {id:'test', label:'测试管理'},
        {id:'log', label:'操作日志'},
        {id:'comment', label:'评论'}
    ];
    tabs.forEach(function(t, i) {
        var tab = document.createElement('div');
        tab.className = 'tab-l1' + (i === 0 ? ' active' : '');
        tab.setAttribute('data-tab', t.id);
        tab.onclick = function() { switchL1Tab(t.id); };
        tab.textContent = t.label;
        l1.appendChild(tab);
    });
}

function renderSRDrawerContent(sr, l1Tab) {
    var body = document.getElementById('drawerBody');
    var l2bar = document.getElementById('drawerTabsL2');
    var html = '';

    if (l1Tab === 'basic') {
        l2bar.style.display = 'flex';
        l2bar.innerHTML = '';
        var l2tabs = [
            {id:'detail', label:'需求详情'},
            {id:'schedule', label:'计划排期'},
            {id:'signoff', label:'会签管理'}
        ];
        l2tabs.forEach(function(t, i) {
            var tab = document.createElement('div');
            tab.className = 'tab-l2' + (i === 0 ? ' active' : '');
            tab.setAttribute('data-tab', t.id);
            tab.onclick = function() { switchL2Tab(t.id); };
            tab.textContent = t.label;
            l2bar.appendChild(tab);
        });
        html += '<div class="tab-content active" id="l2-detail">';
        html += renderSRDetailSection(sr);
        html += '</div>';
        html += '<div class="tab-content" id="l2-schedule">';
        html += renderSRScheduleSection(sr);
        html += '</div>';
        html += '<div class="tab-content" id="l2-signoff">';
        html += renderSRSignoffSection(sr);
        html += '</div>';
    } else if (l1Tab === 'feature') {
        l2bar.style.display = 'none';
        html += '<div class="detail-section">';
        html += '<div class="detail-section-title">关联特性</div>';
        html += '<div class="detail-grid">';
        html += field('所属特性', sr.field);
        html += field('标签', sr.tags);
        html += '</div></div>';
    } else if (l1Tab === 'parent') {
        l2bar.style.display = 'none';
        var parent = allData.ir.find(function(i) { return i.id === sr.parentId; });
        if (parent) {
            html += '<div class="detail-section">';
            html += '<div class="detail-section-title">父需求</div>';
            html += '<div class="detail-grid">';
            html += field('父需求编码', parent.code);
            html += '<div class="detail-field"><div class="detail-label">父需求标题</div><div class="detail-value"><span class="link-title" onclick="closeDrawer();openIRDetail(\''+parent.id+'\')">'+escapeHtml(parent.title)+'</span></div></div>';
            html += field('父需求状态', parent.status);
            html += field('父需求等级', parent.level);
            html += '</div></div>';
        } else {
            html += '<div class="empty-state">无父需求</div>';
        }
    } else if (l1Tab === 'child') {
        l2bar.style.display = 'none';
        var ars = allData.ar.filter(function(a) { return a.parentId === sr.id; });
        if (ars.length === 0) {
            html += '<div class="empty-state">暂无子需求(AR)</div>';
        } else {
            html += '<div class="table-wrap"><table class="data-table"><thead><tr><th>编码</th><th>标题</th><th>责任人</th><th>状态</th></tr></thead><tbody>';
            ars.forEach(function(a) {
                html += '<tr><td class="text-sm">'+escapeHtml(a.code)+'</td><td class="text-sm">'+escapeHtml(a.title)+'</td><td class="text-sm">'+escapeHtml(a.owner)+'</td><td>'+getStatusBadge(a.status)+'</td></tr>';
            });
            html += '</tbody></table></div>';
        }
    } else if (l1Tab === 'depend') {
        l2bar.style.display = 'none';
        html += '<div class="empty-state">暂无依赖需求</div>';
    } else if (l1Tab === 'test') {
        l2bar.style.display = 'none';
        html += '<div class="detail-section">';
        html += '<div class="detail-section-title">测试结果说明</div>';
        html += '<div class="detail-textarea">'+escapeHtml(sr.testResult)+'</div>';
        html += '</div>';
    } else if (l1Tab === 'log') {
        l2bar.style.display = 'none';
        html += '<div class="detail-section">';
        html += '<div class="detail-section-title">操作日志</div>';
        var logs = [
            {time:'2026-09-05 14:00', text:escapeHtml(sr.handler)+' 更新了开发进度'},
            {time:'2026-08-20 10:00', text:escapeHtml(sr.owner)+' 提交了自检结果'},
            {time:'2026-03-08 09:30', text:escapeHtml(sr.devRep)+' 完成技术评审'},
            {time:'2026-02-28 16:00', text:escapeHtml(sr.owner)+' 开始开发'},
            {time:'2026-02-14 11:00', text:escapeHtml(sr.owner)+' 创建了SR需求'}
        ];
        logs.forEach(function(l) {
            html += '<div class="log-item"><span class="log-time">'+l.time+'</span><span class="log-text">'+l.text+'</span></div>';
        });
        html += '</div>';
    } else if (l1Tab === 'comment') {
        l2bar.style.display = 'none';
        html += '<div class="detail-section">';
        html += '<div class="detail-section-title">评论</div>';
        var comments = [
            {author:sr.owner, time:'2026-08-20 10:00', text:'开发已完成，准备自检。'},
            {author:sr.testRep, time:'2026-08-15 14:00', text:'测试用例已编写完成，待自检后开始测试。'},
            {author:sr.devRep, time:'2026-03-01 09:00', text:'技术方案确认，可以开始开发。'}
        ];
        comments.forEach(function(c) {
            html += '<div class="comment-item">';
            html += '<div class="comment-header"><div class="comment-avatar">'+c.author.charAt(0)+'</div><span class="comment-author">'+c.author+'</span><span class="comment-time">'+c.time+'</span></div>';
            html += '<div class="comment-body">'+c.text+'</div>';
            html += '</div>';
        });
        html += '</div>';
    }
    body.innerHTML = html;
}

function renderSRDetailSection(sr) {
    var html = '';
    var editable = isDetailLocked(sr) ? false : (isEditing ? true : undefined);
    // 基础信息
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">基础信息</div>';
    html += '<div class="detail-grid">';
    var parent = allData.ir.find(function(i) { return i.id === sr.parentId; });
    html += field('所属父级', parent ? parent.title : '-', false, editable);
    html += field('需求编码', sr.code, false, editable);
    html += field('标题', sr.title, true, editable);
    html += textareaField('描述', sr.desc, true, editable);
    html += selectField('状态', sr.status, dropdownOptions['状态'], false, editable);
    html += selectField('需求来源', sr.source, dropdownOptions['需求来源'], false, editable);
    html += selectField('需求分类', sr.category, dropdownOptions['需求分类'], false, editable);
    html += selectField('价值主张', sr.value, dropdownOptions['价值主张'], false, editable);
    html += field('系统级需求', sr.sysLevel, false, editable);
    html += field('优先级', sr.priority, false, editable);
    html += field('责任人', sr.owner, false, editable);
    html += field('开发代表', sr.devRep, false, editable);
    html += field('UX代表', sr.uxRep, false, editable);
    html += field('测试代表', sr.testRep, false, editable);
    html += field('处理人', sr.handler, false, editable);
    html += field('预估工作量', sr.workload + ' 人时', false, editable);
    html += field('开发工作量', sr.devWork + ' 人时', false, editable);
    html += field('测试工作量', sr.testWork + ' 人时', false, editable);
    html += field('设计工作量', sr.designWork + ' 人时', false, editable);
    html += field('产品工作量', sr.productWork + ' 人时', false, editable);
    html += field('归属领域', sr.domain, false, editable);
    html += field('开发部门二级', sr.dept2, false, editable);
    html += field('开发部门三级', sr.dept3, false, editable);
    html += field('开发责任人', sr.devOwner, false, editable);
    html += field('责任田', sr.field, false, editable);
    html += field('责任田主', sr.fieldOwner, false, editable);
    html += field('归属项目', sr.project, false, editable);
    html += field('标签', sr.tags, false, editable);
    html += '</div></div>';
    // 适配策略
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">适配策略</div>';
    html += '<div class="detail-grid">';
    html += selectField('需求差异类型', sr.diffType, dropdownOptions['需求差异类型'], false, editable);
    html += multiSelectField('适用品牌', sr.brands, multiSelectOptions['适用品牌'], false, editable);
    html += multiSelectField('适用产品线', sr.productLine, multiSelectOptions['适用产品线'], false, editable);
    html += multiSelectField('适用市场', sr.markets, multiSelectOptions['适用市场'], false, editable);
    html += multiSelectField('适用版本', sr.versions, multiSelectOptions['适用版本'], false, editable);
    html += categoryField('适配品类', sr.categories, editable);
    html += '</div></div>';
    // 需求开发
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">需求开发</div>';
    html += '<div class="detail-grid">';
    html += field('开发责任人', sr.devOwner, false, editable);
    html += textareaField('自检结果说明', sr.selfCheckResult, true, editable);
    html += '</div></div>';
    // UI检视
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">UI检视</div>';
    html += '<div class="detail-grid">';
    html += textareaField('UI检视结果说明', sr.uiCheckResult, true, editable);
    html += '</div></div>';
    // 需求测试
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">需求测试</div>';
    html += '<div class="detail-grid">';
    html += textareaField('测试结果说明', sr.testResult, true, editable);
    html += '</div></div>';
    // 需求验收
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">需求验收</div>';
    html += '<div class="detail-grid">';
    html += dateField('计划验收完成时间', sr.planAcceptDate, false, editable);
    html += dateField('实际验收完成时间', sr.actualAcceptDate, false, editable);
    html += field('验收结果', sr.acceptResult, false, editable);
    html += textareaField('验收结果说明', sr.acceptResultNote || '暂无说明', true, editable);
    html += '</div></div>';
    return html;
}

function renderSRScheduleSection(sr) {
    var html = '';
    var editable = isScheduleLocked(sr) ? false : (isEditing ? true : undefined);
    var parent = allData.ir.find(function(i) { return i.id === sr.parentId; });
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">计划排期</div>';
    html += '<div class="detail-grid">';
    if (parent) {
        html += dateField('计划需求评审完成时间', parent.planReviewDate, false, undefined);
        html += dateField('实际需求评审完成时间', parent.actualReviewDate, false, undefined);
        html += dateField('计划技术评审完成时间', parent.planTechReviewDate, false, undefined);
        html += dateField('实际技术评审完成时间', parent.actualTechReviewDate, false, undefined);
        html += dateField('计划开发开始时间', parent.planDevStart, false, undefined);
        html += dateField('实际开发开始时间', parent.actualDevStart, false, undefined);
        html += dateField('计划开发完成时间', parent.planDevEnd, false, undefined);
        html += dateField('实际开发完成时间', parent.actualDevEnd, false, undefined);
    }
    html += dateField('计划验收完成时间', sr.planAcceptDate, false, editable);
    html += dateField('实际验收完成时间', sr.actualAcceptDate, false, editable);
    html += '</div></div>';
    return html;
}

function renderSRSignoffSection(sr) {
    var html = '';
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">会签管理</div>';
    html += '<div class="detail-grid">';
    html += field('会签状态', sr.status === '已验收' ? '已完成' : '待会签');
    html += field('开发代表会签', sr.status === '已验收' ? '已签' : '待签');
    html += field('UX代表会签', sr.status === '已验收' ? '已签' : '待签');
    html += field('测试代表会签', sr.status === '已验收' ? '已签' : '待签');
    html += '</div></div>';
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">会签记录</div>';
    if (sr.status === '已验收') {
        html += '<div class="log-item"><span class="log-time">'+sr.actualAcceptDate+'</span><span class="log-text">'+escapeHtml(sr.testRep)+' 测试代表完成会签</span></div>';
        html += '<div class="log-item"><span class="log-time">'+sr.actualAcceptDate+'</span><span class="log-text">'+escapeHtml(sr.uxRep)+' UX代表完成会签</span></div>';
        html += '<div class="log-item"><span class="log-time">'+sr.actualAcceptDate+'</span><span class="log-text">'+escapeHtml(sr.devRep)+' 开发代表完成会签</span></div>';
    } else {
        html += '<div class="empty-state">暂无会签记录</div>';
    }
    html += '</div>';
    return html;
}

/* ========== Tab切换 ========== */
function switchL1Tab(tab) {
    document.querySelectorAll('.tab-l1').forEach(function(t) {
        t.classList.remove('active');
    });
    var tabEl = document.querySelector('.tab-l1[data-tab="'+tab+'"]');
    if (tabEl) tabEl.classList.add('active');

    if (currentDrawer === 'ir') {
        var ir = allData.ir.find(function(i) { return i.id === currentDetailId; });
        if (ir) renderIRDrawerContent(ir, tab);
    } else if (currentDrawer === 'sr') {
        var sr = allData.sr.find(function(s) { return s.id === currentDetailId; });
        if (sr) renderSRDrawerContent(sr, tab);
    }
    updateEditBar();
}

function switchL2Tab(tab) {
    document.querySelectorAll('.tab-l2').forEach(function(t) {
        t.classList.remove('active');
    });
    var tabEl = document.querySelector('.tab-l2[data-tab="'+tab+'"]');
    if (tabEl) tabEl.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(function(c) {
        c.classList.remove('active');
    });
    var content = document.getElementById('l2-'+tab);
    if (content) content.classList.add('active');
}

/* ========== 关闭抽屉 ========== */
function closeDrawer() {
    isEditing = false;
    document.getElementById('drawerMask').classList.remove('show');
    document.getElementById('drawer').classList.remove('show');
    var bar = document.getElementById('drawerEditBar');
    if (bar) bar.style.display = 'none';
    currentDrawer = null;
    currentDetailId = null;
}

/* ========== 编辑模式 ========== */
function updateEditBar() {
    var bar = document.getElementById('drawerEditBar');
    if (!bar) return;
    var type = currentDrawer;
    if (!type || !currentDetailId) { bar.style.display = 'none'; return; }
    var item = allData[type].find(function(d) { return d.id === currentDetailId; });
    if (!item) { bar.style.display = 'none'; return; }
    if (item.lockType === 'demand-plan') { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    if (isEditing) {
        bar.innerHTML = '<button class="toolbar-btn primary" onclick="saveDetail()">保存</button><button class="toolbar-btn" onclick="cancelEdit()">取消</button>';
    } else {
        bar.innerHTML = '<button class="toolbar-btn primary" onclick="editDetail()">编辑</button>';
    }
}

function editDetail() {
    isEditing = true;
    updateEditBar();
    var type = currentDrawer;
    var item = allData[type].find(function(d) { return d.id === currentDetailId; });
    if (!item) return;
    var activeTabEl = document.querySelector('.tab-l1.active');
    var tabId = activeTabEl ? activeTabEl.getAttribute('data-tab') : 'basic';
    if (type === 'ir') renderIRDrawerContent(item, tabId);
    else renderSRDrawerContent(item, tabId);
}

function cancelEdit() {
    isEditing = false;
    updateEditBar();
    var type = currentDrawer;
    var item = allData[type].find(function(d) { return d.id === currentDetailId; });
    if (!item) return;
    var activeTabEl = document.querySelector('.tab-l1.active');
    var tabId = activeTabEl ? activeTabEl.getAttribute('data-tab') : 'basic';
    if (type === 'ir') renderIRDrawerContent(item, tabId);
    else renderSRDrawerContent(item, tabId);
}

function saveDetail() {
    var type = currentDrawer;
    if (!type || !currentDetailId) return;
    var item = allData[type].find(function(d) { return d.id === currentDetailId; });
    if (!item) return;
    var body = document.getElementById('drawerBody');
    var elements = body.querySelectorAll('[data-field]');
    var multiFields = {};
    elements.forEach(function(el) {
        var label = el.getAttribute('data-field');
        var prop = fieldLabelToProp[label];
        if (!prop) return;
        if (el.tagName === 'INPUT' && el.type === 'checkbox') {
            if (!multiFields[label]) multiFields[label] = [];
            if (el.checked) multiFields[label].push(el.value);
        } else {
            var val = el.value;
            if (prop === 'workload' || prop === 'devWork' || prop === 'testWork' || prop === 'designWork' || prop === 'productWork') {
                val = parseInt(val) || 0;
            }
            item[prop] = val;
        }
    });
    for (var label in multiFields) {
        var prop = fieldLabelToProp[label];
        if (!prop) continue;
        var selected = multiFields[label];
        if (arrayProps.indexOf(prop) >= 0) {
            item[prop] = selected;
        } else {
            item[prop] = selected.join(',');
        }
    }
    isEditing = false;
    updateEditBar();
    var activeTabEl = document.querySelector('.tab-l1.active');
    var tabId = activeTabEl ? activeTabEl.getAttribute('data-tab') : 'basic';
    if (type === 'ir') renderIRDrawerContent(item, tabId);
    else renderSRDrawerContent(item, tabId);
    if (type === 'ir') renderIRList(); else renderSRList();
    var prefix = type === 'ir' ? 'IR' : 'SR';
    document.getElementById('drawerTitle').innerHTML = getDrawerTitleHTML(item, prefix);
    alert('保存成功');
}

/* ========== 辅助：生成字段HTML ========== */
function field(label, value, isFull, editable) {
    var cls = isFull ? 'detail-field detail-full' : 'detail-field';
    var valStr = (value === null || value === undefined || value === '') ? '' : String(value);
    if (editable === true) {
        return '<div class="'+cls+'"><div class="detail-label">'+escapeHtml(label)+'</div><div class="detail-value"><input class="edit-input" data-field="'+escapeHtml(label)+'" value="'+escapeHtml(valStr)+'"></div></div>';
    }
    var displayCls = (editable === false) ? 'detail-value locked' : 'detail-value';
    return '<div class="'+cls+'"><div class="detail-label">'+escapeHtml(label)+'</div><div class="'+displayCls+'">'+escapeHtml(valStr || '-')+'</div></div>';
}

function textareaField(label, value, isFull, editable) {
    var cls = isFull ? 'detail-field detail-full' : 'detail-field';
    var valStr = (value === null || value === undefined) ? '' : String(value);
    if (editable === true) {
        return '<div class="'+cls+'"><div class="detail-label">'+escapeHtml(label)+'</div><div class="detail-value"><textarea class="edit-textarea" data-field="'+escapeHtml(label)+'">'+escapeHtml(valStr)+'</textarea></div></div>';
    }
    var displayCls = (editable === false) ? 'detail-textarea locked' : 'detail-textarea';
    return '<div class="'+cls+'"><div class="detail-label">'+escapeHtml(label)+'</div><div class="'+displayCls+'">'+escapeHtml(valStr || '-')+'</div></div>';
}

function categoryField(label, categories, editable) {
    var options = ['手机','平板'];
    var cats = categories || [];
    var html = '<div class="detail-field"><div class="detail-label">'+escapeHtml(label)+'</div>';
    if (editable === true) {
        html += '<div class="detail-value"><div class="category-checkbox-group">';
        options.forEach(function(opt) {
            var checked = cats.indexOf(opt) >= 0 ? 'checked' : '';
            html += '<div class="category-checkbox-item"><input type="checkbox" data-field="'+escapeHtml(label)+'" value="'+escapeHtml(opt)+'" '+checked+'> <label>'+escapeHtml(opt)+'</label></div>';
        });
        html += '</div></div>';
    } else {
        var displayCls = (editable === false) ? 'detail-value locked' : 'detail-value';
        html += '<div class="'+displayCls+'">'+escapeHtml(cats.length > 0 ? cats.join(', ') : '-')+'</div>';
    }
    html += '</div>';
    return html;
}

function selectField(label, value, options, isFull, editable) {
    var cls = isFull ? 'detail-field detail-full' : 'detail-field';
    var valStr = (value === null || value === undefined || value === '') ? '' : String(value);
    if (editable === true) {
        var html = '<div class="'+cls+'"><div class="detail-label">'+escapeHtml(label)+'</div><div class="detail-value"><select class="edit-select" data-field="'+escapeHtml(label)+'">';
        html += '<option value="">请选择</option>';
        options.forEach(function(opt) {
            var selected = (opt === valStr) ? 'selected' : '';
            html += '<option value="'+escapeHtml(opt)+'" '+selected+'>'+escapeHtml(opt)+'</option>';
        });
        html += '</select></div></div>';
        return html;
    }
    var displayCls = (editable === false) ? 'detail-value locked' : 'detail-value';
    return '<div class="'+cls+'"><div class="detail-label">'+escapeHtml(label)+'</div><div class="'+displayCls+'">'+escapeHtml(valStr || '-')+'</div></div>';
}

function multiSelectField(label, values, options, isFull, editable) {
    var cls = isFull ? 'detail-field detail-full' : 'detail-field';
    var valArr = [];
    if (Array.isArray(values)) {
        valArr = values;
    } else if (values) {
        valArr = String(values).split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s; });
    }
    if (editable === true) {
        var html = '<div class="'+cls+'"><div class="detail-label">'+escapeHtml(label)+'</div><div class="detail-value"><div class="category-checkbox-group">';
        options.forEach(function(opt) {
            var checked = valArr.indexOf(opt) >= 0 ? 'checked' : '';
            html += '<div class="category-checkbox-item"><input type="checkbox" data-field="'+escapeHtml(label)+'" value="'+escapeHtml(opt)+'" '+checked+'> <label>'+escapeHtml(opt)+'</label></div>';
        });
        html += '</div></div></div>';
        return html;
    }
    var displayCls = (editable === false) ? 'detail-value locked' : 'detail-value';
    var displayStr = valArr.length > 0 ? valArr.join(', ') : '-';
    return '<div class="'+cls+'"><div class="detail-label">'+escapeHtml(label)+'</div><div class="'+displayCls+'">'+escapeHtml(displayStr)+'</div></div>';
}

function dateField(label, value, isFull, editable) {
    var cls = isFull ? 'detail-field detail-full' : 'detail-field';
    var valStr = (value === null || value === undefined || value === '') ? '' : String(value);
    if (editable === true) {
        return '<div class="'+cls+'"><div class="detail-label">'+escapeHtml(label)+'</div><div class="detail-value"><input type="date" class="edit-input" data-field="'+escapeHtml(label)+'" value="'+escapeHtml(valStr)+'"></div></div>';
    }
    var displayCls = (editable === false) ? 'detail-value locked' : 'detail-value';
    return '<div class="'+cls+'"><div class="detail-label">'+escapeHtml(label)+'</div><div class="'+displayCls+'">'+escapeHtml(valStr || '-')+'</div></div>';
}

function isDetailLocked(item) {
    return item.lockType === 'demand' || item.lockType === 'demand-plan';
}
function isScheduleLocked(item) {
    return item.lockType === 'demand-plan';
}

function getLockHint(item, typePrefix) {
    if (!item.lockType) return '';
    var hint = '';
    if (item.lockType === 'demand') {
        hint = typePrefix + '需求锁定';
    } else if (item.lockType === 'demand-plan') {
        hint = typePrefix + '需求&计划锁定';
    }
    return '<span class="lock-hint">'+escapeHtml(hint)+'</span>';
}

function getDrawerTitleHTML(item, typePrefix) {
    var lockIcon = item.lockType ? '<span class="lock-icon">&#128274;</span>' : '';
    var hint = getLockHint(item, typePrefix);
    return lockIcon + escapeHtml(item.title) + ' (' + escapeHtml(item.code) + ')' + hint;
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

/* ========== 锁定弹窗 ========== */
function showLockModal(type) {
    currentLockType = type;
    currentLockSelection = null;
    var prefix = type === 'ir' ? 'IR' : 'SR';
    document.getElementById('lockModalTitle').textContent = '选择锁定类型';
    var body = document.getElementById('lockModalBody');
    body.innerHTML = '';
    var html = '<div class="lock-option-group">';
    html += '<div class="lock-option" onclick="selectLockOption(this, \'demand\')">';
    html += '<input type="radio" name="lockType" value="demand">';
    html += '<span class="lock-option-label">'+prefix+'需求锁定</span>';
    html += '<div style="font-size:12px;color:#64748b;margin-left:24px;">需求详情只读，计划排期可编辑</div>';
    html += '</div>';
    html += '<div class="lock-option" onclick="selectLockOption(this, \'demand-plan\')">';
    html += '<input type="radio" name="lockType" value="demand-plan">';
    html += '<span class="lock-option-label">'+prefix+'需求&计划锁定</span>';
    html += '<div style="font-size:12px;color:#64748b;margin-left:24px;">需求详情和计划排期均只读</div>';
    html += '</div>';
    html += '</div>';
    body.innerHTML = html;
    document.getElementById('lockModal').classList.add('show');
}

function selectLockOption(el, lockType) {
    document.querySelectorAll('#lockModalBody .lock-option').forEach(function(o) { o.classList.remove('selected'); });
    el.classList.add('selected');
    el.querySelector('input').checked = true;
    currentLockSelection = lockType;
}

function confirmLock() {
    if (!currentLockSelection) { alert('请选择锁定类型'); return; }
    var type = currentLockType;
    var ids = Array.from(selectedItems[type]);
    var prefix = type === 'ir' ? 'IR' : 'SR';
    ids.forEach(function(id) {
        var item = allData[type].find(function(d) { return d.id === id; });
        if (item) {
            item.lockType = currentLockSelection;
        }
    });
    closeModal('lockModal');
    alert('已锁定 ' + ids.length + ' 条' + prefix + '需求');
    selectedItems[type].clear();
    updateBulkBar(type);
    if (type === 'ir') renderIRList(); else renderSRList();
    if (currentDrawer === type && currentDetailId) {
        isEditing = false;
        var item = allData[type].find(function(d) { return d.id === currentDetailId; });
        if (item) {
            document.getElementById('drawerTitle').innerHTML = getDrawerTitleHTML(item, prefix);
            var activeTabEl = document.querySelector('.tab-l1.active');
            var tabId = activeTabEl ? activeTabEl.getAttribute('data-tab') : 'basic';
            if (type === 'ir') renderIRDrawerContent(item, tabId);
            else renderSRDrawerContent(item, tabId);
            updateEditBar();
        }
    }
}

/* ========== 基线弹窗 ========== */
function showBaselineModal(type) {
    currentBaselineType = type;
    currentBaselineSelection = null;
    var body = document.getElementById('baselineModalBody');
    var html = '';
    html += '<div class="lock-option-group">';
    html += '<div class="lock-option" onclick="selectBaselineOption(this, \'ir-demand\')">';
    html += '<input type="radio" name="baselineType" value="ir-demand">';
    html += '<span class="lock-option-label">IR需求锁定</span>';
    html += '<div style="font-size:12px;color:#64748b;margin-left:24px;">校验：选中的需求只能是IR</div>';
    html += '</div>';
    html += '<div class="lock-option" onclick="selectBaselineOption(this, \'sr-demand\')">';
    html += '<input type="radio" name="baselineType" value="sr-demand">';
    html += '<span class="lock-option-label">SR需求锁定</span>';
    html += '<div style="font-size:12px;color:#64748b;margin-left:24px;">校验：选中的需求只能是SR</div>';
    html += '</div>';
    html += '<div class="lock-option" onclick="selectBaselineOption(this, \'ir-sr-demand-plan\')">';
    html += '<input type="radio" name="baselineType" value="ir-sr-demand-plan">';
    html += '<span class="lock-option-label">IR&SR 需求&计划锁定</span>';
    html += '<div style="font-size:12px;color:#64748b;margin-left:24px;">校验：选中的需求可以是IR也可以是SR</div>';
    html += '</div>';
    html += '</div>';
    html += '<div style="margin-top:16px;">';
    html += '<div style="margin-bottom:6px;font-size:14px;font-weight:600;color:#1e293b;">基线版本号</div>';
    html += '<input class="version-input" id="baselineVersionInput" placeholder="请输入版本号，如 v1.0.0">';
    html += '</div>';
    body.innerHTML = html;
    document.getElementById('baselineModal').classList.add('show');
}

function selectBaselineOption(el, baselineType) {
    document.querySelectorAll('#baselineModalBody .lock-option').forEach(function(o) { o.classList.remove('selected'); });
    el.classList.add('selected');
    el.querySelector('input').checked = true;
    currentBaselineSelection = baselineType;
}

function confirmBaseline() {
    if (!currentBaselineSelection) { alert('请选择基线类型'); return; }
    var versionInput = document.getElementById('baselineVersionInput');
    var versionNo = versionInput ? versionInput.value.trim() : '';
    if (!versionNo) { alert('请输入基线版本号'); return; }

    var type = currentBaselineType;
    var selectedIds = Array.from(selectedItems[type]);
    var selectedItemsList = [];
    selectedIds.forEach(function(id) {
        var item = allData[type].find(function(d) { return d.id === id; });
        if (item) selectedItemsList.push(item);
    });

    var lockType;
    if (currentBaselineSelection === 'ir-demand') {
        if (type !== 'ir') { alert('校验失败：IR需求锁定只能选择IR需求'); return; }
        for (var i = 0; i < selectedItemsList.length; i++) {
            if (selectedItemsList[i].id.indexOf('IR-') !== 0) {
                alert('校验失败：选中的需求包含非IR需求'); return;
            }
        }
        lockType = 'demand';
    } else if (currentBaselineSelection === 'sr-demand') {
        if (type !== 'sr') { alert('校验失败：SR需求锁定只能选择SR需求'); return; }
        for (var j = 0; j < selectedItemsList.length; j++) {
            if (selectedItemsList[j].id.indexOf('SR-') !== 0) {
                alert('校验失败：选中的需求包含非SR需求'); return;
            }
        }
        lockType = 'demand';
    } else if (currentBaselineSelection === 'ir-sr-demand-plan') {
        lockType = 'demand-plan';
    }

    selectedItemsList.forEach(function(item) {
        item.lockType = lockType;
    });

    var baseline = {
        id: 'BL-' + String(allData.baselines.length + 1).padStart(3, '0'),
        version: versionNo,
        type: currentBaselineSelection,
        lockType: lockType,
        operator: '当前用户',
        createdAt: new Date().toLocaleString('zh-CN'),
        itemIds: selectedIds,
        itemCount: selectedIds.length,
        typeLabel: currentBaselineSelection === 'ir-demand' ? 'IR需求锁定' :
                   currentBaselineSelection === 'sr-demand' ? 'SR需求锁定' : 'IR&SR 需求&计划锁定'
    };
    allData.baselines.push(baseline);

    closeModal('baselineModal');
    alert('基线 ' + versionNo + ' 已生成，包含 ' + selectedIds.length + ' 条需求');
    selectedItems[type].clear();
    updateBulkBar(type);
    if (type === 'ir') renderIRList(); else renderSRList();
    renderBaselineList();
}

/* ========== 基线管理列表 ========== */
function renderBaselineList() {
    var countEl = document.getElementById('baselineCount');
    if (countEl) countEl.textContent = allData.baselines.length;
    var table = document.getElementById('baselineTable');
    if (!table) return;
    var html = '';
    html += '<thead><tr>';
    html += '<th>基线编号</th>';
    html += '<th>版本号</th>';
    html += '<th>基线类型</th>';
    html += '<th>锁定类型</th>';
    html += '<th>需求数量</th>';
    html += '<th>操作者</th>';
    html += '<th>生成时间</th>';
    html += '<th class="col-action">操作</th>';
    html += '</tr></thead>';
    html += '<tbody>';
    if (allData.baselines.length === 0) {
        html += '<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:24px;">暂无基线记录</td></tr>';
    } else {
        allData.baselines.forEach(function(bl) {
            html += '<tr>';
            html += '<td class="text-sm">'+escapeHtml(bl.id)+'</td>';
            html += '<td class="text-sm">'+escapeHtml(bl.version)+'</td>';
            html += '<td class="text-sm">'+escapeHtml(bl.typeLabel)+'</td>';
            html += '<td class="text-sm">'+(bl.lockType === 'demand' ? '需求锁定' : (bl.lockType === 'demand-plan' ? '需求&计划锁定' : '-'))+'</td>';
            html += '<td class="text-sm">'+bl.itemCount+'</td>';
            html += '<td class="text-sm">'+escapeHtml(bl.operator)+'</td>';
            html += '<td class="text-sm">'+escapeHtml(bl.createdAt)+'</td>';
            html += '<td class="col-action"><button class="toolbar-btn" style="padding:4px 8px;font-size:12px;" onclick="viewBaseline(\''+bl.id+'\')">查看</button></td>';
            html += '</tr>';
        });
    }
    html += '</tbody>';
    table.innerHTML = html;
}

function viewBaseline(id) {
    var bl = allData.baselines.find(function(b) { return b.id === id; });
    if (!bl) return;
    var body = document.getElementById('baselineDetailBody');
    var html = '';
    // 基线信息
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">基线信息</div>';
    html += '<div class="detail-grid">';
    html += '<div class="detail-field"><div class="detail-label">基线编号</div><div class="detail-value">'+escapeHtml(bl.id)+'</div></div>';
    html += '<div class="detail-field"><div class="detail-label">版本号</div><div class="detail-value">'+escapeHtml(bl.version)+'</div></div>';
    html += '<div class="detail-field"><div class="detail-label">基线类型</div><div class="detail-value">'+escapeHtml(bl.typeLabel)+'</div></div>';
    html += '<div class="detail-field"><div class="detail-label">锁定类型</div><div class="detail-value">'+(bl.lockType === 'demand' ? '需求锁定' : '需求&计划锁定')+'</div></div>';
    html += '<div class="detail-field"><div class="detail-label">需求数量</div><div class="detail-value">'+bl.itemCount+'</div></div>';
    html += '<div class="detail-field"><div class="detail-label">操作者</div><div class="detail-value">'+escapeHtml(bl.operator)+'</div></div>';
    html += '<div class="detail-field detail-full"><div class="detail-label">生成时间</div><div class="detail-value">'+escapeHtml(bl.createdAt)+'</div></div>';
    html += '</div></div>';
    // 需求列表
    html += '<div class="detail-section" style="margin-top:16px;">';
    html += '<div class="detail-section-title">需求列表</div>';
    html += '<div class="table-wrap" style="max-height:300px;overflow-y:auto;">';
    html += '<table class="data-table"><thead><tr>';
    html += '<th>类型</th>';
    html += '<th>需求编码</th>';
    html += '<th>标题</th>';
    html += '<th>状态</th>';
    html += '<th>锁定状态</th>';
    html += '<th class="col-action">操作</th>';
    html += '</tr></thead><tbody>';
    bl.itemIds.forEach(function(itemId) {
        var item = allData.ir.find(function(d) { return d.id === itemId; });
        var prefix = 'IR';
        if (!item) {
            item = allData.sr.find(function(d) { return d.id === itemId; });
            prefix = 'SR';
        }
        if (item) {
            var lockIcon = item.lockType ? '<span class="lock-icon">&#128274;</span>' : '';
            var lockStatus = item.lockType ? (item.lockType === 'demand' ? prefix+'需求锁定' : prefix+'需求&计划锁定') : '未锁定';
            html += '<tr>';
            html += '<td class="text-sm"><span style="color:'+(prefix==='IR'?'#3b82f6':'#8b5cf6')+';">['+prefix+']</span></td>';
            html += '<td class="text-sm">'+escapeHtml(item.code)+'</td>';
            html += '<td class="text-sm">'+lockIcon+escapeHtml(item.title)+'</td>';
            html += '<td class="text-sm">'+escapeHtml(item.status)+'</td>';
            html += '<td class="text-sm">'+escapeHtml(lockStatus)+'</td>';
            html += '<td class="col-action"><button class="toolbar-btn" style="padding:4px 8px;font-size:12px;" onclick="closeModal(\'baselineDetailModal\');open'+prefix+'Detail(\''+item.id+'\')">查看详情</button></td>';
            html += '</tr>';
        }
    });
    html += '</tbody></table>';
    html += '</div></div>';
    body.innerHTML = html;
    document.getElementById('baselineDetailModal').classList.add('show');
}

/* ========== 启动 ========== */
initPage();