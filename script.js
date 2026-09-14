/* ========== 全局数据 ========== */
var allData = { ir: [], sr: [], ar: [], baselines: [], changes: [] };
var expandedRows = {};
var selectedItems = { ir: new Set(), sr: new Set() };
var currentDrawer = null; // 'ir' or 'sr'
var currentDetailId = null;
var currentLockType = null; // 'ir' or 'sr' for lock modal
var currentLockSelection = null; // 'demand' or 'demand-plan'
var currentBaselineType = null;
var currentBaselineSelection = null;
var isEditing = false;
var currentChangeTab = 'req'; // 'req' or 'feature' - 变更对象Tab页

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
var STORAGE_KEY = 'reqMgmtData_v1';

function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
    } catch(e) { console.warn('localStorage保存失败:', e); }
}

function loadFromStorage() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        var parsed = JSON.parse(raw);
        if (parsed && parsed.ir && parsed.sr && parsed.changes) {
            allData = parsed;
            if (!allData.ar) allData.ar = [];
            if (!allData.baselines) allData.baselines = [];
            return true;
        }
    } catch(e) { console.warn('localStorage加载失败:', e); }
    return false;
}

function initPage() {
    var loaded = loadFromStorage();
    if (!loaded) {
        generateSampleData();
        generateChangeSampleData();
        saveToStorage();
    }
    renderSidebar();
    showPage('page-dashboard');
    renderTodoList();
    document.getElementById('stat-ir').textContent = allData.ir.length;
    document.getElementById('stat-sr').textContent = allData.sr.length;
    document.getElementById('stat-ar').textContent = allData.ar.length;
    renderBaselineList();
    /* 如果变更记录为空（如用户手动删除后），重新生成初始样本数据 */
    if (allData.changes.length === 0) {
        generateChangeSampleData();
        saveToStorage();
    }
    renderChangeList();
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
    } else if (pageId === 'page-change-mgmt') {
        renderChangeList();
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
    saveToStorage();
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
    saveToStorage();
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
    saveToStorage();
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
    saveToStorage();
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

/* ========== 变更管理：全局变量 ========== */
var currentChangeObjects = []; // 变更对象数组
var currentChangeReqSelectType = null; // 需求选择类型
var currentApprovalChangeId = null; // 当前审批的变更ID
var currentTransferStepIndex = null; // 转办的步骤索引
var currentResubmitChangeId = null; // 当前重新提交的变更ID（驳回后修改重提）

var changeFieldOptions = {
    '基本信息': ['状态', '需求来源', '需求分类', '价值主张', '需求等级', '需求差异类型', '适用品牌', '适用产品线', '适用市场', '适用版本', '适配品类', '事业部锁定', '标题', '描述', '责任人', '系统工程师',
                 '系统级需求', '优先级', '开发代表', 'UX代表', '测试代表', '处理人', '归属领域', '开发部门二级', '开发部门三级', '开发责任人', '责任田', '责任田主', '归属项目'],
    '计划排期': ['计划需求评审完成时间', '实际需求评审完成时间', '计划技术评审完成时间', '实际技术评审完成时间', '计划开发开始时间', '实际开发开始时间', '计划开发完成时间', '实际开发完成时间',
                 '计划验收完成时间', '实际验收完成时间']
};

/* IR可编辑字段（编辑弹窗用） */
var irEditableFields = {
    '基本信息': ['状态', '需求来源', '需求分类', '价值主张', '需求等级', '需求差异类型', '适用品牌', '适用产品线', '适用市场', '适用版本', '适配品类', '事业部锁定', '标题', '描述', '责任人', '系统工程师'],
    '计划排期': ['计划需求评审完成时间', '实际需求评审完成时间', '计划技术评审完成时间', '实际技术评审完成时间', '计划开发开始时间', '实际开发开始时间', '计划开发完成时间', '实际开发完成时间']
};

/* SR可编辑字段（编辑弹窗用） */
var srEditableFields = {
    '基本信息': ['状态', '需求来源', '需求分类', '价值主张', '需求差异类型', '适用品牌', '适用产品线', '适用市场', '适用版本', '适配品类', '标题', '描述', '系统级需求', '优先级', '责任人', '开发代表', 'UX代表', '测试代表', '处理人', '归属领域', '开发部门二级', '开发部门三级', '开发责任人', '责任田', '责任田主', '归属项目'],
    '计划排期': ['计划验收完成时间', '实际验收完成时间']
};

var approverConfig = {
    '手机': { SPP: '王海', SE: '刘祥根', SPM: '张海军' },
    '平板': { SPP: '沈茂伟', SE: '王力博', SPM: '肖龙启' }
};

/* ========== 变更管理：示例数据 ========== */
function generateChangeSampleData() {
    allData.changes = [
        {
            id: 'CR-2026-001', code: 'CR-2026-001', title: 'AI夜景算法需求等级变更',
            status: '变更结束',
            objects: [
                { reqType: 'IR', reqId: 'IR-001', reqCode: 'IR-2026-001', reqTitle: 'AI夜景算法优化',
                  changeCategory: '修改',
                  changes: [{ field: '需求等级', before: 'S', after: 'A' }] }
            ],
            reqLevel: '初始需求IR', changeType: '需求变更', changeCategory: '修改',
            affectFeature: '否', isValuePoint: '否',
            changeOwner: '张明', sourceDept: ['产品部'],
            irFactors: '市场需求调整', srFactors: '',
            changeReason: '根据市场反馈，S级优先级过高，调整为A级', reviewConclusion: '评审通过，同意变更',
            reviewLink: 'https://example.com/review/001', remark: '',
            applicant: '张明', applyDate: '2026-08-20', endDate: '2026-08-25',
            workflow: {
                currentStep: 2, steps: [
                    { role: 'SPP', approver: '王海', status: '通过', comment: '同意变更，风险可控' },
                    { role: 'SPM', approver: '张海军', status: '通过', comment: '同意需求等级调整' }
                ]
            }
        },
        {
            id: 'CR-2026-002', code: 'CR-2026-002', title: '快充协议计划排期变更',
            status: '流程中',
            objects: [
                { reqType: 'IR', reqId: 'IR-002', reqCode: 'IR-2026-002', reqTitle: '超级闪充快充协议升级',
                  changeCategory: '修改',
                  changes: [{ field: '计划开发完成时间', before: '2026-09-15', after: '2026-09-30' }] },
                { reqType: 'SR', reqId: 'SR-001', reqCode: 'SR-2026-002-01', reqTitle: '快充协议适配',
                  changeCategory: '修改',
                  changes: [{ field: '计划开发完成时间', before: '2026-09-10', after: '2026-09-25' }] }
            ],
            reqLevel: '初始需求IR,系统需求SR', changeType: '计划变更', changeCategory: '修改',
            affectFeature: '否', isValuePoint: '否',
            changeOwner: '李华', sourceDept: ['研发部', '产品部'],
            irFactors: '', srFactors: '排期调整',
            changeReason: '供应商芯片交付延迟，开发排期需后移两周', reviewConclusion: '',
            reviewLink: '', remark: '已通知相关干系人',
            applicant: '李华', applyDate: '2026-09-01', endDate: null,
            workflow: {
                currentStep: 0, steps: [
                    { role: 'SPM', approver: '张海军', status: '待审批', comment: '' }
                ]
            }
        },
        {
            id: 'CR-2026-003', code: 'CR-2026-003', title: '新增多摄协同拍摄SR需求',
            status: '流程中',
            objects: [
                { reqType: 'SR', reqId: 'SR-005', reqCode: 'SR-2026-007-01', reqTitle: '多摄融合算法（新增）',
                  changeCategory: '新增',
                  changes: [] }
            ],
            reqLevel: '系统需求SR', changeType: '需求变更,计划变更', changeCategory: '新增',
            affectFeature: '是', isValuePoint: '是',
            changeOwner: '王芳', sourceDept: ['影像部'],
            irFactors: '', srFactors: '新增SR需求',
            changeReason: '需要新增多摄协同拍摄的SR需求以支持IR-2026-007', reviewConclusion: '',
            reviewLink: '', remark: '',
            applicant: '王芳', applyDate: '2026-09-05', endDate: null,
            workflow: {
                currentStep: 0, steps: [
                    { role: 'SE', approver: '刘祥根', status: '待审批', comment: '' },
                    { role: 'SPM', approver: '张海军', status: '待审批', comment: '' }
                ]
            }
        }
    ];
}

/* 生成测试用例：自动生成9条电子流演示数据（覆盖全部审批路由场景） */
function generateDemoChanges() {
    var demos = [
        /* 场景1: IR / 需求变更 → SPP */
        {
            title: 'AI夜景算法迁移至新平台',
            status: '流程中',
            objects: [
                { reqType:'IR', reqId:'IR-001', reqCode:'IR-2026-001', reqTitle:'AI夜景算法优化',
                  changeCategory:'修改', changes:[
                    { field:'归属项目', before:'tOS17.0', after:'tOS17.1' },
                    { field:'需求等级', before:'S', after:'A' }
                  ] }
            ],
            reqLevel:'初始需求IR', changeType:'需求变更', changeCategory:'修改',
            affectFeature:'否', isValuePoint:'否',
            changeOwner:'张明', sourceDept:['产品部'],
            irFactors:'市场需求调整', srFactors:'',
            changeReason:'AI夜景算法需迁移至新平台架构，归属项目从tOS17.0变更为tOS17.1',
            reviewConclusion:'评审通过', reviewLink:'https://example.com/review/demo1', remark:'',
            applicant:'张明', applyDate:'2026-09-10', endDate:null,
            workflow:{ currentStep:0, steps:[
                { role:'SPP', approver:'王海', status:'待审批', comment:'' },
                { role:'SPM', approver:'张海军', status:'待审批', comment:'' }
            ] }
        },
        /* 场景2: IR / 计划变更 → SPM */
        {
            title: '充电模块IR开发排期后移',
            status:'流程中',
            objects: [
                { reqType:'IR', reqId:'IR-002', reqCode:'IR-2026-002', reqTitle:'超级闪充快充协议升级',
                  changeCategory:'修改', changes:[
                    { field:'计划开发开始时间', before:'2026-09-01', after:'2026-09-15' },
                    { field:'计划开发完成时间', before:'2026-09-30', after:'2026-10-20' }
                  ] }
            ],
            reqLevel:'初始需求IR', changeType:'计划变更', changeCategory:'修改',
            affectFeature:'否', isValuePoint:'否',
            changeOwner:'李华', sourceDept:['研发部','产品部'],
            irFactors:'排期调整', srFactors:'',
            changeReason:'开发资源紧张，IR排期需后移两周',
            reviewConclusion:'', reviewLink:'', remark:'',
            applicant:'李华', applyDate:'2026-09-12', endDate:null,
            workflow:{ currentStep:0, steps:[{ role:'SPM', approver:'张海军', status:'待审批', comment:'' }] }
        },
        /* 场景3: IR / 需求变更+计划变更 → SPP&SPM */
        {
            title: 'AI夜景算法需求等级及排期同步调整',
            status:'变更结束',
            objects: [
                { reqType:'IR', reqId:'IR-001', reqCode:'IR-2026-001', reqTitle:'AI夜景算法优化',
                  changeCategory:'修改', changes:[
                    { field:'需求等级', before:'S', after:'A' },
                    { field:'计划开发完成时间', before:'2026-06-30', after:'2026-07-20' }
                  ] }
            ],
            reqLevel:'初始需求IR', changeType:'需求变更,计划变更', changeCategory:'修改',
            affectFeature:'否', isValuePoint:'否',
            changeOwner:'张明', sourceDept:['产品部','研发部'],
            irFactors:'市场需求调整,排期调整', srFactors:'',
            changeReason:'AI夜景算法需求等级从S调整为A，同时开发排期后移20天',
            reviewConclusion:'评审通过', reviewLink:'https://example.com/review/demo3', remark:'',
            applicant:'张明', applyDate:'2026-08-28', endDate:'2026-09-03',
            workflow:{ currentStep:2, steps:[
                { role:'SPP', approver:'王海', status:'通过', comment:'同意需求等级调整' },
                { role:'SPM', approver:'张海军', status:'通过', comment:'排期调整合理，同意' }
            ] }
        },
        /* 场景4: SR / 需求变更 → SE */
        {
            title: '多摄协同拍摄SR需求描述完善',
            status:'待申请人确认',
            objects: [
                { reqType:'SR', reqId:'SR-005', reqCode:'SR-2026-007-01', reqTitle:'多摄融合算法（新增）',
                  changeCategory:'新增', changes:[] }
            ],
            reqLevel:'系统需求SR', changeType:'需求变更,计划变更', changeCategory:'新增',
            affectFeature:'是', isValuePoint:'是',
            changeOwner:'王芳', sourceDept:['影像部'],
            irFactors:'', srFactors:'新增SR需求',
            changeReason:'需要新增多摄协同拍摄的SR需求以支持IR-2026-007',
            reviewConclusion:'', reviewLink:'', remark:'',
            applicant:'王芳', applyDate:'2026-09-05', endDate:null,
            workflow:{ currentStep:0, steps:[
                { role:'SE', approver:'刘祥根', status:'驳回', comment:'需求描述不够详细，请补充验收标准' },
                { role:'SPM', approver:'张海军', status:'待审批', comment:'' }
            ] }
        },
        /* 场景5: SR / 计划变更 → SPM */
        {
            title: '快充协议SR计划排期变更',
            status:'变更结束',
            objects: [
                { reqType:'SR', reqId:'SR-001', reqCode:'SR-2026-002-01', reqTitle:'快充协议适配',
                  changeCategory:'修改', changes:[
                    { field:'计划开发完成时间', before:'2026-09-10', after:'2026-09-25' }
                  ] }
            ],
            reqLevel:'系统需求SR', changeType:'计划变更', changeCategory:'修改',
            affectFeature:'否', isValuePoint:'否',
            changeOwner:'李华', sourceDept:['研发部'],
            irFactors:'', srFactors:'排期调整',
            changeReason:'供应商芯片交付延迟，SR开发排期需后移',
            reviewConclusion:'评审通过', reviewLink:'https://example.com/review/demo5', remark:'',
            applicant:'李华', applyDate:'2026-09-01', endDate:'2026-09-05',
            workflow:{ currentStep:1, steps:[{ role:'SPM', approver:'张海军', status:'通过', comment:'同意调整' }] }
        },
        /* 场景6: SR / 需求变更+计划变更 → SE&SPM */
        {
            title: '蓝牙音频SR需求等级及排期变更',
            status:'流程中',
            objects: [
                { reqType:'SR', reqId:'SR-003', reqCode:'SR-2026-003-01', reqTitle:'蓝牙5.3音频协议适配',
                  changeCategory:'修改', changes:[
                    { field:'需求等级', before:'B', after:'A' },
                    { field:'计划开发完成时间', before:'2026-08-30', after:'2026-09-20' }
                  ] }
            ],
            reqLevel:'系统需求SR', changeType:'需求变更,计划变更', changeCategory:'修改',
            affectFeature:'否', isValuePoint:'否',
            changeOwner:'陈明', sourceDept:['研发部'],
            irFactors:'', srFactors:'市场需求调整,排期调整',
            changeReason:'蓝牙音频SR需求等级从B提升至A，排期同步后移',
            reviewConclusion:'评审通过', reviewLink:'https://example.com/review/demo6', remark:'',
            applicant:'陈明', applyDate:'2026-09-08', endDate:null,
            workflow:{ currentStep:1, steps:[
                { role:'SE', approver:'刘祥根', status:'通过', comment:'同意需求等级提升' },
                { role:'SPM', approver:'张海军', status:'待审批', comment:'' }
            ] }
        },
        /* 场景7: IR+SR / 需求变更 → SPP+SE */
        {
            title: '隐私安全模块需求变更',
            status:'流程中',
            objects: [
                { reqType:'IR', reqId:'IR-005', reqCode:'IR-2026-006', reqTitle:'隐私数据安全合规',
                  changeCategory:'修改', changes:[
                    { field:'需求等级', before:'A', after:'S' },
                    { field:'需求描述', before:'基础隐私保护', after:'增强型隐私安全合规方案' }
                  ] },
                { reqType:'SR', reqId:'SR-006', reqCode:'SR-2026-008-01', reqTitle:'安全沙箱SR',
                  changeCategory:'修改', changes:[
                    { field:'需求描述', before:'基础沙箱隔离', after:'增强型安全沙箱方案' }
                  ] }
            ],
            reqLevel:'初始需求IR,系统需求SR', changeType:'需求变更', changeCategory:'修改',
            affectFeature:'是', isValuePoint:'否',
            changeOwner:'刘洋', sourceDept:['安全部','研发部'],
            irFactors:'合规要求', srFactors:'合规要求',
            changeReason:'根据最新法规要求，隐私安全模块需求等级提升至S级，IR和SR同步变更',
            reviewConclusion:'评审通过', reviewLink:'https://example.com/review/demo7', remark:'涉及合规要求',
            applicant:'刘洋', applyDate:'2026-09-11', endDate:null,
            workflow:{ currentStep:1, steps:[
                { role:'SPP', approver:'王海', status:'通过', comment:'合规要求紧急，同意变更' },
                { role:'SE', approver:'刘祥根', status:'待审批', comment:'' },
                { role:'SPM', approver:'张海军', status:'待审批', comment:'' }
            ] }
        },
        /* 场景8: IR+SR / 计划变更 → SPM */
        {
            title: '系统流畅度IR与SR排期同步调整',
            status:'流程中',
            objects: [
                { reqType:'IR', reqId:'IR-006', reqCode:'IR-2026-008', reqTitle:'系统流畅度全面提升',
                  changeCategory:'修改', changes:[
                    { field:'计划开发开始时间', before:'2026-09-10', after:'2026-09-25' },
                    { field:'计划开发完成时间', before:'2026-11-30', after:'2026-12-15' }
                  ] },
                { reqType:'SR', reqId:'SR-007', reqCode:'SR-2026-009-01', reqTitle:'动画框架优化SR',
                  changeCategory:'修改', changes:[
                    { field:'计划开发完成时间', before:'2026-10-30', after:'2026-11-15' }
                  ] }
            ],
            reqLevel:'初始需求IR,系统需求SR', changeType:'计划变更', changeCategory:'修改',
            affectFeature:'否', isValuePoint:'否',
            changeOwner:'陈明', sourceDept:['研发部'],
            irFactors:'排期调整', srFactors:'排期调整',
            changeReason:'系统流畅度优化涉及IR和SR两个层级，排期需同步后移',
            reviewConclusion:'', reviewLink:'', remark:'',
            applicant:'陈明', applyDate:'2026-09-13', endDate:null,
            workflow:{ currentStep:0, steps:[
                { role:'SPM', approver:'张海军', status:'待审批', comment:'' }
            ] }
        },
        /* 场景9: IR+SR / 需求变更+计划变更 → SPP+SE+SPM */
        {
            title: '显示驱动模块迁移及排期调整',
            status:'流程中',
            objects: [
                { reqType:'IR', reqId:'IR-003', reqCode:'IR-2026-003', reqTitle:'折叠屏显示驱动优化',
                  changeCategory:'修改', changes:[
                    { field:'归属项目', before:'tOS16.5', after:'tOS17.1' },
                    { field:'需求等级', before:'A', after:'S' }
                  ] },
                { reqType:'SR', reqId:'SR-002', reqCode:'SR-2026-003-01', reqTitle:'折叠屏适配SR',
                  changeCategory:'修改', changes:[
                    { field:'计划开发完成时间', before:'2026-10-15', after:'2026-11-01' }
                  ] }
            ],
            reqLevel:'初始需求IR,系统需求SR', changeType:'需求变更,计划变更', changeCategory:'修改',
            affectFeature:'是', isValuePoint:'是',
            changeOwner:'王芳', sourceDept:['影像部','研发部'],
            irFactors:'市场需求调整', srFactors:'排期调整',
            changeReason:'显示驱动模块需迁移至新平台，IR归属项目变更，SR计划排期同步调整',
            reviewConclusion:'', reviewLink:'', remark:'涉及多模块协同',
            applicant:'王芳', applyDate:'2026-09-08', endDate:null,
            workflow:{ currentStep:1, steps:[
                { role:'SPP', approver:'王海', status:'通过', comment:'同意迁移方案' },
                { role:'SE', approver:'刘祥根', status:'待审批', comment:'' },
                { role:'SPM', approver:'张海军', status:'待审批', comment:'' }
            ] }
        }
    ];

    /* 检查是否已生成过演示数据，避免重复添加 */
    var existingDemo = allData.changes.some(function(c) { return c.id && c.id.indexOf('CR-DEMO') === 0; });
    if (existingDemo) {
        alert('测试用例已生成，请勿重复点击。如需重新生成，请先删除已有的测试用例数据。');
        return;
    }

    var added = 0;
    demos.forEach(function(d) {
        var seq = allData.changes.length + 1;
        var id = 'CR-DEMO-' + String(seq).padStart(3, '0');
        d.id = id;
        d.code = id;
        allData.changes.push(d);
        added++;
    });

    renderChangeList();
    saveToStorage();
    alert('已生成 ' + added + ' 条电子流演示数据，覆盖9种审批路由场景（均以SPM为最终审批人）：\n' +
          '1. IR/需求变更 → SPP→SPM审批\n' +
          '2. IR/计划变更 → SPM审批\n' +
          '3. IR/需求变更+计划变更 → SPP→SPM审批\n' +
          '4. SR/新增(需求变更+计划变更) → SE→SPM审批（含驳回场景）\n' +
          '5. SR/计划变更 → SPM审批\n' +
          '6. SR/需求变更+计划变更 → SE→SPM审批\n' +
          '7. IR+SR/需求变更 → SPP→SE→SPM审批\n' +
          '8. IR+SR/计划变更 → SPM审批\n' +
          '9. IR+SR/需求变更+计划变更 → SPP→SE→SPM三级审批');
}

/* ========== 变更管理：状态Badge ========== */
function getChangeStatusBadge(status) {
    var map = { '草稿': 'change-status-draft', '流程中': 'change-status-flow', '变更结束': 'change-status-done', '取消申请': 'change-status-cancel', '待申请人确认': 'change-status-pending-confirm', '已取消': 'change-status-cancelled' };
    var cls = map[status] || 'change-status-draft';
    return '<span class="badge ' + cls + '">' + escapeHtml(status) + '</span>';
}

/* ========== 变更管理：时长计算 ========== */
function getChangeDuration(change) {
    var apply = new Date(change.applyDate);
    var end = change.endDate ? new Date(change.endDate) : new Date();
    var diff = end - apply;
    if (diff < 0) diff = 0;
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return days + '天' + hours + '小时';
}

/* ========== 变更管理：列表渲染 ========== */
var selectedChangeIds = new Set();

function renderChangeList() {
    var table = document.getElementById('changeTable');
    if (!table) return;
    var html = '';
    html += '<thead><tr>';
    /* 全选复选框根据当前选中状态设置checked属性 */
    var allChecked = (allData.changes.length > 0 && selectedChangeIds.size === allData.changes.length);
    var masterChecked = allChecked ? ' checked' : '';
    html += '<th style="width:36px;"><input type="checkbox" id="changeSelectAll"' + masterChecked + ' onclick="toggleAllChanges(this)"></th>';
    html += '<th>变更标题</th><th>需求层级</th><th>变更类型</th><th>变更分类</th>';
    html += '<th>变更需求编码</th><th>变更责任人</th><th>变更状态</th>';
    html += '<th>申请人</th><th>申请日期</th><th>时长</th><th>操作</th>';
    html += '</tr></thead><tbody>';
    allData.changes.forEach(function(c) {
        var codes = c.objects.map(function(o) { return o.reqCode; }).join(', ');
        var checked = selectedChangeIds.has(c.id) ? ' checked' : '';
        html += '<tr>';
        html += '<td style="text-align:center;"><input type="checkbox" class="change-row-cb" data-id="' + c.id + '"' + checked + ' onclick="toggleChangeSelect(\'' + c.id + '\', this.checked)"></td>';
        html += '<td><span class="link-title" onclick="openChangeDetail(\'' + c.id + '\')">' + escapeHtml(c.title) + '</span></td>';
        html += '<td>' + escapeHtml(c.reqLevel) + '</td>';
        html += '<td><span class="change-type-badge">' + escapeHtml(c.changeType) + '</span></td>';
        html += '<td>' + escapeHtml(c.changeCategory) + '</td>';
        html += '<td>' + escapeHtml(codes) + '</td>';
        html += '<td>' + escapeHtml(c.changeOwner) + '</td>';
        html += '<td>' + getChangeStatusBadge(c.status) + '</td>';
        html += '<td>' + escapeHtml(c.applicant) + '</td>';
        html += '<td>' + escapeHtml(c.applyDate) + '</td>';
        html += '<td>' + getChangeDuration(c) + '</td>';
        html += '<td class="col-action">';
        if (c.status === '流程中') {
            html += '<button class="toolbar-btn" style="padding:4px 8px;font-size:12px;" onclick="openChangeApproval(\'' + c.id + '\')">审批</button>';
        } else if (c.status === '待申请人确认') {
            html += '<button class="toolbar-btn" style="padding:4px 8px;font-size:12px;border-color:#f59e0b;color:#d97706;" onclick="openChangeApproval(\'' + c.id + '\')">处理</button>';
        } else {
            html += '<button class="toolbar-btn" style="padding:4px 8px;font-size:12px;" onclick="openChangeDetail(\'' + c.id + '\')">查看</button>';
        }
        html += '</td>';
        html += '</tr>';
    });
    html += '</tbody>';
    table.innerHTML = html;
    updateBatchDeleteBtn();
}

function toggleAllChanges(masterCb) {
    var checked = masterCb.checked;
    /* 直接更新所有行复选框，不重建表格，避免主复选框状态丢失 */
    var rowCbs = document.querySelectorAll('.change-row-cb');
    if (checked) {
        allData.changes.forEach(function(c) { selectedChangeIds.add(c.id); });
    } else {
        selectedChangeIds.clear();
    }
    rowCbs.forEach(function(cb) { cb.checked = checked; });
    updateBatchDeleteBtn();
}

function toggleChangeSelect(id, checked) {
    if (checked) selectedChangeIds.add(id);
    else selectedChangeIds.delete(id);
    /* 同步更新全选复选框状态 */
    var masterCb = document.getElementById('changeSelectAll');
    if (masterCb) {
        var allChecked = (allData.changes.length > 0 && selectedChangeIds.size === allData.changes.length);
        masterCb.checked = allChecked;
    }
    updateBatchDeleteBtn();
}

function updateBatchDeleteBtn() {
    var btn = document.getElementById('batchDeleteBtn');
    if (!btn) return;
    if (selectedChangeIds.size > 0) {
        btn.style.display = '';
        btn.innerHTML = '&#128465; 批量删除(' + selectedChangeIds.size + ')';
    } else {
        btn.style.display = 'none';
    }
}

function deleteSelectedChanges() {
    if (selectedChangeIds.size === 0) { alert('请先选择需要删除的变更记录'); return; }
    if (!confirm('确认删除选中的 ' + selectedChangeIds.size + ' 条变更记录？删除后无法恢复。')) return;
    allData.changes = allData.changes.filter(function(c) { return !selectedChangeIds.has(c.id); });
    selectedChangeIds.clear();
    renderChangeList();
    saveToStorage();
    alert('已删除选中的变更记录');
}

/* ========== 变更管理：发起变更 ========== */
function openChangeCreate() {
    currentChangeObjects = [];
    currentResubmitChangeId = null;
    currentChangeTab = 'req';
    renderChangeCreateForm();
    document.getElementById('changeCreateModal').classList.add('show');
}

function renderChangeCreateForm() {
    var body = document.getElementById('changeCreateBody');

    /* 保存已有表单值，防止重新渲染时丢失 */
    var fv = {};
    ['changeTitle','changeAffectFeature','changeIsValuePoint','changeOwner',
     'changeSourceDept','changeReason','changeReviewConclusion',
     'changeReviewLink','changeRemark','changeIrFactors','changeSrFactors'
    ].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) fv[id] = el.value;
    });

    var html = '';

    // 1. 变更标题（无标题栏，直接展示输入框）
    html += '<div class="change-section">';
    html += '<div class="change-info-grid">';
    html += '<div class="change-info-field"><div class="change-info-label">变更标题 <span class="required">*</span></div>';
    html += '<div class="change-info-value"><input type="text" id="changeTitle" placeholder="请输入变更标题" style="width:100%;" value="' + escapeHtml(fv.changeTitle || '') + '"></div></div>';
    html += '<div class="change-info-field"><div class="change-info-label">流程编码</div>';
    html += '<div class="change-info-value auto">系统自动生成</div></div>';
    html += '</div></div>';

    // 2. 变更对象板块（带Tab页）
    html += '<div class="change-section">';
    html += '<div class="change-section-title">变更对象</div>';

    // Tab栏
    html += '<div class="change-tab-bar">';
    html += '<div class="change-tab' + (currentChangeTab === 'req' ? ' active' : '') + '" onclick="switchChangeTab(\'req\')">需求</div>';
    html += '<div class="change-tab' + (currentChangeTab === 'feature' ? ' active' : '') + '" onclick="switchChangeTab(\'feature\')">特性</div>';
    html += '</div>';

    // 按钮区
    html += '<div style="margin-bottom:8px;">';
    if (currentChangeTab === 'req') {
        html += '<button class="change-action-btn" onclick="addNewIR()">新增IR</button>';
        html += '<button class="change-action-btn primary" onclick="openReqSelect()">选取</button>';
    } else {
        html += '<button class="change-action-btn" onclick="addNewChangeObject(\'特性\')">新增特性</button>';
        html += '<button class="change-action-btn primary" onclick="openFeatureSelect()">选取</button>';
    }
    html += '</div>';

    // 过滤当前Tab的对象
    var tabObjects = [];
    currentChangeObjects.forEach(function(obj, i) {
        var isReqObj = (obj.reqType === 'IR' || obj.reqType === 'SR');
        var isFeatureObj = (obj.reqType === '特性');
        if ((currentChangeTab === 'req' && isReqObj) || (currentChangeTab === 'feature' && isFeatureObj)) {
            tabObjects.push({obj: obj, index: i});
        }
    });

    if (tabObjects.length === 0) {
        html += '<div class="empty-state">暂无' + (currentChangeTab === 'req' ? '需求' : '特性') + '变更对象，请点击上方按钮选取或新增</div>';
    } else {
        html += '<table class="change-objects-table">';
        html += '<thead><tr><th>变更分类</th><th>需求标题</th><th>需求编码</th><th>操作</th></tr></thead>';
        html += '<tbody>';
        tabObjects.forEach(function(item) {
            var obj = item.obj;
            var i = item.index;
            var hasChanges = obj.changes.length > 0;
            // 对象摘要行
            html += '<tr class="change-object-row' + (hasChanges ? '' : ' collapsed') + '" id="changeObjRow' + i + '"' + (hasChanges ? ' onclick="toggleChangeObjRow(' + i + ')"' : '') + '>';
            html += '<td onclick="event.stopPropagation()">';
            if (obj.changeCategory === '新增') {
                html += '<select class="change-field-select" disabled><option value="新增" selected>新增</option></select>';
            } else {
                html += '<select class="change-field-select" onchange="updateChangeObj(' + i + ',\'changeCategory\',this.value)">';
                ['删除', '修改'].forEach(function(cat) {
                    html += '<option value="' + cat + '"' + (obj.changeCategory === cat ? ' selected' : '') + '>' + cat + '</option>';
                });
                html += '</select>';
            }
            html += '</td>';
            html += '<td>' + escapeHtml(obj.reqTitle || '(待填写)') + '</td>';
            html += '<td>' + escapeHtml(obj.reqCode || '(待生成)') + '</td>';
            html += '<td onclick="event.stopPropagation()">';
            if (obj.reqType === 'IR') {
                html += '<button class="change-action-btn primary" onclick="event.stopPropagation();addNewChangeObject(\'SR\',' + i + ')">新增SR</button>';
            }
            html += '<button class="change-action-btn" onclick="event.stopPropagation();editChangeObject(' + i + ')">编辑</button>';
            html += '<button class="change-action-btn danger" onclick="event.stopPropagation();removeChangeObject(' + i + ')">移除</button>';
            html += '</td>';
            html += '<td colspan="3">';
            if (hasChanges) {
                html += '<span class="expand-indicator">&#9660;</span>';
                html += '<span style="font-size:11px;color:#64748b;">' + obj.changes.length + '项变更</span>';
            } else {
                html += '<span style="font-size:11px;color:#94a3b8;">无变更字段</span>';
            }
            html += '</td>';
            html += '</tr>';

            // 变更字段明细行
            if (hasChanges) {
                html += '<tr class="change-detail-rows" id="changeDetailRows' + i + '"><td colspan="7" style="padding:8px 16px;background:#f8fafc;">';
                html += '<table style="width:100%;font-size:11px;border-collapse:collapse;">';
                html += '<thead><tr><th style="text-align:left;padding:4px;">变更字段</th><th style="text-align:left;padding:4px;">变更前</th><th style="text-align:left;padding:4px;">变更后</th><th style="width:60px;">操作</th></tr></thead><tbody>';
                obj.changes.forEach(function(ch, j) {
                    html += '<tr>';
                    html += '<td style="padding:4px;">' + escapeHtml(ch.field) + '</td>';
                    html += '<td style="padding:4px;"><div class="change-before-after">' + escapeHtml(ch.before) + '</div></td>';
                    html += '<td style="padding:4px;"><div class="change-before-after">' + escapeHtml(ch.after) + '</div></td>';
                    html += '<td style="padding:4px;"><button class="change-action-btn danger" onclick="removeChangeFieldRow(' + i + ',' + j + ')">移除</button></td>';
                    html += '</tr>';
                });
                html += '</tbody></table>';
                html += '</td></tr>';
            }
        });
        html += '</tbody></table>';
    }
    html += '</div>';

    // 3. 变更信息板块
    html += '<div class="change-section">';
    html += '<div class="change-section-title">变更信息</div>';
    html += '<div class="change-info-grid full-row">';
    // 需求层级（自动）
    html += '<div class="change-info-field"><div class="change-info-label">需求层级</div><div class="change-info-value auto" id="aggReqLevel">' + autoAggReqLevel() + '</div></div>';
    // 变更类型（自动）
    html += '<div class="change-info-field"><div class="change-info-label">变更类型</div><div class="change-info-value auto" id="aggChangeType">' + autoAggChangeType() + '</div></div>';
    // 变更分类（自动）
    html += '<div class="change-info-field"><div class="change-info-label">变更分类</div><div class="change-info-value auto" id="aggChangeCategory">' + autoAggChangeCategory() + '</div></div>';
    // 是否影响特性
    html += '<div class="change-info-field"><div class="change-info-label">是否影响特性 <span class="required">*</span></div>';
    html += '<div class="change-info-value"><select id="changeAffectFeature"><option value="">请选择</option><option value="是"' + (fv.changeAffectFeature === '是' ? ' selected' : '') + '>是</option><option value="否"' + (fv.changeAffectFeature === '否' ? ' selected' : '') + '>否</option></select></div></div>';
    // 是否价值点
    html += '<div class="change-info-field"><div class="change-info-label">是否价值点 <span class="required">*</span></div>';
    html += '<div class="change-info-value"><select id="changeIsValuePoint"><option value="">请选择</option><option value="是"' + (fv.changeIsValuePoint === '是' ? ' selected' : '') + '>是</option><option value="否"' + (fv.changeIsValuePoint === '否' ? ' selected' : '') + '>否</option></select></div></div>';
    // 变更责任人
    html += '<div class="change-info-field"><div class="change-info-label">变更责任人 <span class="required">*</span></div>';
    html += '<div class="change-info-value"><input type="text" id="changeOwner" placeholder="请输入" value="' + escapeHtml(fv.changeOwner || '') + '"></div></div>';
    // 变更来源部门
    html += '<div class="change-info-field"><div class="change-info-label">变更来源部门 <span class="required">*</span></div>';
    html += '<div class="change-info-value"><input type="text" id="changeSourceDept" placeholder="多个部门用逗号隔开" value="' + escapeHtml(fv.changeSourceDept || '') + '"></div></div>';
    // IR变更因素（动态显示/隐藏）
    html += '<div class="change-info-field" id="irFactorsField" style="display:none;"><div class="change-info-label">IR变更影响因素 <span class="required">*</span></div>';
    html += '<div class="change-info-value"><select id="changeIrFactors"><option value="">请选择</option>';
    ['市场需求', '技术升级', '合规要求', '竞品对标', '用户体验'].forEach(function(v) {
        html += '<option value="' + v + '"' + (fv.changeIrFactors === v ? ' selected' : '') + '>' + v + '</option>';
    });
    html += '</select></div></div>';
    // SR变更因素（动态显示/隐藏）
    html += '<div class="change-info-field" id="srFactorsField" style="display:none;"><div class="change-info-label">SR变更影响因素 <span class="required">*</span></div>';
    html += '<div class="change-info-value"><select id="changeSrFactors"><option value="">请选择</option>';
    ['依赖变更', '接口变更', '性能优化', '架构调整'].forEach(function(v) {
        html += '<option value="' + v + '"' + (fv.changeSrFactors === v ? ' selected' : '') + '>' + v + '</option>';
    });
    html += '</select></div></div>';
    // 变更原因
    html += '<div class="change-info-field full-width"><div class="change-info-label">变更原因 <span class="required">*</span></div>';
    html += '<div class="change-info-value"><textarea id="changeReason" placeholder="请输入变更原因" style="min-height:50px;">' + escapeHtml(fv.changeReason || '') + '</textarea></div></div>';
    // 领域评审结论
    html += '<div class="change-info-field full-width"><div class="change-info-label">领域评审结论 <span class="required">*</span></div>';
    html += '<div class="change-info-value"><textarea id="changeReviewConclusion" placeholder="请输入评审结论" style="min-height:50px;">' + escapeHtml(fv.changeReviewConclusion || '') + '</textarea></div></div>';
    // 评审结论链接
    html += '<div class="change-info-field full-width"><div class="change-info-label">评审结论链接 <span class="required">*</span></div>';
    html += '<div class="change-info-value"><input type="text" id="changeReviewLink" placeholder="请上传需求变更申请表链接，可输入多个链接" value="' + escapeHtml(fv.changeReviewLink || '') + '"></div></div>';
    // 备注
    html += '<div class="change-info-field full-width"><div class="change-info-label">备注</div>';
    html += '<div class="change-info-value"><textarea id="changeRemark" placeholder="请输入备注" style="min-height:40px;">' + escapeHtml(fv.changeRemark || '') + '</textarea></div></div>';
    html += '</div></div>';

    body.innerHTML = html;
    refreshChangeFactors();
}

/* ========== 变更管理：自动聚合 ========== */
function autoAggReqLevel() {
    var hasIR = false, hasSR = false;
    currentChangeObjects.forEach(function(o) {
        if (o.reqType === 'IR') hasIR = true;
        if (o.reqType === 'SR') hasSR = true;
    });
    var result = [];
    if (hasIR) result.push('初始需求IR');
    if (hasSR) result.push('系统需求SR');
    return result.join(',') || '-';
}

function autoAggChangeType() {
    var hasBasic = false, hasSchedule = false;
    currentChangeObjects.forEach(function(o) {
        // 变更分类为"新增"且未涉及任何变更字段时，视为同时涉及需求变更和计划变更
        if (o.changeCategory === '新增' && (!o.changes || o.changes.length === 0)) {
            hasBasic = true;
            hasSchedule = true;
            return;
        }
        o.changes.forEach(function(ch) {
            if (changeFieldOptions['基本信息'].indexOf(ch.field) >= 0) hasBasic = true;
            if (changeFieldOptions['计划排期'].indexOf(ch.field) >= 0) hasSchedule = true;
        });
    });
    var result = [];
    if (hasBasic) result.push('需求变更');
    if (hasSchedule) result.push('计划变更');
    return result.join(',') || '-';
}

function autoAggChangeCategory() {
    var cats = [];
    currentChangeObjects.forEach(function(o) {
        if (o.changeCategory && cats.indexOf(o.changeCategory) < 0) cats.push(o.changeCategory);
    });
    return cats.join('/') || '-';
}

function refreshAggFields() {
    var el1 = document.getElementById('aggReqLevel');
    var el2 = document.getElementById('aggChangeType');
    var el3 = document.getElementById('aggChangeCategory');
    if (el1) el1.textContent = autoAggReqLevel();
    if (el2) el2.textContent = autoAggChangeType();
    if (el3) el3.textContent = autoAggChangeCategory();
    refreshChangeFactors();
}

/* 根据需求层级动态显示/隐藏IR/SR变更因素 */
function refreshChangeFactors() {
    var reqLevel = autoAggReqLevel();
    var hasIR = reqLevel.indexOf('初始需求IR') >= 0;
    var hasSR = reqLevel.indexOf('系统需求SR') >= 0;
    var irField = document.getElementById('irFactorsField');
    var srField = document.getElementById('srFactorsField');
    if (irField) irField.style.display = hasIR ? '' : 'none';
    if (srField) srField.style.display = (hasSR && !hasIR) ? '' : 'none';
}

/* ========== 变更管理：Tab切换 ========== */
function switchChangeTab(tab) {
    currentChangeTab = tab;
    renderChangeCreateForm();
    refreshAggFields();
}

/* ========== 变更管理：特性选择 ========== */
function openFeatureSelect() {
    document.getElementById('featureSelectBody').innerHTML = '<div class="empty-state">暂无可选特性，请通过"新增特性"按钮添加</div>';
    document.getElementById('featureSelectModal').classList.add('show');
}

/* ========== 变更管理：需求选择 ========== */
function openReqSelect() {
    document.getElementById('reqSelectTitle').textContent = '选取需求（IR及IR层级下SR）';
    var body = document.getElementById('reqSelectBody');
    var html = '';
    if (allData.ir.length === 0) {
        html = '<div class="empty-state">暂无可选IR需求</div>';
    } else {
        html += '<div style="margin-bottom:8px;font-size:12px;color:#64748b;">勾选需求行可多选IR或其下的SR，点击"确认选取"完成添加</div>';
        allData.ir.forEach(function(ir) {
            var irAlreadySel = currentChangeObjects.some(function(o) { return o.reqId === ir.id; });
            // IR行
            if (!irAlreadySel) {
                html += '<div class="req-select-ir-block" style="margin-bottom:8px;">';
                html += '<table class="req-select-table"><tbody>';
                html += '<tr style="cursor:pointer;" onclick="toggleReqCheckbox(this)">';
                html += '<td style="width:40px;text-align:center;"><input type="checkbox" class="req-select-cb" data-type="IR" data-id="' + escapeHtml(ir.id) + '" onclick="event.stopPropagation()"></td>';
                html += '<td style="width:70px;font-weight:600;color:#3b82f6;">IR</td>';
                html += '<td style="width:130px;">' + escapeHtml(ir.code) + '</td>';
                html += '<td>' + escapeHtml(ir.title) + '</td>';
                html += '<td style="width:80px;">' + escapeHtml(ir.status) + '</td>';
                html += '<td style="width:80px;">' + escapeHtml(ir.owner) + '</td>';
                html += '</tr>';
                html += '</tbody></table>';
                // IR层级下的SR
                var childSRs = allData.sr.filter(function(sr) { return sr.parentId === ir.id; });
                if (childSRs.length > 0) {
                    html += '<div style="margin-left:24px;border-left:2px solid #e2e8f0;padding-left:8px;">';
                    html += '<table class="req-select-table"><tbody>';
                    childSRs.forEach(function(sr) {
                        var srAlreadySel = currentChangeObjects.some(function(o) { return o.reqId === sr.id; });
                        if (srAlreadySel) return;
                        html += '<tr style="cursor:pointer;" onclick="toggleReqCheckbox(this)">';
                        html += '<td style="width:40px;text-align:center;"><input type="checkbox" class="req-select-cb" data-type="SR" data-id="' + escapeHtml(sr.id) + '" onclick="event.stopPropagation()"></td>';
                        html += '<td style="width:70px;color:#7c3aed;">SR</td>';
                        html += '<td style="width:130px;">' + escapeHtml(sr.code) + '</td>';
                        html += '<td>' + escapeHtml(sr.title) + '</td>';
                        html += '<td style="width:80px;">' + escapeHtml(sr.status) + '</td>';
                        html += '<td style="width:80px;">' + escapeHtml(sr.owner) + '</td>';
                        html += '</tr>';
                    });
                    html += '</tbody></table></div>';
                }
                html += '</div>';
            } else {
                // IR已选，但SR可能未选
                var childSRs2 = allData.sr.filter(function(sr) { return sr.parentId === ir.id; });
                var unselectedSRs = childSRs2.filter(function(sr) { return !currentChangeObjects.some(function(o) { return o.reqId === sr.id; }); });
                if (unselectedSRs.length > 0) {
                    html += '<div class="req-select-ir-block" style="margin-bottom:8px;">';
                    html += '<table class="req-select-table"><tbody>';
                    html += '<tr style="background:#f0fdf4;"><td style="width:40px;"></td><td style="width:70px;font-weight:600;color:#16a34a;">IR</td><td style="width:130px;">' + escapeHtml(ir.code) + '</td><td>' + escapeHtml(ir.title) + '</td><td colspan="2" style="font-size:11px;color:#16a34a;">已选取</td></tr>';
                    html += '</tbody></table>';
                    html += '<div style="margin-left:24px;border-left:2px solid #e2e8f0;padding-left:8px;">';
                    html += '<table class="req-select-table"><tbody>';
                    unselectedSRs.forEach(function(sr) {
                        html += '<tr style="cursor:pointer;" onclick="toggleReqCheckbox(this)">';
                        html += '<td style="width:40px;text-align:center;"><input type="checkbox" class="req-select-cb" data-type="SR" data-id="' + escapeHtml(sr.id) + '" onclick="event.stopPropagation()"></td>';
                        html += '<td style="width:70px;color:#7c3aed;">SR</td>';
                        html += '<td style="width:130px;">' + escapeHtml(sr.code) + '</td>';
                        html += '<td>' + escapeHtml(sr.title) + '</td>';
                        html += '<td style="width:80px;">' + escapeHtml(sr.status) + '</td>';
                        html += '<td style="width:80px;">' + escapeHtml(sr.owner) + '</td>';
                        html += '</tr>';
                    });
                    html += '</tbody></table></div></div>';
                }
            }
        });
    }
    body.innerHTML = html;
    document.getElementById('reqSelectModal').classList.add('show');
}

function toggleReqCheckbox(row) {
    var cb = row.querySelector('.req-select-cb');
    if (cb) cb.checked = !cb.checked;
}

function confirmReqSelectBatch() {
    var checkboxes = document.querySelectorAll('#reqSelectBody .req-select-cb:checked');
    var added = 0;
    checkboxes.forEach(function(cb) {
        var type = cb.getAttribute('data-type');
        var reqId = cb.getAttribute('data-id');
        var data = type === 'IR' ? allData.ir : allData.sr;
        var req = data.find(function(d) { return d.id === reqId; });
        if (req) {
            currentChangeObjects.push({
                reqType: type, reqId: req.id, reqCode: req.code, reqTitle: req.title,
                changeCategory: '修改', changes: []
            });
            added++;
        }
    });
    closeModal('reqSelectModal');
    if (added > 0) {
        renderChangeCreateForm();
        refreshAggFields();
    }
}

/* ========== 变更管理：新增变更对象 ========== */
function addNewChangeObject(type, parentIndex) {
    var obj = {
        reqType: type,
        reqId: type + '-NEW-' + Date.now(),
        reqCode: type + '-2026-NEW-' + (currentChangeObjects.length + 1),
        reqTitle: '(' + (type === 'IR' ? '新增IR' : type === 'SR' ? '新增SR' : '新增特性') + ')',
        changeCategory: '新增',
        changes: []
    };
    if (type === 'SR' && parentIndex !== undefined) {
        // 新增SR关联到IR
        currentChangeObjects.splice(parentIndex + 1, 0, obj);
    } else {
        currentChangeObjects.push(obj);
    }
    renderChangeCreateForm();
}

/* ========== 变更管理：新增IR（直接弹出编辑弹窗） ========== */
var isAddingNewIR = false;

function addNewIR() {
    isAddingNewIR = true;
    currentEditChangeObjIndex = null;
    currentEditOrigData = {};

    document.getElementById('changeEditReqTitle').textContent = '新增IR需求基本信息';

    var fieldsConfig = irEditableFields;
    var body = document.getElementById('changeEditReqBody');
    var html = '';

    /* 基本信息 */
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">基本信息</div>';
    html += '<div class="detail-grid">';
    fieldsConfig['基本信息'].forEach(function(label) {
        var val = '';
        if (dropdownOptions[label]) {
            html += selectField(label, val, dropdownOptions[label], false, true);
        } else if (multiSelectOptions[label]) {
            html += multiSelectField(label, val, multiSelectOptions[label], false, true);
        } else if (label === '适配品类') {
            html += categoryField(label, val, true);
        } else if (label === '描述') {
            html += textareaField(label, val, true, true);
        } else {
            html += field(label, val, false, true);
        }
    });
    html += '</div></div>';

    /* 计划排期 */
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">计划排期</div>';
    html += '<div class="detail-grid three-col">';
    fieldsConfig['计划排期'].forEach(function(label) {
        html += dateField(label, '', false, true);
    });
    html += '</div></div>';

    body.innerHTML = html;
    document.getElementById('changeEditReqModal').classList.add('show');
}

/* ========== 变更管理：对象操作 ========== */
function removeChangeObject(index) {
    currentChangeObjects.splice(index, 1);
    renderChangeCreateForm();
}

/* ========== 变更管理：编辑需求基本信息 ========== */
var currentEditChangeObjIndex = null;
var currentEditOrigData = null;

function editChangeObject(index) {
    var obj = currentChangeObjects[index];
    if (!obj) return;
    currentEditChangeObjIndex = index;

    /* 查找需求数据 */
    var reqData;
    if (obj.reqType === 'IR') {
        reqData = allData.ir.find(function(i) { return i.id === obj.reqId; });
    } else {
        reqData = allData.sr.find(function(s) { return s.id === obj.reqId; });
    }
    /* 新增的需求（尚未保存到allData），使用空白模板 */
    if (!reqData) {
        /* 新增的需求：优先使用tempData中保存的编辑数据 */
        if (obj.tempData) {
            reqData = obj.tempData;
        } else {
            reqData = { code: obj.reqCode, title: obj.reqTitle };
        }
    }

    /* 存储原始数据深拷贝，用于后续比对 */
    currentEditOrigData = JSON.parse(JSON.stringify(reqData));

    /* 弹窗标题 */
    var typeLabel = obj.reqType === 'IR' ? 'IR' : obj.reqType === 'SR' ? 'SR' : '特性';
    document.getElementById('changeEditReqTitle').textContent =
        typeLabel + '需求基本信息编辑（' + (reqData.code || obj.reqCode || '') + '）';

    /* 根据需求类型选择字段集 */
    var fieldsConfig = obj.reqType === 'IR' ? irEditableFields : srEditableFields;

    var body = document.getElementById('changeEditReqBody');
    var html = '';

    /* 基本信息 */
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">基本信息</div>';
    html += '<div class="detail-grid">';
    fieldsConfig['基本信息'].forEach(function(label) {
        var prop = fieldLabelToProp[label];
        var val = reqData[prop];
        if (dropdownOptions[label]) {
            html += selectField(label, val, dropdownOptions[label], false, true);
        } else if (multiSelectOptions[label]) {
            html += multiSelectField(label, val, multiSelectOptions[label], false, true);
        } else if (label === '适配品类') {
            html += categoryField(label, val, true);
        } else if (label === '描述') {
            html += textareaField(label, val, true, true);
        } else {
            html += field(label, val, false, true);
        }
    });
    html += '</div></div>';

    /* 计划排期 */
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">计划排期</div>';
    html += '<div class="detail-grid three-col">';
    fieldsConfig['计划排期'].forEach(function(label) {
        var prop = fieldLabelToProp[label];
        var val = reqData[prop];
        html += dateField(label, val, false, true);
    });
    html += '</div></div>';

    body.innerHTML = html;
    document.getElementById('changeEditReqModal').classList.add('show');
}

/* 收集编辑弹窗中所有表单字段值，存为tempData */
function collectFormData(fieldsConfig) {
    var data = {};
    var allFields = fieldsConfig['基本信息'].concat(fieldsConfig['计划排期']);
    allFields.forEach(function(label) {
        var prop = fieldLabelToProp[label];
        if (multiSelectOptions[label] || label === '适配品类') {
            var checkboxes = document.querySelectorAll('#changeEditReqBody [data-field="' + label + '"]:checked');
            data[prop] = Array.prototype.map.call(checkboxes, function(cb) { return cb.value; });
        } else {
            var inputEl = document.querySelector('#changeEditReqBody [data-field="' + label + '"]');
            data[prop] = inputEl ? inputEl.value : '';
        }
    });
    return data;
}

function saveChangeObjEdit() {
    if (currentEditChangeObjIndex === null && !isAddingNewIR) return;

    /* 新增IR模式：收集全部字段数据，存入tempData */
    if (isAddingNewIR) {
        var titleInput = document.querySelector('#changeEditReqBody [data-field="标题"]');
        var title = titleInput ? titleInput.value.trim() : '';
        if (!title) { alert('请输入标题'); return; }

        var formData = collectFormData(irEditableFields);
        formData.code = 'IR-2026-NEW-' + (currentChangeObjects.length + 1);
        formData.title = title;

        var obj = {
            reqType: 'IR',
            reqId: 'IR-NEW-' + Date.now(),
            reqCode: 'IR-2026-NEW-' + (currentChangeObjects.length + 1),
            reqTitle: title,
            changeCategory: '新增',
            changes: [],
            tempData: formData
        };
        currentChangeObjects.push(obj);

        closeModal('changeEditReqModal');
        isAddingNewIR = false;
        currentEditChangeObjIndex = null;
        currentEditOrigData = null;
        renderChangeCreateForm();
        refreshAggFields();
        return;
    }

    if (!currentEditOrigData) return;

    var obj = currentChangeObjects[currentEditChangeObjIndex];

    /* 变更分类为"新增"的对象：收集全部字段数据，存入tempData */
    if (obj.changeCategory === '新增') {
        var fieldsConfig = obj.reqType === 'IR' ? irEditableFields : srEditableFields;
        var formData = collectFormData(fieldsConfig);
        var newTitleInput = document.querySelector('#changeEditReqBody [data-field="标题"]');
        if (newTitleInput && newTitleInput.value.trim()) {
            obj.reqTitle = newTitleInput.value.trim();
            formData.title = obj.reqTitle;
        }
        formData.code = obj.reqCode;
        obj.tempData = formData;
        closeModal('changeEditReqModal');
        currentEditChangeObjIndex = null;
        currentEditOrigData = null;
        renderChangeCreateForm();
        refreshAggFields();
        return;
    }

    /* 变更分类为"删除"的对象：不比对变更前后，清空变更明细 */
    if (obj.changeCategory === '删除') {
        obj.changes = [];
        closeModal('changeEditReqModal');
        currentEditChangeObjIndex = null;
        currentEditOrigData = null;
        renderChangeCreateForm();
        refreshAggFields();
        return;
    }

    var origData = currentEditOrigData;
    var fieldsConfig = obj.reqType === 'IR' ? irEditableFields : srEditableFields;
    var allFields = fieldsConfig['基本信息'].concat(fieldsConfig['计划排期']);
    var newChanges = [];

    allFields.forEach(function(label) {
        var prop = fieldLabelToProp[label];
        var origVal = origData[prop];

        if (multiSelectOptions[label] || label === '适配品类') {
            /* 多选/分类：收集勾选的checkbox */
            var checkboxes = document.querySelectorAll('#changeEditReqBody [data-field="' + label + '"]:checked');
            var newVal = Array.prototype.map.call(checkboxes, function(cb) { return cb.value; });
            /* 规范化原始值为数组 */
            var origArr = [];
            if (Array.isArray(origVal)) {
                origArr = origVal.slice();
            } else if (origVal) {
                origArr = String(origVal).split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s; });
            }
            /* 比较数组 */
            var changed = false;
            if (newVal.length !== origArr.length) {
                changed = true;
            } else {
                for (var i = 0; i < newVal.length; i++) {
                    if (origArr.indexOf(newVal[i]) < 0) { changed = true; break; }
                }
            }
            if (changed) {
                newChanges.push({
                    field: label,
                    before: origArr.join(', ') || '（空）',
                    after: newVal.join(', ') || '（空）'
                });
            }
        } else {
            /* 单值字段：text, select, date, textarea */
            var inputEl = document.querySelector('#changeEditReqBody [data-field="' + label + '"]');
            var newVal = inputEl ? inputEl.value : '';
            var origStr = (origVal === null || origVal === undefined) ? '' : String(origVal);
            if (newVal !== origStr) {
                newChanges.push({
                    field: label,
                    before: origStr || '（空）',
                    after: newVal || '（空）'
                });
            }
        }
    });

    /* 更新变更对象的变更明细 */
    obj.changes = newChanges;

    /* 同步更新标题 */
    var titleInput = document.querySelector('#changeEditReqBody [data-field="标题"]');
    if (titleInput && titleInput.value) {
        obj.reqTitle = titleInput.value;
    }

    /* 关闭弹窗 */
    closeModal('changeEditReqModal');

    /* 重置全局变量 */
    currentEditChangeObjIndex = null;
    currentEditOrigData = null;

    /* 重新渲染表单 */
    renderChangeCreateForm();

    /* 反馈提示 */
    if (newChanges.length > 0) {
        /* 在控制台记录，不弹窗打断流程 */
    }
}

function updateChangeObj(index, prop, value) {
    if (currentChangeObjects[index]) {
        currentChangeObjects[index][prop] = value;
        refreshAggFields();
    }
}

function toggleChangeObjRow(index) {
    var row = document.getElementById('changeObjRow' + index);
    var detail = document.getElementById('changeDetailRows' + index);
    if (!row || !detail) return;
    var isCollapsed = row.classList.toggle('collapsed');
    detail.style.display = isCollapsed ? 'none' : '';
}

function addChangeFieldRow(objIndex) {
    var field = prompt('请输入变更字段名称（如：状态、需求等级、计划开发完成时间等）', '状态');
    if (!field) return;
    var before = prompt('变更前值', '');
    var after = prompt('变更后值', '');
    currentChangeObjects[objIndex].changes.push({ field: field, before: before || '', after: after || '' });
    renderChangeCreateForm();
    refreshAggFields();
}

function removeChangeFieldRow(objIndex, fieldIndex) {
    currentChangeObjects[objIndex].changes.splice(fieldIndex, 1);
    renderChangeCreateForm();
    refreshAggFields();
}

/* ========== 变更管理：提交变更 ========== */
function submitChange() {
    var title = document.getElementById('changeTitle').value.trim();
    if (!title) { alert('请输入变更标题'); return; }
    if (currentChangeObjects.length === 0) { alert('请至少添加一个变更对象'); return; }
    var affectFeature = document.getElementById('changeAffectFeature').value;
    var isValuePoint = document.getElementById('changeIsValuePoint').value;
    var changeOwner = document.getElementById('changeOwner').value.trim();
    var sourceDept = document.getElementById('changeSourceDept').value.trim();
    var changeReason = document.getElementById('changeReason').value.trim();
    var reviewConclusion = document.getElementById('changeReviewConclusion').value.trim();
    var reviewLink = document.getElementById('changeReviewLink').value.trim();

    if (!affectFeature) { alert('请选择是否影响特性'); return; }
    if (!isValuePoint) { alert('请选择是否价值点'); return; }
    if (!changeOwner) { alert('请输入变更责任人'); return; }
    if (!sourceDept) { alert('请输入变更来源部门'); return; }
    if (!changeReason) { alert('请输入变更原因'); return; }
    if (!reviewConclusion) { alert('请输入领域评审结论'); return; }
    if (!reviewLink) { alert('请输入评审结论链接'); return; }

    // 动态验证IR/SR变更因素
    var irFactorsField = document.getElementById('irFactorsField');
    var srFactorsField = document.getElementById('srFactorsField');
    var irFactors = document.getElementById('changeIrFactors').value;
    var srFactors = document.getElementById('changeSrFactors').value;
    if (irFactorsField && irFactorsField.style.display !== 'none' && !irFactors) {
        alert('请选择IR变更影响因素'); return;
    }
    if (srFactorsField && srFactorsField.style.display !== 'none' && !srFactors) {
        alert('请选择SR变更影响因素'); return;
    }

    // 校验：变更分类为"修改"的对象必须有变更字段信息
    for (var ci = 0; ci < currentChangeObjects.length; ci++) {
        var cobj = currentChangeObjects[ci];
        if (cobj.changeCategory === '修改' && cobj.changes.length === 0) {
            alert('变更对象【' + (cobj.reqTitle || '') + '】的变更分类为"修改"，必须有变更字段信息，否则不允许提交'); return;
        }
    }

    // 校验：是否影响特性为"是"时，变更对象里必须选择特性对象
    if (affectFeature === '是') {
        var hasFeatureObj = currentChangeObjects.some(function(o) { return o.reqType === '特性'; });
        if (!hasFeatureObj) {
            alert('是否影响特性选择了"是"，请在变更对象中选择或新增特性对象'); return;
        }
    }

    // 校验：变更标题含有"迁移"时，变更字段必须有"归属项目"的修改记录
    if (title.indexOf('迁移') >= 0) {
        var hasProjectChange = currentChangeObjects.some(function(obj) {
            return obj.changes.some(function(ch) { return ch.field === '归属项目'; });
        });
        if (!hasProjectChange) {
            alert('变更标题含有"迁移"字样，变更字段中必须有"归属项目"的修改记录'); return;
        }
    }

    // 确定适配品类（取变更对象中IR的categories）
    var categories = [];
    currentChangeObjects.forEach(function(o) {
        if (o.reqType === 'IR') {
            var ir = allData.ir.find(function(d) { return d.id === o.reqId; });
            if (ir && ir.categories) ir.categories.forEach(function(c) { if (categories.indexOf(c) < 0) categories.push(c); });
        }
    });
    if (categories.length === 0) categories = ['手机'];

    var reqLevel = autoAggReqLevel();
    var changeType = autoAggChangeType();
    var changeCategory = autoAggChangeCategory();

    var today = new Date().toISOString().slice(0, 10);

    /* 驳回后修改重提：更新已有变更记录，重置审批流程 */
    if (currentResubmitChangeId) {
        var existingChange = allData.changes.find(function(c) { return c.id === currentResubmitChangeId; });
        if (existingChange) {
            existingChange.title = title;
            existingChange.objects = JSON.parse(JSON.stringify(currentChangeObjects));
            existingChange.reqLevel = reqLevel;
            existingChange.changeType = changeType;
            existingChange.changeCategory = changeCategory;
            existingChange.affectFeature = affectFeature;
            existingChange.isValuePoint = isValuePoint;
            existingChange.changeOwner = changeOwner;
            existingChange.sourceDept = sourceDept.split(',').map(function(s) { return s.trim(); });
            existingChange.irFactors = document.getElementById('changeIrFactors').value;
            existingChange.srFactors = document.getElementById('changeSrFactors').value;
            existingChange.changeReason = changeReason;
            existingChange.reviewConclusion = reviewConclusion;
            existingChange.reviewLink = reviewLink;
            existingChange.remark = document.getElementById('changeRemark').value.trim();
            existingChange.status = '流程中';
            existingChange.endDate = null;
            existingChange.applyDate = today;
            /* 重置审批流程 */
            existingChange.workflow = determineWorkflow(reqLevel, changeType, categories);
        }
        currentResubmitChangeId = null;
        closeModal('changeCreateModal');
        renderChangeList();
        saveToStorage();
        alert('变更已修改并重新提交，审批流程已重启');
        return;
    }

    var newId = 'CR-2026-' + String(allData.changes.length + 1).padStart(3, '0');

    var change = {
        id: newId, code: newId, title: title, status: '流程中',
        objects: JSON.parse(JSON.stringify(currentChangeObjects)),
        reqLevel: reqLevel, changeType: changeType, changeCategory: changeCategory,
        affectFeature: affectFeature, isValuePoint: isValuePoint,
        changeOwner: changeOwner, sourceDept: sourceDept.split(',').map(function(s) { return s.trim(); }),
        irFactors: document.getElementById('changeIrFactors').value,
        srFactors: document.getElementById('changeSrFactors').value,
        changeReason: changeReason, reviewConclusion: reviewConclusion,
        reviewLink: reviewLink, remark: document.getElementById('changeRemark').value.trim(),
        applicant: changeOwner, applyDate: today, endDate: null,
        workflow: determineWorkflow(reqLevel, changeType, categories)
    };

    allData.changes.push(change);
    closeModal('changeCreateModal');
    renderChangeList();
    saveToStorage();
    alert('变更已提交，流程编码：' + newId + '\n审批流程已启动');
}

/* ========== 变更管理：电子流路由 ========== */
function determineWorkflow(reqLevel, changeType, categories) {
    var category = categories[0] || '手机';
    var approvers = approverConfig[category] || approverConfig['手机'];
    var roles = [];

    var hasIR = reqLevel.indexOf('初始需求IR') >= 0;
    var hasSR = reqLevel.indexOf('系统需求SR') >= 0;
    var hasDemand = changeType.indexOf('需求变更') >= 0;
    var hasPlan = changeType.indexOf('计划变更') >= 0;

    // 根据需求层级和变更类型确定审批角色
    if (hasIR && hasSR) {
        // IR + SR
        if (hasDemand && hasPlan) {
            roles = ['SPP', 'SE', 'SPM']; // SPP+SE+SPM
        } else if (hasDemand) {
            roles = ['SPP', 'SE']; // SPP+SE
        } else { // hasPlan
            roles = ['SPM']; // SPM
        }
    } else if (hasIR) {
        // IR only
        if (hasDemand && hasPlan) {
            roles = ['SPP', 'SPM']; // SPP&SPM
        } else if (hasDemand) {
            roles = ['SPP']; // SPP
        } else { // hasPlan
            roles = ['SPM']; // SPM
        }
    } else if (hasSR) {
        // SR only
        if (hasDemand && hasPlan) {
            roles = ['SE', 'SPM']; // SE&SPM
        } else if (hasDemand) {
            roles = ['SE']; // SE
        } else { // hasPlan
            roles = ['SPM']; // SPM
        }
    }

    // 确保最后一个审批人为SPM
    if (roles.length === 0 || roles[roles.length - 1] !== 'SPM') {
        roles.push('SPM');
    }

    var steps = roles.map(function(role) {
        return { role: role, approver: approvers[role] || '-', status: '待审批', comment: '' };
    });

    return { currentStep: 0, steps: steps };
}

/* ========== 变更管理：根据电子流流向生成测试用例 ========== */
function generateTestCases(change) {
    var cases = [];
    var tcId = 1;

    var hasIR = change.reqLevel.indexOf('初始需求IR') >= 0;
    var hasSR = change.reqLevel.indexOf('系统需求SR') >= 0;
    var hasDemand = change.changeType.indexOf('需求变更') >= 0;
    var hasPlan = change.changeType.indexOf('计划变更') >= 0;

    /* 1. 流程路由测试 */
    var flowDesc = change.workflow.steps.map(function(s) { return s.role + '(' + s.approver + ')'; }).join(' → ');
    var scenarioDesc = change.reqLevel + ' / ' + change.changeType;

    cases.push({
        id: 'TC-' + String(tcId++).padStart(3, '0'),
        category: '流程路由',
        title: '验证电子流审批路径正确',
        precondition: '场景：' + scenarioDesc + '\n变更分类：' + change.changeCategory,
        steps: '1.提交变更申请\n2.验证审批节点序列\n3.确认审批人列表',
        expected: '审批路径为：' + flowDesc + '\n共' + change.workflow.steps.length + '个审批节点'
    });

    /* 2. 场景路由验证（不同需求层级+变更类型组合） */
    if (hasIR && hasSR) {
        if (hasDemand && hasPlan) {
            cases.push({
                id: 'TC-' + String(tcId++).padStart(3, '0'),
                category: '场景路由',
                title: 'IR+SR / 需求变更+计划变更 → SPP+SE+SPM',
                precondition: '需求层级：IR+SR\n变更类型：需求变更+计划变更',
                steps: '1.提交包含IR和SR的变更\n2.验证需求基本信息和计划排期均有变更\n3.验证审批流程包含SPP、SE、SPM三个节点',
                expected: '路由到SPP → SE → SPM三级审批'
            });
        } else if (hasDemand) {
            cases.push({
                id: 'TC-' + String(tcId++).padStart(3, '0'),
                category: '场景路由',
                title: 'IR+SR / 需求变更 → SPP+SE',
                precondition: '需求层级：IR+SR\n变更类型：需求变更',
                steps: '1.提交包含IR和SR的变更\n2.验证仅需求基本信息有变更\n3.验证审批流程包含SPP、SE两个节点',
                expected: '路由到SPP → SE两级审批'
            });
        } else {
            cases.push({
                id: 'TC-' + String(tcId++).padStart(3, '0'),
                category: '场景路由',
                title: 'IR+SR / 计划变更 → SPM',
                precondition: '需求层级：IR+SR\n变更类型：计划变更',
                steps: '1.提交包含IR和SR的变更\n2.验证仅计划排期有变更\n3.验证审批流程仅包含SPM节点',
                expected: '路由到SPM单级审批'
            });
        }
    } else if (hasIR) {
        if (hasDemand && hasPlan) {
            cases.push({
                id: 'TC-' + String(tcId++).padStart(3, '0'),
                category: '场景路由',
                title: 'IR / 需求变更+计划变更 → SPP+SPM',
                precondition: '需求层级：IR\n变更类型：需求变更+计划变更',
                steps: '1.提交仅含IR的变更\n2.验证审批流程包含SPP、SPM两个节点',
                expected: '路由到SPP → SPM两级审批'
            });
        } else if (hasDemand) {
            cases.push({
                id: 'TC-' + String(tcId++).padStart(3, '0'),
                category: '场景路由',
                title: 'IR / 需求变更 → SPP',
                precondition: '需求层级：IR\n变更类型：需求变更',
                steps: '1.提交仅含IR的需求变更\n2.验证审批流程仅包含SPP节点',
                expected: '路由到SPP单级审批'
            });
        } else {
            cases.push({
                id: 'TC-' + String(tcId++).padStart(3, '0'),
                category: '场景路由',
                title: 'IR / 计划变更 → SPM',
                precondition: '需求层级：IR\n变更类型：计划变更',
                steps: '1.提交仅含IR的计划变更\n2.验证审批流程仅包含SPM节点',
                expected: '路由到SPM单级审批'
            });
        }
    } else if (hasSR) {
        if (hasDemand && hasPlan) {
            cases.push({
                id: 'TC-' + String(tcId++).padStart(3, '0'),
                category: '场景路由',
                title: 'SR / 需求变更+计划变更 → SE+SPM',
                precondition: '需求层级：SR\n变更类型：需求变更+计划变更',
                steps: '1.提交仅含SR的变更\n2.验证审批流程包含SE、SPM两个节点',
                expected: '路由到SE → SPM两级审批'
            });
        } else if (hasDemand) {
            cases.push({
                id: 'TC-' + String(tcId++).padStart(3, '0'),
                category: '场景路由',
                title: 'SR / 需求变更 → SE',
                precondition: '需求层级：SR\n变更类型：需求变更',
                steps: '1.提交仅含SR的需求变更\n2.验证审批流程仅包含SE节点',
                expected: '路由到SE单级审批'
            });
        } else {
            cases.push({
                id: 'TC-' + String(tcId++).padStart(3, '0'),
                category: '场景路由',
                title: 'SR / 计划变更 → SPM',
                precondition: '需求层级：SR\n变更类型：计划变更',
                steps: '1.提交仅含SR的计划变更\n2.验证审批流程仅包含SPM节点',
                expected: '路由到SPM单级审批'
            });
        }
    }

    /* 3. 各审批节点测试 */
    change.workflow.steps.forEach(function(step, idx) {
        cases.push({
            id: 'TC-' + String(tcId++).padStart(3, '0'),
            category: '审批节点',
            title: '验证' + step.role + '审批通过功能',
            precondition: '流程流转至第' + (idx + 1) + '步\n审批人：' + step.approver,
            steps: '1.登录审批人' + step.approver + '\n2.查看变更详情\n3.填写审批意见\n4.点击"通过"',
            expected: step.role + '能查看变更详情，填写意见后通过审批' + (idx < change.workflow.steps.length - 1 ? '，流程流转到下一节点' : '，流程结束')
        });
        cases.push({
            id: 'TC-' + String(tcId++).padStart(3, '0'),
            category: '审批节点',
            title: '验证' + step.role + '驳回功能',
            precondition: '流程流转至第' + (idx + 1) + '步\n审批人：' + step.approver,
            steps: '1.登录审批人' + step.approver + '\n2.填写审批意见（必填）\n3.点击"驳回"',
            expected: '流程退回给申请人，变更状态变为"待申请人确认"'
        });
        cases.push({
            id: 'TC-' + String(tcId++).padStart(3, '0'),
            category: '审批节点',
            title: '验证' + step.role + '转办功能',
            precondition: '流程流转至第' + (idx + 1) + '步\n审批人：' + step.approver,
            steps: '1.登录审批人' + step.approver + '\n2.点击"转办"\n3.选择转办人\n4.确认转办',
            expected: '审批权限转移给转办人，流程节点不改变'
        });
    });

    /* 4. 变更内容验证测试 */
    change.objects.forEach(function(obj) {
        if (obj.changes.length > 0) {
            obj.changes.forEach(function(ch) {
                cases.push({
                    id: 'TC-' + String(tcId++).padStart(3, '0'),
                    category: '变更内容',
                    title: '验证' + obj.reqTitle + '的"' + ch.field + '"变更',
                    precondition: '变更对象：' + obj.reqCode + '（' + obj.reqType + '）\n变更分类：' + obj.changeCategory,
                    steps: '1.查看变更对象详情\n2.验证"' + ch.field + '"字段变更前值\n3.验证"' + ch.field + '"字段变更后值',
                    expected: '"' + ch.field + '"字段从"' + ch.before + '"变更为"' + ch.after + '"'
                });
            });
        } else {
            cases.push({
                id: 'TC-' + String(tcId++).padStart(3, '0'),
                category: '变更内容',
                title: '验证' + obj.reqTitle + '的' + obj.changeCategory + '操作',
                precondition: '变更对象：' + obj.reqCode + '（' + obj.reqType + '）\n变更分类：' + obj.changeCategory,
                steps: '1.查看变更对象详情\n2.验证变更分类为"' + obj.changeCategory + '"',
                expected: obj.changeCategory === '新增' ? '新增需求正确创建并关联到变更，需求编码自动生成' : obj.changeCategory === '删除' ? '删除需求正确标记，变更明细清空' : '变更明细正确展示'
            });
        }
    });

    /* 5. 附加场景测试 */
    if (change.affectFeature === '是') {
        cases.push({
            id: 'TC-' + String(tcId++).padStart(3, '0'),
            category: '场景验证',
            title: '验证影响特性的变更包含特性对象',
            precondition: '是否影响特性=是',
            steps: '1.检查变更对象列表\n2.验证存在"特性"类型的变更对象\n3.验证特性变更内容完整',
            expected: '变更对象中包含特性对象，特性变更内容完整准确'
        });
    }
    if (change.isValuePoint === '是') {
        cases.push({
            id: 'TC-' + String(tcId++).padStart(3, '0'),
            category: '场景验证',
            title: '验证价值点变更的标记',
            precondition: '是否价值点=是',
            steps: '1.查看变更基本信息\n2.验证"是否价值点"字段为"是"',
            expected: '价值点变更正确标记，便于价值点统计'
        });
    }
    /* 驳回重提场景 */
    cases.push({
        id: 'TC-' + String(tcId++).padStart(3, '0'),
        category: '场景验证',
        title: '验证驳回后修改重提流程',
        precondition: '变更被任一审批节点驳回',
        steps: '1.审批人点击"驳回"\n2.申请人收到驳回通知\n3.申请人点击"修改后重新提交"\n4.修改变更内容\n5.重新提交',
        expected: '变更内容更新，审批流程从头重启，状态恢复为"流程中"'
    });

    return cases;
}

/* ========== 变更管理：审批 ========== */
function openChangeApproval(changeId) {
    var change = allData.changes.find(function(c) { return c.id === changeId; });
    if (!change) return;
    currentApprovalChangeId = changeId;
    renderChangeApprovalBody(change);
    document.getElementById('changeApprovalModal').classList.add('show');
}

function renderChangeApprovalBody(change, isDetail) {
    var bodyId = isDetail ? 'changeDetailBody' : 'changeApprovalBody';
    var body = document.getElementById(bodyId);
    var footer = document.getElementById('changeApprovalFooter');
    var html = '';

    // 变更基本信息
    html += '<div class="change-detail-section">';
    html += '<div class="change-section-title">变更基本信息</div>';
    html += '<div class="change-detail-grid">';
    html += '<div class="change-detail-item"><div class="change-detail-item-label">变更标题</div><div class="change-detail-item-value">' + escapeHtml(change.title) + '</div></div>';
    html += '<div class="change-detail-item"><div class="change-detail-item-label">流程编码</div><div class="change-detail-item-value">' + escapeHtml(change.code) + '</div></div>';
    html += '<div class="change-detail-item"><div class="change-detail-item-label">需求层级</div><div class="change-detail-item-value">' + escapeHtml(change.reqLevel) + '</div></div>';
    html += '<div class="change-detail-item"><div class="change-detail-item-label">变更类型</div><div class="change-detail-item-value">' + escapeHtml(change.changeType) + '</div></div>';
    html += '<div class="change-detail-item"><div class="change-detail-item-label">变更分类</div><div class="change-detail-item-value">' + escapeHtml(change.changeCategory) + '</div></div>';
    html += '<div class="change-detail-item"><div class="change-detail-item-label">变更状态</div><div class="change-detail-item-value">' + getChangeStatusBadge(change.status) + '</div></div>';
    html += '<div class="change-detail-item"><div class="change-detail-item-label">变更责任人</div><div class="change-detail-item-value">' + escapeHtml(change.changeOwner) + '</div></div>';
    html += '<div class="change-detail-item"><div class="change-detail-item-label">申请人</div><div class="change-detail-item-value">' + escapeHtml(change.applicant) + '</div></div>';
    html += '<div class="change-detail-item"><div class="change-detail-item-label">申请日期</div><div class="change-detail-item-value">' + escapeHtml(change.applyDate) + '</div></div>';
    html += '<div class="change-detail-item"><div class="change-detail-item-label">是否影响特性</div><div class="change-detail-item-value">' + escapeHtml(change.affectFeature) + '</div></div>';
    html += '<div class="change-detail-item"><div class="change-detail-item-label">是否价值点</div><div class="change-detail-item-value">' + escapeHtml(change.isValuePoint) + '</div></div>';
    html += '<div class="change-detail-item"><div class="change-detail-item-label">变更来源部门</div><div class="change-detail-item-value">' + escapeHtml(change.sourceDept.join(',')) + '</div></div>';
    html += '</div></div>';

    // 变更原因
    html += '<div class="change-detail-section"><div class="change-section-title">变更原因</div>';
    html += '<div style="font-size:13px;color:#475569;line-height:1.5;padding:8px;background:#f8fafc;border-radius:6px;">' + escapeHtml(change.changeReason) + '</div></div>';

    // 变更对象
    html += '<div class="change-detail-section"><div class="change-section-title">变更对象</div>';
    html += '<table class="change-objects-table"><thead><tr><th>变更分类</th><th>需求标题</th><th>需求编码</th><th>变更字段</th><th>变更前</th><th>变更后</th></tr></thead><tbody>';
    change.objects.forEach(function(obj) {
        if (obj.changes.length === 0) {
            html += '<tr><td>' + escapeHtml(obj.changeCategory) + '</td><td>' + escapeHtml(obj.reqTitle) + '</td><td>' + escapeHtml(obj.reqCode) + '</td><td colspan="3">-</td></tr>';
        } else {
            obj.changes.forEach(function(ch, idx) {
                if (idx === 0) {
                    html += '<tr><td rowspan="' + obj.changes.length + '">' + escapeHtml(obj.changeCategory) + '</td>';
                    html += '<td rowspan="' + obj.changes.length + '">' + escapeHtml(obj.reqTitle) + '</td>';
                    html += '<td rowspan="' + obj.changes.length + '">' + escapeHtml(obj.reqCode) + '</td>';
                } else {
                    html += '<tr>';
                }
                html += '<td>' + escapeHtml(ch.field) + '</td>';
                html += '<td><div class="change-before-after">' + escapeHtml(ch.before) + '</div></td>';
                html += '<td><div class="change-before-after">' + escapeHtml(ch.after) + '</div></td>';
                html += '</tr>';
            });
        }
    });
    html += '</tbody></table></div>';

    // 审批流程时间线
    html += '<div class="change-detail-section"><div class="change-section-title">审批流程</div>';
    html += '<div class="workflow-timeline">';
    // 申请人节点
    html += '<div class="workflow-step"><div class="workflow-step-icon approved">申</div>';
    html += '<div class="workflow-step-content"><div class="workflow-step-role">申请人</div>';
    html += '<div class="workflow-step-approver">' + escapeHtml(change.applicant) + '</div>';
    html += '<div class="workflow-step-status"><span class="badge badge-status-accepted">已提交</span></div></div></div>';

    change.workflow.steps.forEach(function(step, i) {
        var iconCls = 'pending';
        var iconText = step.role.substring(0, 1);
        if (step.status === '通过') { iconCls = 'approved'; }
        else if (step.status === '驳回') { iconCls = 'rejected'; }
        else if (i === change.workflow.currentStep) { iconCls = 'current'; }

        html += '<div class="workflow-step"><div class="workflow-step-icon ' + iconCls + '">' + iconText + '</div>';
        html += '<div class="workflow-step-content"><div class="workflow-step-role">' + escapeHtml(step.role) + '</div>';
        html += '<div class="workflow-step-approver">' + escapeHtml(step.approver) + '</div>';
        var statusBadge = step.status === '待审批' ? '<span class="badge badge-status-pending">' + step.status + '</span>'
            : step.status === '通过' ? '<span class="badge badge-status-accepted">' + step.status + '</span>'
            : '<span class="badge badge-status-review">' + step.status + '</span>';
        html += '<div class="workflow-step-status">' + statusBadge + '</div>';
        if (step.comment) {
            html += '<div class="workflow-step-comment">' + escapeHtml(step.comment) + '</div>';
        }
        html += '</div></div>';
    });
    html += '</div></div>';

    // 审批意见区（仅审批模式且当前步骤待审批时显示）
    var currentStep = change.workflow.steps[change.workflow.currentStep];
    if (!isDetail && currentStep && currentStep.status === '待审批') {
        html += '<div class="change-detail-section"><div class="change-section-title">审批意见</div>';
        html += '<textarea class="approval-textarea" id="approvalComment" placeholder="请输入审批意见（必填）：变更结论、变更风险评估、变更拒绝原因等"></textarea>';
        html += '<div class="approval-actions">';
        html += '<button class="toolbar-btn success" onclick="approveChange(\'通过\')">通过</button>';
        html += '<button class="toolbar-btn warning" onclick="approveChange(\'风险通过\')">风险通过</button>';
        html += '<button class="toolbar-btn danger" onclick="approveChange(\'驳回\')">驳回</button>';
        html += '<button class="toolbar-btn" onclick="openTransferModal()">转办</button>';
        html += '</div></div>';
    }

    // 申请人确认区（驳回后退回给申请人，仅审批模式且状态为待申请人确认时显示）
    if (!isDetail && change.status === '待申请人确认') {
        var rejectStep = change.workflow.steps[change.workflow.currentStep];
        var rejectComment = rejectStep ? rejectStep.comment : '';
        html += '<div class="change-detail-section"><div class="change-section-title">申请人确认</div>';
        html += '<div style="font-size:13px;color:#d97706;padding:8px 12px;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;margin-bottom:12px;line-height:1.5;">';
        html += '您的变更申请已被<strong>驳回</strong>。';
        if (rejectComment) {
            html += '<br>驳回意见：' + escapeHtml(rejectComment);
        }
        html += '<br>请选择「修改后重新提交」修改变更内容并重新提交审批，或「确认取消」终止此变更申请。';
        html += '</div>';
        html += '<div class="approval-actions">';
        html += '<button class="toolbar-btn primary" onclick="resubmitChange()">修改后重新提交</button>';
        html += '<button class="toolbar-btn danger" onclick="confirmCancelChange()">确认取消</button>';
        html += '</div></div>';
    }

    body.innerHTML = html;

    // 更新Footer（仅审批模式）
    if (!isDetail && footer) {
        if (currentStep && currentStep.status === '待审批') {
            footer.innerHTML = '<button class="toolbar-btn" onclick="closeModal(\'changeApprovalModal\')">关闭</button>';
        } else {
            footer.innerHTML = '<button class="toolbar-btn" onclick="closeModal(\'changeApprovalModal\')">关闭</button>';
        }
    }
}

function approveChange(action) {
    var change = allData.changes.find(function(c) { return c.id === currentApprovalChangeId; });
    if (!change) return;
    var comment = document.getElementById('approvalComment').value.trim();
    if (!comment) { alert('请输入审批意见'); return; }

    var step = change.workflow.steps[change.workflow.currentStep];
    step.comment = comment;

    if (action === '通过' || action === '风险通过') {
        step.status = '通过';
        change.workflow.currentStep++;
        if (change.workflow.currentStep >= change.workflow.steps.length) {
            change.status = '变更结束';
            change.endDate = new Date().toISOString().slice(0, 10);
        }
    } else if (action === '驳回') {
        step.status = '驳回';
        change.status = '待申请人确认';
    }

    renderChangeList();
    renderChangeApprovalBody(change);
    saveToStorage();
    alert(action === '通过' || action === '风险通过' ? (change.status === '变更结束' ? '审批通过，流程已结束' : '审批通过，流转到下一节点') : '已驳回，流程已退回给申请人确认');
}

/* ========== 变更管理：驳回后修改重提 ========== */
function resubmitChange() {
    var change = allData.changes.find(function(c) { return c.id === currentApprovalChangeId; });
    if (!change) return;

    /* 加载现有变更对象到工作数组 */
    currentChangeObjects = JSON.parse(JSON.stringify(change.objects));
    currentResubmitChangeId = change.id;

    /* 关闭审批弹窗 */
    closeModal('changeApprovalModal');

    /* 打开发起变更表单，预填数据 */
    renderChangeCreateForm();
    document.getElementById('changeTitle').value = change.title;
    document.getElementById('changeAffectFeature').value = change.affectFeature || '';
    document.getElementById('changeIsValuePoint').value = change.isValuePoint || '';
    document.getElementById('changeOwner').value = change.changeOwner || '';
    document.getElementById('changeSourceDept').value = (change.sourceDept || []).join(',');
    document.getElementById('changeReason').value = change.changeReason || '';
    document.getElementById('changeReviewConclusion').value = change.reviewConclusion || '';
    document.getElementById('changeReviewLink').value = change.reviewLink || '';
    var remarkEl = document.getElementById('changeRemark');
    if (remarkEl) remarkEl.value = change.remark || '';
    var irFactorsEl = document.getElementById('changeIrFactors');
    if (irFactorsEl && change.irFactors) irFactorsEl.value = change.irFactors;
    var srFactorsEl = document.getElementById('changeSrFactors');
    if (srFactorsEl && change.srFactors) srFactorsEl.value = change.srFactors;

    refreshAggFields();
    document.getElementById('changeCreateModal').classList.add('show');
}

/* ========== 变更管理：确认取消 ========== */
function confirmCancelChange() {
    if (!confirm('确认取消此变更申请？取消后无法恢复。')) return;
    var change = allData.changes.find(function(c) { return c.id === currentApprovalChangeId; });
    if (!change) return;
    change.status = '已取消';
    change.endDate = new Date().toISOString().slice(0, 10);
    renderChangeList();
    closeModal('changeApprovalModal');
    saveToStorage();
    alert('变更申请已取消');
}

/* ========== 变更管理：转办 ========== */
function openTransferModal() {
    var change = allData.changes.find(function(c) { return c.id === currentApprovalChangeId; });
    if (!change) return;
    var step = change.workflow.steps[change.workflow.currentStep];
    currentTransferStepIndex = change.workflow.currentStep;
    var body = document.getElementById('transferBody');
    var html = '<div style="font-size:13px;margin-bottom:12px;">当前节点：' + escapeHtml(step.role) + ' - ' + escapeHtml(step.approver) + '</div>';
    html += '<div style="font-size:13px;margin-bottom:8px;">选择新的评审人：</div>';
    html += '<select id="transferApprover" style="width:100%;padding:8px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;">';
    html += '<option value="">请选择</option>';
    // 列出该品类下的所有审批人
    var category = '手机';
    var approvers = approverConfig[category] || approverConfig['手机'];
    Object.keys(approvers).forEach(function(role) {
        if (role !== step.role) {
            html += '<option value="' + role + ':' + approvers[role] + '">' + role + ' - ' + approvers[role] + '</option>';
        }
    });
    html += '</select>';
    body.innerHTML = html;
    document.getElementById('transferModal').classList.add('show');
}

function confirmTransfer() {
    var select = document.getElementById('transferApprover');
    if (!select || !select.value) { alert('请选择转办人'); return; }
    var parts = select.value.split(':');
    var role = parts[0], name = parts[1];
    var change = allData.changes.find(function(c) { return c.id === currentApprovalChangeId; });
    if (!change) return;
    var step = change.workflow.steps[currentTransferStepIndex];
    step.role = role;
    step.approver = name;
    closeModal('transferModal');
    renderChangeApprovalBody(change);
    saveToStorage();
    alert('已转办给 ' + role + ' - ' + name);
}

/* ========== 变更管理：详情查看 ========== */
function openChangeDetail(changeId) {
    var change = allData.changes.find(function(c) { return c.id === changeId; });
    if (!change) return;
    renderChangeApprovalBody(change, true);
    document.getElementById('changeDetailModal').classList.add('show');
}

/* ========== 启动 ========== */
initPage();