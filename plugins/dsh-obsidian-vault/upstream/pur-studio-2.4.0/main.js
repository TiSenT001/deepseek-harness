const { Plugin, ItemView, Menu, FuzzySuggestModal, Notice, PluginSettingTab, Setting, normalizePath, addIcon, TFile } = require('obsidian');
const path = require('path');
const { exec, execFile } = require('child_process');

// ================== 默认设置 ==================
const DEFAULT_SETTINGS = {
  canvasData: {
    elements: [],
    viewState: { offsetX: 0, offsetY: 0, scale: 1 }
  },
  preferences: {
    backgroundColor: 'obsidian',
    gridColor: '#333333',
    showGrid: true,
    lang: 'zh',
  }
};

// ================== i18n ==================
const L = {
  zh: {
    openPur: '打开 Pur Studio',
    newCanvas: '新建 Pur Studio 画布',
    saveStudioAs: '保存画布为文件...',
    saveAsPur: '保存为 .PurStudio',
    exportMd: '保存为 Markdown',
    exportPng: '导出为 PNG',
    exportJpg: '导出为 JPG',
    newText: '新建文本',
    addNoteLink: '添加笔记链接',
    importLocal: '导入本地文件',
    importNet: '导入网络数据/链接',
    embedNote: '嵌入当前笔记',
    open: '打开',
    openNewTab: '在新标签页打开',
    openRight: '在右侧打开',
    copy: '复制',
    duplicate: '创建副本',
    delete: '删除',
    group: '创建群组',
    ungroup: '取消群组',
    edit: '编辑',
    editLabel: '编辑群组名称',
    linkNote: '关联笔记',
    modLinkNote: '修改关联笔记',
    unlinkNote: '取消关联笔记',
    editLine: '编辑虚线注释',
    lock: '锁定',
    unlock: '解锁',
    copyLink: '复制链接',
    revealExplorer: '在资源管理器中显示',
    fitView: '适应视图 (F)',
    saveExport: '保存/导出',
    arrange: '排列与对齐',
    alignTop: '顶对齐',
    alignLeft: '左对齐',
    alignCenter: '居中对齐',
    distH: '水平等距',
    scaleUni: '统一缩放',
    popout: '弹出为独立窗口',
    mergeMain: '合并到主窗口',
    pinTop: '启动系统置顶',
    unpinTop: '取消系统置顶',
    editNode: '编辑节点',
    addInPin: '+ 添加输入引脚',
    addOutPin: '+ 添加输出引脚',
    delInPin: '- 删除输入引脚',
    delOutPin: '- 删除输出引脚',
    genCode: '生成可运行代码',
    exportCode: '导出并运行代码',
    import: '导入',
    input: '输入',
    output: '输出',
    nodeTitle: '节点',
    save: '保存',
    cancel: '取消',
    confirm: '确定',
    loadImg: '加载中...',
    dblClickEdit: '双击编辑文本',
    imgNoteLink: '图片关联笔记',
    imgModLink: '修改图片关联笔记',
    imgUnlink: '取消图片关联',
    saved: '已保存',
    saveFailed: '保存失败',
    exported: '已导出',
    importFailed: '导入图片失败',
    noExportContent: '选中的节点没有可导出的纯文本/代码内容！',
    lockedNotice: '已锁定，不能编辑',
    embeddedTo: '已嵌入',
    linkedNotice: '已关联笔记',
    groupLinked: '群组已关联',
    copied: '已复制',
    uploaded: '文件已上传',
    noCodeNodes: '画布上没有可连线的节点（添加引脚后即可生成代码）！',
    select2group: '请选择至少2个非连线元素创建群组',
    bgColor: '背景颜色',
    bgColorDesc: '十六进制颜色值，填 obsidian 跟随系统主题，填 transparent 为透明',
    gridColor: '网格颜色',
    gridColorDesc: '画布网格线颜色',
    showGrid: '显示网格',
    settingsTitle: 'Pur Studio 设置',
    purCanvas: '画布',
    img: '图片',
    text: '文本',
    noteLink: '笔记链接',
    codeNode: '代码节点',
    groupLabel: '群组',
    line: '连线',
    pos: '位置',
    size: '尺寸',
    contains: '包含',
    elements: '个元素',
    title: '标题',
    rotation: '旋转',
    locked: '已锁定',
    pins: '引脚',
    path: '路径',
    summary: '摘要',
    exportTitle: '导出',
    exportFile: '文件',
    exportTime: '导出时间',
    totalElements: '元素总数',
    downloadVideo: '📥 开始下载视频...',
    videoDone: '✅ 视频已下载到 附件/',
    videoFailed: '❌ 下载失败',
    cantDeleteLastPin: '不能删除最后一个引脚',
    lang: '语言',
  },
  en: {
    openPur: 'Open Pur Studio',
    newCanvas: 'New Pur Studio',
    saveStudioAs: 'Save Pur Studio As...',
    saveAsPur: 'Save as .PurStudio',
    exportMd: 'Save as Markdown',
    exportPng: 'Export as PNG',
    exportJpg: 'Export as JPG',
    newText: 'New Text',
    addNoteLink: 'Add Note Link',
    importLocal: 'Import Local Files',
    importNet: 'Import Web Data / Link',
    embedNote: 'Embed in Current Note',
    open: 'Open',
    openNewTab: 'Open in New Tab',
    openRight: 'Open to the Right',
    copy: 'Copy',
    duplicate: 'Duplicate',
    delete: 'Delete',
    group: 'Create Group',
    ungroup: 'Ungroup',
    edit: 'Edit',
    editLabel: 'Edit Group Name',
    linkNote: 'Link Note',
    modLinkNote: 'Change Linked Note',
    unlinkNote: 'Unlink Note',
    editLine: 'Edit Line Label',
    lock: 'Lock',
    unlock: 'Unlock',
    copyLink: 'Copy Link',
    revealExplorer: 'Reveal in Explorer',
    fitView: 'Fit to View (F)',
    saveExport: 'Save / Export',
    arrange: 'Arrange & Align',
    alignTop: 'Align Top',
    alignLeft: 'Align Left',
    alignCenter: 'Align Center',
    distH: 'Distribute Horizontally',
    scaleUni: 'Uniform Scale',
    popout: 'Pop Out as Window',
    mergeMain: 'Merge to Main Window',
    pinTop: 'Always on Top',
    unpinTop: 'Remove Always on Top',
    editNode: 'Edit Node',
    addInPin: '+ Add Input Pin',
    addOutPin: '+ Add Output Pin',
    delInPin: '- Remove Input Pin',
    delOutPin: '- Remove Output Pin',
    genCode: 'Generate Runnable Code',
    exportCode: 'Export & Run Code',
    import: 'Import',
    input: 'Input',
    output: 'Output',
    nodeTitle: 'Node',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    loadImg: 'Loading...',
    dblClickEdit: 'Double-click to edit',
    imgNoteLink: 'Link Image to Note',
    imgModLink: 'Change Image Note Link',
    imgUnlink: 'Unlink Image from Note',
    saved: 'Saved',
    saveFailed: 'Save Failed',
    exported: 'Exported',
    importFailed: 'Import Image Failed',
    noExportContent: 'No exportable text/code content in selected nodes!',
    lockedNotice: 'Locked, cannot edit',
    embeddedTo: 'Embedded to',
    linkedNotice: 'Linked to note',
    groupLinked: 'Group linked to',
    copied: 'Copied',
    uploaded: 'File uploaded',
    noCodeNodes: 'No connectable nodes on canvas (add pins first to generate code)!',
    select2group: 'Please select at least 2 non-line elements to create a group',
    bgColor: 'Background Color',
    bgColorDesc: 'Hex color value, or "obsidian" to follow theme, "transparent" for transparent',
    gridColor: 'Grid Color',
    gridColorDesc: 'Canvas grid line color',
    showGrid: 'Show Grid',
    settingsTitle: 'Pur Studio Settings',
    purCanvas: 'Canvas',
    img: 'Image',
    text: 'Text',
    noteLink: 'Note Link',
    codeNode: 'Code Node',
    groupLabel: 'Group',
    line: 'Line',
    pos: 'Position',
    size: 'Size',
    contains: 'Contains',
    elements: 'elements',
    title: 'Title',
    rotation: 'Rotation',
    locked: 'Locked',
    pins: 'Pins',
    path: 'Path',
    summary: 'Summary',
    exportTitle: 'Export',
    exportFile: 'File',
    exportTime: 'Export Time',
    totalElements: 'Total Elements',
    downloadVideo: '📥 Downloading video...',
    videoDone: '✅ Video downloaded to attachments/',
    videoFailed: '❌ Download failed',
    cantDeleteLastPin: 'Cannot delete last pin',
    lang: 'Language',
  }
};
const t = (plugin, key) => (L[plugin?.settings?.preferences?.lang || 'zh'] || L.zh)[key] || key;
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// 计算节点高度（根据引脚数量）
function calcNodeHeight(node) {
  const pinCount = Math.max((node.inputs || []).length, (node.outputs || []).length, 1);
  return 60 + pinCount * 28;
}

// ---- 58 预制代码节点（可视化编程 code-node 预制库） ----
const CODE_NODE_PRESETS = [
  { id: "math-add", title: "加法", cat: "数学", inputs: ["a", "b"], outputs: ["sum"], code: "function process(inputs) {\n  const { a, b } = inputs;\n  return { sum: a + b };\n}" },
  { id: "math-sub", title: "减法", cat: "数学", inputs: ["a", "b"], outputs: ["diff"], code: "function process(inputs) {\n  const { a, b } = inputs;\n  return { diff: a - b };\n}" },
  { id: "math-mul", title: "乘法", cat: "数学", inputs: ["a", "b"], outputs: ["product"], code: "function process(inputs) {\n  const { a, b } = inputs;\n  return { product: a * b };\n}" },
  { id: "math-div", title: "除法", cat: "数学", inputs: ["a", "b"], outputs: ["quotient"], code: "function process(inputs) {\n  const { a, b } = inputs;\n  return { quotient: a / b };\n}" },
  { id: "math-mod", title: "取模", cat: "数学", inputs: ["a", "b"], outputs: ["result"], code: "function process(inputs) {\n  const { a, b } = inputs;\n  return { result: a % b };\n}" },
  { id: "math-pow", title: "幂", cat: "数学", inputs: ["base", "exp"], outputs: ["result"], code: "function process(inputs) {\n  const { base, exp } = inputs;\n  return { result: Math.pow(base, exp) };\n}" },
  { id: "math-sqrt", title: "平方根", cat: "数学", inputs: ["x"], outputs: ["result"], code: "function process(inputs) {\n  const { x } = inputs;\n  return { result: Math.sqrt(x) };\n}" },
  { id: "math-abs", title: "绝对值", cat: "数学", inputs: ["x"], outputs: ["result"], code: "function process(inputs) {\n  const { x } = inputs;\n  return { result: Math.abs(x) };\n}" },
  { id: "math-ceil", title: "向上取整", cat: "数学", inputs: ["x"], outputs: ["result"], code: "function process(inputs) {\n  const { x } = inputs;\n  return { result: Math.ceil(x) };\n}" },
  { id: "math-floor", title: "向下取整", cat: "数学", inputs: ["x"], outputs: ["result"], code: "function process(inputs) {\n  const { x } = inputs;\n  return { result: Math.floor(x) };\n}" },
  { id: "math-round", title: "四舍五入", cat: "数学", inputs: ["x"], outputs: ["result"], code: "function process(inputs) {\n  const { x } = inputs;\n  return { result: Math.round(x) };\n}" },
  { id: "math-sin", title: "正弦", cat: "数学", inputs: ["x"], outputs: ["result"], code: "function process(inputs) {\n  const { x } = inputs;\n  return { result: Math.sin(x) };\n}" },
  { id: "math-cos", title: "余弦", cat: "数学", inputs: ["x"], outputs: ["result"], code: "function process(inputs) {\n  const { x } = inputs;\n  return { result: Math.cos(x) };\n}" },
  { id: "math-random", title: "随机数", cat: "数学", inputs: ["min", "max"], outputs: ["result"], code: "function process(inputs) {\n  const { min, max } = inputs;\n  return { result: min + Math.random() * (max - min) };\n}" },
  { id: "math-min", title: "最小值", cat: "数学", inputs: ["a", "b"], outputs: ["result"], code: "function process(inputs) {\n  const { a, b } = inputs;\n  return { result: Math.min(a, b) };\n}" },
  { id: "math-max", title: "最大值", cat: "数学", inputs: ["a", "b"], outputs: ["result"], code: "function process(inputs) {\n  const { a, b } = inputs;\n  return { result: Math.max(a, b) };\n}" },
  { id: "logic-and", title: "与", cat: "逻辑", inputs: ["a", "b"], outputs: ["result"], code: "function process(inputs) {\n  const { a, b } = inputs;\n  return { result: !!(a && b) };\n}" },
  { id: "logic-or", title: "或", cat: "逻辑", inputs: ["a", "b"], outputs: ["result"], code: "function process(inputs) {\n  const { a, b } = inputs;\n  return { result: !!(a || b) };\n}" },
  { id: "logic-not", title: "非", cat: "逻辑", inputs: ["a"], outputs: ["result"], code: "function process(inputs) {\n  const { a } = inputs;\n  return { result: !a };\n}" },
  { id: "logic-xor", title: "异或", cat: "逻辑", inputs: ["a", "b"], outputs: ["result"], code: "function process(inputs) {\n  const { a, b } = inputs;\n  return { result: Boolean(a) !== Boolean(b) };\n}" },
  { id: "logic-gt", title: "大于", cat: "逻辑", inputs: ["a", "b"], outputs: ["result"], code: "function process(inputs) {\n  const { a, b } = inputs;\n  return { result: a > b };\n}" },
  { id: "logic-lt", title: "小于", cat: "逻辑", inputs: ["a", "b"], outputs: ["result"], code: "function process(inputs) {\n  const { a, b } = inputs;\n  return { result: a < b };\n}" },
  { id: "logic-eq", title: "等于", cat: "逻辑", inputs: ["a", "b"], outputs: ["result"], code: "function process(inputs) {\n  const { a, b } = inputs;\n  return { result: a === b };\n}" },
  { id: "logic-if", title: "条件分支", cat: "逻辑", inputs: ["condition", "thenValue", "elseValue"], outputs: ["result"], code: "function process(inputs) {\n  const { condition, thenValue, elseValue } = inputs;\n  return { result: condition ? thenValue : elseValue };\n}" },
  { id: "str-concat", title: "拼接", cat: "字符串", inputs: ["a", "b"], outputs: ["result"], code: "function process(inputs) {\n  const { a, b } = inputs;\n  return { result: String(a) + String(b) };\n}" },
  { id: "str-upper", title: "转大写", cat: "字符串", inputs: ["text"], outputs: ["result"], code: "function process(inputs) {\n  const { text } = inputs;\n  return { result: String(text).toUpperCase() };\n}" },
  { id: "str-lower", title: "转小写", cat: "字符串", inputs: ["text"], outputs: ["result"], code: "function process(inputs) {\n  const { text } = inputs;\n  return { result: String(text).toLowerCase() };\n}" },
  { id: "str-len", title: "长度", cat: "字符串", inputs: ["text"], outputs: ["result"], code: "function process(inputs) {\n  const { text } = inputs;\n  return { result: String(text).length };\n}" },
  { id: "str-split", title: "分割", cat: "字符串", inputs: ["text", "sep"], outputs: ["result"], code: "function process(inputs) {\n  const { text, sep } = inputs;\n  return { result: String(text).split(sep) };\n}" },
  { id: "str-replace", title: "替换", cat: "字符串", inputs: ["text", "find", "replacement"], outputs: ["result"], code: "function process(inputs) {\n  const { text, find, replacement } = inputs;\n  return { result: String(text).split(find).join(replacement) };\n}" },
  { id: "str-slice", title: "截取", cat: "字符串", inputs: ["text", "start", "end"], outputs: ["result"], code: "function process(inputs) {\n  const { text, start, end } = inputs;\n  return { result: String(text).slice(start, end) };\n}" },
  { id: "str-includes", title: "包含", cat: "字符串", inputs: ["text", "search"], outputs: ["result"], code: "function process(inputs) {\n  const { text, search } = inputs;\n  return { result: String(text).includes(search) };\n}" },
  { id: "arr-make", title: "创建数组", cat: "数组", inputs: ["a", "b"], outputs: ["result"], code: "function process(inputs) {\n  const { a, b } = inputs;\n  return { result: [a, b] };\n}" },
  { id: "arr-len", title: "数组长度", cat: "数组", inputs: ["arr"], outputs: ["result"], code: "function process(inputs) {\n  const { arr } = inputs;\n  return { result: (arr || []).length };\n}" },
  { id: "arr-push", title: "追加", cat: "数组", inputs: ["arr", "item"], outputs: ["result"], code: "function process(inputs) {\n  const { arr, item } = inputs;\n  return { result: (arr || []).concat(item) };\n}" },
  { id: "arr-concat", title: "合并", cat: "数组", inputs: ["arr1", "arr2"], outputs: ["result"], code: "function process(inputs) {\n  const { arr1, arr2 } = inputs;\n  return { result: (arr1 || []).concat(arr2 || []) };\n}" },
  { id: "arr-map", title: "映射", cat: "数组", inputs: ["arr"], outputs: ["result"], code: "function process(inputs) {\n  const { arr } = inputs;\n  return { result: (arr || []).map(x => x * 2) };\n}" },
  { id: "arr-filter", title: "过滤", cat: "数组", inputs: ["arr"], outputs: ["result"], code: "function process(inputs) {\n  const { arr } = inputs;\n  return { result: (arr || []).filter(x => x > 0) };\n}" },
  { id: "arr-sort", title: "排序", cat: "数组", inputs: ["arr"], outputs: ["result"], code: "function process(inputs) {\n  const { arr } = inputs;\n  return { result: (arr || []).slice().sort((x, y) => x - y) };\n}" },
  { id: "arr-sum", title: "求和", cat: "数组", inputs: ["arr"], outputs: ["result"], code: "function process(inputs) {\n  const { arr } = inputs;\n  return { result: (arr || []).reduce((s, x) => s + x, 0) };\n}" },
  { id: "obj-make", title: "创建对象", cat: "对象", inputs: ["key", "value"], outputs: ["result"], code: "function process(inputs) {\n  const { key, value } = inputs;\n  return { result: { [key]: value } };\n}" },
  { id: "obj-get", title: "取键", cat: "对象", inputs: ["obj", "key"], outputs: ["result"], code: "function process(inputs) {\n  const { obj, key } = inputs;\n  return { result: obj ? obj[key] : undefined };\n}" },
  { id: "obj-keys", title: "取所有键", cat: "对象", inputs: ["obj"], outputs: ["result"], code: "function process(inputs) {\n  const { obj } = inputs;\n  return { result: obj ? Object.keys(obj) : [] };\n}" },
  { id: "obj-values", title: "取所有值", cat: "对象", inputs: ["obj"], outputs: ["result"], code: "function process(inputs) {\n  const { obj } = inputs;\n  return { result: obj ? Object.values(obj) : [] };\n}" },
  { id: "obj-merge", title: "合并对象", cat: "对象", inputs: ["a", "b"], outputs: ["result"], code: "function process(inputs) {\n  const { a, b } = inputs;\n  return { result: Object.assign({}, a || {}, b || {}) };\n}" },
  { id: "ctrl-range", title: "范围", cat: "控制流", inputs: ["start", "end"], outputs: ["result"], code: "function process(inputs) {\n  const { start, end } = inputs;\n  return { result: Array.from({ length: Math.max(0, end - start) }, (_, i) => start + i) };\n}" },
  { id: "ctrl-sumrange", title: "求和循环", cat: "控制流", inputs: ["n"], outputs: ["result"], code: "function process(inputs) {\n  const { n } = inputs;\n  let s = 0;\n  for (let i = 1; i <= n; i++) s += i;\n  return { result: s };\n}" },
  { id: "ctrl-factorial", title: "阶乘", cat: "控制流", inputs: ["n"], outputs: ["result"], code: "function process(inputs) {\n  const { n } = inputs;\n  let s = 1;\n  for (let i = 2; i <= n; i++) s *= i;\n  return { result: s };\n}" },
  { id: "ctrl-fib", title: "斐波那契", cat: "控制流", inputs: ["n"], outputs: ["result"], code: "function process(inputs) {\n  const { n } = inputs;\n  let a = 0, b = 1;\n  for (let i = 0; i < n; i++) { const t = a + b; a = b; b = t; }\n  return { result: a };\n}" },
  { id: "ctrl-counter", title: "计数器", cat: "控制流", inputs: ["prev"], outputs: ["result"], code: "function process(inputs) {\n  const { prev } = inputs;\n  return { result: (prev || 0) + 1 };\n}" },
  { id: "util-log", title: "打印", cat: "工具", inputs: ["value"], outputs: ["result"], code: "function process(inputs) {\n  const { value } = inputs;\n  console.log('Pur Studio:', value);\n  return { result: value };\n}" },
  { id: "util-identity", title: "恒等", cat: "工具", inputs: ["value"], outputs: ["result"], code: "function process(inputs) {\n  const { value } = inputs;\n  return { result: value };\n}" },
  { id: "util-const", title: "常量", cat: "工具", inputs: [], outputs: ["result"], code: "function process() {\n  return { result: 42 };\n}" },
  { id: "util-now", title: "时间戳", cat: "工具", inputs: [], outputs: ["result"], code: "function process() {\n  return { result: Date.now() };\n}" },
  { id: "util-date", title: "当前日期", cat: "工具", inputs: [], outputs: ["result"], code: "function process() {\n  return { result: new Date().toISOString() };\n}" },
  { id: "util-typeof", title: "类型判断", cat: "工具", inputs: ["value"], outputs: ["result"], code: "function process(inputs) {\n  const { value } = inputs;\n  return { result: typeof value };\n}" },
  { id: "util-tonum", title: "转数字", cat: "工具", inputs: ["text"], outputs: ["result"], code: "function process(inputs) {\n  const { text } = inputs;\n  return { result: parseFloat(text) };\n}" },
  { id: "util-tostr", title: "转字符串", cat: "工具", inputs: ["value"], outputs: ["result"], code: "function process(inputs) {\n  const { value } = inputs;\n  return { result: String(value) };\n}" }
];

// ---- JSON Canvas 标准格式转换（Obsidian .canvas 对齐） ----
const PUR_META = '__pur';

function elementsToJSONCanvas(elements) {
  const nodes = [], edges = [];
  const walk = (els, px, py, parentId) => {
    for (const el of els) {
      if (el.type === 'line') {
        edges.push({
          id: el.id, fromNode: el.from || '', toNode: el.to || '',
          fromSide: el.fromSide || 'right', toSide: el.toSide || 'left',
          color: el.color, label: el.content || '',
          [PUR_META]: { fromPin: el.fromPin, toPin: el.toPin, style: el.style, arrow: el.arrow, arrowSize: el.arrowSize }
        });
        continue;
      }
      const ax = el.x + (px || 0), ay = el.y + (py || 0);
      const pur = Object.assign({}, el);
      delete pur.id; delete pur.x; delete pur.y; delete pur.w; delete pur.h; delete pur.children;
      if (parentId) pur.parentGroupId = parentId;
      if (el.type === 'group') {
        nodes.push({ id: el.id, type: 'group', x: ax, y: ay, width: el.w || 0, height: el.h || 0, label: el.content || '', color: el.color, [PUR_META]: pur });
        if (el.children && el.children.length) walk(el.children, ax, ay, el.id);
      } else if (el.type === 'image') {
        nodes.push({ id: el.id, type: 'file', x: ax, y: ay, width: el.w || 0, height: el.h || 0, file: el.original || '', [PUR_META]: pur });
      } else if (el.type === 'note-link') {
        const isUrl = el.link && /^https?:/i.test(el.link);
        const n = { id: el.id, type: isUrl ? 'link' : 'file', x: ax, y: ay, width: el.w || 0, height: el.h || 0, [PUR_META]: pur };
        if (isUrl) n.url = el.link || ''; else n.file = el.link || '';
        nodes.push(n);
      } else if (el.type === 'code-node') {
        nodes.push({ id: el.id, type: 'text', x: ax, y: ay, width: el.w || 0, height: el.h || 0, text: '```javascript\n' + (el.code || el.content || '') + '\n```', [PUR_META]: pur });
      } else {
        nodes.push({ id: el.id, type: 'text', x: ax, y: ay, width: el.w || 0, height: el.h || 0, text: el.content || '', [PUR_META]: pur });
      }
    }
  };
  walk(elements, 0, 0, null);
  return { nodes, edges };
}

function elFromNode(n, pur) {
  if (pur && pur.type) {
    // __pur 导出时已 delete id/x/y/w/h，故 pur.id/pur.w/pur.h 恒为 undefined，这些回退是死代码
    const el = Object.assign({
      id: n.id || generateId(),
      x: n.x || 0, y: n.y || 0,
      w: n.width !== undefined ? n.width : 0,
      h: n.height !== undefined ? n.height : 0
    }, pur);
    delete el.parentGroupId;
    return el;
  }
  if (n.type === 'file') {
    const f = n.file || '';
    if (/\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(f)) {
      return { id: n.id || generateId(), type: 'image', x: n.x || 0, y: n.y || 0, w: n.width || 300, h: n.height || 200, original: f, rotation: 0, opacity: 1 };
    }
    return { id: n.id || generateId(), type: 'note-link', x: n.x || 0, y: n.y || 0, w: n.width || 280, h: n.height || 80, content: f, link: f, rotation: 0, opacity: 1 };
  }
  if (n.type === 'link') {
    return { id: n.id || generateId(), type: 'note-link', x: n.x || 0, y: n.y || 0, w: n.width || 280, h: n.height || 80, content: n.url || '', link: n.url || '', rotation: 0, opacity: 1 };
  }
  return { id: n.id || generateId(), type: 'text', x: n.x || 0, y: n.y || 0, w: n.width || 250, h: n.height || 60, content: n.text || '', bgColor: 'rgba(30,30,30,0.8)', color: n.color || '#e0e0e0', fontSize: 14, rotation: 0, opacity: 1 };
}

function jsonCanvasToElements(data) {
  const nodes = data.nodes || [];
  const edges = data.edges || [];
  const elements = [];
  const groupMap = new Map();
  for (const n of nodes) {
    if (n.type === 'group') {
      const pur = n[PUR_META] || {};
      const g = Object.assign({ id: n.id || generateId(), type: 'group', x: n.x || 0, y: n.y || 0, w: n.width || 0, h: n.height || 0, content: n.label || '', rotation: 0, opacity: 1 }, pur, { children: [] });
      delete g.parentGroupId;
      elements.push(g);
      groupMap.set(g.id, g);
    }
  }
  for (const n of nodes) {
    if (n.type === 'group') continue;
    const pur = n[PUR_META] || {};
    const el = elFromNode(n, pur);
    if (pur.parentGroupId && groupMap.has(pur.parentGroupId)) {
      const g = groupMap.get(pur.parentGroupId);
      el.x = (n.x || 0) - g.x;
      el.y = (n.y || 0) - g.y;
      g.children.push(el);
    } else {
      elements.push(el);
    }
  }
  for (const e of edges) {
    const pur = e[PUR_META] || {};
    // 恢复 fromSide/toSide：导出时它们是 JSON Canvas 标准字段，导入曾丢弃导致往返丢失
    elements.push(Object.assign({ id: e.id || generateId(), type: 'line', from: e.fromNode || '', to: e.toNode || '', fromSide: e.fromSide || 'right', toSide: e.toSide || 'left', color: e.color, width: 2, content: e.label || '' }, pur));
  }
  return elements;
}
// 强制字符级折行算法
function wrapText(ctx, text, maxWidth) {
  const lines = [];
  const paragraphs = (text || '').split('\n');
  for (const p of paragraphs) {
    let currentLine = '';
    for (let i = 0; i < p.length; i++) {
      const char = p[i];
      const testLine = currentLine + char;
      if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    if (p === '') lines.push(''); 
  }
  return lines;
}
function findElementById(elements, id) {
  for (const el of elements) {
    if (el.id === id) return { el, parentX: 0, parentY: 0 };
    if (el.type === 'group' && el.children) {
      const found = findElementById(el.children, id);
      if (found) return { el: found.el, parentX: found.parentX + el.x, parentY: found.parentY + el.y };
    }
  }
  return null;
}
function getWorldPos(elements, id) {
  const result = findElementById(elements, id);
  if (!result) return null;
  return { x: result.el.x + result.parentX, y: result.el.y + result.parentY, w: result.el.w || 0, h: result.el.h || 0 };
}

// ---- 统一的引脚坐标计算（绘制/检测/连线都用这个，保证完全一致） ----
function getPinPosForElement(el, isInput, index) {
  const ins = el.inputs || [];
  const outs = el.outputs || [];
  const totalPins = Math.max(ins.length, outs.length, 1);
  const w = el.w || 100;
  const h = el.h || 80;
  const pinStartY = h * 0.15;
  const pinEndY = h * 0.85;
  const py = totalPins === 1 ? h / 2 : pinStartY + index * ((pinEndY - pinStartY) / Math.max(totalPins - 1, 1));
  const px = isInput ? 0 : w;
  return { x: px, y: py };
}

// ---- 节点引脚坐标计算（任何有 inputs/outputs 的元素都可以有引脚） ----
function getPinWorldPos(elements, nodeId, pinId) {
  const nodeWP = getWorldPos(elements, nodeId);
  if (!nodeWP) return null;
  let node = null;
  const findNode = (els) => {
    for (const e of els) {
      if (e.id === nodeId) { node = e; return true; }
      if (e.type === 'group' && e.children && findNode(e.children)) return true;
    }
    return false;
  };
  findNode(elements);
  if (!node) return null;
  if (!(node.inputs || node.outputs) || ((node.inputs || []).length === 0 && (node.outputs || []).length === 0)) return null;

  let idx = (node.inputs || []).findIndex(p => p.id === pinId);
  if (idx !== -1) {
    const p = getPinPosForElement(node, true, idx);
    return { x: nodeWP.x + p.x, y: nodeWP.y + p.y, isInput: true };
  }

  idx = (node.outputs || []).findIndex(p => p.id === pinId);
  if (idx !== -1) {
    const p = getPinPosForElement(node, false, idx);
    return { x: nodeWP.x + p.x, y: nodeWP.y + p.y, isInput: false };
  }

  return null;
}


// ---- IR 解析（YAML + IR → 画布元素）——纯函数，从 PurStudioView 抽出 ----
function parseValue(val) {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === 'null' || val === '~') return null;
  if (/^-?\d+\.?\d*$/.test(val)) return parseFloat(val);
  // Remove quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1);
  }
  return val;
}

function parseKV(line, obj) {
  const ci = line.indexOf(': ');
  if (ci < 0) return '';
  const key = line.substring(0, ci).trim();
  const valStr = line.substring(ci + 2).trim();
  obj[key] = parseValue(valStr);
  return key;
}

// Minimal YAML parser for UAsset IR format
function parseSimpleYAML(text) {
  const lines = text.split('\n');
  const root = {};
  const stack = [{ obj: root, indent: -1, isList: false, listKey: '' }];

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const indent = line.search(/\S/);
    const trimmed = line.trim();

    // Remove comments
    const commentIdx = trimmed.indexOf(' #');
    const content = commentIdx > 0 ? trimmed.substring(0, commentIdx).trim() : trimmed;

    // Pop stack
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const current = stack[stack.length - 1];

    // List item
    if (content.startsWith('- ')) {
      const itemVal = content.substring(2).trim();
      if (!current.obj[current.listKey]) current.obj[current.listKey] = [];
      const list = current.obj[current.listKey];

      if (itemVal.includes(': ')) {
        const obj = {};
        parseKV(itemVal, obj);
        list.push(obj);
        stack.push({ obj, indent, isList: false, listKey: '' });
      } else {
        list.push(parseValue(itemVal));
      }
      continue;
    }

    // Bare key ("key:") — value is a nested list or object on following lines.
    // 裸键必须显式识别：IR 格式的 graphs:/nodes:/pins:/links: 冒号后无空格，
    // 旧代码的 content.includes(': ') 匹配不到，导致子列表挂到空字符串键 "" 下。
    if (content.endsWith(':')) {
      const key = content.substring(0, content.length - 1).trim();
      if (!key) continue;
      const nextLine = lines.slice(lines.indexOf(line) + 1).find(l => l.trim() && !l.trim().startsWith('#'));
      if (nextLine) {
        const nextIndent = nextLine.search(/\S/);
        if (nextIndent > indent) {
          if (nextLine.trim().startsWith('- ')) {
            current.obj[key] = [];
            stack.push({ obj: current.obj, indent, isList: true, listKey: key });
          } else {
            current.obj[key] = {};
            stack.push({ obj: current.obj[key], indent, isList: false, listKey: '' });
          }
        }
      }
      continue;
    }

    // Key: value pair
    if (content.includes(': ')) {
      // Target object: the last list item when inside a list, else current.obj.
      // 旧代码对普通对象用 [current.obj.length - 1] 数组下标会拿到 undefined 崩溃。
      const target = (current.isList && current.obj[current.listKey])
        ? current.obj[current.listKey][current.obj[current.listKey].length - 1]
        : current.obj;
      const key = parseKV(content, target);
      const val = target[key];

      // Check if next non-comment line is a list or nested object
      const nextLine = lines.slice(lines.indexOf(line) + 1).find(l => l.trim() && !l.trim().startsWith('#'));
      if (nextLine) {
        const nextIndent = nextLine.search(/\S/);
        if (nextIndent > indent && val === undefined) {
          if (nextLine.trim().startsWith('- ')) {
            // List follows
            target[key] = [];
            stack.push({ obj: target, indent, isList: true, listKey: key });
          } else {
            // Nested object
            target[key] = {};
            stack.push({ obj: target[key], indent, isList: false, listKey: '' });
          }
        }
      }
    }
  }

  return root;
}

// IR → Pur Studio elements
function irToElements(ir, baseX, baseY) {
  const gid = () => crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);

  // Detect type
  const source = (ir.source || '').toLowerCase();
  const isMaterial = source.includes('material');
  const bgColor = isMaterial ? 'rgba(20,50,40,0.92)' : 'rgba(20,40,60,0.92)';
  const textColor = isMaterial ? '#c8ffe0' : '#c8e0ff';

  const graphs = ir.graphs || (ir.nodes ? [{ name: ir.source || 'Graph', nodes: ir.nodes || [], links: ir.links || [] }] : []);
  if (!graphs.length) return null;

  const groups = [];
  let gx = baseX || 20, gy = baseY || 20;
  const colW = 1400;

  for (let gi = 0; gi < graphs.length; gi++) {
    const graph = graphs[gi];
    const irNodes = graph.nodes || [];
    const irLinks = graph.links || [];
    if (!irNodes.length) continue;

    // Build node map
    const purNodes = [];
    const idMap = {};

    for (let ni = 0; ni < irNodes.length; ni++) {
      const n = irNodes[ni];
      const inputs = [];
      const outputs = [];
      (n.pins || []).forEach(p => {
        const def = { id: p.name || '', label: p.display_name || p.label || p.name || '' };
        if (p.direction === 'input') inputs.push(def);
        else if (p.direction === 'output') outputs.push(def);
      });

      const title = n.title || n.type || 'Node';
      let content = '// ' + (n.type || '');
      if (n.function) content = '// ' + n.function;
      if (n.event) content = '// event: ' + n.event;

      const pinCount = Math.max(inputs.length, outputs.length, 1);
      const node = {
        id: gid(), type: 'text', title,
        content, inputs, outputs,
        x: n.x || (ni * 320 + 20), y: Math.max(48, n.y || 48),
        w: 300, h: Math.max(90, 60 + pinCount * 28),
        bgColor, color: textColor,
        fontSize: 14, rotation: 0, opacity: 1
      };
      purNodes.push(node);
      idMap[n.id] = node.id;
    }

    // Build lines
    const lines = [];
    (irLinks || []).forEach(l => {
      const fromStr = l.from || '';
      const toStr = l.to || '';
      const fi = fromStr.lastIndexOf('.');
      const ti = toStr.lastIndexOf('.');
      if (fi < 0 || ti < 0) return;
      const fromNodeId = fromStr.substring(0, fi);
      const fromPin = fromStr.substring(fi + 1);
      const toNodeId = toStr.substring(0, ti);
      const toPin = toStr.substring(ti + 1);
      const pf = idMap[fromNodeId], pt = idMap[toNodeId];
      if (!pf || !pt) return;
      lines.push({ id: gid(), type: 'line', from: pf, fromPin, to: pt, toPin, content: '' });
    });

    const maxX = Math.max(...purNodes.map(n => n.x + n.w), 400);
    const maxY = Math.max(...purNodes.map(n => n.y + n.h), 150);

    const group = {
      id: gid(), type: 'group',
      x: gx + (gi % 2) * colW,
      y: gy,
      w: Math.min(maxX + 40, colW - 40),
      h: maxY + 40,
      content: `📦 ${graph.name || 'Pipeline ' + (gi + 1)} (${purNodes.length}节点 ${lines.length}连线)`,
      children: [...purNodes, ...lines],
      rotation: 0, opacity: 1
    };
    groups.push(group);

    if (gi % 2 === 1) gy += maxY + 70;
  }

  return groups;
}
// ================== 画布视图 ==================
class PurStudioView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.elements = [];
    this.viewState = { offsetX: 0, offsetY: 0, scale: 1 };
    this.canvasFile = null;

    this.isPanning = false;
    this.isSelecting = false;
    this.selectionRect = null;
    this.selectedIds = new Set();
    this.hoveredLineId = null;
    
    this.dragStart = null;
    this.dragElement = null;
    this.isDraggingElement = false;
    this.isResizingElement = false; 
    this.resizeElement = null;
    this.resizeStart = null;

    this.lastMouse = { x: 0, y: 0 };
    this._panVel = { x: 0, y: 0 };
    this._momentumRaf = null;

    this._renderPending = false;
    

    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 50;
    this.clipboard = [];
    this._autoSaveTimer = null;
    this.isPinned = false;
    this.ctx = null;
    
    this._onPaste = this.onPaste.bind(this);
  }

  getViewType() { return 'pur-studio'; }
  getDisplayText() { return this.canvasFile ? this.canvasFile.basename : 'Pur Studio'; }
  getIcon() { return 'pur-icon'; }

  getState() { return this.canvasFile ? { file: this.canvasFile.path } : {}; }

  async setState(state, result) {
    if (state.file) {
      // 去重：直接比较 canvasFile 路径
      const dup = this.app.workspace.getLeavesOfType('pur-studio').find(l => {
        if (l.view === this) return false;
        return l.view?.canvasFile?.path === state.file;
      });
      if (dup) {
        this.app.workspace.revealLeaf(dup);
        const selfLeaf = this.app.workspace.getLeavesOfType('pur-studio').find(l => l.view === this);
        if (selfLeaf) selfLeaf.detach();
        return;
      }
      const file = this.app.vault.getAbstractFileByPath(state.file);
      if (file instanceof TFile) await this.loadFromFile(file);
    }
    await super.setState(state, result);
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.style.overflow = 'hidden';
    container.style.position = 'relative';

    this.canvas = container.createEl('canvas', { cls: 'pur-studio' });
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    this.canvas.tabIndex = 0; 
    this.ctx = this.canvas.getContext('2d', { alpha: false });

    if (!this.canvasFile) {
      const data = this.plugin.settings.canvasData;
      this.elements = data.elements || [];
      this.viewState = Object.assign({ offsetX: 0, offsetY: 0, scale: 1 }, data.viewState);
      this._hasData = (data.elements && data.elements.length > 0);
      this.selectedIds.clear();
    }

    this._onMouseDown = this.onMouseDown.bind(this);
    this._onMouseMove = this.onMouseMove.bind(this);
    this._onMouseUp = this.onMouseUp.bind(this);
    this._onWheel = this.onWheel.bind(this);
    this._onContextMenu = this.onContextMenu.bind(this);
    this._onDoubleClick = this.onDoubleClick.bind(this);
    this._onResize = this.onResize.bind(this);
    this._onKeyDown = this.onKeyDown.bind(this);
    this._onDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; };
    this._onDrop = this.onDrop.bind(this);

    this.canvas.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mouseup', this._onMouseUp);
    this.canvas.addEventListener('wheel', this._onWheel, { passive: false });
    this.canvas.addEventListener('contextmenu', this._onContextMenu);
    this.canvas.addEventListener('dblclick', this._onDoubleClick);
    window.addEventListener('resize', this._onResize);
    this.canvas.addEventListener('keydown', this._onKeyDown);
    this.containerEl.addEventListener('paste', this._onPaste);
    this.canvas.addEventListener('dragover', this._onDragOver);
    this.canvas.addEventListener('drop', this._onDrop);

    this.saveHistory();
    this.requestRender();

    // 外部 .md 文件修改 → 自动同步卡片引脚
    this.plugin.registerEvent(this.app.vault.on('modify', async (file) => {
      if (this.plugin._activeEditingLink === file.path) return;
      if (!file.path.endsWith('.md')) return;
      let needRender = false;
      for (const el of this.elements) {
        if (el.type !== 'note-link' || el.link !== file.path) continue;
        try {
          const raw = await this.app.vault.read(file);
          el.content = raw;
          const oldIn = {}; if (el.inputs) el.inputs.forEach(p=>{if(p.label)oldIn[p.label]=p.id});
          const oldOut = {}; if (el.outputs) el.outputs.forEach(p=>{if(p.label)oldOut[p.label]=p.id});
          const pm = raw.match(/const\s*\{\s*([^}]+)\s*\}\s*=\s*inputs/);
          el.inputs = pm ? pm[1].split(',').map(s=>s.trim().split('=')[0].trim()).filter(Boolean).map(n=>({id:oldIn[n]||generateId(),label:n})) : [];
          const rm = raw.match(/return\s*\{([^}]+)\}/);
          el.outputs = rm ? rm[1].split(',').map(s=>s.trim().split(':')[0].trim()).filter(Boolean).map(n=>({id:oldOut[n]||generateId(),label:n})) : [];
          el.h = 60 + Math.max(el.inputs.length,el.outputs.length,1)*28 + 20;
          needRender = true;
        } catch(e) {}
      }
      if (needRender) this.requestRender();
    }));
  }

  async onClose() {
    if (this._autoSaveTimer) { clearTimeout(this._autoSaveTimer); this._autoSaveTimer = null; }
    this.containerEl.removeEventListener('paste', this._onPaste);
    if (this.canvas) {
      this.canvas.removeEventListener('mousedown', this._onMouseDown);
      this.canvas.removeEventListener('wheel', this._onWheel);
      this.canvas.removeEventListener('contextmenu', this._onContextMenu);
      this.canvas.removeEventListener('dblclick', this._onDoubleClick);
      this.canvas.removeEventListener('keydown', this._onKeyDown);
      this.canvas.removeEventListener('dragover', this._onDragOver);
      this.canvas.removeEventListener('drop', this._onDrop);
    }
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mouseup', this._onMouseUp);
    window.removeEventListener('resize', this._onResize);
    await this.saveData();
  }

  requestRender() {
    if (!this._renderPending && this.canvas) {
      this._renderPending = true;
      const targetWindow = this.containerEl.win || window;
      targetWindow.requestAnimationFrame(() => this.draw());
    }
  }

  async loadFromFile(file) {
    this.canvasFile = file;
    this._hasData = true; // 先标记——防止加载中的自动保存覆盖文件
    try {
      const raw = await this.app.vault.read(file);
      const data = JSON.parse(raw);
      this.elements = data.elements || [];
      this.viewState = Object.assign({ offsetX: 0, offsetY: 0, scale: 1 }, data.viewState || {});
      if (!data.elements || !data.elements.length) this._hasData = false;
      this.selectedIds.clear();
      this.history = [];
      this.historyIndex = -1;
      this.saveHistory();
      if (this.plugin.pendingLocateTarget) {
          const target = this.plugin.pendingLocateTarget;
          this.plugin.pendingLocateTarget = null;
          const targetEl = this.elements.find(e => e.type === 'note-link' && e.link === target);
          if (targetEl) {
              const cw = this.canvas.width || 800;
              const ch = this.canvas.height || 600;
              this.viewState.offsetX = cw / 2 - (targetEl.x + targetEl.w / 2) * this.viewState.scale;
              this.viewState.offsetY = ch / 2 - (targetEl.y + targetEl.h / 2) * this.viewState.scale;
              this.selectedIds.clear();
              this.selectedIds.add(targetEl.id);
      }
      }
            this.requestRender();
      this.refreshNoteLinkColors();
      this._startPreload();
    } catch (e) {
      this.elements = [];
      this.viewState = { offsetX: 0, offsetY: 0, scale: 1 };
      this.selectedIds.clear();
      new Notice('画布读取失败');
    }
  }

  _startPreload() {
    const imgs = [];
    const collect = (els) => {
      for (const e of els) {
        if (e.type === 'image' && e.dataURL && !this.plugin.imageCache[e.dataURL]) imgs.push(e.dataURL);
        if (e.children) collect(e.children);
      }
    };
    collect(this.elements);
    if (!imgs.length) return;
    let i = 0;
    const batch = () => {
      const end = Math.min(i + 40, imgs.length);
      for (; i < end; i++) {
        const src = imgs[i];
        const img = new Image();
        img.src = src;
        img.onload = () => { this.plugin.imageCache[src] = img; };
      }
      if (i < imgs.length) setTimeout(batch, 40);
    };
    setTimeout(batch, 100);
  }

  async saveData() {
    if (this.canvasFile) {
      // 死守：空elements且文件已有内容→不保存（防止加载前覆写）
      if (!this.elements.length) {
        if (!this._hasData) return;
        try {
          if (await this.app.vault.adapter.exists(this.canvasFile.path)) {
            const raw = await this.app.vault.adapter.read(this.canvasFile.path);
            if (raw.length > 10) return;
          }
        } catch(e) { return; }
      }
      const payload = JSON.stringify({ elements: this.elements, viewState: this.viewState }, null, 2);
      try {
        const stillThere = this.app.vault.getAbstractFileByPath(this.canvasFile.path);
        if (stillThere instanceof TFile) await this.app.vault.modify(stillThere, payload);
      } catch (e) { console.error(e); }
    } else {
      this.plugin.settings.canvasData.elements = this.elements;
      this.plugin.settings.canvasData.viewState = this.viewState;
      await this.plugin.saveSettings();
    }
  }

  // ================== 渲染引擎 ==================
  draw() {
    if (this._drawing) { this._renderPending = true; return; } // 跳帧
    this._drawing = true;
    this._renderPending = false;
    const { offsetX, offsetY, scale } = this.viewState;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const prefs = this.plugin.settings.preferences;

    ctx.clearRect(0, 0, w, h);
    let bgColor = prefs.backgroundColor;
    if (bgColor === 'obsidian' || bgColor === 'default' || !bgColor) {
        bgColor = getComputedStyle(this.containerEl).getPropertyValue('--background-primary').trim() || '#1e1e1e';
    }
    if (bgColor !== 'transparent') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, w, h);
    }

    if (prefs.showGrid) {
      ctx.strokeStyle = prefs.gridColor;
	      // 网格密度随缩放自适应：目标屏幕间距 50px，吸附到 1/2/5×10ⁿ
	      const targetWorld = 50 / scale;
	      const mag = Math.pow(10, Math.floor(Math.log10(targetWorld)));
	      const n = targetWorld / mag;
	      const snap = n <= 1.5 ? 1 : n <= 3.5 ? 2 : n <= 7.5 ? 5 : 10;
	      const gridSize = snap * mag;
	      ctx.lineWidth = scale >= 1 ? 1 : 0.5;
	      const startX = -offsetX % (gridSize * scale);
	      const startY = -offsetY % (gridSize * scale);
	      ctx.beginPath();
	      for (let x = startX; x < w; x += gridSize * scale) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
	      for (let y = startY; y < h; y += gridSize * scale) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();
    }

    // 1. 渲染连线 (置于卡片底层)——递归搜集群组内连线
    const allLines = [];
    const collectLines = (els) => { for (const e of els) { if (e.type === 'line') allLines.push(e); if (e.type === 'group' && e.children) collectLines(e.children); } };
    collectLines(this.elements);
    for (const el of allLines) {
        if (el.type === 'line') {
            const fromWP = getWorldPos(this.elements, el.from);
            const toWP = getWorldPos(this.elements, el.to);
            if (!fromWP || !toWP) continue;

            // 引脚连接（有 fromPin/toPin 就按引脚画；没有就画普通连线）
            const isPinConn = !!(el.fromPin || el.toPin);

            let sx1, sy1, sx2, sy2;
            if (el.fromPin) {
                const pw = getPinWorldPos(this.elements, el.from, el.fromPin);
                if (pw) { sx1 = pw.x * scale + offsetX; sy1 = pw.y * scale + offsetY; }
                else { sx1 = (fromWP.x + fromWP.w/2) * scale + offsetX; sy1 = (fromWP.y + fromWP.h/2) * scale + offsetY; }
            } else {
                sx1 = (fromWP.x + fromWP.w/2) * scale + offsetX;
                sy1 = (fromWP.y + fromWP.h/2) * scale + offsetY;
            }
            if (el.toPin) {
                const pw = getPinWorldPos(this.elements, el.to, el.toPin);
                if (pw) { sx2 = pw.x * scale + offsetX; sy2 = pw.y * scale + offsetY; }
                else { sx2 = (toWP.x + toWP.w/2) * scale + offsetX; sy2 = (toWP.y + toWP.h/2) * scale + offsetY; }
            } else {
                sx2 = (toWP.x + toWP.w/2) * scale + offsetX;
                sy2 = (toWP.y + toWP.h/2) * scale + offsetY;
            }

            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            if (isPinConn) {
                // 引脚连线：白色实线（参与节点关系，圆角端点）
                ctx.strokeStyle = this.hoveredLineId === el.id ? '#ffffff' : 'rgba(255, 255, 255, 0.9)';
                ctx.lineWidth = (this.hoveredLineId === el.id ? 4 : 2.5) * scale;
            } else {
                // 普通虚线：仅装饰，不参与节点运行关系
                ctx.strokeStyle = el.color || 'rgba(150, 150, 150, 0.55)';
                ctx.lineWidth = (this.hoveredLineId === el.id ? 5 : (el.width || 2)) * scale;
                ctx.setLineDash([10 * scale, 6 * scale]);
            }
            ctx.beginPath();
            const dx = Math.abs(sx2 - sx1), dy = Math.abs(sy2 - sy1);
            const style = el.style || 'curve';
            if (style === 'straight') {
                ctx.moveTo(sx1, sy1); ctx.lineTo(sx2, sy2);
            } else if (style === 'rect') {
                const mx = (sx1 + sx2) / 2;
                ctx.moveTo(sx1, sy1); ctx.lineTo(mx, sy1); ctx.lineTo(mx, sy2); ctx.lineTo(sx2, sy2);
            } else {
                ctx.moveTo(sx1, sy1);
                const controlOffset = Math.max(50, dx * 0.5);
                ctx.bezierCurveTo(sx1 + controlOffset, sy1, sx2 - controlOffset, sy2, sx2, sy2);
            }
            ctx.stroke();
            if (el.arrow !== false) {
                const arrowSize = (el.arrowSize || 10) * scale;
                const angle = Math.atan2(sy2 - sy1, sx2 - sx1);
                const ax = sx2 - Math.cos(angle) * arrowSize * 0.6;
                const ay = sy2 - Math.sin(angle) * arrowSize * 0.6;
                ctx.fillStyle = ctx.strokeStyle;
                ctx.beginPath();
                ctx.moveTo(sx2, sy2);
                ctx.lineTo(ax - Math.sin(angle) * arrowSize * 0.5, ay + Math.cos(angle) * arrowSize * 0.5);
                ctx.lineTo(ax + Math.sin(angle) * arrowSize * 0.5, ay - Math.cos(angle) * arrowSize * 0.5);
                ctx.closePath(); ctx.fill();
            }
            if (el.content) {
                const lmx = sx1 + (sx2 - sx1) / 2, lmy = sy1 + (sy2 - sy1) / 2;
                const lfs = Math.max(10, (el.fontSize || 12) * scale);
                ctx.font = lfs + 'px ' + (el.fontFamily || 'sans-serif');
                const tw = ctx.measureText(el.content).width;
                ctx.fillStyle = el.textColor || el.color || 'rgba(200,200,200,0.9)';
                ctx.fillText(el.content, lmx - tw/2, lmy + lfs/3);
            }
            ctx.restore();
        }
    }

    


        // 递归渲染所有群组虚线大框（支持嵌套）- 改为圆角风格
    const renderGroupFrames = (elements, ox, oy) => {
        for (const gel of elements) {
            if (gel.type !== 'group' || !gel.children) continue;
            renderGroupFrames(gel.children, ox + gel.x, oy + gel.y);
            const gx = ((gel.x + ox) * scale) + offsetX;
            const gy = ((gel.y + oy) * scale) + offsetY;
            const gw = gel.w * scale;
            const gh = gel.h * scale;
            const gr = 8 * scale; // 圆角半径
            if (gw >= 2 && gh >= 2) {
                ctx.save();
                // 虚线圆角边框
                ctx.strokeStyle = gel.borderColor || gel.color || 'rgba(180, 200, 230, 0.5)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([8, 4]);
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(gx, gy, gw, gh, gr);
                else { const r = Math.min(gr, gw / 2, gh / 2);
                    ctx.moveTo(gx + r, gy);
                    ctx.lineTo(gx + gw - r, gy);
                    ctx.arcTo(gx + gw, gy, gx + gw, gy + r, r);
                    ctx.lineTo(gx + gw, gy + gh - r);
                    ctx.arcTo(gx + gw, gy + gh, gx + gw - r, gy + gh, r);
                    ctx.lineTo(gx + r, gy + gh);
                    ctx.arcTo(gx, gy + gh, gx, gy + gh - r, r);
                    ctx.lineTo(gx, gy + r);
                    ctx.arcTo(gx, gy, gx + r, gy, r);
                    ctx.closePath();
                }
                ctx.stroke();
                ctx.setLineDash([]);

                // 群组标题（圆角胶囊底）
                if (gel.content) {
                    const ls = Math.max(8, (gel.fontSize || 12) * scale);
                    ctx.font = ['bold ', ls, 'px ', (gel.fontFamily || 'sans-serif')].join('');
                    const tw = ctx.measureText(gel.content).width;
                    ctx.beginPath();
                    if (ctx.roundRect) ctx.roundRect(gx + 4, gy - ls - 6, tw + 12, ls + 6, 4 * scale);
                    else ctx.rect(gx + 4, gy - ls - 6, tw + 12, ls + 6);
                    ctx.fillStyle = 'rgba(32, 34, 38, 0.85)';
                    ctx.fill();
                    ctx.fillStyle = '#cfd5de';
                    ctx.fillText(gel.content, gx + 10, gy - 4);
                }

                ctx.restore();
                // 锁定图标
                if (gel.locked) {
                    const elapsed = gel._lockTime ? Date.now() - gel._lockTime : 9999;
                    const duration = 500;
                    if (elapsed < duration) {
                        ctx.save();
                        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.beginPath();
                        ctx.strokeRect(gx + gw - 20, gy + 6, 12, 10);
                        ctx.moveTo(gx + gw - 17, gy + 6); ctx.lineTo(gx + gw - 17, gy + 3);
                        ctx.arc(gx + gw - 14, gy + 3, 3, Math.PI, 0); ctx.lineTo(gx + gw - 11, gy + 6);
                        ctx.stroke();
                        ctx.restore();
                    }
                }
                // 缩放手柄 + 选中高亮（仅选中时显示）- 统一方框
                if (this.selectedIds.has(gel.id) && !gel.locked) {
                    const hx = gx + gw - 8;
                    const hy = gy + gh - 8;
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(hx, hy, 14, 14);
                    ctx.strokeStyle = '#000000'; ctx.lineWidth = 1;
                    ctx.strokeRect(hx, hy, 14, 14);
                    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
                    ctx.strokeRect(gx, gy, gw, gh);
                }
            }
        }
    };
    renderGroupFrames(this.elements, 0, 0);

    const worldLeft = -offsetX / scale, worldTop = -offsetY / scale;
    const worldRight = (w - offsetX) / scale, worldBottom = (h - offsetY) / scale;

    const renderElements = [];
    for (const el of this.elements) {
        if (el.type === 'group' && el.children) {
            const expandGroup = (children, gx, gy, gid) => {
                const flat = [];
                for (const ch of children) {
                    const wx = ch.x + gx, wy = ch.y + gy;
                    if (ch.type === 'group' && ch.children) {
                        flat.push(...expandGroup(ch.children, wx, wy, ch.id));
                    } else {
                        flat.push({ ...ch, x: wx, y: wy, parentGroupId: gid });
                    }
                }
                return flat;
            };
            renderElements.push(...expandGroup(el.children, el.x, el.y, el.id));
        } else if (el.type !== 'line') { 
            renderElements.push(el); 
        }
    }

    for (const el of renderElements) {
      const { x, y, w: ew, h: eh } = el;
      if (x + ew < worldLeft || x > worldRight || y + eh < worldTop || y > worldBottom) continue;
      
      const screenW = ew * scale, screenH = eh * scale;
      if (screenW < 2 || screenH < 2) continue;

      const screenX = (x * scale) + offsetX, screenY = (y * scale) + offsetY;

      // 标题在外——画在元素上方（群组风格）
      if (el.title && (el.type === 'text' || el.type === 'code-node')) {
        const ls = Math.max(8, (el.fontSize || 12) * 0.8 * scale);
        ctx.save();
        ctx.font = 'bold ' + ls + 'px sans-serif';
        const tw = ctx.measureText(el.title).width;
        const tx = screenX, ty = screenY - ls - 4;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(tx, ty, tw + 10, ls + 4, 4 * scale);
        else ctx.rect(tx, ty, tw + 10, ls + 4);
        ctx.fillStyle = 'rgba(32, 34, 38, 0.85)';
        ctx.fill();
        ctx.fillStyle = '#4a9eff';
        ctx.fillText(el.title, tx + 5, ty + ls);
        ctx.restore();
      }

      ctx.save();
      ctx.translate(screenX + screenW/2, screenY + screenH/2);
      if (el.rotation) ctx.rotate(el.rotation * Math.PI / 180);
      if (el.flipH) ctx.scale(-1, 1);
      if (el.flipV) ctx.scale(1, -1);
      ctx.translate(-screenW/2, -screenH/2);
      ctx.globalAlpha = el.opacity !== undefined ? el.opacity : 1;

      if (el.type === 'text') {
        if (el.isEditing) {
            const editDiv = this.containerEl.querySelector('#pur-edit-dialog');
            if (editDiv) {
                editDiv.style.left = `${screenX}px`;
                editDiv.style.top = `${screenY}px`;
                const input = editDiv.querySelector('#text-input');
                if (input) {
                    input.style.fontSize = `${(el.fontSize || 14) * scale}px`;
                    input.style.padding = `${10 * scale}px`;
                }
            }
        } else {
            // 文本卡片：深灰圆角背景，无描边
            ctx.fillStyle = el.bgColor || 'rgba(32,34,38,0.9)';
            ctx.globalAlpha = el.bgOpacity ?? 0.92;
            if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(0, 0, screenW, screenH, 8 * scale); ctx.fill(); }
            else ctx.fillRect(0, 0, screenW, screenH);

            ctx.globalAlpha = el.opacity !== undefined ? el.opacity : 1;
            ctx.fillStyle = el.color || '#e0e0e0';
            const fontSize = (el.fontSize || 14) * scale;
            const fontFamily = el.fontFamily || 'sans-serif';
            ctx.font = `${el.bold ? 'bold ' : ''}${fontSize}px ${fontFamily}`;

            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, screenW, screenH);
            ctx.clip();

            let yOffset = 10 * scale + fontSize;
            const paragraphs = (el.content || '...').split('\n');

            for (let i = 0; i < paragraphs.length; i++) {
               const lines = wrapText(ctx, paragraphs[i], screenW - 20 * scale);
               for (const line of lines) {
                   ctx.fillText(line, 10 * scale, yOffset);
                   yOffset += fontSize * 1.3;
               }
            }
            ctx.restore();
        }

        // ====== 文本节点附加引脚（当用户添加了 inputs/outputs 时） ======
        const hasPins = ((el.inputs && el.inputs.length) || (el.outputs && el.outputs.length));
        if (hasPins && !el.isEditing) {
            const ins = el.inputs || [];
            const outs = el.outputs || [];
            // 引脚位置按"总数量等分"整个节点高度（从顶部 15% 到底部 85% 均匀分布）
            const totalPins = Math.max(ins.length, outs.length, 1);
            const pinStartY = screenH * 0.15;
            const pinEndY = screenH * 0.85;
            const pinSpacing = totalPins > 1 ? (pinEndY - pinStartY) / (totalPins - 1) : (screenH / 2);

            // 输入引脚（左边白色空心圆，细线描边，区分"接收"语义）
            ins.forEach((pin, i) => {
                const py = totalPins === 1 ? screenH / 2 : pinStartY + i * pinSpacing;
                const hoverPin = this._hoverPin;
                const isHovering = hoverPin && hoverPin.nodeId === el.id && hoverPin.pinId === pin.id && hoverPin.isInput;
                const pinR = isHovering ? 7 * scale : 5.5 * scale;
                ctx.beginPath(); ctx.arc(0, py, pinR, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(230,230,230,0.08)'; ctx.fill();
                ctx.strokeStyle = isHovering ? '#ffffff' : 'rgba(230,230,230,0.75)';
                ctx.lineWidth = 1.5 * scale;
                ctx.stroke();
                // 标签在文本框外左侧
                const labelText = pin.label || '';
                const labelFont = `${11 * scale}px -apple-system, "Segoe UI", sans-serif`;
                const tw = ctx.measureText(labelText).width;
                const labelX = -pinR * scale - tw - 6 * scale;
                ctx.fillStyle = 'rgba(210,210,215,0.7)';
                ctx.font = labelFont;
                ctx.fillText(labelText, labelX, py + 4 * scale);
            });
            // 输出引脚（右边白色实心圆，区分"发送"语义）
            outs.forEach((pin, i) => {
                const py = totalPins === 1 ? screenH / 2 : pinStartY + i * pinSpacing;
                const hoverPin = this._hoverPin;
                const isHovering = hoverPin && hoverPin.nodeId === el.id && hoverPin.pinId === pin.id && !hoverPin.isInput;
                const pinR = isHovering ? 7 * scale : 5.5 * scale;
                ctx.beginPath(); ctx.arc(screenW, py, pinR, 0, Math.PI * 2);
                ctx.fillStyle = isHovering ? '#ffffff' : 'rgba(235,235,235,0.95)'; ctx.fill();
                const labelText = pin.label || '';
                const labelFont = `${11 * scale}px -apple-system, "Segoe UI", sans-serif`;
                const tw = ctx.measureText(labelText).width;
                const labelX = screenW + pinR * scale + 6 * scale;
                ctx.fillStyle = 'rgba(210,210,215,0.7)';
                ctx.font = labelFont;
                ctx.fillText(labelText, labelX, py + 4 * scale);
            });
        }
      } else if (el.type === 'image') {
        const cacheKey = el.dataURL || el.original;
        const img = this.plugin.imageCache[cacheKey];
        if (img) {
          ctx.drawImage(img, 0, 0, screenW, screenH);
        } else if (el.dataURL) {
          // 预加载：在视口内立即加载
          const imgEl = new Image();
          imgEl.onload = () => { this.plugin.imageCache[cacheKey] = imgEl; this.requestRender(); };
          imgEl.src = el.dataURL;
          ctx.fillStyle = '#333'; ctx.fillRect(0, 0, screenW, screenH);
          ctx.fillStyle = '#888'; ctx.font = '12px sans-serif'; ctx.fillText('加载中...', 10, 20);
        } else {
          ctx.fillStyle = '#333'; ctx.fillRect(0, 0, screenW, screenH);
          ctx.fillStyle = '#888'; ctx.font = '12px sans-serif'; ctx.fillText('加载中...', 10, 20);
          if (el.original) this.plugin.loadImage(el.original, this);
        }
      } else if (el.type === 'note-link') {
        ctx.save();
        // 圆角背景，无描边
        ctx.fillStyle = el.cardColor || 'rgba(72, 54, 153, 0.95)';
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(0, 0, screenW, screenH, 8 * scale); ctx.fill(); }
        else ctx.fillRect(0, 0, screenW, screenH);

        ctx.fillStyle = '#ffffff';
        const titleSize = 14 * scale; ctx.font = `600 ${titleSize}px -apple-system, "Segoe UI", sans-serif`;

        let yOffset = titleSize + 10;
        // 代码节点卡片只显示文件名，不显示代码全文
        const isCodeCard = el.content && (el.content.includes('function process') || el.content.includes('return {'));
        const displayText = isCodeCard ? ('📄 ' + ((el.link||'').split('/').pop()||'').replace('.md','')) : (el.content || '链接');
        const textLines = displayText.split('\n');
        for (let i = 0; i < textLines.length; i++) {
            const wrapped = wrapText(ctx, textLines[i], screenW - 20);
            for (const wLine of wrapped) {
                ctx.fillText(wLine, 12, yOffset);
                yOffset += titleSize * 1.3;
            }
        }
        if (el.note) {
            ctx.fillStyle = 'rgba(255,255,255,0.75)';
            const ns = (el.noteFontSize || 11) * scale;
            ctx.font = ns + 'px ' + (el.noteFontFamily || 'sans-serif');
            const nw = wrapText(ctx, el.note, screenW - 20);
            for (let i = 0; i < nw.length; i++) {
                yOffset += ns;
                ctx.fillText(nw[i].substring(0, Math.floor(screenW / (ns * 0.55))), 12, yOffset);
            }
        }
        ctx.restore();
        // note-link 引脚渲染
        const nlPins = ((el.inputs && el.inputs.length) || (el.outputs && el.outputs.length));
        if (nlPins) {
          const ins = el.inputs || [], outs = el.outputs || [];
          const totalP = Math.max(ins.length, outs.length, 1);
          const ps = screenH * 0.15, pe = screenH * 0.85;
          const sp = totalP > 1 ? (pe - ps) / (totalP - 1) : (screenH / 2);
          ins.forEach((pin, i) => {
            const py = totalP === 1 ? screenH / 2 : ps + i * sp;
            const pinR = 5 * scale;
            ctx.beginPath(); ctx.arc(0, py, pinR, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(230,230,230,0.08)'; ctx.fill();
            ctx.strokeStyle = 'rgba(230,230,230,0.75)'; ctx.lineWidth = 1.5 * scale; ctx.stroke();
            const lt = pin.label || '';
            if (lt) { ctx.fillStyle = 'rgba(210,210,215,0.7)'; ctx.font = (10 * scale) + 'px sans-serif'; ctx.fillText(lt, -pinR * scale - ctx.measureText(lt).width - 4 * scale, py + 3 * scale); }
          });
          outs.forEach((pin, i) => {
            const py = totalP === 1 ? screenH / 2 : ps + i * sp;
            const pinR = 5 * scale;
            ctx.beginPath(); ctx.arc(screenW, py, pinR, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(235,235,235,0.95)'; ctx.fill();
            const lt = pin.label || '';
            if (lt) { ctx.fillStyle = 'rgba(210,210,215,0.7)'; ctx.font = (10 * scale) + 'px sans-serif'; ctx.fillText(lt, screenW + pinR * scale + 4 * scale, py + 3 * scale); }
          });
        }
      } else if (el.type === 'code-node') {
        // === 代码节点：极简风格 ===
        const inputs = el.inputs || [];
        const outputs = el.outputs || [];
        const isSelected = this.selectedIds.has(el.id);

        // 节点主体：纯深灰圆角背景，无描边
        ctx.fillStyle = el.bgColor || 'rgba(32, 34, 38, 0.92)';
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(0, 0, screenW, screenH, 8 * scale); ctx.fill(); }
        else ctx.fillRect(0, 0, screenW, screenH);

        // 标题：无蓝色背景，纯白字，字重适中
        ctx.fillStyle = '#ffffff';
        ctx.font = `600 ${13 * scale}px -apple-system, "Segoe UI", sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        let nodeTitle = el.title || '节点';
        const maxW = screenW - 70 * scale;
        if (ctx.measureText(nodeTitle).width > maxW) {
          while (ctx.measureText(nodeTitle + '...').width > maxW && nodeTitle.length > 1) {
            nodeTitle = nodeTitle.substring(0, nodeTitle.length - 1);
          }
          nodeTitle += '...';
        }
        ctx.fillText(nodeTitle, 12 * scale, 19 * scale);

        // 类型标签：浅灰小字
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.font = `${10 * scale}px -apple-system, "SF Mono", monospace`;
        ctx.textAlign = 'right';
        ctx.fillText('◯ node', screenW - 12 * scale, 19 * scale);

        // 分割线：极细，不显眼
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(12 * scale, 38 * scale);
        ctx.lineTo(screenW - 12 * scale, 38 * scale);
        ctx.stroke();

        // 引脚位置
        const totalPins4Code = Math.max(inputs.length, outputs.length, 1);
        const pinStartLocalY = (el.h || 80) * 0.15;
        const pinEndLocalY = (el.h || 80) * 0.85;

        // 输入引脚（左侧：白色空心圆，细线描边，语义"接收"）
        ctx.textAlign = 'left';
        inputs.forEach((pin, index) => {
          const localY = totalPins4Code === 1 ? (el.h || 80) / 2 : pinStartLocalY + index * ((pinEndLocalY - pinStartLocalY) / Math.max(totalPins4Code - 1, 1));
          const pinY = localY * scale;
          const hoverPin = this._hoverPin;
          const isHovering = hoverPin && hoverPin.nodeId === el.id && hoverPin.pinId === pin.id && !hoverPin.isOutput;
          const pinR = isHovering ? 7 * scale : 5.5 * scale;
          ctx.beginPath();
          ctx.arc(0, pinY, pinR, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(230,230,230,0.08)';
          ctx.fill();
          ctx.strokeStyle = isHovering ? '#ffffff' : 'rgba(230,230,230,0.75)';
          ctx.lineWidth = 1.5 * scale;
          ctx.stroke();
          // 标签：柔和字重，带胶囊底
          const labelText = pin.label || pin.id || '';
          const labelFont = `${11 * scale}px -apple-system, "Segoe UI", sans-serif`;
          const labelX = (pinR + 10) * scale;
          const tw = ctx.measureText(labelText).width;
          ctx.save();
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(labelX - 4 * scale, pinY - 8 * scale, tw + 8 * scale, 16 * scale, 8 * scale) : ctx.rect(labelX - 4 * scale, pinY - 8 * scale, tw + 8 * scale, 16 * scale);
          ctx.fillStyle = 'rgba(255,255,255,0.04)';
          ctx.fill();
          ctx.restore();
          ctx.fillStyle = 'rgba(210,210,215,0.85)';
          ctx.font = labelFont;
          ctx.fillText(labelText, labelX, pinY + 4 * scale);
        });

        // 输出引脚（右侧：白色实心圆，语义"发送"）
        ctx.textAlign = 'right';
        outputs.forEach((pin, index) => {
          const localY = totalPins4Code === 1 ? (el.h || 80) / 2 : pinStartLocalY + index * ((pinEndLocalY - pinStartLocalY) / Math.max(totalPins4Code - 1, 1));
          const pinY = localY * scale;
          const hoverPin = this._hoverPin;
          const isHovering = hoverPin && hoverPin.nodeId === el.id && hoverPin.pinId === pin.id && hoverPin.isOutput;
          const pinR = isHovering ? 7 * scale : 5.5 * scale;
          ctx.beginPath();
          ctx.arc(screenW, pinY, pinR, 0, Math.PI * 2);
          ctx.fillStyle = isHovering ? '#ffffff' : 'rgba(235,235,235,0.95)';
          ctx.fill();
          // 标签：柔和字重，带胶囊底
          const labelText = pin.label || pin.id || '';
          const labelFont = `${11 * scale}px -apple-system, "Segoe UI", sans-serif`;
          const tw = ctx.measureText(labelText).width;
          const labelX = screenW - pinR - tw - 10 * scale;
          ctx.save();
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(labelX - 4 * scale, pinY - 8 * scale, tw + 8 * scale, 16 * scale, 8 * scale) : ctx.rect(labelX - 4 * scale, pinY - 8 * scale, tw + 8 * scale, 16 * scale);
          ctx.fillStyle = 'rgba(255,255,255,0.04)';
          ctx.fill();
          ctx.restore();
          ctx.fillStyle = 'rgba(210,210,215,0.85)';
          ctx.font = labelFont;
          ctx.fillText(labelText, labelX, pinY + 4 * scale);
        });

        // 节点信息（底部）
        const totalPins = inputs.length + outputs.length;
        const infoY = pinEndLocalY * scale + 16 * scale;
        if (infoY < screenH - 8 * scale && totalPins > 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
          ctx.font = `${9.5 * scale}px -apple-system, "SF Mono", monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(`${inputs.length} ← · ${outputs.length} →`, screenW / 2, infoY);
        }
      }
      ctx.restore();

      const idToCheck = el.parentGroupId ? el.parentGroupId : el.id;
	      // 选中高亮：元素自身被选中时显示边框
	      if (this.selectedIds.has(el.id) && !el.isEditing) {
        ctx.save();
        ctx.translate(screenX + screenW/2, screenY + screenH/2);
        if (el.rotation) ctx.rotate(el.rotation * Math.PI / 180);
        ctx.translate(-screenW/2, -screenH/2);
        
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
        ctx.strokeRect(0, 0, screenW, screenH);
        
        if (el.locked) {
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.beginPath();
          ctx.strokeRect(screenW - 20, 10, 12, 10); 
          ctx.moveTo(screenW - 17, 10); ctx.lineTo(screenW - 17, 7);
          ctx.arc(screenW - 14, 7, 3, Math.PI, 0); ctx.lineTo(screenW - 11, 10);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(screenW - 8, screenH - 8, 14, 14);
          ctx.strokeStyle = '#000000'; ctx.lineWidth = 1;
          ctx.strokeRect(screenW - 8, screenH - 8, 14, 14);
        }
        ctx.restore();
      }
    }

    if (this.selectionRect) {
      let { x, y, w, h } = this.selectionRect;
      if (w < 0) { x += w; w = Math.abs(w); } 
      if (h < 0) { y += h; h = Math.abs(h); }
      ctx.strokeStyle = '#e0e0e0'; ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h); ctx.setLineDash([]);
    }

    // === 引脚拖拽临时连线（支持新建 / 重连起点 / 重连终点）===
    if (this._pinDrag) {
      let fromX = null, fromY = null, toX = null, toY = null;
      const drag = this._pinDrag;

      // 计算起点坐标
      if (drag.fromNodeId !== undefined && drag.fromNodeId !== null && drag.fromPinId) {
        const fromPos = getPinWorldPos(this.elements, drag.fromNodeId, drag.fromPinId);
        if (fromPos) { fromX = fromPos.x * scale + offsetX; fromY = fromPos.y * scale + offsetY; }
      }
      // 计算终点坐标（或鼠标）
      if (drag.toNodeId !== undefined && drag.toPinId) {
        const toPos = getPinWorldPos(this.elements, drag.toNodeId, drag.toPinId);
        if (toPos) { toX = toPos.x * scale + offsetX; toY = toPos.y * scale + offsetY; }
      }

      // 根据拖拽模式决定起止点和自由拖拽点
      let startX, startY, endX, endY;
      if (drag.dragMode === 'relink-from') {
        // 起点自由（鼠标），终点固定在原目标
        startX = drag.mouseScreenX; startY = drag.mouseScreenY;
        endX = toX; endY = toY;
      } else {
        // 新建连线 或 重连终点：起点固定，终点自由（鼠标）
        if (fromX === null) { // 安全回退
          startX = drag.mouseScreenX - 50; startY = drag.mouseScreenY;
        } else {
          startX = fromX; startY = fromY;
        }
        endX = drag.mouseScreenX; endY = drag.mouseScreenY;
      }

      ctx.save();
      ctx.setLineDash([8 * scale, 4 * scale]);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 * scale;
      const dx = Math.abs(endX - startX);
      const controlOffset = Math.max(50, dx * 0.5);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      // 起点在左 → 控制点向右；起点在右 → 控制点向左
      const c1x = drag.dragMode === 'relink-from' ? startX - controlOffset : startX + controlOffset;
      const c2x = drag.dragMode === 'relink-from' ? endX + controlOffset : endX - controlOffset;
      ctx.bezierCurveTo(c1x, startY, c2x, endY, endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);
      // 自由拖拽端的圆圈标记
      ctx.beginPath();
      ctx.arc(drag.mouseScreenX, drag.mouseScreenY, 6 * scale, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 * scale;
      ctx.stroke();
      ctx.restore();
    }

    // === 在引脚连线上绘制端点高亮圆（提示用户可拖拽重连）===
    const allPinLines = [];
    const collectPinLines = (els) => { for (const e of els) { if (e.type === 'line') allPinLines.push(e); if (e.type === 'group' && e.children) collectPinLines(e.children); } };
    collectPinLines(this.elements);
    for (const el of allPinLines) {
      if (el.type !== 'line') continue;
      if (!el.fromPin && !el.toPin) continue;
      let fromPos = el.fromPin ? getPinWorldPos(this.elements, el.from, el.fromPin) : null;
      let toPos = el.toPin ? getPinWorldPos(this.elements, el.to, el.toPin) : null;
      if (!fromPos && !toPos) continue;
      if (fromPos) {
        const fx = fromPos.x * scale + offsetX, fy = fromPos.y * scale + offsetY;
        ctx.save();
        ctx.beginPath();
        ctx.arc(fx, fy, 3 * scale, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fill();
        ctx.restore();
      }
      if (toPos) {
        const tx = toPos.x * scale + offsetX, ty = toPos.y * scale + offsetY;
        ctx.save();
        ctx.beginPath();
        ctx.arc(tx, ty, 3 * scale, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fill();
        ctx.restore();
      }
    }

    // 缩放比例显示（左下角，缩放时显示2秒后淡出）
    if (this._showZoomUntil && Date.now() < this._showZoomUntil) {
      const alpha = Math.min(1, (this._showZoomUntil - Date.now()) / 600);
      ctx.save();
      ctx.fillStyle = `rgba(255,255,255,${(alpha * 0.55).toFixed(2)})`;
      ctx.font = 'bold 15px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 3;
      ctx.fillText(Math.round(scale * 100) + '%', 16, h - 16);
      ctx.restore();
      if (Date.now() >= this._showZoomUntil) this.requestRender();
    }
    // 周边预加载：视口外 2 倍范围内的图片后台加载
    const preloadMargin = 2;
    const plLeft = worldLeft - (w/scale) * preloadMargin;
    const plRight = worldRight + (w/scale) * preloadMargin;
    const plTop = worldTop - (h/scale) * preloadMargin;
    const plBottom = worldBottom + (h/scale) * preloadMargin;
    let preloadCount = 0;
    for (const el of renderElements) {
      if (el.type !== 'image' || !el.dataURL) continue;
      if (el.x + el.w < plLeft || el.x > plRight || el.y + el.h < plTop || el.y > plBottom) continue;
      const key = el.dataURL;
      if (!this.plugin.imageCache[key]) {
        const imgEl = new Image();
        imgEl.src = el.dataURL;
        imgEl.onload = () => { this.plugin.imageCache[key] = imgEl; };
        preloadCount++;
        if (preloadCount > 20) break; // 每帧最多预加载 20 张
      }
    }
    this._drawing = false;
    if (this._renderPending) this.draw();
  }

  // ================== 引脚检测 ==================
  getPinAt(worldX, worldY) {
    const scale = this.viewState.scale;
    const tolerance = 14 / scale;
    const candidates = [];
    // 扁平化所有元素（包括群组内的元素），记录世界坐标偏移
    const collect = (elements, ox, oy) => {
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if (el.type === 'group' && el.children) { collect(el.children, ox + el.x, oy + el.y); continue; }
        if (!(el.type === 'code-node' || (el.type === 'text' && ((el.inputs && el.inputs.length) || (el.outputs && el.outputs.length))) || (el.type === 'note-link' && ((el.inputs && el.inputs.length) || (el.outputs && el.outputs.length))))) continue;
        candidates.push({ el, ox, oy });
      }
    };
    collect(this.elements, 0, 0);
    for (const { el, ox, oy } of candidates) {
      const inputs = el.inputs || [];
      const outputs = el.outputs || [];
      // 输出引脚（右侧）
      for (let j = 0; j < outputs.length; j++) {
        const p = getPinPosForElement(el, false, j);
        const px = el.x + ox + p.x;
        const py = el.y + oy + p.y;
        const dist = Math.sqrt((worldX - px) ** 2 + (worldY - py) ** 2);
        if (dist < tolerance) return { nodeId: el.id, pinId: outputs[j].id, isOutput: true };
      }
      // 输入引脚（左侧）
      for (let j = 0; j < inputs.length; j++) {
        const p = getPinPosForElement(el, true, j);
        const px = el.x + ox + p.x;
        const py = el.y + oy + p.y;
        const dist = Math.sqrt((worldX - px) ** 2 + (worldY - py) ** 2);
        if (dist < tolerance) return { nodeId: el.id, pinId: inputs[j].id, isOutput: false };
      }
    }
    return null;
  }

  // 检测点击的是否是连线端点（用于拖拽断链/重连）
  getLineEndpointAt(worldX, worldY) {
    const scale = this.viewState.scale;
    const tolerance = 16 / scale;
    const allLines = [];
    const cl = (els) => { for (const e of els) { if (e.type === 'line') allLines.push(e); if (e.type === 'group' && e.children) cl(e.children); } };
    cl(this.elements);
    for (let i = allLines.length - 1; i >= 0; i--) {
      const el = allLines[i];
      if (el.type !== 'line') continue;
      if (!el.fromPin && !el.toPin) continue; // 只针对引脚连线
      // 检查起点（输出端）
      if (el.fromPin) {
        const fromPos = getPinWorldPos(this.elements, el.from, el.fromPin);
        if (fromPos) {
          const dist = Math.sqrt((worldX - fromPos.x) ** 2 + (worldY - fromPos.y) ** 2);
          if (dist < tolerance) return { lineId: el.id, isFrom: true, nodeId: el.from, pinId: el.fromPin };
        }
      }
      // 检查终点（输入端）
      if (el.toPin) {
        const toPos = getPinWorldPos(this.elements, el.to, el.toPin);
        if (toPos) {
          const dist = Math.sqrt((worldX - toPos.x) ** 2 + (worldY - toPos.y) ** 2);
          if (dist < tolerance) return { lineId: el.id, isFrom: false, nodeId: el.to, pinId: el.toPin };
        }
      }
    }
    return null;
  }

  // 代码节点已移除模板系统，保留原有渲染逻辑

  // ================== 窗口与置顶 ==================
  async popOutAndPin() {
    await this.saveData();
    if (this.app.commands.commands['workspace:move-to-new-window']) {
      this.app.commands.executeCommandById('workspace:move-to-new-window');
    }
  }

  async mergeToMainWindow() {
    if (this.containerEl.win === window) return; 
    const state = this.leaf.getViewState();
    this.leaf.detach(); 
    const newLeaf = this.app.workspace.getLeaf('tab'); 
    await newLeaf.setViewState(state); 
    this.app.workspace.revealLeaf(newLeaf);
  }

  async toggleAlwaysOnTop() {
    this.isPinned = !this.isPinned;
    try {
        const win = this.containerEl.win || window.activeWindow || window;
        if (win.require) {
            const electron = win.require('electron');
            if (electron && electron.remote) {
                electron.remote.getCurrentWindow().setAlwaysOnTop(this.isPinned);
            }
        }
    } catch (e) { console.error(e); }
  }


  isPurInPopout() {
    const w = this.containerEl.win;
    if (typeof w === 'object' && w !== null && w !== window) return true;
    const doc = this.containerEl.ownerDocument;
    if (doc && doc.defaultView && doc.defaultView !== window) return true;
    const root = this.containerEl.getRootNode && this.containerEl.getRootNode();
    if (root && root.defaultView && root.defaultView !== window) return true;
    if (this.leaf && typeof this.leaf.view === 'object' && this.leaf.view !== this) {
      const parentWin = this.leaf.view.containerEl && this.leaf.view.containerEl.win;
      if (parentWin && parentWin !== window) return true;
    }
    return false;
  }




  // ================== 视频下载 ==================
  isVideoUrl(url) {
    return /^https?:\/\/(www\.)?(bilibili\.com|youtube\.com|youtu\.be|vimeo\.com|b23\.tv)/i.test(url);
  }

  async downloadVideo(url, worldX, worldY) {
    const vaultBase = this.app.vault.adapter.basePath;
    const attachDir = path.join(vaultBase, '附件');
    const fs = require('fs');
    try {
      if (!fs.existsSync(attachDir)) fs.mkdirSync(attachDir);
    } catch(e) { console.error(e); }

    // 动态定位 yt-dlp：扫描 LOCALAPPDATA/APPDATA 下 Python*/Scripts/yt-dlp.exe，
    // 回退到 PATH 上的裸名 yt-dlp，避免硬编码用户名（旧值 C:/Users/Administrator/... 换机即断）
    const ytDlpPath = (() => {
      const bases = [
        process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Programs', 'Python'),
        process.env.APPDATA && path.join(process.env.APPDATA, 'Python'),
      ].filter(Boolean);
      for (const base of bases) {
        let entries;
        try { entries = fs.readdirSync(base); } catch (e) { continue; }
        for (const e of entries) {
          if (/^Python\d+$/.test(e)) {
            const p = path.join(base, e, 'Scripts', 'yt-dlp.exe');
            try { if (fs.existsSync(p)) return p; } catch (_) {}
          }
        }
      }
      return 'yt-dlp';
    })();
    const format = 'bestvideo[height<=480]+bestaudio/best[height<=480]';
    const output = path.join(attachDir, '%(title)s.%(ext)s');
    new Notice('📥 开始下载视频...');

    execFile(ytDlpPath, ['-f', format, '-o', output, '--no-playlist', url],
      { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        new Notice('❌ 下载失败: ' + error.message);
        return;
      }
      new Notice('✅ 视频已下载到 附件/');
    });
  }

  // ================== 交互事件 ==================
  screenToWorld(sx, sy) { return { x: (sx - this.viewState.offsetX) / this.viewState.scale, y: (sy - this.viewState.offsetY) / this.viewState.scale }; }

  getElementAt(worldX, worldY) {
    const check = (elements, ox, oy) => {
        for (let i = elements.length - 1; i >= 0; i--) {
            const el = elements[i];
            if (el.type === 'line') {
                const fromWP = getWorldPos(this.elements, el.from);
                const toWP = getWorldPos(this.elements, el.to);
                if (!fromWP || !toWP) continue;
                const cx1 = fromWP.x + fromWP.w/2, cy1 = fromWP.y + fromWP.h/2;
                const cx2 = toWP.x + toWP.w/2, cy2 = toWP.y + toWP.h/2;
                const mx = cx1 + (cx2 - cx1) / 2, my = cy1 + (cy2 - cy1) / 2;
                const dist = Math.sqrt((worldX - mx)*(worldX - mx) + (worldY - my)*(worldY - my));
                if (dist < 25 / (this.viewState.scale || 1)) return el;
                continue;
              }
            const wx = el.x + ox, wy = el.y + oy;
            if (worldX >= wx && worldX <= wx + (el.w||0) && worldY >= wy && worldY <= wy + (el.h||0)) {
                if (el.type === 'group' && el.children && !el.locked) {
                    const child = check(el.children, wx, wy);
                    if (child) return child;
                }
                return el;
            }
        }
        return null;
    };
    return check(this.elements, 0, 0);
  }

  onMouseDown(e) {
    const win = this.containerEl.win;
    if (win.document.getElementById('pur-edit-dialog') || win.document.getElementById('pur-url-dialog')) return; 
    this.canvas.focus();
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    const world = this.screenToWorld(sx, sy);
    this.lastMouse = { x: e.clientX, y: e.clientY };

    // === 引脚拖拽连线检测（最高优先级） ===
    const clickedPin = this.getPinAt(world.x, world.y);
    // 先检查是否点击了已存在的连线端点（拖拽重连）
    const clickedLineEndpoint = this.getLineEndpointAt(world.x, world.y);

    if (clickedPin && e.button === 0) {
      if (clickedPin.isOutput) {
        // 从输出引脚开始拖拽创建新连线
        this._pinDrag = {
          fromNodeId: clickedPin.nodeId,
          fromPinId: clickedPin.pinId,
          mouseScreenX: sx,
          mouseScreenY: sy,
          lineId: null
        };
        this.canvas.style.cursor = 'crosshair';
        this.requestRender();
        return;
      }
    }

    // 点击已有连线的端点 → 拖拽重新连接
    if (clickedLineEndpoint && e.button === 0) {
      const line = this.elements.find(el => el.id === clickedLineEndpoint.lineId);
      if (line) {
        if (clickedLineEndpoint.isFrom) {
          // 拖拽起点（输出端）—— 保持目标不变，重连起点到新输出
          this._pinDrag = {
            fromNodeId: null, // 表示临时断开起点，拖动中
            fromPinId: null,
            toNodeId: line.to,
            toPinId: line.toPin,
            mouseScreenX: sx,
            mouseScreenY: sy,
            lineId: line.id,
            dragMode: 'relink-from' // 重连起点
          };
        } else {
          // 拖拽终点（输入端）—— 保持起点不变，重连终点到新输入
          this._pinDrag = {
            fromNodeId: line.from,
            fromPinId: line.fromPin,
            mouseScreenX: sx,
            mouseScreenY: sy,
            lineId: line.id,
            dragMode: 'relink-to' // 重连终点
          };
        }
        this.canvas.style.cursor = 'crosshair';
        this.requestRender();
        return;
      }
    }

    let clickedResize = false;
    for (const id of this.selectedIds) {
      const selWP = findElementById(this.elements, id); const selEl = selWP ? selWP.el : null;
      if (selEl && !selEl.locked && selEl.type !== 'line') {
        const handleWorldX = selEl.x + selWP.parentX + selEl.w;
        const handleWorldY = selEl.y + selWP.parentY + selEl.h;
        const tolerance = 20 / this.viewState.scale;
        if (Math.abs(world.x - handleWorldX) < tolerance && Math.abs(world.y - handleWorldY) < tolerance) {
          this.isResizingElement = true;
          this.resizeElement = selEl;
          this.resizeStart = { x: e.clientX, y: e.clientY, w: selEl.w, h: selEl.h, parentX: selWP.parentX, parentY: selWP.parentY };
          clickedResize = true;
          break;
        }
      }
    }
    if (clickedResize) { e.stopPropagation(); return; }


    const el = this.getElementAt(world.x, world.y);

    if (e.button === 0) {
      if (el) {
        if (e.ctrlKey || e.metaKey) {
          if (this.selectedIds.has(el.id)) this.selectedIds.delete(el.id); else this.selectedIds.add(el.id);
        } else {
          if (!this.selectedIds.has(el.id)) { this.selectedIds.clear(); this.selectedIds.add(el.id); }
          if (el.type === 'line') { this.editLineLabel(el); return; }
          if (true) {
            this.dragElement = el; this.isDraggingElement = true;
            this.dragStart = {
                x: e.clientX, y: e.clientY,
                elements: Array.from(this.selectedIds).map(id => {
                    const fp = findElementById(this.elements, id);
                    if (!fp) return null;
                    return { id: fp.el.id, x: fp.el.x + fp.parentX, y: fp.el.y + fp.parentY, parentX: fp.parentX, parentY: fp.parentY };
                })
            };
          }
        }
      } else {
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey) this.selectedIds.clear();
        this.isSelecting = true; this.selectionRect = { x: sx, y: sy, w: 0, h: 0 };
      }
    } else if (e.button === 1 || e.button === 2) { 
      this._rclickStart = { x: e.clientX, y: e.clientY };
      this.isPanning = true; 
    }
    this.requestRender();
  }

  onMouseMove(e) {
    // 仅 Pur Studio 活跃时处理，不影响其他视图
    if (!this._isViewActive()) return;
    const dx = e.clientX - this.lastMouse.x, dy = e.clientY - this.lastMouse.y;
    this.lastMouse.x = e.clientX; this.lastMouse.y = e.clientY;
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    const world = this.screenToWorld(sx, sy);

    // === 正在拖拽引脚连线 / 重连连线端点 ===
    if (this._pinDrag) {
      this._pinDrag.mouseScreenX = sx;
      this._pinDrag.mouseScreenY = sy;
      // 检测鼠标下的目标引脚（用于松开时重新连接）
      const hovered = this.getPinAt(world.x, world.y);
      if (this._pinDrag.dragMode === 'relink-from') {
        // 重连起点：悬停必须在输出引脚上才有效
        this._hoverPin = (hovered && hovered.isOutput) ? hovered : null;
      } else {
        // 新建连线 / 重连终点：悬停必须在输入引脚上
        this._hoverPin = (hovered && !hovered.isOutput) ? hovered : null;
      }
      this.requestRender();
      return;
    }

    // 引脚悬停检测
    const hp = this.getPinAt(world.x, world.y);
    const needRedraw = (hp && !this._hoverPin) || (!hp && this._hoverPin) ||
      (hp && this._hoverPin && (hp.nodeId !== this._hoverPin.nodeId || hp.pinId !== this._hoverPin.pinId));
    if (needRedraw) {
      this._hoverPin = hp;
      this.canvas.style.cursor = hp ? 'pointer' : 'default';
      this.requestRender();
    }

    // 连线悬停检测
    if (!this.isPanning && !this.isDraggingElement && !this.isResizingElement && !hp) {
          const wx = world.x, wy = world.y;
          let nearest = null, nearestDist = 30 / (this.viewState.scale || 1);
          const allHoverLines = [];
          const chl = (els) => { for (const e of els) { if (e.type === 'line') allHoverLines.push(e); if (e.type === 'group' && e.children) chl(e.children); } };
          chl(this.elements);
          for (const el of allHoverLines) {
              if (el.type !== "line") continue;
              const fw = getWorldPos(this.elements, el.from);
              const tw = getWorldPos(this.elements, el.to);
              if (!fw || !tw) continue;
              const cx1 = fw.x + fw.w/2, cy1 = fw.y + fw.h/2;
              const cx2 = tw.x + tw.w/2, cy2 = tw.y + tw.h/2;
              for (let t = 0; t <= 1; t += 0.05) {
                  const bx = cx1 + (cx2 - cx1) * t, by = cy1 + (cy2 - cy1) * t;
                  const d = Math.sqrt((wx - bx)**2 + (wy - by)**2);
                  if (d < nearestDist) { nearest = el.id; nearestDist = d; }
              }
          }
          if (this.hoveredLineId !== nearest) { this.hoveredLineId = nearest; this.requestRender(); }
    }

    if (this.isPanning) {
      this._panVel.x = dx; this._panVel.y = dy;
      this.viewState.offsetX += dx; this.viewState.offsetY += dy;
      this.draw(); 
    } else if (this.isResizingElement && this.resizeElement) {
      const moveX = (e.clientX - this.resizeStart.x) / this.viewState.scale;
      const moveY = (e.clientY - this.resizeStart.y) / this.viewState.scale;
      this.resizeElement.w = parseFloat((Math.max(30, this.resizeStart.w + moveX)).toFixed(1));
      this.resizeElement.h = parseFloat((Math.max(30, this.resizeStart.h + moveY)).toFixed(1));
      this.draw();
    } else if (this.isDraggingElement && this.dragElement) {
      const moveX = (e.clientX - this.dragStart.x) / this.viewState.scale;
      const moveY = (e.clientY - this.dragStart.y) / this.viewState.scale;
      
      // 纯世界坐标拖动
      for (const sel of this.dragStart.elements) {
          if (!sel) continue;
          const sp = findElementById(this.elements, sel.id);
          if (!sp) continue;
          const el = sp.el;
          if (el && el.type !== 'line') {
              el.x = (sel.x + moveX) - sel.parentX;
              el.y = (sel.y + moveY) - sel.parentY;
          }
      }
      this.draw(); 
    } else if (this.isSelecting && this.selectionRect) {
      const rect = this.canvas.getBoundingClientRect();
      this.selectionRect.w = (e.clientX - rect.left) - this.selectionRect.x;
      this.selectionRect.h = (e.clientY - rect.top) - this.selectionRect.y;
      this.draw();
    }
  }

  _startMomentum() {
    if (Math.abs(this._panVel.x) < 0.5 && Math.abs(this._panVel.y) < 0.5) return;
    this._panVel.x *= 0.90; this._panVel.y *= 0.90;
    this.viewState.offsetX += this._panVel.x; this.viewState.offsetY += this._panVel.y;
    this.draw();
    const targetWindow = this.containerEl.win || window;
    this._momentumRaf = targetWindow.requestAnimationFrame(() => this._startMomentum());
  }

  onMouseUp(e) {
    // 仅 Pur Studio 活跃时处理
    if (!this._isViewActive()) return;
    // === 引脚拖拽连线完成 / 重连完成 ===
    if (this._pinDrag) {
      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
      const world = this.screenToWorld(sx, sy);
      const targetPin = this.getPinAt(world.x, world.y);
      const drag = this._pinDrag;
      this._pinDrag = null;
      this._hoverPin = null;
      this.canvas.style.cursor = 'default';

      if (drag.dragMode === 'relink-from') {
        // === 重连起点（原起点断开，需要重新连接到新的输出引脚）===
        if (targetPin && targetPin.isOutput && targetPin.nodeId !== drag.toNodeId) {
          const existingLine = this.elements.find(el => el.id === drag.lineId);
          if (existingLine) {
            existingLine.from = targetPin.nodeId;
            existingLine.fromPin = targetPin.pinId;
            this.saveHistory();
            this.saveData();
            new Notice('连线起点已重连');
          }
        }
        this.requestRender();
        return;
      }

      if (drag.dragMode === 'relink-to') {
        // === 重连终点（原终点断开，需要重新连接到新的输入引脚）===
        if (targetPin && !targetPin.isOutput && targetPin.nodeId !== drag.fromNodeId) {
          const existingLine = this.elements.find(el => el.id === drag.lineId);
          if (existingLine) {
            // 删除目标输入引脚若已有其他连线，则清理
            this.elements = this.elements.filter(el => {
              if (el.id === drag.lineId) return true; // 保留当前线（稍后更新）
              if (el.type !== 'line') return true;
              return !(el.to === targetPin.nodeId && el.toPin === targetPin.pinId);
            });
            // 现在更新当前连线
            const line = this.elements.find(el => el.id === drag.lineId);
            if (line) {
              line.to = targetPin.nodeId;
              line.toPin = targetPin.pinId;
            }
            this.saveHistory();
            this.saveData();
            new Notice('连线终点已重连');
          }
        }
        this.requestRender();
        return;
      }

      // === 新建连线（默认行为）===
      if (targetPin && !targetPin.isOutput && targetPin.nodeId !== drag.fromNodeId) {
        // 删除已存在的到这个输入引脚的连线（每个输入引脚只能有一个连接）
        this.elements = this.elements.filter(el => {
          if (el.type !== 'line') return true;
          return !(el.to === targetPin.nodeId && el.toPin === targetPin.pinId);
        });
        const line = {
          id: generateId(),
          type: 'line',
          from: drag.fromNodeId,
          fromPin: drag.fromPinId,
          to: targetPin.nodeId,
          toPin: targetPin.pinId,
          content: ''
        };
        this.elements.push(line);
        this.saveHistory();
        this.saveData();
        new Notice('连线已创建');
      }
      this.requestRender();
      return;
    }

    if (this.isResizingElement) {
      this.isResizingElement = false;
      this.resizeElement = null;
      this.saveHistory(); this.saveData();
      this.requestRender();
      return;
    }

    if (this.isSelecting && this.selectionRect) {
      let { x, y, w, h } = this.selectionRect;
      if (w < 0) { x += w; w = Math.abs(w); } 
      if (h < 0) { y += h; h = Math.abs(h); }
      const worldStart = this.screenToWorld(x, y), worldEnd = this.screenToWorld(x + w, y + h);
      const selected = this.elements.filter(el => 
        el.type !== 'line' && (el.x < worldEnd.x && el.x + el.w > worldStart.x) && (el.y < worldEnd.y && el.y + el.h > worldStart.y) 
      );
      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) this.selectedIds.clear();
      selected.forEach(el => this.selectedIds.add(el.id));
      this.selectionRect = null; this.isSelecting = false;
    }
    if (this.isDraggingElement) {
      this.isDraggingElement = false;
      const hasMoved = this.dragStart ? this.dragStart.elements.some(de => { const fp = findElementById(this.elements, de.id); return fp && (Math.abs(fp.el.x + fp.parentX - de.x) > 1 || Math.abs(fp.el.y + fp.parentY - de.y) > 1); }) : false;
      if (hasMoved) {
          for (const sel of this.dragStart.elements) {
              const fp = findElementById(this.elements, sel.id);
              if (!fp || fp.el.type === 'line' || fp.el.type === 'group') continue;
              const el = fp.el;
              const wx = el.x + fp.parentX, wy = el.y + fp.parentY;
              const cx = wx + (el.w || 50) / 2, cy = wy + (el.h || 30) / 2;
              // 找到最深层包含该节点中心的群组
              let target = null, targetDepth = -1;
              const search = (els, depth) => {
                  for (const e of els) {
                      if (e.type !== 'group' || !e.children || e.id === el.id) continue;
                      const gw = getWorldPos(this.elements, e.id);
                      if (gw && cx >= gw.x && cx <= gw.x + gw.w && cy >= gw.y && cy <= gw.y + gw.h) {
                          if (depth > targetDepth) { target = e; targetDepth = depth; }
                          search(e.children, depth + 1);
                      }
                  }
              };
              search(this.elements, 0);
              // 从当前位置移除
              const topIdx = this.elements.indexOf(el);
              if (topIdx > -1) this.elements.splice(topIdx, 1);
              else {
                  const allG = []; const cg = (els) => { for (const e of els) { if (e.type === 'group' && e.children) { allG.push(e); cg(e.children); } } };
                  cg(this.elements);
                  for (const g of allG) { const ci = g.children.indexOf(el); if (ci > -1) { g.children.splice(ci, 1); break; } }
              }
              // 放入目标群组或顶层
              if (target) {
                  const gw = getWorldPos(this.elements, target.id);
                  el.x = wx - (gw ? gw.x : target.x);
                  el.y = wy - (gw ? gw.y : target.y);
                  target.children.push(el);
              } else {
                  el.x = wx; el.y = wy;
                  this.elements.push(el);
              }
          }
      }
            this.saveHistory(); this.saveData();
    }
    if (this.isPanning) {
      this.isPanning = false;
      if (e.button === 2 && this._rclickStart) {
        if (Math.abs(e.clientX - this._rclickStart.x) + Math.abs(e.clientY - this._rclickStart.y) < 5) this.showContextMenu(e);
      }
      if (this._momentumRaf) {
        const targetWindow = this.containerEl.win || window;
        targetWindow.cancelAnimationFrame(this._momentumRaf);
      }
      this._startMomentum();
    }
    this.canvas.style.cursor = 'default';
    this.requestRender();
  }

  onWheel(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const worldX = (mx - this.viewState.offsetX) / this.viewState.scale;
    const worldY = (my - this.viewState.offsetY) / this.viewState.scale;
    const zoomFactor = e.deltaY > 0 ? 0.85 : 1.15;
    this.viewState.scale = Math.min(10, Math.max(0.05, this.viewState.scale * zoomFactor));
    this.viewState.offsetX = mx - worldX * this.viewState.scale;
    this.viewState.offsetY = my - worldY * this.viewState.scale;
    this._showZoomUntil = Date.now() + 2000;
    this.draw();
  }

  _showZoomUntil = null;

  onContextMenu(e) { e.preventDefault(); }
  onDoubleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const world = this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    const el = this.getElementAt(world.x, world.y);
    if (!el) { this.addTextBlock(world.x, world.y); return; } 
    if (el.locked) { new Notice(t(this.plugin, 'lockedNotice')); }
    else if (el.type === 'text' || el.type === 'code-node') this.editTextElement(el);
    else if (el.type === 'group') this.editGroupLabel(el);
    else if (el.type === 'line') this.editLineLabel(el);
    else if (el.type === 'image') {
      if (el.link) this.app.workspace.openLinkText(el.link, '', false);
      else if (el.original) this.app.workspace.openLinkText(el.original, '', false);
    }
    else if (el.type === 'note-link' && el.link) this.app.workspace.openLinkText(el.link, '', false);
  }


  // ================== 节点编辑器（简化版） ==================
  async editCodeNode(node) {
    const win = this.containerEl.win;
    if (win.document.getElementById('pur-edit-dialog')) return;

    const inputs = (node.inputs || []).map(p => ({ id: p.id, label: p.label }));
    const outputs = (node.outputs || []).map(p => ({ id: p.id, label: p.label }));

    const container = this.containerEl.children[1];
    const w = Math.round(container.clientWidth * 0.65);
    const h = Math.round(container.clientHeight * 0.75);
    const cx = (container.clientWidth - w) / 2;
    const cy = (container.clientHeight - h) / 2;

    const resizeDialog = () => {
      const cw = container.clientWidth, ch = container.clientHeight;
      const nw = Math.round(cw * 0.65), nh = Math.round(ch * 0.75);
      div.style.left = ((cw - nw) / 2) + 'px';
      div.style.top = ((ch - nh) / 2) + 'px';
      div.style.width = nw + 'px';
      div.style.height = nh + 'px';
    };
    this._purResizeHandler = resizeDialog;
    win.addEventListener('resize', resizeDialog);

    const div = win.document.createElement('div');
    div.id = 'pur-edit-dialog';
    div.style.cssText = `position:absolute; left:${cx}px; top:${cy}px; width:${w}px; height:${h}px; z-index:100000; display:flex; flex-direction:column; background:rgba(25,25,25,0.98); border:1px solid rgba(255,255,255,0.15); border-radius:10px; box-shadow:0 8px 32px rgba(0,0,0,0.5); overflow:hidden; backdrop-filter:blur(6px); box-sizing:border-box;`;

    div.innerHTML = `
      <div class="pur-drag-handle" style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:rgba(255,255,255,0.06); border-bottom:1px solid rgba(255,255,255,0.08); cursor:move; user-select:none; flex-shrink:0;">
        <span style="color:#fff; font-weight:bold; font-size:14px;">编辑节点</span>
        <button id="pur-edit-close" style="background:transparent; border:none; color:#888; font-size:18px; cursor:pointer; padding:0 6px;">×</button>
      </div>
      <div style="flex:1; padding:14px; overflow-y:auto; display:flex; flex-direction:column; gap:12px;">
        <div>
          <label style="color:#ccc; font-size:12px; display:block; margin-bottom:4px;">节点标题</label>
          <input id="pur-node-title" type="text" value="${node.title || ''}" style="width:100%; background:#1a1a1a; color:#fff; border:1px solid #333; border-radius:4px; padding:6px 8px; font-size:13px; box-sizing:border-box;">
        </div>
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <label style="color:#ccc; font-size:12px;">输入引脚</label>
            <button id="pur-add-input" style="background:transparent; color:#bbb; border:1px dashed #666; border-radius:4px; padding:3px 10px; font-size:11px; cursor:pointer;">+ 添加输入</button>
          </div>
          <div id="pur-inputs-list" style="display:flex; flex-direction:column; gap:4px;"></div>
        </div>
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <label style="color:#ccc; font-size:12px;">输出引脚</label>
            <button id="pur-add-output" style="background:transparent; color:#bbb; border:1px dashed #666; border-radius:4px; padding:3px 10px; font-size:11px; cursor:pointer;">+ 添加输出</button>
          </div>
          <div id="pur-outputs-list" style="display:flex; flex-direction:column; gap:4px;"></div>
        </div>
      </div>
      <div style="display:flex; gap:8px; justify-content:flex-end; padding:10px 14px; border-top:1px solid rgba(255,255,255,0.08); background:rgba(0,0,0,0.2); flex-shrink:0;">
        <button id="pur-delete-node" style="background:transparent; color:#ff6b6b; border:1px solid rgba(255,107,107,0.3); border-radius:4px; padding:6px 14px; font-size:12px; cursor:pointer;">删除节点</button>
        <button id="pur-cancel-node" style="background:transparent; color:#ccc; border:1px solid #444; border-radius:4px; padding:6px 14px; font-size:12px; cursor:pointer;">取消</button>
        <button id="pur-save-node" style="background:#4a9eff; color:#fff; border:none; border-radius:4px; padding:6px 14px; font-size:12px; font-weight:bold; cursor:pointer;">保存</button>
      </div>
    `;
    this.containerEl.appendChild(div);

    // 渲染引脚列表
    const renderPins = (listId, pins) => {
      const listEl = div.querySelector(listId);
      listEl.innerHTML = '';
      pins.forEach((pin, idx) => {
        const row = win.document.createElement('div');
        row.style.cssText = 'display:flex; gap:6px; align-items:center;';
        row.innerHTML = `
          <input type="text" value="${pin.label || pin.id}" data-idx="${idx}" placeholder="引脚名称" style="flex:1; background:#1a1a1a; color:#fff; border:1px solid #333; border-radius:4px; padding:4px 8px; font-size:12px;">
          <button data-idx="${idx}" style="background:transparent; color:#888; border:1px solid #555; border-radius:4px; padding:4px 10px; font-size:11px; cursor:pointer;">删除</button>
        `;
        const input = row.querySelector('input');
        const delBtn = row.querySelector('button');
        input.oninput = (e) => { pins[idx].label = e.target.value; };
        delBtn.onclick = () => { pins.splice(idx, 1); renderPins(listId, pins); };
        listEl.appendChild(row);
      });
    };
    renderPins('#pur-inputs-list', inputs);
    renderPins('#pur-outputs-list', outputs);

    div.querySelector('#pur-add-input').onclick = () => {
      const code = div.querySelector('textarea')?.value || '';
      const used = inputs.map(p=>p.label).filter(Boolean);
      let found=[];const m=code.match(/const\s*\{\s*([^}]+)\s*\}\s*=\s*inputs/);if(m)found=m[1].split(',').map(s=>s.trim().split('=')[0].trim()).filter(Boolean);
      const unmapped=found.filter(l=>!used.includes(l));
      inputs.push({ id: generateId(), label: unmapped.length>0?unmapped[0]:'' }); renderPins('#pur-inputs-list', inputs); };
    div.querySelector('#pur-add-output').onclick = () => {
      const code = div.querySelector('textarea')?.value || '';
      const used = outputs.map(p=>p.label).filter(Boolean);
      let found=[];const m=code.match(/return\s*\{([^}]+)\}/);if(m)found=m[1].split(',').map(s=>s.trim().split(':')[0].trim()).filter(Boolean);
      const unmapped=found.filter(l=>!used.includes(l));
      outputs.push({ id: generateId(), label: unmapped.length>0?unmapped[0]:'' }); renderPins('#pur-outputs-list', outputs); };

    const close = () => { win.removeEventListener('resize', resizeDialog); div.remove(); };
    div.querySelector('#pur-edit-close').onclick = close;
    div.querySelector('#pur-cancel-node').onclick = close;

    div.querySelector('#pur-save-node').onclick = () => {
      node.title = div.querySelector('#pur-node-title').value.trim() || '节点';
      node.inputs = inputs.map((p, i) => ({ id: p.id || generateId(), label: p.label ? p.label.trim() : '' }));
      node.outputs = outputs.map((p, i) => ({ id: p.id || generateId(), label: p.label ? p.label.trim() : '' }));
      this.saveHistory(); this.saveData(); this.requestRender();
      close();
      new Notice('节点已更新');
    };

    div.querySelector('#pur-delete-node').onclick = () => {
      if (!confirm('确定删除此节点吗？相关连线也会被删除。')) return;
      const nodeId = node.id;
      this.elements = this.elements.filter(el => {
        if (el.id === nodeId) return false;
        if (el.type === 'line' && (el.from === nodeId || el.to === nodeId)) return false;
        return true;
      });
      this.saveHistory(); this.saveData(); this.requestRender();
      close();
      new Notice('节点已删除');
    };

    // 拖拽移动
    let isDragging = false, startX, startY, initX, initY;
    div.querySelector('.pur-drag-handle').onmousedown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
      isDragging = true; startX = e.clientX; startY = e.clientY; initX = div.offsetLeft; initY = div.offsetTop;
    };
    win.document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      div.style.left = (initX + (e.clientX - startX)) + 'px';
      div.style.top = (initY + (e.clientY - startY)) + 'px';
    });
    win.document.addEventListener('mouseup', () => { isDragging = false; });
  }

  async editLineLabel(el) {
    const win = this.containerEl.win;
    if (win.document.getElementById('pur-edit-dialog')) return;
    const wp1 = getWorldPos(this.elements, el.from);
    const wp2 = getWorldPos(this.elements, el.to);
    if (!wp1 || !wp2) return;
    const scale = this.viewState.scale;
    const mx = ((wp1.x + wp1.w/2 + wp2.x + wp2.w/2) / 2) * scale + this.viewState.offsetX;
    const my = ((wp1.y + wp1.h/2 + wp2.y + wp2.h/2) / 2) * scale + this.viewState.offsetY;
    const div = win.document.createElement('div');
    div.id = 'pur-edit-dialog';
    div.style.cssText = 'position:absolute; left:' + (mx - 120) + 'px; top:' + (my - 15) + 'px; width:' + (240) + 'px; z-index:100000; display:flex; flex-direction:column; background:rgba(0,0,0,0.5); border:2px solid #4a9eff; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.5); overflow:hidden; backdrop-filter:blur(4px); box-sizing:border-box;';
    const tc = el.textColor || '#e0e0e0';
    const fs = el.fontSize || 12;
    const ff = el.fontFamily || 'sans-serif';
    const styleOpts=['curve','straight','rect'];const curStyle=el.style||'curve';
    const styleHTML='<select id=\"line-style\" title=\"连线样式\" style=\"background:#222;color:#ccc;border:1px solid #444;border-radius:3px;outline:none;cursor:pointer;font-size:10px;padding:1px;\">'+styleOpts.map(s=>'<option value=\"'+s+'\"'+(curStyle===s?' selected':'')+'>'+(s==='curve'?'曲线':s==='straight'?'直线':'直角')+'</option>').join('')+'</select>';
    const arrowHTML='<label title=\"显示箭头\" style=\"display:flex;align-items:center;gap:2px;font-size:10px;color:#999;\"><input type=\"checkbox\" id=\"line-arrow\"'+(el.arrow!==false?' checked':'')+' style=\"width:12px;height:12px;\">-></label>';
    div.innerHTML = '<div class=\"pur-drag-handle\" style=\"display:flex; gap:4px; padding:6px 8px; background:rgba(0,0,0,0.6); border-bottom:1px solid rgba(255,255,255,0.1); align-items:center; cursor:move; user-select:none; flex-shrink:0; flex-wrap:wrap;\">'+styleHTML+arrowHTML+'<input type=\"color\" id=\"line-text-color\" value=\"' + tc + '\" title=\"文字颜色\" style=\"width:20px;height:20px;padding:0;border:none;cursor:pointer;background:transparent;\"><input type=\"number\" id=\"line-size\" value=\"' + fs + '\" min=\"8\" max=\"40\" title=\"字号\" style=\"width:36px;background:#222;color:#ccc;border:1px solid #444;border-radius:3px;padding:2px;outline:none;font-size:11px;text-align:center;\"><select id=\"line-font\" style=\"background:#222;color:#ccc;border:1px solid #444;border-radius:3px;outline:none;cursor:pointer;font-size:11px;padding:1px;max-width:65px;\"><option value=\"sans-serif\"' + (ff==='sans-serif'?' selected':'') + '>默认</option><option value=\"Microsoft YaHei, sans-serif\"' + (ff==='Microsoft YaHei, sans-serif'?' selected':'') + '>雅黑</option><option value=\"SimSun, serif\"' + (ff==='SimSun, serif'?' selected':'') + '>宋体</option><option value=\"SimHei, sans-serif\"' + (ff==='SimHei, sans-serif'?' selected':'') + '>黑体</option><option value=\"KaiTi, serif\"' + (ff==='KaiTi, serif'?' selected':'') + '>楷体</option><option value=\"cursive\"' + (ff==='cursive'?' selected':'') + '>手写</option></select></div><textarea id=\"line-label-input\" placeholder=\"连线注释... (点击空白处保存)\" style=\"flex-grow:1; width:100%; height:60px; background:transparent; color:' + tc + '; border:none; padding:8px; font-size:' + (fs * scale) + 'px; font-family:' + ff + '; outline:none; resize:none; box-sizing:border-box;\">' + (el.content || '') + '</textarea>';
    this.containerEl.appendChild(div);
    const input = div.querySelector('#line-label-input');
    setTimeout(() => input.focus(), 50);
    div.onmousedown = (e) => { if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return; e.stopPropagation(); };
    const done = () => { el.content = input.value.trim(); el.textColor = div.querySelector('#line-text-color').value; el.fontSize = parseInt(div.querySelector('#line-size').value) || 12; el.fontFamily = div.querySelector('#line-font').value; el.style = div.querySelector('#line-style')?.value || 'curve'; el.arrow = div.querySelector('#line-arrow')?.checked; div.remove(); win.document.removeEventListener('mousemove', onMove); win.document.removeEventListener('mouseup', onUp); win.document.removeEventListener('mousedown', outsideClick); this.saveHistory(); this.saveData(); this.requestRender(); this.canvas.focus(); };
    input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') { div.remove(); this.canvas.focus(); } });
    const handle = div.querySelector('.pur-drag-handle');
    let isDragging = false, startX, startY, initX, initY;
    handle.onmousedown = (e) => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return; isDragging = true; startX = e.clientX; startY = e.clientY; initX = div.offsetLeft; initY = div.offsetTop; e.stopPropagation(); };
    const onMove = (e) => { if (!isDragging) return; div.style.left = (initX + (e.clientX - startX)) + 'px'; div.style.top = (initY + (e.clientY - startY)) + 'px'; };
    const onUp = () => isDragging = false;
    win.document.addEventListener('mousemove', onMove);
    win.document.addEventListener('mouseup', onUp);
    const outsideClick = (e) => { if (!div.contains(e.target)) done(); };
    setTimeout(() => win.document.addEventListener('mousedown', outsideClick), 100);
  }

  async editGroupLabel(el) {
    const win = this.containerEl.win;
    if (win.document.getElementById('pur-edit-dialog')) return;
    const gw = getWorldPos(this.elements, el.id);
    const sx = ((gw ? gw.x : el.x) * this.viewState.scale) + this.viewState.offsetX;
    const sy = ((gw ? gw.y : el.y) * this.viewState.scale) + this.viewState.offsetY;
    const div = win.document.createElement('div');
    div.id = 'pur-edit-dialog';
    div.style.cssText = `position:absolute; left:${sx}px; top:${sy}px; width:${Math.max(220, el.w * this.viewState.scale)}px; z-index:100000; display:flex; flex-direction:column; background:rgba(0,0,0,0.5); border:2px solid #4a9eff; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.5); overflow:hidden; backdrop-filter:blur(4px); box-sizing:border-box;`;
    div.innerHTML = `<div class="pur-drag-handle" style="display:flex; gap:6px; padding:8px 10px; background:rgba(0,0,0,0.6); border-bottom:1px solid rgba(255,255,255,0.1); align-items:center; cursor:move; user-select:none; flex-shrink:0;"><select id="group-font" style="background:#222;color:#ccc;border:1px solid #444;border-radius:3px;outline:none;cursor:pointer;font-size:11px;padding:1px;max-width:70px;"><option value="sans-serif" ${(!el.fontFamily || el.fontFamily === 'sans-serif') ? 'selected' : ''}>默认</option><option value="Microsoft YaHei, sans-serif" ${el.fontFamily === "'Microsoft YaHei', sans-serif" ? 'selected' : ''}>雅黑</option><option value="SimSun, serif" ${el.fontFamily === 'SimSun, serif' ? 'selected' : ''}>宋体</option><option value="SimHei, sans-serif" ${el.fontFamily === 'SimHei, sans-serif' ? 'selected' : ''}>黑体</option><option value="KaiTi, serif" ${el.fontFamily === 'KaiTi, serif' ? 'selected' : ''}>楷体</option><option value="cursive" ${el.fontFamily === 'cursive' ? 'selected' : ''}>手写</option></select><input type="number" id="group-size" value="${el.fontSize || 12}" min="8" max="40" title="字号" style="width:36px;background:#222;color:#ccc;border:1px solid #444;border-radius:3px;padding:2px;outline:none;font-size:11px;text-align:center;"><input type="text" id="group-label-input" value="${el.content || ''}" placeholder="输入群组名称..." style="flex:1;background:#222;color:#eee;border:1px solid #444;border-radius:4px;padding:4px 8px;outline:none;font-size:12px;"><input type="color" id="group-color" value="${el.color || '#e0e0e0'}" title="文字颜色" style="width:22px;height:22px;padding:0;border:none;cursor:pointer;background:transparent;"><input type="color" id="group-border-color" value="${el.borderColor || el.color || 'rgba(150,160,180,0.5)'}" title="边框颜色" style="width:22px;height:22px;padding:0;border:none;cursor:pointer;background:transparent;"></div>`;
    this.containerEl.appendChild(div);
    const input = div.querySelector('#group-label-input');
    setTimeout(() => { input.focus(); input.select(); }, 50);
    div.onmousedown = (e) => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return; e.stopPropagation(); };
    const done = () => { el.content = input.value.trim(); el.color = div.querySelector('#group-color').value; el.borderColor = div.querySelector('#group-border-color').value; div.remove(); win.document.removeEventListener('mousemove', onMove); win.document.removeEventListener('mouseup', onUp); win.document.removeEventListener('mousedown', outsideClick); this.saveHistory(); this.saveData(); this.requestRender(); this.canvas.focus(); };
    input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') done(); if (e.key === 'Escape') { div.remove(); this.canvas.focus(); } });
    const handle = div.querySelector('.pur-drag-handle');
    let isDragging = false, startX, startY, initX, initY;
    handle.onmousedown = (e) => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return; isDragging = true; startX = e.clientX; startY = e.clientY; initX = div.offsetLeft; initY = div.offsetTop; e.stopPropagation(); };
    const onMove = (e) => { if (!isDragging) return; div.style.left = `${initX + (e.clientX - startX)}px`; div.style.top = `${initY + (e.clientY - startY)}px`; };
    const onUp = () => isDragging = false;
    win.document.addEventListener('mousemove', onMove);
    win.document.addEventListener('mouseup', onUp);
    const outsideClick = (e) => { if (!div.contains(e.target)) done(); };
    setTimeout(() => win.document.addEventListener('mousedown', outsideClick), 100);
  }


  // 编辑链接卡片注释
  async editNoteLink(el) {
    const win = this.containerEl.win;
    if (win.document.getElementById('pur-edit-dialog')) return;
    const scale = this.viewState.scale;
    const sx = (el.x * scale) + this.viewState.offsetX;
    const sy = (el.y * scale) + this.viewState.offsetY;
    const div = win.document.createElement('div');
    div.id = 'pur-edit-dialog';
    div.style.cssText = 'position:absolute; left:' + sx + 'px; top:' + sy + 'px; width:' + Math.max(220, el.w * scale) + 'px; z-index:100000; display:flex; flex-direction:column; background:rgba(0,0,0,0.5); border:2px solid #4a9eff; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.5); overflow:hidden; backdrop-filter:blur(4px); box-sizing:border-box;';
    const nfs = el.noteFontSize || 12;
    const nc = el.noteColor || '#ccc';
    div.innerHTML = '<div class="pur-drag-handle" style="display:flex; gap:6px; padding:8px 10px; background:rgba(0,0,0,0.6); border-bottom:1px solid rgba(255,255,255,0.1); align-items:center; cursor:move; user-select:none; flex-shrink:0;"><span style="color:#4a9eff;font-size:12px;">' + String.fromCodePoint(0x1F4C4) + ' ' + (el.content || '链接') + '</span><input type="color" id="note-color" value="' + nc + '" title="文字颜色" style="width:22px;height:22px;padding:0;border:none;cursor:pointer;background:transparent;"><input type="number" id="note-size" value="' + nfs + '" min="8" max="40" title="字号" style="width:36px;background:#222;color:#ccc;border:1px solid #444;border-radius:3px;padding:2px;outline:none;font-size:11px;text-align:center;"><select id="note-font" style="background:#222;color:#ccc;border:1px solid #444;border-radius:3px;outline:none;cursor:pointer;font-size:11px;padding:1px;max-width:70px;"><option value="sans-serif">默认</option><option value="Microsoft YaHei, sans-serif">雅黑</option><option value="SimSun, serif">宋体</option><option value="SimHei, sans-serif">黑体</option><option value="KaiTi, serif">楷体</option><option value="cursive">手写</option></select></div><textarea id="note-input" placeholder="添加注释... (点击空白处保存)" style="background:#222;color:#eee;border:1px solid #444;border-radius:4px;padding:6px 10px;margin:8px;outline:none;font-size:12px;resize:none;flex-grow:1;box-sizing:border-box;">' + (el.note || '') + '</textarea>';
    this.containerEl.appendChild(div);
    const input = div.querySelector('#note-input');
    setTimeout(() => { input.focus(); input.select(); }, 50);
    div.onmousedown = (e) => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return; e.stopPropagation(); };
    const done = () => { el.note = input.value.trim(); const ncEl = div.querySelector('#note-color'); if (ncEl) el.noteColor = ncEl.value; const nsEl = div.querySelector('#note-size'); if (nsEl) el.noteFontSize = parseInt(nsEl.value) || 12; const nfEl = div.querySelector('#note-font'); if (nfEl) el.noteFontFamily = nfEl.value; div.remove(); win.document.removeEventListener('mousemove', onMove); win.document.removeEventListener('mouseup', onUp); win.document.removeEventListener('mousedown', outsideClick); this.saveHistory(); this.saveData(); this.requestRender(); this.canvas.focus(); };
    input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') { div.remove(); this.canvas.focus(); } });
    const handle = div.querySelector('.pur-drag-handle');
    let isDragging = false, startX, startY, initX, initY;
    handle.onmousedown = (e) => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return; isDragging = true; startX = e.clientX; startY = e.clientY; initX = div.offsetLeft; initY = div.offsetTop; e.stopPropagation(); };
    const onMove = (e) => { if (!isDragging) return; div.style.left = (initX + (e.clientX - startX)) + 'px'; div.style.top = (initY + (e.clientY - startY)) + 'px'; };
    const onUp = () => isDragging = false;
    win.document.addEventListener('mousemove', onMove);
    win.document.addEventListener('mouseup', onUp);
    const outsideClick = (e) => { if (!div.contains(e.target)) done(); };
    setTimeout(() => win.document.addEventListener('mousedown', outsideClick), 100);
  }

      showDialog({ id, title, contentHTML, onConfirm, onCancel, width = '300px' }) {
    const win = this.containerEl.win;
    const existing = win.document.getElementById(id);
    if (existing) existing.remove();

    const div = win.document.createElement('div');
    div.id = id;
    div.style.cssText = `position:absolute; left:calc(50% - ${parseInt(width)/2}px); top:30%; background:rgba(25,25,25,0.98); border-radius:8px; box-shadow:0 10px 40px rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.12); z-index:100000; display:flex; flex-direction:column; width:${width}; overflow:hidden;`;

    const showTitle = title && title !== '';
    const showBtns = onConfirm || onCancel;
    div.innerHTML = `
        ${showTitle ? `<div style="background:rgba(0,0,0,0.3); padding:8px 14px; cursor:move; user-select:none; color:#888; font-size:12px; border-bottom:1px solid rgba(255,255,255,0.06);">${title}</div>` : ''}
        <div style="padding:${showBtns?'15px':'12px'}; display:flex; flex-direction:column; gap:8px;">
            ${contentHTML}
            ${showBtns ? `<div style="display:flex; justify-content:flex-end; gap:6px;">
                ${onCancel ? `<button class="pur-btn-cancel" style="background:transparent; color:#999; border:1px solid rgba(255,255,255,0.12); cursor:pointer; padding:5px 12px; border-radius:4px; font-size:11px;">取消</button>` : ''}
                ${onConfirm ? `<button class="pur-btn-confirm" style="background:transparent; color:#999; border:1px solid rgba(255,255,255,0.12); cursor:pointer; padding:5px 12px; border-radius:4px; font-size:11px;">确定</button>` : ''}
            </div>` : ''}
        </div>
    `;
    this.containerEl.appendChild(div);

    const handle = div.querySelector('.pur-drag-handle');
    let isDragging = false, startX, startY, initX, initY;
    if (handle) handle.onmousedown = (e) => { isDragging = true; startX = e.clientX; startY = e.clientY; initX = div.offsetLeft; initY = div.offsetTop; e.stopPropagation(); };
    const onMove = (e) => { if (!isDragging) return; div.style.left = `${initX + (e.clientX - startX)}px`; div.style.top = `${initY + (e.clientY - startY)}px`; };
    const onUp = () => isDragging = false;
    win.document.addEventListener('mousemove', onMove);
    win.document.addEventListener('mouseup', onUp);

    const cleanup = () => { win.document.removeEventListener('mousemove', onMove); win.document.removeEventListener('mouseup', onUp); div.remove(); this.canvas.focus(); };
    const maybeConfirm = div.querySelector('.pur-btn-confirm');
    const maybeCancel = div.querySelector('.pur-btn-cancel');
    if (maybeConfirm) maybeConfirm.onclick = () => { if(onConfirm) onConfirm(div); cleanup(); };
    if (maybeCancel) maybeCancel.onclick = () => { if(onCancel) onCancel(div); cleanup(); };
    // 无按钮时：整窗可拖拽 + 点击外部关闭
    if (!onConfirm && !onCancel) {
      let isDrag = false, sx, sy, ix, iy;
      div.style.cursor = 'move';
      div.onmousedown = (e) => { if (e.target.tagName==='BUTTON') return; isDrag=true; sx=e.clientX; sy=e.clientY; ix=div.offsetLeft; iy=div.offsetTop; e.stopPropagation(); };
      win.document.addEventListener('mousemove', (e) => { if(!isDrag) return; div.style.left=(ix+e.clientX-sx)+'px'; div.style.top=(iy+e.clientY-sy)+'px'; });
      win.document.addEventListener('mouseup', () => { isDrag=false; });
      setTimeout(() => {
        const oc = (e) => { if (!div.contains(e.target)) { cleanup(); win.document.removeEventListener('mousedown', oc); } };
        win.document.addEventListener('mousedown', oc);
      }, 200);
    }
    return div;
  }

  // ================== 多元导入粘贴 ==================
  async fetchAndCreateTextFromURL(url, worldX, worldY) {
    const elId = generateId();
    this.elements.push({ id: elId, type: 'text', x: worldX, y: worldY, w: 250, h: 60, content: '⏳ 正在解析网页...', bgColor: 'rgba(45,45,45,0.8)', color: '#e0e0e0', fontSize: 14, rotation: 0, opacity: 1 });
    this.requestRender();

    try {
      const { requestUrl } = require('obsidian');
      const res = await requestUrl({ url: url });
      const parser = new DOMParser();
      const doc = parser.parseFromString(res.text, 'text/html');
      doc.querySelectorAll('script, style, noscript, nav, footer, header, svg').forEach(s => s.remove());
      
      let text = doc.body.innerText.replace(/\n\s*\n/g, '\n\n').trim().substring(0, 1500); 
      if (!text || text.includes('登录') || text.includes('Sign in') || text.length < 30) {
          text = "⚠️ 无法抓取该内容。\n原因：该网页需要登录账号，或者使用了重度前端框架阻止了外部访问。";
      }
      const finalContent = `🔗 ${url}\n\n${text}`;
      const targetEl = this.elements.find(e => e.id === elId);
      if (targetEl) { targetEl.content = finalContent; targetEl.h = Math.max(80, finalContent.split('\n').length * 20 + 20); this.saveHistory(); this.saveData(); this.requestRender(); }
    } catch(e) {
      const targetEl = this.elements.find(e => e.id === elId);
      if (targetEl) { targetEl.type = 'note-link'; targetEl.content = '网页链接 (抓取失败)'; targetEl.link = url; this.saveHistory(); this.saveData(); this.requestRender(); }
    }
  }

  async onPaste(e) {
    const win = this.containerEl.win;
    if (win.document.querySelector('#pur-edit-dialog') || win.document.querySelector('#pur-url-dialog')) return;
    
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    const textData = (e.clipboardData || e.originalEvent.clipboardData).getData('text/plain');
    const rect = this.canvas.getBoundingClientRect();
    const world = this.screenToWorld(rect.width/2, rect.height/2);
    let handled = false;

    if (textData && textData.trim() !== '') {
      const text = textData.trim();
      if (/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(text) || text.startsWith('data:image/')) {
        this.elements.push({ id: generateId(), type: 'image', x: world.x, y: world.y, w: 300, h: 200, original: text, rotation: 0, opacity: 1 });
        handled = true;
      } else if (/^https?:\/\//i.test(text)) {
        this.fetchAndCreateTextFromURL(text, world.x, world.y);
        handled = true;
      } else if (text.startsWith('[[') && text.endsWith(']]')) {
        const filename = text.replace('[[', '').replace(']]', '').trim();
        this.elements.push({ id: generateId(), type: 'note-link', x: world.x, y: world.y, w: 220, h: 80, content: filename, link: filename, rotation: 0, opacity: 1 });
        this.updateNoteLinkInfo(filename);
        handled = true;
      } else if (!items[0].type.includes('image')) {
        this.elements.push({ id: generateId(), type: 'text', x: world.x, y: world.y, w: 250, h: Math.max(60, text.split('\n').length * 22 + 20), content: text, bgColor: 'rgba(45,45,45,0.8)', color: '#e0e0e0', fontSize: 14, rotation: 0, opacity: 1 });
        handled = true;
      }
    }

    if (!handled) {
      for (const item of items) {
        if (item.type.indexOf("image") !== -1) {
          try {
            const file = item.getAsFile();
            const canvasName = this.canvasFile ? this.canvasFile.basename : '粘贴';
            const vaultPath = await this.plugin.copyImage(file, canvasName);
            if (vaultPath) { this.elements.push({ id: generateId(), type: 'image', x: world.x, y: world.y, w: 300, h: 200, original: vaultPath, rotation: 0, opacity: 1 }); handled = true; }
          } catch (err) {}
        }
      }
    }
    if (handled) { this.requestRender(); this.saveHistory(); this.saveData(); }
  }

  // 完美修复：精准解析 Obsidian 笔记拖拽 (不会再出现乱码协议)
  async onDrop(e) {
    e.preventDefault();
    if (!e.dataTransfer) return;
    const rect = this.canvas.getBoundingClientRect();
    const world = this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    let offset = 0;
    let handled = false;

    if (e.dataTransfer.files.length > 0) {
      for (const file of e.dataTransfer.files) {
        if (file.type.startsWith('image/')) {
          try {
            const canvasName = this.canvasFile ? this.canvasFile.basename : '拖拽';
            const vaultPath = await this.plugin.copyImage(file, canvasName);
            if (vaultPath) { this.elements.push({ id: generateId(), type: 'image', x: world.x + offset, y: world.y, w: 300, h: 200, original: vaultPath, rotation: 0, opacity: 1 }); offset += 320; handled = true; }
          } catch (err) {}
        } else {
          // 文本文件拖入 → 自动生成文本框
          try {
            const text = await new Promise(r => { const rd = new FileReader(); rd.onload = () => r(rd.result); rd.readAsText(file); });
            const lines = text.split('\n');
            this.elements.push({ id: generateId(), type: 'text', x: world.x + offset, y: world.y, w: 480, h: Math.min(400, Math.max(80, lines.length * 22 + 20)), content: text, bgColor: 'rgba(35,35,40,0.85)', color: '#e0e0e0', fontSize: 14, rotation: 0, opacity: 1 });
            offset += 500; handled = true;
          } catch (err) {}
        }
      }
    }
    
    if (handled) { this.saveHistory(); this.saveData(); this.requestRender(); return; }

    const uriList = e.dataTransfer.getData('text/uri-list');
    const htmlData = e.dataTransfer.getData('text/html');
    const plainText = e.dataTransfer.getData('text/plain');

    let targetUrl = '';
    if (htmlData) {
      const imgMatch = htmlData.match(/<img[^>]+src="?([^"\s]+)"?\s*/i);
      if (imgMatch && imgMatch[1]) targetUrl = imgMatch[1].replace(/&amp;/g, '&');
    }
    if (!targetUrl && uriList) targetUrl = uriList.split('\n')[0].trim();

    const rawText = plainText ? plainText.trim() : '';
    const fallbackStr = targetUrl || rawText;

    if (!fallbackStr) return;

    try {
        let decoded = fallbackStr;
        try { decoded = decodeURIComponent(fallbackStr); } catch(e) { console.error(e); }

        // 核心修复：解析 Obsidian 拖放出来的内部 URI (obsidian://open?vault=...)
        if (decoded.startsWith('obsidian://')) {
            const url = new URL(decoded);
            const fileParam = url.searchParams.get('file');
            if (fileParam) {
                const filename = fileParam.replace(/.md$/i, '');
                const el = { id: generateId(), type: 'note-link', x: world.x, y: world.y, w: 280, h: 80, content: filename, link: fileParam, rotation: 0, opacity: 1 };
                try {
                  let file = this.app.vault.getAbstractFileByPath(fileParam);
                  if (!file && !fileParam.endsWith('.md')) file = this.app.vault.getAbstractFileByPath(fileParam + '.md');
                  if (!file) file = this.app.metadataCache.getFirstLinkpathDest(fileParam, '');
                  if (file) { el.link = file.path;
                    const raw = await this.app.vault.read(file);
                    // 优先从 frontmatter 读引脚，否则从代码解析
                    let hasPins = false;
                    const fm = raw.match(/^---\n([\s\S]*?)\n---/);
                    if (fm) {
                      const fmi = fm[1].match(/^inputs:\s*(.+)$/m);
                      const fmo = fm[1].match(/^outputs:\s*(.+)$/m);
                      if (fmi) { el.inputs = fmi[1].split(',').map(s=>{const[p,n]=s.trim().split('=');return{id:n||p,label:p}}); hasPins=true; }
                      if (fmo) { el.outputs = fmo[1].split(',').map(s=>{const[p,n]=s.trim().split('=');return{id:n||p,label:p}}); hasPins=true; }
                    }
                    if (!hasPins) {
                      const retm = raw.match(/return\s*\{([^}]+)\}/);
                      if (retm) el.outputs = retm[1].split(',').map(s=>s.trim().split(':')[0].trim()).filter(Boolean).map(k=>({id:k,label:k.toUpperCase()}));
                      const paramm = raw.match(/const\s*\{\s*([^}]+)\s*\}\s*=\s*inputs/);
                      if (paramm) el.inputs = paramm[1].split(',').map(s=>s.trim().split('=')[0].trim()).filter(Boolean).map(k=>({id:k,label:k.toUpperCase()}));
                    }
                    // 存代码到卡片
                    let code = raw.replace(/^---[\s\S]*?---\n*/, '').trim();
                    const cb = code.match(/```(?:javascript|js)?\n([\s\S]*?)\n```/);
                    if (cb) code = cb[1];
                    if (code.includes('function process') || code.includes('return {')) el.content = code;
                    el.h = 60 + Math.max((el.inputs||[]).length,(el.outputs||[]).length,1)*28 + 40;
                  }
                } catch(e) { console.error(e); }
                this.elements.push(el);
                this.updateNoteLinkInfo(fileParam);
                handled = true;
              }
        }
        else if (/\.(md|PurStudio)$/i.test(decoded)) {
           const parts = decoded.split(/[\\/]/);
           const fname = parts[parts.length - 1].replace(/\.(md|PurStudio)$/i, '').trim();
           const el = { id: generateId(), type: 'note-link', x: world.x, y: world.y, w: 280, h: 80, content: fname, link: fname, rotation: 0, opacity: 1 };
           const file = this.app.vault.getAbstractFileByPath(fname);
           if (file) { try {
             const raw = await this.app.vault.read(file);
             const fm = raw.match(/^---\n([\s\S]*?)\n---/);
             if (fm) {
               const fmi = fm[1].match(/^inputs:\s*(.+)$/m);
               const fmo = fm[1].match(/^outputs:\s*(.+)$/m);
               if (fmi) el.inputs = fmi[1].split(',').map(s=>{const[p,n]=s.trim().split('=');return{id:n||p,label:p}});
               if (fmo) el.outputs = fmo[1].split(',').map(s=>{const[p,n]=s.trim().split('=');return{id:n||p,label:p}});
             }
             let code2 = raw.replace(/^---[\s\S]*?---\n*/, '').trim();
             const cb2 = code2.match(/```(?:javascript|js)?\n([\s\S]*?)\n```/);
             if (cb2) code2 = cb2[1];
             if (code2.includes('function') || code2.includes('return {')) el.content = code2;
             el.h = 60 + Math.max((el.inputs||[]).length,(el.outputs||[]).length,1) * 28 + 40;
           } catch(e) { console.error(e); } }
           this.elements.push(el);
           this.updateNoteLinkInfo(fname);
           handled = true;
        }
        else if (rawText.startsWith('[[') && rawText.endsWith(']]')) {
           const linkText = rawText.replace('[[', '').replace(']]', '').trim();
           const el = { id: generateId(), type: 'note-link', x: world.x, y: world.y, w: 280, h: 80, content: linkText, link: linkText, rotation: 0, opacity: 1 };
           let file = this.app.vault.getAbstractFileByPath(linkText);
           if (!file) file = this.app.metadataCache.getFirstLinkpathDest(linkText, '');
           if (file) {
             el.link = file.path;
             try {
               const raw = await this.app.vault.read(file);
               let hasPins = false;
               const fm = raw.match(/^---\n([\s\S]*?)\n---/);
               if (fm) {
                 const fmi = fm[1].match(/^inputs:\s*(.+)$/m);
                 const fmo = fm[1].match(/^outputs:\s*(.+)$/m);
                 if (fmi) { el.inputs = fmi[1].split(',').map(s=>{const[p,n]=s.trim().split('=');return{id:n||p,label:p}}); hasPins = true; }
                 if (fmo) { el.outputs = fmo[1].split(',').map(s=>{const[p,n]=s.trim().split('=');return{id:n||p,label:p}}); hasPins = true; }
               }
               if (!hasPins) {
                 const retm = raw.match(/return\s*\{([^}]+)\}/);
                 if (retm) el.outputs = retm[1].split(',').map(s=>s.trim().split(':')[0].trim()).filter(Boolean).map(k=>({id:k,label:k.toUpperCase()}));
                 const paramm = raw.match(/const\s*\{\s*([^}]+)\s*\}\s*=\s*inputs/);
                 if (paramm) el.inputs = paramm[1].split(',').map(s=>s.trim().split('=')[0].trim()).filter(Boolean).map(k=>({id:k,label:k.toUpperCase()}));
               }
               el.h = 60 + Math.max((el.inputs||[]).length,(el.outputs||[]).length,1) * 28 + 40;
             } catch(e) { console.error(e); }
           }
           this.elements.push(el);
           this.updateNoteLinkInfo(el.link);
           handled = true;
        }
        else if (/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(fallbackStr) || fallbackStr.startsWith('data:image/')) {
           this.elements.push({ id: generateId(), type: 'image', x: world.x, y: world.y, w: 300, h: 200, original: fallbackStr, rotation: 0, opacity: 1 });
           handled = true;
        }
        else if (/^https?:\/\//i.test(fallbackStr)) {
           if (this.isVideoUrl(fallbackStr)) {
             this.downloadVideo(fallbackStr, world.x, world.y);
             handled = true;
           } else {
             this.elements.push({ id: generateId(), type: 'note-link', x: world.x, y: world.y, w: 220, h: 80, content: '网页链接', link: fallbackStr, rotation: 0, opacity: 1 });
             handled = true;
           }
        }
        else if (rawText) {
           this.elements.push({ id: generateId(), type: 'text', x: world.x, y: world.y, w: 200, h: Math.max(60, rawText.split('\n').length * 20 + 20), content: rawText, bgColor: 'rgba(45,45,45,0.8)', color: '#e0e0e0', fontSize: 14, rotation: 0, opacity: 1 });
           handled = true;
        }
    } catch(e) { console.error(e); }

    if (handled) { this.saveHistory(); this.saveData(); this.requestRender(); }
  }

  onKeyDown(e) {
    // 仅 canvas 聚焦时触发（listener 已绑定在 canvas 上，不影响其他视图）
    const win = this.containerEl.win;
    if (win.document.querySelector('#pur-edit-dialog') || win.document.querySelector('#pur-url-dialog') || win.document.querySelector('#pur-save-dialog') || win.document.querySelector('#pur-export-dialog')) return;
    let handled = true;
    if (e.key === 'Delete' || e.key === 'Backspace') { if (this.selectedIds.size > 0) this.deleteSelected(); else handled = false; }
    else if ((e.ctrlKey || e.metaKey) && e.key === 'z') { if (this.historyIndex > 0) this.undo(); else handled = false; }
    else if ((e.ctrlKey || e.metaKey) && e.key === 'y') { if (this.historyIndex < this.history.length - 1) this.redo(); else handled = false; }
    else if ((e.ctrlKey || e.metaKey) && e.key === 'a') { this.selectedIds.clear(); this.elements.forEach(el => this.selectedIds.add(el.id)); this.requestRender(); }
    else if ((e.ctrlKey || e.metaKey) && e.key === 'c') this.copySelected();
    else if ((e.ctrlKey || e.metaKey) && e.key === 'v') this.pasteClipboard();
    else if ((e.ctrlKey || e.metaKey) && e.key === 'g') this.groupSelected();
    else if ((e.ctrlKey || e.metaKey) && e.key === 's') { this.saveData(); new Notice(t(this.plugin, 'saved')); }
    else if ((e.ctrlKey || e.metaKey) && e.key === 'm') { this.exportAsText('快速导出_' + new Date().toISOString().slice(0,10)); }
    else if (e.key === 'f' && !e.ctrlKey && !e.metaKey) { this.fitToView(); }
    else handled = false;
    if (handled) e.preventDefault();
  }

  // ================== 元素操作合集 ==================
  alignElements(type) {
    const sel = this.getSelectedElements();
    if (sel.length < 2) return;
    const ref = sel[0];
    if (type === 'distribute-h') {
        sel.sort((a, b) => a.x - b.x); let currX = sel[0].x;
        for (const s of sel) { s.x = currX; currX += s.w + 20; }
    } else {
        for (let i = 1; i < sel.length; i++) {
          if (type === 'left') sel[i].x = ref.x;
          if (type === 'top') sel[i].y = ref.y;
          if (type === 'center') { sel[i].x = ref.x + ref.w/2 - sel[i].w/2; sel[i].y = ref.y + ref.h/2 - sel[i].h/2; }
        }
    }
    this.saveHistory(); this.saveData(); this.requestRender();
  }

  scaleElements(type) {
    const sel = this.getSelectedElements();
    if (sel.length < 2) return;
    const ref = sel[0];
    for (let i = 1; i < sel.length; i++) {
      if (type === 'width') { const ratio = ref.w / sel[i].w; sel[i].w = ref.w; sel[i].h *= ratio; } 
      else if (type === 'height') { const ratio = ref.h / sel[i].h; sel[i].h = ref.h; sel[i].w *= ratio; }
    }
    this.saveHistory(); this.saveData(); this.requestRender();
  }

  arrangeElements() {
    const selected = this.selectedIds.size > 0 ? this.getSelectedElements() : this.elements.filter(e => e.type !== 'group' && e.type !== 'line');
    if (selected.length < 2) return;
    selected.sort((a, b) => b.h - a.h);
    const startX = Math.min(...selected.map(el => el.x));
    const startY = Math.min(...selected.map(el => el.y));
    const padding = 15;
    const totalArea = selected.reduce((sum, el) => sum + ((el.w + padding) * (el.h + padding)), 0);
    const optimalWidth = Math.max(500, Math.ceil(Math.sqrt(totalArea) * 1.3)); 
    let currentX = startX, currentY = startY, currentRowHeight = 0;
    for (const el of selected) {
      if (currentX + el.w > startX + optimalWidth && currentX !== startX) {
        currentX = startX; currentY += currentRowHeight + padding; currentRowHeight = 0;
      }
      el.x = currentX; el.y = currentY;
      currentX += el.w + padding; currentRowHeight = Math.max(currentRowHeight, el.h);
    }
    this.saveHistory(); this.saveData(); this.requestRender(); this.fitToView();
  }

  // 连线核心功能
  connectSelected() {
    const sel = this.getSelectedElements();
    if (sel.length !== 2) { new Notice('请选择两个元素进行连线'); return; }
    const [el1, el2] = sel;
    const existing = this.elements.find(e => e.type === 'line' && ((e.from === el1.id && e.to === el2.id) || (e.from === el2.id && e.to === el1.id)));
    if (existing) return;

    this.elements.push({ id: generateId(), type: 'line', from: el1.id, to: el2.id, color: 'rgba(150, 150, 150, 0.7)', width: 2 });
    this.saveHistory(); this.saveData(); this.requestRender();
  }

  // 带有浮动工具栏、原地无感打字的终极编辑器
  async editTextElement(el) {
    const win = this.containerEl.win;
    win.document.querySelectorAll('#pur-edit-dialog').forEach(node => node.remove());

    el.isEditing = true;
    this.requestRender();

    const scale = this.viewState.scale;
    const screenX = (el.x * scale) + this.viewState.offsetX;
    const screenY = (el.y * scale) + this.viewState.offsetY;

    const div = win.document.createElement('div');
    div.id = 'pur-edit-dialog';
    // 核心修复2：移除 min-width:150px 这种硬性限制，让它可以 100% 匹配底层画布比例；确保加入 box-sizing: border-box
    div.style.cssText = `position:absolute; left:${screenX}px; top:${screenY}px; width:${(Math.max(30, el.w * scale)).toFixed(1)}px; height:${(Math.max(30, el.h * scale)).toFixed(1)}px; z-index:100000; display:flex; flex-direction:column; background:rgba(0,0,0,0.5); border:2px solid #4a9eff; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.5); overflow:hidden; backdrop-filter:blur(4px); box-sizing:border-box;`;

    // === 引脚按钮：白色简约箭头（与右键栏风格一致），移到工具栏右侧（已移除"清除引脚"按钮）===
    const _pinButtons = `
      <div style="display:inline-flex; gap:4px; align-items:center; margin-left:auto;">
        <button id="add-in-pin" data-tip="添加输入引脚 · 接收上游数据" style="background:transparent; color:#ccc; border:1px solid rgba(255,255,255,0.2); border-radius:4px; padding:3px 6px; cursor:pointer; font-size:11px; font-weight:normal; transition:all 0.15s ease; display:inline-flex; align-items:center; gap:4px;" onmouseover="this.style.color='#fff';this.style.fontWeight='bold';this.style.borderColor='rgba(255,255,255,0.55)';this.style.boxShadow='0 0 8px rgba(255,255,255,0.25)';" onmouseout="this.style.color='#ccc';this.style.fontWeight='normal';this.style.borderColor='rgba(255,255,255,0.2)';this.style.boxShadow='none';">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 12h13M13 6l-7 6 7 6"/></svg>输入
        </button>
        <button id="add-out-pin" data-tip="添加输出引脚 · 发送到下游" style="background:transparent; color:#ccc; border:1px solid rgba(255,255,255,0.2); border-radius:4px; padding:3px 6px; cursor:pointer; font-size:11px; font-weight:normal; transition:all 0.15s ease; display:inline-flex; align-items:center; gap:4px;" onmouseover="this.style.color='#fff';this.style.fontWeight='bold';this.style.borderColor='rgba(255,255,255,0.55)';this.style.boxShadow='0 0 8px rgba(255,255,255,0.25)';" onmouseout="this.style.color='#ccc';this.style.fontWeight='normal';this.style.borderColor='rgba(255,255,255,0.2)';this.style.boxShadow='none';">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M17 12H4M11 6l7 6-7 6"/></svg>输出
        </button>
      </div>
    `;

    div.innerHTML = `
      <div class="pur-drag-handle" style="display:flex; gap:6px; padding:8px 10px; background:rgba(0,0,0,0.6); border-bottom:1px solid rgba(255,255,255,0.1); align-items:center; flex-wrap:nowrap; cursor:move; white-space:nowrap; user-select:none; flex-shrink:0;">
         <input type="color" id="t-color" value="${el.color || '#e0e0e0'}" title="文字颜色" data-tip="文字颜色" style="width:20px;height:20px;padding:0;border:none;cursor:pointer;background:transparent;">
         <input type="color" id="t-bg" value="${(el.bgColor && el.bgColor.startsWith('#')) ? el.bgColor : '#2d2d2d'}" title="背景颜色" data-tip="文本框背景色" style="width:20px;height:20px;padding:0;border:none;cursor:pointer;background:transparent;">
         <input type="range" id="t-op" min="0" max="1" step="0.05" value="${el.bgOpacity ?? 0.8}" title="背景透明度" data-tip="文本框背景不透明度" style="width:60px; cursor:pointer; accent-color:#4a9eff;">
         <button id="t-bold" style="background:${el.bold ? '#4a9eff' : 'transparent'}; color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:4px; padding:2px 6px; cursor:pointer; font-weight:bold; font-size:12px;" title="加粗" data-tip="文本粗体切换">B</button>
         <input type="number" id="t-size" value="${el.fontSize || 14}" min="10" max="100" title="字号" data-tip="文字大小（px）" style="width:40px; background:#222; color:#ccc; border:1px solid #444; border-radius:4px; padding:2px 4px; outline:none; font-size:12px; text-align:center;">
         <select id="t-font" title="字体" data-tip="文本字体样式（默认黑体）" style="background:#222; color:#ccc; border:1px solid #444; border-radius:4px; outline:none; cursor:pointer; font-size:12px; padding:2px; max-width:85px;">
             <option value="SimHei, sans-serif" selected>黑体</option>
             <option value="sans-serif">系统默认</option>
             <option value="Microsoft YaHei, sans-serif">微软雅黑</option>
             <option value="SimSun, serif">宋体</option>
             <option value="KaiTi, serif">楷体</option>
             <option value="cursive">手写体</option>
         </select>
         <!-- 引脚按钮已移至右键菜单 -->
      </div>
      <input id="node-title" value="${(el.title || '').replace(/"/g, '&quot;')}" placeholder="标题（可选）" style="background:transparent; color:#4a9eff; border:none; border-bottom:1px solid rgba(255,255,255,0.08); padding:6px 10px; outline:none; font-size:13px; font-weight:bold; width:100%; box-sizing:border-box; flex-shrink:0;">
      <textarea id="text-input" placeholder="输入字符(点击空白处保存)" style="flex:1 1 auto; min-height:40px; width:100%; background:transparent; color:${el.color || '#e0e0e0'}; border:none; padding:${10 * scale}px; font-size:${(el.fontSize || 14) * scale}px; font-family:${el.fontFamily || 'SimHei, sans-serif'}; font-weight:${el.bold ? 'bold' : 'normal'}; outline:none; resize:none; line-height:1.3; white-space:pre-wrap; word-wrap:break-word; box-sizing:border-box; overflow-y:auto;"></textarea>
      <div class="pur-resize-grip" style="position:absolute; right:0; bottom:0; width:18px; height:18px; cursor:nwse-resize; z-index:10; background:linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.4) 75%, rgba(255,255,255,0.25) 75%, transparent 87%); border-radius:0 0 6px 0;" title="拖拽缩放"></div>
    `;
    this.containerEl.appendChild(div);

    const input = div.querySelector('#text-input');
    input.value = el.content === '双击编辑文本' ? '' : (el.content || '');
    setTimeout(() => { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }, 50);

    // === 引脚同步引擎：只更新内存，失焦才落盘 ===
    this.plugin._activeEditingLink = el.link;

    input.addEventListener('input', (e) => {
      const code = e.target.value;
      el.content = code;
      let changed = false;

      const oldInMap = {}; if (el.inputs) el.inputs.forEach(p=>{if(p.label)oldInMap[p.label]=p.id});
      const oldOutMap = {}; if (el.outputs) el.outputs.forEach(p=>{if(p.label)oldOutMap[p.label]=p.id});

      const mIn = code.match(/const\s*\{\s*([^}]+)\s*\}\s*=\s*inputs/);
      if (mIn) {
        el.inputs = mIn[1].split(',').map(s=>s.trim().split('=')[0].trim()).filter(Boolean).map(n=>({id:oldInMap[n]||generateId(),label:n}));
        changed = true;
      } else if (!code.includes('inputs')) { el.inputs = []; changed = true; }

      const mOut = code.match(/return\s*\{([^}]+)\}/);
      if (mOut) {
        el.outputs = mOut[1].split(',').map(s=>s.trim().split(':')[0].trim()).filter(Boolean).map(n=>({id:oldOutMap[n]||generateId(),label:n}));
        changed = true;
      } else if (!code.includes('return')) { el.outputs = []; changed = true; }

      if (changed) {
        const tp = Math.max((el.inputs||[]).length,(el.outputs||[]).length,1);
        const minH = 60 + tp * 28 + 20;
        if (el.h < minH) { el.h = minH; div.style.height = (el.h * this.viewState.scale + parseFloat(div.dataset.extraH||'0')) + 'px'; }
        this.requestRender();
      }
    });

    // 失焦或关闭时一次性落盘
    const saveToDisk = async () => {
      if (el.type === 'note-link' && el.link) {
        const file = this.app.vault.getAbstractFileByPath(el.link);
        if (file) { try { await this.app.vault.modify(file, input.value); } catch(err){} }
      }
      this.plugin._activeEditingLink = null;
    };
    input.addEventListener('blur', saveToDisk);
    const origClose = close;
    close = async () => { await saveToDisk(); if (typeof origClose === 'function') origClose(); };

	    // 悬停提示
	    const tooltip = win.document.createElement('div');
	    tooltip.id = 'pur-tooltip';
	    tooltip.style.cssText = 'position:fixed; pointer-events:none; z-index:1000001; background:rgba(0,0,0,0.92); color:#eee; padding:5px 10px; border-radius:4px; font-size:11px; white-space:nowrap; display:none; border:1px solid rgba(255,255,255,0.2); letter-spacing:0.5px;';
	    win.document.body.appendChild(tooltip);

	    const showTip = (e) => {
	        const tip = e.currentTarget.dataset.tip;
	        if (!tip) return;
	        tooltip.textContent = tip;
	        tooltip.style.display = 'block';
	        const tr = tooltip.getBoundingClientRect();
	        let left = e.clientX - tr.width / 2;
	        let top = e.clientY - tr.height - 8;
	        if (left < 4) left = 4;
	        if (top < 4) top = e.clientY + 16;
	        tooltip.style.left = left + 'px';
	        tooltip.style.top = top + 'px';
	    };
	    const hideTip = () => { tooltip.style.display = 'none'; };

	    div.querySelectorAll('[data-tip]').forEach(ctrl => {
	        ctrl.addEventListener('mouseenter', showTip);
	        ctrl.addEventListener('mouseleave', hideTip);
	    });

    div.onmousedown = (e) => {
        // 允许所有交互元素 (input/button/select/textarea) 正常工作
        const interactive = e.target.closest('input, button, select, textarea, [class*="pur-resize-grip"]');
        if (interactive) return;
        e.stopPropagation();
    };

    // === 引脚按钮事件（仅保留添加输入/输出，已移除"清除引脚"按钮）===
    {
        // 引脚添加已移至右键菜单
    }

    div.querySelector('#t-color').oninput = (e) => { el.color = e.target.value; input.style.color = e.target.value; const t = div.querySelector('#node-title'); if(t) t.style.color = e.target.value; this.draw(); };
    div.querySelector('#t-bg').oninput = (e) => { el.bgColor = e.target.value; this.draw(); };
    div.querySelector('#t-op').oninput = (e) => { el.bgOpacity = parseFloat(e.target.value); this.draw(); };
    div.querySelector('#t-font').onchange = (e) => { el.fontFamily = e.target.value; input.style.fontFamily = e.target.value; this.draw(); };
    div.querySelector('#t-bold').onclick = (e) => { el.bold = !el.bold; e.target.style.background = el.bold ? '#4a9eff' : 'transparent'; input.style.fontWeight = el.bold ? 'bold' : 'normal'; const t = div.querySelector('#node-title'); if(t) t.style.fontWeight = el.bold ? 'bold' : 'normal'; this.draw(); };
    div.querySelector('#t-size').oninput = (e) => { el.fontSize = parseInt(e.target.value) || 14; input.style.fontSize = (el.fontSize * this.viewState.scale) + 'px'; const t = div.querySelector('#node-title'); if(t) t.style.fontSize = (el.fontSize * 0.9) + 'px'; this.draw(); };

    // === 额外面板高度补偿：仅工具栏（底部引脚面板已移除，引脚按钮在工具栏右侧）===
    const extraH = 45 + 8 * this.viewState.scale;
    div.dataset.extraH = String(extraH);
    // 初始化时调整 dialog 高度 = 原始内容高度 + 额外面板
    div.style.height = `${Math.max(80, el.h * this.viewState.scale + extraH)}px`;

    // 核心修复3：自定义 resize grip（在 draw() 中也会用到）
    const drawExtraH = extraH;
    const grip = div.querySelector('.pur-resize-grip');
    let isResizing = false, rsStartX, rsStartY, rsInitW, rsInitH;
    grip.onmousedown = (e) => {
        isResizing = true;
        rsStartX = e.clientX;
        rsStartY = e.clientY;
        rsInitW = div.getBoundingClientRect().width;
        rsInitH = div.getBoundingClientRect().height;
        e.preventDefault();
        e.stopPropagation();
    };
    const onResizeMove = (e) => {
        if (!isResizing) return;
        const newW = Math.max(80, rsInitW + (e.clientX - rsStartX));
        const newH = Math.max(100, rsInitH + (e.clientY - rsStartY));
        div.style.width = newW + 'px';
        div.style.height = newH + 'px';
        div.dataset.isResizing = "true";
        this.draw();
    };
    const onResizeUp = () => {
        if (!isResizing) return;
        isResizing = false;
        const finalW = parseFloat(div.style.width) || (el.w * this.viewState.scale);
        const finalH = parseFloat(div.style.height) || (el.h * this.viewState.scale + extraH);
        // 保存时扣除额外面板高度，只记录文本内容区域的尺寸
        el.w = parseFloat((Math.max(30, finalW / this.viewState.scale)).toFixed(1));
        el.h = parseFloat((Math.max(30, (finalH - extraH) / this.viewState.scale)).toFixed(1));
        div.dataset.isResizing = "false";
        this.requestRender();
    };
	    win.document.addEventListener('mousemove', onResizeMove);
	    win.document.addEventListener('mouseup', onResizeUp);

    const handle = div.querySelector('.pur-drag-handle');
    let isDragging = false, startX, startY, initX, initY;
    handle.onmousedown = (e) => { if (e.target.closest && e.target.closest('input, button, select, textarea, #t-op, #t-color, #t-bg, #t-bold, #t-size, #t-font')) return; isDragging = true; startX = e.clientX; startY = e.clientY; initX = div.offsetLeft; initY = div.offsetTop; e.stopPropagation(); };
    const onMove = (e) => {
        if (!isDragging) return;
        const newX = initX + (e.clientX - startX);
        const newY = initY + (e.clientY - startY);
        div.style.left = `${newX}px`;
        div.style.top = `${newY}px`;
        el.x = (newX - this.viewState.offsetX) / this.viewState.scale;
        el.y = (newY - this.viewState.offsetY) / this.viewState.scale;
        this.draw();
    };
    const onUp = () => isDragging = false;
    win.document.addEventListener('mousemove', onMove);
    win.document.addEventListener('mouseup', onUp);

    const finish = (save) => {
        if (save) {
            el.content = input.value;
            const titleInput = div.querySelector('#node-title');
            if (titleInput) el.title = titleInput.value.trim();
        }
        el.isEditing = false;
        div.remove();
        div.remove();
        win.document.removeEventListener('mousemove', onResizeMove);
        win.document.removeEventListener('mouseup', onResizeUp);
        win.document.removeEventListener('mousemove', onMove);
        win.document.removeEventListener('mouseup', onUp);
        win.document.removeEventListener('mousedown', outsideClick);
        this.saveHistory(); this.saveData(); this.requestRender(); this.canvas.focus();
    };

    const outsideClick = (e) => { if (!div.contains(e.target)) finish(true); };
    setTimeout(() => win.document.addEventListener('mousedown', outsideClick), 100);

    input.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Escape') { e.preventDefault(); finish(false); }
    });
  }
  
  // 根据图谱颜色组给笔记链接卡片分配颜色
  getGraphColorForFile(file) {
    if (!file) return '#483699';
    this._loadGraphColors();
    for (const group of (this._graphColors || [])) {
      if (this._matchQuery(file, group.query)) {
        return group.hex || '#483699';
      }
    }
    return '#483699';
  }

  _loadGraphColors() {
    try {
      const p = require('path').join(this.app.vault.adapter.basePath, '.obsidian', 'graph.json');
      if (require('fs').existsSync(p)) {
        const data = JSON.parse(require('fs').readFileSync(p, 'utf-8'));
        this._graphColors = (data.colorGroups || []).map(g => ({
          query: g.query || '',
          hex: '#' + (g.color && g.color.rgb ? g.color.rgb.toString(16).padStart(6, '0') : '483699')
        }));
      }
    } catch(e) { this._graphColors = []; }
  }

  _matchQuery(file, query) {
    const fp = file.path ? file.path : file;
    const path = fp.toLowerCase();
    const name = fp.split('/').pop().toLowerCase().replace('.md', '');
    const q = query;
    if (q.startsWith('path:')) return path.includes(q.substring(5).toLowerCase());
    if (q.startsWith('file:')) return name.includes(q.substring(5).toLowerCase());
    if (q.startsWith('tag:')) {
      const tag = q.substring(4).replace('#', '').toLowerCase();
      const abstractFile = this.app.vault.getAbstractFileByPath(fp);
      if (abstractFile) {
        const cache = this.app.metadataCache.getFileCache(abstractFile);
        if (cache && cache.tags) return cache.tags.some(t => t.tag.toLowerCase().includes(tag));
      }
      return false;
    }
    return false;
  }


  refreshNoteLinkColors() {
    this._loadGraphColors();
    for (const el of this.elements) {
      if (el.type !== 'note-link' || !el.link) continue;
      for (const group of (this._graphColors || [])) {
        if (this._matchQuery(el, group.query)) {
          el.cardColor = group.hex;
          break;
        }
      }
    }
  }
    deleteSelected() {
      // 收集所有要删除的 id（包括群组内部元素 + 它们的相关连线）
      const collectIds = (elements, outIds) => {
        for (const el of elements) {
          if (this.selectedIds.has(el.id)) {
            outIds.add(el.id);
            // 递归收集群组内子元素
            if (el.type === 'group' && el.children) collectIds(el.children, outIds);
          } else if (el.type === 'group' && el.children) {
            collectIds(el.children, outIds);
          }
        }
      };
      const deleteIds = new Set();
      collectIds(this.elements, deleteIds);

      // 递归过滤：保留元素 + 清理其 children
      const filterTree = (elements) => elements.filter(el => {
        if (deleteIds.has(el.id)) return false;
        // 代码节点/文本节点被删除 → 清理与之相关的引脚连线
        if (el.type === 'line' && (deleteIds.has(el.from) || deleteIds.has(el.to))) return false;
        if (el.type === 'group' && el.children) el.children = filterTree(el.children);
        return true;
      });
      this.elements = filterTree(this.elements);
      this.selectedIds.clear();
      this.saveHistory();
      this.saveData();
      this.requestRender();
  }
  
  copySelected() { this.clipboard = this.getSelectedElements().map(el => JSON.parse(JSON.stringify(el))); new Notice(`已复制 ${this.clipboard.length} 个元素`); }
  pasteClipboard(wx = null, wy = null) {
    if(!this.clipboard.length) return;
    const newElements = this.clipboard.map(el => ({ ...el, id: generateId(), x: wx ? wx : el.x + 50, y: wy ? wy : el.y + 50 }));
    this.elements.push(...newElements); this.selectedIds.clear(); newElements.forEach(el => this.selectedIds.add(el.id));
    this.saveHistory(); this.saveData(); this.requestRender();
  }
  duplicateSelected() {
    const clones = this.getSelectedElements().map(el => ({ ...JSON.parse(JSON.stringify(el)), id: generateId(), x: el.x + 30, y: el.y + 30 }));
    this.elements.push(...clones); this.selectedIds.clear(); clones.forEach(c => this.selectedIds.add(c.id));
    this.saveHistory(); this.saveData(); this.requestRender(); new Notice(`已复制 ${clones.length} 个元素`);
  }

  groupSelected() {
    if (this.selectedIds.size < 2) return;
    const selected = this.getSelectedElements().filter(el => el.type !== 'line');
    if (selected.length < 2) { new Notice(t(this.plugin, 'select2group')); return; }
    const minX = Math.min(...selected.map(el => el.x)), minY = Math.min(...selected.map(el => el.y));
    const maxX = Math.max(...selected.map(el => el.x + el.w)), maxY = Math.max(...selected.map(el => el.y + el.h));
    const groupId = generateId();
    this.elements = this.elements.filter(el => !this.selectedIds.has(el.id));
    this.elements.push({ id: groupId, type: 'group', x: minX - 10, y: minY - 10, w: maxX - minX + 20, h: maxY - minY + 20, children: selected.map(el => ({ ...el, x: el.x - minX + 10, y: el.y - minY + 10 })), rotation: 0, opacity: 1 });
    this.selectedIds.clear(); this.selectedIds.add(groupId); this.saveHistory(); this.saveData(); this.requestRender();
  }
  ungroupSelected() {
    const selected = this.elements.filter(el => this.selectedIds.has(el.id) && el.type === 'group');
    if (!selected.length) return;
    for (const group of selected) {
      const idx = this.elements.indexOf(group);
      if (idx > -1) this.elements.splice(idx, 1, ...group.children.map(child => ({ ...child, x: child.x + group.x, y: child.y + group.y })));
    }
    this.selectedIds.clear(); this.saveHistory(); this.saveData(); this.requestRender();
  }


  askChooseGroup(elements, matchedGroups) {
    const win = this.containerEl.win;
    const container = this.containerEl.children[1];
    const cx = container.clientWidth / 2;
    const cy = container.clientHeight / 3;
    const div = win.document.createElement('div');
    div.id = 'pur-add-group-dialog';
    div.style.cssText = `position:absolute; left:${cx - 160}px; top:${cy}px; width:320px; z-index:100001; background:rgba(0,0,0,0.9); border:2px solid #4a9eff; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.6); padding:16px; display:flex; flex-direction:column; gap:8px;`;
    const count = elements.length;
    let btns = '';
    for (const m of matchedGroups) {
        const label = m.group.content || '群组';
        btns += `<button class="ag-choice" data-idx="${matchedGroups.indexOf(m)}" style="background:rgba(255,255,255,0.08);color:#ccc;border:1px solid rgba(255,255,255,0.15);border-radius:4px;padding:8px 12px;cursor:pointer;font-size:12px;text-align:left;">添加到 <b style="color:#4a9eff;">${label}</b></button>`;
    }
    div.innerHTML = `<div style="color:#eee;font-size:13px;text-align:center;margin-bottom:4px;">将 <b>${count} 个元素</b> 添加到哪个群组？</div>${btns}<button id="ag-cancel" style="background:transparent;color:#aaa;border:1px solid #555;border-radius:4px;padding:6px;cursor:pointer;font-size:12px;margin-top:4px;">取消</button>`;
    this.containerEl.appendChild(div);
    div.querySelectorAll('.ag-choice').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.idx);
            const m = matchedGroups[idx];
            div.remove();
            this.askAddToGroup(m.overlaps, m.group);
        };
    });
    div.querySelector('#ag-cancel').onclick = () => { div.remove(); this.canvas.focus(); };
    setTimeout(() => { const oc = (e) => { if (!div.contains(e.target)) { div.remove(); this.canvas.focus(); win.document.removeEventListener('mousedown', oc); } }; win.document.addEventListener('mousedown', oc); }, 100);
  }

  askAddToGroup(elements, group) {
    const win = this.containerEl.win;
    const existing = win.document.getElementById('pur-add-group-dialog');
    if (existing) existing.remove();
    const container = this.containerEl.children[1];
    const cx = container.clientWidth / 2;
    const cy = container.clientHeight / 3;
    const div = win.document.createElement('div');
    div.id = 'pur-add-group-dialog';
    div.style.cssText = `position:absolute; left:${cx - 140}px; top:${cy}px; width:280px; z-index:100001; background:rgba(0,0,0,0.9); border:2px solid #4a9eff; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.6); padding:16px; display:flex; flex-direction:column; gap:12px; align-items:center;`;
    const count = elements.length;
    const label = group.content || '群组';
    div.innerHTML = `<div style="color:#eee;font-size:13px;text-align:center;">将 <b>${count} 个元素</b> 添加到 <b>${label}</b> ？</div><div style="display:flex;gap:8px;"><button id="ag-yes" style="background:#4a9eff;color:#fff;border:none;border-radius:4px;padding:6px 20px;cursor:pointer;font-size:13px;">是</button><button id="ag-no" style="background:transparent;color:#aaa;border:1px solid #555;border-radius:4px;padding:6px 20px;cursor:pointer;font-size:13px;">否</button></div>`;
    this.containerEl.appendChild(div);
    div.querySelector('#ag-yes').onclick = () => {
        for (const el of elements) {
            const idx = this.elements.indexOf(el);
            if (idx > -1) {
                this.elements.splice(idx, 1);
                const gw = getWorldPos(this.elements, group.id);
                el.x = el.x - (gw ? gw.x : group.x);
                el.y = el.y - (gw ? gw.y : group.y);
                group.children.push(el);
            }
        }
        this.selectedIds.clear();
        this.selectedIds.add(group.id);
        div.remove();
        this.saveHistory(); this.saveData(); this.requestRender();
    };
    div.querySelector('#ag-no').onclick = () => { div.remove(); this.canvas.focus(); };
    setTimeout(() => { const oc = (e) => { if (!div.contains(e.target)) { div.remove(); this.canvas.focus(); win.document.removeEventListener('mousedown', oc); } }; win.document.addEventListener('mousedown', oc); }, 100);
  }

    getSelectedElements() { const result = []; const search = (elements) => { for (const el of elements) { if (this.selectedIds.has(el.id)) result.push(el); if (el.type === "group" && el.children) search(el.children); } }; search(this.elements); return result; }

    bringToFront() { for (const el of this.getSelectedElements()) { const idx = this.elements.indexOf(el); if (idx > -1) { this.elements.splice(idx, 1); this.elements.push(el); } } this.saveHistory(); this.saveData(); this.requestRender(); }
  sendToBack() { const sel = this.getSelectedElements(); for (let i = sel.length - 1; i >= 0; i--) { const idx = this.elements.indexOf(sel[i]); if (idx > -1) { this.elements.splice(idx, 1); this.elements.unshift(sel[i]); } } this.saveHistory(); this.saveData(); this.requestRender(); }
  bringForward() { for (const el of this.getSelectedElements()) { const idx = this.elements.indexOf(el); if (idx > -1 && idx < this.elements.length - 1) { this.elements.splice(idx, 1); this.elements.splice(idx + 1, 0, el); } } this.saveHistory(); this.saveData(); this.requestRender(); }
  sendBackward() { const sel = this.getSelectedElements(); for (let i = sel.length - 1; i >= 0; i--) { const idx = this.elements.indexOf(sel[i]); if (idx > 0) { this.elements.splice(idx, 1); this.elements.splice(idx - 1, 0, sel[i]); } } this.saveHistory(); this.saveData(); this.requestRender(); }
  resetTransform() { for (const el of this.getSelectedElements()) { el.rotation = 0; el.flipH = false; el.flipV = false; } this.saveHistory(); this.saveData(); this.requestRender(); }
  toggleLock() { for (const el of this.getSelectedElements()) { el.locked = !el.locked; if (el.locked) el._lockTime = Date.now(); } this.saveHistory(); this.saveData(); this.requestRender(); }
  
  fitToView() {
    const targets = this.selectedIds.size > 0 ? this.getSelectedElements() : this.elements;
    if (!targets.length) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of targets) {
      if (el.x < minX) minX = el.x; if (el.y < minY) minY = el.y;
      if (el.x + el.w > maxX) maxX = el.x + el.w; if (el.y + el.h > maxY) maxY = el.y + el.h;
    }
    const pad = 40, worldW = maxX - minX + pad * 2, worldH = maxY - minY + pad * 2;
    const sx = this.canvas.width / worldW, sy = this.canvas.height / worldH;
    this.viewState.scale = Math.min(sx, sy, 5);
    this.viewState.offsetX = this.canvas.width / 2 - (minX + (maxX - minX) / 2) * this.viewState.scale;
    this.viewState.offsetY = this.canvas.height / 2 - (minY + (maxY - minY) / 2) * this.viewState.scale;
    this.requestRender();
  }

  revealInExplorer(el) { const f = this.app.vault.getAbstractFileByPath(el.link || el.original); if (f) { const l = this.app.workspace.getLeavesOfType('file-explorer')[0]; if (l) { this.app.workspace.revealLeaf(l); if (l.view.revealInFolder) l.view.revealInFolder(f); } } }
  openElement(el, mode) {
    let t = null;
    if (el.type === 'note-link') t = el.link;
    else if (el.type === 'image') t = el.link || el.original; // 图片优先打开关联笔记
    else t = el.original;
    if (t) this.app.workspace.openLinkText(t, '', mode === 'tab' ? 'tab' : mode === 'right' ? 'split' : false);
  }

  exportStudioImg(format = 'png') {
    const targets = this.elements;
    if (!targets.length) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of targets) {
      if (el.x < minX) minX = el.x; if (el.y < minY) minY = el.y;
      if (el.x + el.w > maxX) maxX = el.x + el.w; if (el.y + el.h > maxY) maxY = el.y + el.h;
    }
    const padding = 20; const exportW = maxX - minX + padding * 2; const exportH = maxY - minY + padding * 2;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = exportW; tempCanvas.height = exportH;
    const tCtx = tempCanvas.getContext('2d');

    if (format !== 'png') {
      tCtx.fillStyle = this.plugin.settings.preferences.backgroundColor || '#1e1e1e';
      tCtx.fillRect(0, 0, exportW, exportH);
    }
    for (const el of targets) {
      if (el.type === 'line') continue; // 暂不导出连线
      const renderX = el.x - minX + padding, renderY = el.y - minY + padding;
      tCtx.save();
      tCtx.translate(renderX + el.w/2, renderY + el.h/2);
      if (el.rotation) tCtx.rotate(el.rotation * Math.PI / 180);
      if (el.flipH) tCtx.scale(-1, 1); if (el.flipV) tCtx.scale(1, -1);
      tCtx.translate(-el.w/2, -el.h/2);
      tCtx.globalAlpha = el.opacity !== undefined ? el.opacity : 1;

      if (el.type === 'image') {
        const key = el.dataURL || el.original;
        const img = this.plugin.imageCache[key];
        if (!img && el.dataURL) { const i = new Image(); i.onload = () => { this.plugin.imageCache[key] = i; }; i.src = el.dataURL; }
        if (img) tCtx.drawImage(img, 0, 0, el.w, el.h);
      } else if (el.type === 'text') {
        tCtx.fillStyle = el.bgColor || 'rgba(45,45,45,0.8)'; 
        tCtx.globalAlpha = el.bgOpacity ?? 0.8;
        tCtx.fillRect(0, 0, el.w, el.h);
        tCtx.globalAlpha = el.opacity !== undefined ? el.opacity : 1;
        tCtx.fillStyle = el.color || '#e0e0e0'; tCtx.font = `${el.bold ? 'bold ' : ''}${el.fontSize || 14}px ${el.fontFamily || 'sans-serif'}`;
        const lines = el.content ? el.content.split('\n') : [];
        for (let i=0; i<lines.length; i++) tCtx.fillText(lines[i], 10, (el.fontSize||14) + (i*(el.fontSize||14)*1.3) + 5);
      }
      tCtx.restore();
    }
    const a = document.createElement('a');
    a.href = tempCanvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.9 : 1.0);
    a.download = this.canvasFile ? this.canvasFile.basename + `_导出.${format}` : `pur-scene.${format}`;
    a.click();
    new Notice(`已导出精准裁切的 ${format.toUpperCase()}`);
  }

  async exportAsText(customName, exportSelectedOnly = false) {
    try {
        let content = '';

        // 核心逻辑判断：是导出纯文本内容，还是全画布大纲
        if (exportSelectedOnly) {
            const selected = this.getSelectedElements()
                .filter(el => el.type === 'text' || el.type === 'code-node')
                .map(el => el.type === 'code-node' ? '```javascript\n' + (el.content || el.code || '') + '\n```' : (el.content || ''))
                .filter(text => text.trim() !== '');

            if (selected.length === 0) {
                new Notice('❌ 选中的节点没有可导出的纯文本/代码内容！');
                return;
            }
            content = selected.join('\n\n---\n\n');
        } else {
            console.log('[PurStudio] 开始导出全画布 Markdown 大纲');
            const lines = ['# ' + (this.canvasFile ? this.canvasFile.basename : 'Pur Studio 导出'), `> 导出时间：${new Date().toLocaleString()}`, '', '---', ''];
            let idx = 1;
            const exportEl = (el, depth) => {
              if (el.type === 'group') {
                const noteLink = el.link ? ' → [[' + el.link.replace('.md','') + ']]' : '';
                const label = (el.content || '群组').replace(/^📦\s*/, '');
                lines.push((depth===0?'## ':'### ') + idx + '. 📦 ' + label + noteLink);
                lines.push(''); idx++;
                if (el.children) {
                  for (const ch of el.children) exportEl(ch, depth+1);
                }
                return;
              }
              if (el.type === 'line') return;
              if (el.type === 'image') {
                const fname = (el.original || 'image').split(/[\\/]/).pop();
                const imgPath = '收件箱/' + fname;
                lines.push(`![${fname}](https://pur.studio/${encodeURIComponent(this.canvasFile?.basename || '附件图管理')}/${encodeURIComponent(fname)})`);
                lines.push('');
                idx++;
                return;
              }
              if (el.type === 'text') {
                // 跳过纯文件名标签（图片下方/上方的标注文本）
                if (el.content && !/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(el.content.trim())) {
                  lines.push(el.content); lines.push('');
                }
                idx++;
                return;
              }
              if (el.type === 'note-link' && el.link) {
                lines.push(`[[${el.link.replace('.md','')}]]`);
                lines.push(''); idx++;
                return;
              }
            };
            for (const el of this.elements) exportEl(el, 0);
            content = lines.join('\n');
        }

        const name = customName || 'pur-studio-export';
        const basePath = '收件箱';
        const safeName = name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').replace(/\.+$/,'').replace(/^ +| +$/g,'') || '未命名导出';
        const filePath = normalizePath(basePath + '/' + safeName + '.md');

        // ===== 仿照 saveStudioAs 的成功模式：先用底层 adapter 检查目录，再用 Vault API 写文件 =====
        try {
            const adapter = this.app.vault.adapter;
            // 1. 用底层 adapter 检查/创建目录 (与 saveStudioAs 完全一致
            if (!(await adapter.exists(normalizePath(basePath)))) {
                await adapter.mkdir(normalizePath(basePath));
            }

            // 2. 用 Vault API 创建或覆盖写文件
            const existingFile = this.app.vault.getAbstractFileByPath(filePath);
            if (existingFile instanceof TFile) {
                await this.app.vault.modify(existingFile, content);
            } else {
                await this.app.vault.create(filePath, content);
            }
            new Notice('✅ 已导出：' + filePath);
            try { this.app.workspace.openLinkText(filePath, '', false); } catch (e) { console.error(e); }
            return;
        } catch (apiErr) {
            console.warn('[PurStudio] Vault API 写入失败，使用浏览器下载兜底：', apiErr);
        }

        // ===== 兜底：浏览器直接下载
        try {
            const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = safeName + '.md';
            document.body.appendChild(a);
            a.click();
            setTimeout(function() { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
            new Notice('✅ 已通过浏览器下载文件');
            return;
        } catch (cErr) {
            console.warn('[PurStudio] 兜底下载失败：', cErr);
        }

        throw new Error('所有保存方案都失败了');
    } catch (err) {
      console.error('[PurStudio] exportAsText 错误：', err);
      new Notice('❌ 导出失败：' + (err.message || err));
    }
  }

  // 代码生成：按格式生成（js / html / py）
  async generateRunnableCode(format) {
    const fmt = (format || 'js').toLowerCase();
    // 递归穿透群组：把所有嵌套元素压平
    const flatElements = [];
    const extractNodes = (els) => {
      for (const e of els) {
        if (e.type === 'group' && e.children) extractNodes(e.children);
        else flatElements.push(e);
      }
    };
    extractNodes(this.elements);

    const codeNodes = flatElements.filter(e =>
      e.type === 'code-node' || ((e.type === 'text' || e.type === 'note-link') && ((e.inputs && e.inputs.length) || (e.outputs && e.outputs.length)))
    );
    const lines = flatElements.filter(e => e.type === 'line');
    if (codeNodes.length === 0) { new Notice(t(this.plugin, 'noCodeNodes')); return null; }

    // 预读 note-link 链接文件的代码内容
    for (const node of codeNodes) {
      if (node.type === 'note-link' && node.link && (!node.content || !node.content.includes('function'))) {
        try {
          const file = this.app.vault.getAbstractFileByPath(node.link);
          if (file) {
            const raw = await this.app.vault.read(file);
            if (raw) {
              const codeMatch = raw.match(/```(?:javascript|js)?\n?([\s\S]*?)```/) || raw.match(/function process[\s\S]*/);
              node._code = codeMatch ? (codeMatch[1] || codeMatch[0]).trim() : raw.replace(/^---[\s\S]*?---\n*/, '').trim();
              if (!node._code.includes('function') && !node._code.includes('return')) node._code = raw;
            }
          }
        } catch(e) { console.error(e); }
      }
    }

    // 1. 构建图（邻接表）+ 计算入度
    const graph = new Map();
    const inDegree = new Map();
    const nodeMap = new Map();
    codeNodes.forEach(node => {
      graph.set(node.id, []);
      inDegree.set(node.id, 0);
      nodeMap.set(node.id, node);
    });
    lines.forEach(line => {
      if (!graph.has(line.from) || !graph.has(line.to)) return;
      if (!line.fromPin || !line.toPin) return;
      graph.get(line.from).push({ toNode: line.to, fromPin: line.fromPin, toPin: line.toPin });
      inDegree.set(line.to, inDegree.get(line.to) + 1);
    });

    // 2. 拓扑排序
    const queue = [];
    const executionOrder = [];
    inDegree.forEach((degree, nodeId) => { if (degree === 0) queue.push(nodeId); });
    while (queue.length > 0) {
      const currId = queue.shift();
      executionOrder.push(currId);
      graph.get(currId).forEach(edge => {
        inDegree.set(edge.toNode, inDegree.get(edge.toNode) - 1);
        if (inDegree.get(edge.toNode) === 0) queue.push(edge.toNode);
      });
    }
    if (executionOrder.length !== codeNodes.length) {
      new Notice('错误：节点图存在循环依赖，无法生成代码！');
      return null;
    }

    // 3. 构建每个节点的输入来源映射
    const nodeInputs = new Map();
    codeNodes.forEach(node => { nodeInputs.set(node.id, {}); });
    lines.forEach(line => {
      if (!nodeInputs.has(line.to) || !line.fromPin || !line.toPin) return;
      nodeInputs.get(line.to)[line.toPin] = { fromNode: line.from, fromPin: line.fromPin };
    });

    // ---- 共用：节点信息整理 ----
    const nodeVarNames = {};
    const nodeInfo = [];
    executionOrder.forEach((nodeId, i) => {
      const node = nodeMap.get(nodeId);
      const safeName = `node_${i}_${(node.title || 'node').replace(/[^a-zA-Z0-9_一-龥]/g, '')}`;
      nodeVarNames[nodeId] = safeName;
      nodeInfo.push({ id: nodeId, safeName, node, idx: i });
    });

    const header = `${codeNodes.length} 个节点 / ${lines.filter(l => l.fromPin && l.toPin).length} 条连线 | ${new Date().toLocaleString()}`;

    // ============ JavaScript ============
    let js = `// Pur Studio - ${header}\n\n`;
    nodeInfo.forEach(info => {
      js += `// [节点 ${info.idx + 1}] ${info.node.title}\n`;
      js += `const ${info.safeName} = (() => {\n`;
      (info.node._code || info.node.content || info.node.code || 'function process() { return {}; }').split('\n').forEach(l => { js += `  ${l}\n`; });
      js += `  return { process };\n})();\n\n`;
    });
    js += `// ---------- 执行流水线 ----------\nfunction executePipeline() {\n  const results = {};\n\n`;
    nodeInfo.forEach(info => {
      const varName = info.safeName;
      const inputs = info.node.inputs || [];
      const inputMapping = nodeInputs.get(info.id) || {};
      js += `  // ===== 节点 [${info.idx + 1}]: ${info.node.title} =====\n`;
      if (inputs.length === 0) {
        js += `  results['${varName}'] = ${varName}.process({});\n\n`;
      } else {
        js += `  const ${varName}_inputs = {};\n`;
        inputs.forEach(pin => {
          const conn = inputMapping[pin.id];
          if (conn) {
            const sourceVar = nodeVarNames[conn.fromNode];
            const sourceNode = nodeMap.get(conn.fromNode);
            const sourcePin = (sourceNode?.outputs || []).find(p => p.id === conn.fromPin);
            const spName = sourcePin ? sourcePin.label : conn.fromPin;
            js += `  ${varName}_inputs['${pin.label}'] = results['${sourceVar}'] ? results['${sourceVar}']['${spName}'] : undefined;\n`;
          } else {
            js += `  ${varName}_inputs['${pin.label}'] = undefined;\n`;
          }
        });
        js += `  results['${varName}'] = ${varName}.process(${varName}_inputs);\n\n`;
      }
    });
    js += `  return results;\n}\n\ntry {\n  const pipelineResult = executePipeline();\n  console.log('✅ Pur Studio 执行结果:', pipelineResult);\n} catch (err) {\n  console.error('❌ Pur Studio 执行出错:', err);\n}\n`;

    if (fmt === 'js') return js;

    // ============ HTML（浏览器可运行的完整页面） ============
    if (fmt === 'html') {
      const nodesHtml = nodeInfo.map(info => {
        const outs = (info.node.outputs || []).map(p => `<div class="pin-row"><span class="pin-label">${p.label}</span><span class="pin-val" id="out-${info.safeName}-${p.label}">—</span></div>`).join('');
        const ins = (info.node.inputs || []).map(p => `<div class="pin-row"><span class="pin-label">${p.label}</span><span class="pin-val" id="in-${info.safeName}-${p.label}">—</span></div>`).join('');
        return `<div class="node-card">
          <div class="node-title">节点 ${info.idx + 1} · ${info.node.title}</div>
          <div class="node-pins">
            <div class="pin-col"><div class="pin-head">输入</div>${ins || '<div class="pin-empty">(无)</div>'}</div>
            <div class="pin-col"><div class="pin-head">输出</div>${outs || '<div class="pin-empty">(无)</div>'}</div>
          </div>
          <pre class="node-src">${(info.node.content || info.node.code || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        </div>`;
      }).join('');

      const runBlock = nodeInfo.map(info => {
        const varName = info.safeName;
        const inputs = info.node.inputs || [];
        const inputMapping = nodeInputs.get(info.id) || {};
        if (inputs.length === 0) return `  // ===== [${info.idx + 1}] ${info.node.title} =====
  results['${varName}'] = ${varName}.process({});
  renderNode('${varName}', {}, results['${varName}']);`;
        let block = `  // ===== [${info.idx + 1}] ${info.node.title} =====
  const ${varName}_inputs = {};\n`;
        inputs.forEach(pin => {
          const conn = inputMapping[pin.id];
          if (conn) {
            const sourceVar = nodeVarNames[conn.fromNode];
            const sourceNode = nodeMap.get(conn.fromNode);
            const sourcePin = (sourceNode?.outputs || []).find(p => p.id === conn.fromPin);
            const spName = sourcePin ? sourcePin.label : conn.fromPin;
            block += `  ${varName}_inputs['${pin.label}'] = results['${sourceVar}'] ? results['${sourceVar}']['${spName}'] : undefined;\n`;
          } else {
            block += `  ${varName}_inputs['${pin.label}'] = undefined;\n`;
          }
        });
        block += `  results['${varName}'] = ${varName}.process(${varName}_inputs);
  renderNode('${varName}', ${varName}_inputs, results['${varName}']);`;
        return block;
      }).join('\n');

      return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>Pur Studio - ${header}</title>
<style>
  body { font-family: -apple-system, 'Segoe UI', sans-serif; background: #0d1117; color: #e6edf3; margin: 0; padding: 24px; }
  h1 { margin: 0 0 8px 0; font-size: 20px; color: #4a9eff; }
  .meta { color: #8b949e; font-size: 12px; margin-bottom: 20px; }
  .toolbar { margin-bottom: 20px; }
  .toolbar button { background: #4a9eff; color: #fff; border: none; border-radius: 4px; padding: 8px 18px; font-size: 13px; font-weight: bold; cursor: pointer; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
  .node-card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 12px; }
  .node-title { font-weight: bold; color: #4a9eff; font-size: 13px; margin-bottom: 8px; border-bottom: 1px solid #21262d; padding-bottom: 6px; }
  .node-pins { display: flex; gap: 12px; margin-bottom: 10px; font-size: 11px; }
  .pin-col { flex: 1; }
  .pin-head { color: #8b949e; margin-bottom: 4px; font-weight: bold; }
  .pin-row { display: flex; justify-content: space-between; padding: 2px 0; }
  .pin-label { color: #c9d1d9; }
  .pin-val { color: #f0883e; font-family: monospace; }
  .pin-empty { color: #6e7681; font-style: italic; }
  .node-src { background: #010409; border: 1px solid #21262d; border-radius: 4px; padding: 8px; font-size: 10px; color: #8b949e; margin: 0; overflow: auto; max-height: 100px; }
  .output { margin-top: 24px; background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 14px; font-family: monospace; font-size: 12px; white-space: pre-wrap; }
  .error { background: #3a1d1d; border-color: #7a3636; color: #ff8b8b; }
</style>
</head>
<body>
<div class="meta">${header}</div>
<div class="toolbar"><button id="run-btn">▶ 执行流水线</button></div>
<div class="grid">${nodesHtml}</div>
<div class="output" id="output">点击「执行流水线」查看结果…</div>

<script>
  // ---- 节点函数 ----
${nodeInfo.map(info => {
  const inner = (info.node.content || info.node.code || 'function process() { return {}; }').split('\n').map(l => '  ' + l).join('\n');
  return `  const ${info.safeName} = (() => {\n${inner}\n  return { process };\n  })();`;
}).join('\n\n')}

  // ---- 渲染辅助 ----
  function pretty(v) {
    if (v === undefined) return 'undefined';
    if (v === null) return 'null';
    try { return typeof v === 'object' ? JSON.stringify(v, null, 0) : String(v); }
    catch (e) { return String(v); }
  }
  function renderNode(name, inputs, outputs) {
    Object.keys(inputs || {}).forEach(k => {
      const el = document.getElementById('in-' + name + '-' + k);
      if (el) el.textContent = pretty(inputs[k]);
    });
    Object.keys(outputs || {}).forEach(k => {
      const el = document.getElementById('out-' + name + '-' + k);
      if (el) el.textContent = pretty(outputs[k]);
    });
  }

  // ---- 执行流水线 ----
  function executePipeline() {
    const results = {};
${runBlock}
    return results;
  }

  document.getElementById('run-btn').onclick = function () {
    const out = document.getElementById('output');
    out.classList.remove('error');
    try {
      const r = executePipeline();
      out.textContent = '✅ 执行完成！\\n\\n最终结果：\\n' + JSON.stringify(r, null, 2);
    } catch (err) {
      out.classList.add('error');
      out.textContent = '❌ 执行出错：\\n' + (err.message || err);
      console.error(err);
    }
  };
</script>
</body>
</html>`;
    }

    // ============ Python ============
    let py = `# Pur Studio - ${header}\n# 拓扑顺序: ${nodeInfo.map(n => n.safeName).join(' → ')}\n\n`;
    nodeInfo.forEach(info => {
      py += `# ====== [节点 ${info.idx + 1}] ${info.node.title} ======\n`;
      py += `def ${info.safeName}_process(inputs):\n`;
      const src = (info.node.content || info.node.code || 'return {}').replace(/\r/g, '');
      const srcLines = src.split('\n');
      // 如果原内容是 JS function 形式，提取函数体
      let bodyLines = srcLines;
      const joined = srcLines.join('\n');
      if (/\bfunction\s+\w*\s*\(/.test(joined) || /^\s*(inputs)\s*=>/.test(joined)) {
        bodyLines = srcLines.filter(l => !/^\s*(function|return\s+\{process\}|const|let|var)\b/.test(l))
                              .map(l => l.replace(/\}$/, '').trim());
        bodyLines = bodyLines.filter(l => l !== '');
      }
      if (bodyLines.length === 0) bodyLines = ['return {}'];
      bodyLines.forEach(l => { py += `    ${l}\n`; });
      py += '\n';
    });
    py += `# ============ 执行流水线 ============\ndef execute_pipeline():\n    results = {}\n\n`;
    nodeInfo.forEach(info => {
      const varName = info.safeName;
      const inputs = info.node.inputs || [];
      const inputMapping = nodeInputs.get(info.id) || {};
      py += `    # [${info.idx + 1}] ${info.node.title}\n`;
      if (inputs.length === 0) {
        py += `    results['${varName}'] = ${varName}_process({})\n\n`;
      } else {
        py += `    ${varName}_inputs = {}\n`;
        inputs.forEach(pin => {
          const conn = inputMapping[pin.id];
          if (conn) {
            const sourceVar = nodeVarNames[conn.fromNode];
            const sourceNode = nodeMap.get(conn.fromNode);
            const sourcePin = (sourceNode?.outputs || []).find(p => p.id === conn.fromPin);
            const spName = sourcePin ? sourcePin.label : conn.fromPin;
            py += `    ${varName}_inputs['${pin.label}'] = results['${sourceVar}']['${spName}'] if results.get('${sourceVar}') else None\n`;
          } else {
            py += `    ${varName}_inputs['${pin.label}'] = None\n`;
          }
        });
        py += `    results['${varName}'] = ${varName}_process(${varName}_inputs)\n\n`;
      }
    });
    py += `    return results\n\nif __name__ == '__main__':\n    try:\n        r = execute_pipeline()\n        import json\n        print('✅ Pur Studio 执行结果:')\n        print(json.dumps(r, indent=2, default=str))\n    except Exception as err:\n        print('❌ Pur Studio 执行出错:', err)\n`;
    return py;
  }

  // 按格式生成并展示代码（js / html / py）
  async exportAndRunCode(format) {
    const fmt = format || 'js';
    const code = await this.generateRunnableCode(fmt);
    if (!code) return;
    this.showGeneratedCode(code, fmt);
  }

  // 下载代码为文件
  downloadAsFile(content, filename) {
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
      new Notice('✅ 已下载：' + filename);
    } catch (e) {
      new Notice('❌ 下载失败：' + e.message);
    }
  }

  // 显示代码生成预览（弹窗）
  showGeneratedCode(code, format) {
    if (!code) return;
    const fmt = (format || 'js').toLowerCase();
    const label = fmt === 'html' ? 'HTML' : fmt === 'py' ? 'Python' : 'JavaScript';
    const ext = fmt === 'html' ? 'html' : fmt === 'py' ? 'py' : 'js';

    const win = this.containerEl.win;
    if (win.document.getElementById('pur-edit-dialog')) return;

    const container = this.containerEl.children[1];
    const w = Math.round(container.clientWidth * 0.6);
    const h = Math.round(container.clientHeight * 0.7);
    const cx = (container.clientWidth - w) / 2;
    const cy = (container.clientHeight - h) / 2;

    const div = win.document.createElement('div');
    div.id = 'pur-edit-dialog';
    div.style.cssText = `position:absolute; left:${cx}px; top:${cy}px; width:${w}px; height:${h}px; min-width:300px; min-height:180px; resize:both; overflow:visible; z-index:100000; display:flex; flex-direction:column; background:rgba(25,25,25,0.98); border:1px solid rgba(255,255,255,0.12); border-radius:8px; box-shadow:0 8px 32px rgba(0,0,0,0.5); box-sizing:border-box;`;

    div.innerHTML = `
      <div style="flex:1; overflow:hidden;">
        <textarea id="pur-code-output" spellcheck="false" style="width:100%; height:100%; background:#111; color:#ccc; border:none; padding:12px; font-size:12px; font-family:Consolas,Monaco,monospace; box-sizing:border-box; resize:none; white-space:pre; outline:none;">${code}</textarea>
      </div>
      <div style="display:flex; gap:6px; justify-content:flex-end; padding:6px 14px; border-top:1px solid rgba(255,255,255,0.06); background:rgba(0,0,0,0.15); flex-shrink:0;">
        <button id="pur-copy-code" style="background:transparent; color:#999; border:1px solid rgba(255,255,255,0.12); border-radius:4px; padding:5px 12px; font-size:11px; cursor:pointer;">复制</button>
        <button id="pur-download-code" style="background:transparent; color:#999; border:1px solid rgba(255,255,255,0.12); border-radius:4px; padding:5px 12px; font-size:11px; cursor:pointer;">下载 .${ext}</button>
        <button id="pur-run-code" style="background:transparent; color:#999; border:1px solid rgba(255,255,255,0.12); border-radius:4px; padding:5px 12px; font-size:11px; cursor:pointer;">执行</button>
        ${fmt === 'html' ? `<div style="position:relative; display:inline-flex;">
          <button id="pur-open-browser" style="background:transparent; color:#999; border:1px solid rgba(255,255,255,0.12); border-radius:4px 0 0 4px; padding:5px 12px; font-size:11px; cursor:pointer;">浏览器打开</button>
          <button id="pur-browser-arrow" style="background:transparent; color:#999; border:1px solid rgba(255,255,255,0.12); border-left:none; border-radius:0 4px 4px 0; padding:5px 7px; font-size:14px; cursor:pointer;">▾</button>
        </div>` : ''}
        <button id="pur-code-ok" style="background:transparent; color:#999; border:1px solid rgba(255,255,255,0.12); border-radius:4px; padding:5px 12px; font-size:11px; cursor:pointer;">关闭</button>
      </div>
    `;
    this.containerEl.appendChild(div);

    const close = () => {
      div.remove();
      const rd = win.document.getElementById('pur-result-dialog');
      if (rd) rd.remove();
    };
    div.querySelector('#pur-code-ok').onclick = close;

    if (fmt === 'html') {
      // 扫描系统已安装浏览器
      const fs = require('fs'), os = require('os'), path = require('path');
      const browsers = [];
      const winPaths = [
        ['Chrome', process.env['PROGRAMFILES'] + '/Google/Chrome/Application/chrome.exe'],
        ['Chrome', process.env['LOCALAPPDATA'] + '/Google/Chrome/Application/chrome.exe'],
        ['Edge', process.env['PROGRAMFILES(X86)'] + '/Microsoft/Edge/Application/msedge.exe'],
        ['Firefox', process.env['PROGRAMFILES'] + '/Mozilla Firefox/firefox.exe'],
        ['Brave', process.env['PROGRAMFILES'] + '/BraveSoftware/Brave-Browser/Application/brave.exe'],
        ['Opera', process.env['LOCALAPPDATA'] + '/Programs/Opera/opera.exe'],
      ];
      const macPaths = [
        ['Chrome', '/Applications/Google Chrome.app'],
        ['Edge', '/Applications/Microsoft Edge.app'],
        ['Firefox', '/Applications/Firefox.app'],
        ['Brave', '/Applications/Brave Browser.app'],
        ['Safari', '/Applications/Safari.app'],
      ];
      const candidatePaths = os.platform() === 'win32' ? winPaths : macPaths;
      candidatePaths.forEach(([name, p]) => {
        try { if (p && fs.existsSync(p.replace(/\//g, path.sep))) browsers.push({ name, path: p }); }
        catch (e) {}
      });
      // 始终有"系统默认"选项
      browsers.unshift({ name: '系统默认', path: '' });

      // 浏览器菜单挂到按钮父级，absolute定位
      const btnWrap = div.querySelector('#pur-open-browser').parentElement;
      const menuEl = win.document.createElement('div');
      menuEl.id = 'pur-browser-menu';
      menuEl.style.cssText = 'display:none; position:absolute; top:100%; right:0; margin-top:2px; background:rgba(25,25,25,0.98); border:1px solid rgba(255,255,255,0.15); border-radius:4px; z-index:100002; min-width:110px;';
      btnWrap.appendChild(menuEl);

      browsers.forEach((b, i) => {
        const item = win.document.createElement('button');
        item.textContent = b.name;
        item.style.cssText = 'display:block; width:100%; background:transparent; color:#999; border:none; padding:6px 14px; font-size:11px; cursor:pointer; text-align:left; white-space:nowrap;';
        item.onmouseenter = () => { item.style.background = 'rgba(255,255,255,0.06)'; item.style.color = '#fff'; };
        item.onmouseleave = () => { item.style.background = 'transparent'; item.style.color = '#999'; };
        item.onclick = () => openWith(i);
        menuEl.appendChild(item);
      });

      const openWith = (browserIdx) => {
        menuEl.style.display = 'none';
        try {
          const htmlPath = path.join(os.tmpdir(), 'pur_studio_preview.html');
          fs.writeFileSync(htmlPath, div.querySelector('#pur-code-output').value);
          const { exec } = require('child_process');
          const browser = browsers[browserIdx] || browsers[0];
          let cmd;
          if (browser.path) {
            cmd = os.platform() === 'win32' ? `start "" "${browser.path}" "${htmlPath}"`
              : `open -a "${browser.path}" "${htmlPath}"`;
          } else {
            cmd = os.platform() === 'win32' ? `start "" "${htmlPath}"`
              : os.platform() === 'darwin' ? `open "${htmlPath}"` : `xdg-open "${htmlPath}"`;
          }
          exec(cmd);
          new Notice('已用 ' + browser.name + ' 打开');
        } catch (e) { new Notice('打开失败: ' + e.message); }
      };

      // 主按钮：直接用默认浏览器打开
      div.querySelector('#pur-open-browser').onclick = () => openWith(0);

      // 三角按钮：弹出浏览器选择菜单
      const arrowBtn = div.querySelector('#pur-browser-arrow');
      arrowBtn.onclick = (e) => {
        e.stopPropagation();
        menuEl.style.display = menuEl.style.display === 'none' ? 'block' : 'none';
      };
      // 点击其他地方关闭
      win.document.addEventListener('mousedown', (e) => {
        if (menuEl.style.display === 'block' && !btnWrap.contains(e.target)) {
          menuEl.style.display = 'none';
        }
      });
    }

    div.querySelector('#pur-copy-code').onclick = async () => {
      try {
        await navigator.clipboard.writeText(div.querySelector('#pur-code-output').value);
        new Notice('✅ 已复制到剪贴板');
      } catch (e) { new Notice('复制失败，请手动选择文本'); }
    };

    div.querySelector('#pur-download-code').onclick = () => {
      this.downloadAsFile(div.querySelector('#pur-code-output').value, `pur-studio-${Date.now()}.${ext}`);
    };

    div.querySelector('#pur-run-code').onclick = () => {
      const src = div.querySelector('#pur-code-output').value;

      if (fmt === 'py') {
        try {
          const fs = require('fs'), os = require('os'), path = require('path');
          const { exec } = require('child_process');
          const tmpPath = path.join(os.tmpdir(), 'pur_studio_temp.py');
          fs.writeFileSync(tmpPath, src);
          // Windows 优先用真实 Python 路径，避免 Store 存根
          let cmd = 'python3';
          if (os.platform() === 'win32') {
            // 动态定位 python.exe：扫描 %LOCALAPPDATA%/Programs/Python 与 %APPDATA%/Python
            // 下的 Python*/python.exe，回退 PATH 裸名 python——避免硬编码版本号/绝对路径
            // （旧值 Python311 与 C:\Python311 换机即断）
            const candidates = (() => {
              const bases = [
                process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Programs', 'Python'),
                process.env.APPDATA && path.join(process.env.APPDATA, 'Python'),
              ].filter(Boolean);
              const found = [];
              for (const base of bases) {
                let entries;
                try { entries = fs.readdirSync(base); } catch (e) { continue; }
                for (const e of entries) {
                  if (/^Python\d+$/.test(e)) found.push(path.join(base, e, 'python.exe'));
                }
              }
              return found.concat(['python']);
            })();
            cmd = candidates.find(c => { try { return fs.existsSync(c); } catch(e) { return false; } }) || 'python';
          }
          const notice = new Notice('⏳ Python 执行中...', 0);
          const timer = setTimeout(() => { notice.hide(); new Notice('⚠️ Python 执行超时（30秒）'); }, 30000);
          exec(`${cmd} "${tmpPath}"`, { timeout: 30000 }, (error, stdout, stderr) => {
            try {
            clearTimeout(timer);
            notice.hide();
            let result, isErr = false;
            if (error) {
              if (error.killed) { result = '⏱ 执行超时（30秒）'; isErr = true; }
              else if (error.code === 127 || error.message.includes('not found')) { result = '❌ 未找到 Python 环境，请确认已安装并配置 PATH'; isErr = true; }
              else { result = '❌ 崩溃: ' + error.message + '\n' + stderr; isErr = true; }
            }
            else if (stderr) { result = '⚠️ 报错:\n' + stderr + '\n✅ 输出:\n' + stdout; isErr = true; }
            else { result = stdout || '(无输出)'; }
            const isHtmlOut = !isErr && /^<!DOCTYPE|<html|<script/i.test(result.trim());
            this.showDialog({
              id: 'pur-result-dialog',
              title: '',
              contentHTML: `<pre style="background:${isErr?'#3a1d1d':'#0d1117'};color:${isErr?'#ff8b8b':'#56d364'};padding:12px;border-radius:4px;font-size:12px;font-family:Consolas,Monaco,monospace;max-height:300px;overflow-y:auto;white-space:pre-wrap;border:1px solid ${isErr?'#7a3636':'#30363d'};margin:0;">${result}</pre>${isHtmlOut ? '<div style="margin-top:8px; display:flex; justify-content:flex-end;"><button id="pur-preview-html" style="background:transparent; color:#999; border:1px solid rgba(255,255,255,0.12); border-radius:4px; padding:5px 12px; font-size:11px; cursor:pointer;">预览 HTML</button></div>' : ''}`,
              width: '420px'
            });
            if (isHtmlOut) {
              setTimeout(() => {
                const btn = win.document.getElementById('pur-preview-html');
                if (btn) btn.onclick = () => {
                  try { const fs2=require('fs'),os2=require('os'),path2=require('path'); var html=result; var i2=html.lastIndexOf('</html>'); if(i2>-1) html=html.substring(0,i2+7); const hp=path2.join(os2.tmpdir(),'pur_studio_preview.html'); fs2.writeFileSync(hp,html); const {exec:exec2}=require('child_process'); exec2(os2.platform()==='win32'?`start \"\" \"${hp}\"`:`open \"${hp}\"`); } catch(e) { new Notice('打开失败: '+e.message); }
                };
              }, 100);
            }
            } catch (cbErr) { new Notice('结果弹窗失败: ' + cbErr.message); }
          });
        } catch (e) { new Notice('❌ Python不可用: ' + e.message); }
        return;
      }

      try {
        let logs = [];
        const fa = (a) => {
          if (a instanceof Error) return a.name+': '+a.message+'\n'+(a.stack||'');
          if (typeof a==='object'&&a!==null){try{return JSON.stringify(a,null,2)}catch(e){return String(a)}}
          return a;
        };
        const vc = { log:(...a)=>logs.push(a.map(fa).join(' ')), error:(...a)=>logs.push('❌ '+a.map(fa).join(' ')), warn:(...a)=>logs.push('⚠️ '+a.map(fa).join(' ')), info:(...a)=>logs.push('ℹ️ '+a.map(fa).join(' ')) };
        new Function('console', src)(vc);
        const resultText = logs.length > 0 ? logs.join('\n') : '';
        const isHtml = /^<!DOCTYPE|<html/i.test(resultText.trim());
        if (isHtml) {
          // HTML 输出直接浏览器打开，不弹窗
          try {
            var htmlOut = resultText;
            var ei = htmlOut.lastIndexOf('</html>');
            if (ei > -1) htmlOut = htmlOut.substring(0, ei + 7);
            const hp2 = require('path').join(require('os').tmpdir(), 'pur_studio_preview.html');
            require('fs').writeFileSync(hp2, htmlOut);
            require('child_process').exec(require('os').platform() === 'win32' ? `start \"\" \"${hp2}\"` : `open \"${hp2}\"`);
            new Notice('已在浏览器打开');
          } catch (e) { new Notice('打开失败: ' + e.message); }
        } else if (resultText) {
          this.showDialog({
            id: 'pur-result-dialog', title: '',
            contentHTML: `<pre style="background:#111;color:#aaa;padding:12px;border-radius:4px;font-size:12px;font-family:Consolas,Monaco,monospace;max-height:300px;overflow-y:auto;white-space:pre-wrap;border:1px solid rgba(255,255,255,0.08);margin:0;">${resultText}</pre>`,
            width: '420px'
          });
        }
      } catch (e) {
        // 报错才弹窗
        this.showDialog({
          id: 'pur-result-dialog', title: '',
          contentHTML: `<pre style="background:#3a1d1d;color:#ff8b8b;padding:12px;border-radius:4px;font-size:12px;font-family:Consolas,Monaco,monospace;white-space:pre-wrap;border:1px solid #7a3636;margin:0;">${e.message}</pre>`,
          width: '420px'
        });
      }
    };

    let isDragging = false, startX, startY, initX, initY;
    div.querySelector('.pur-drag-handle').onmousedown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
      isDragging = true; startX = e.clientX; startY = e.clientY; initX = div.offsetLeft; initY = div.offsetTop;
    };
    win.document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      div.style.left = (initX + (e.clientX - startX)) + 'px';
      div.style.top = (initY + (e.clientY - startY)) + 'px';
    });
    win.document.addEventListener('mouseup', () => { isDragging = false; });
  }

  // ================== 右键菜单 ==================
  showContextMenu(e) {
    const _ = (k) => t(this.plugin, k);
    const isMac = /Mac/.test(navigator.platform);
    const hk = (hotkey) => hotkey ? '  ' + (isMac ? hotkey.replace('Ctrl','⌘').replace('Shift','⇧').replace('Alt','⌥') : hotkey.replace('Ctrl','Ctrl+').replace('Shift','Shift+').replace('Alt','Alt+')) : '';
    const menu = new Menu(this.app);
    const rect = this.canvas.getBoundingClientRect();
    const world = this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    const el = this.getElementAt(world.x, world.y);
    // === 空白处右键 ===
    if (!el) {
      menu.addItem(item => item.setTitle(_('newCanvas') + hk('')).setIcon('plus').onClick(() => this.plugin.createNewStudio()));
      menu.addItem(item => item.setTitle(_('newText') + hk('')).setIcon('file-text').onClick(() => this.addTextBlock(world.x, world.y)));
      menu.addItem(item => item.setTitle(_('addNoteLink') + hk('')).setIcon('link').onClick(() => this.addNoteLink(world.x, world.y)));
      menu.addItem(item => {
        item.setTitle('添加代码节点').setIcon('terminal');
        const codeSub = item.setSubmenu();
        const byCat = {};
        CODE_NODE_PRESETS.forEach(p => { (byCat[p.cat] = byCat[p.cat] || []).push(p); });
        Object.keys(byCat).forEach(cat => {
          codeSub.addItem(c => {
            c.setTitle(cat);
            const catSub = c.setSubmenu();
            byCat[cat].forEach(p => catSub.addItem(i => i.setTitle(p.title).setIcon('code').onClick(() => this.addCodeNode(world.x, world.y, p))));
          });
        });
      });
      menu.addSeparator();
      menu.addItem(item => {
        item.setTitle(_('import')).setIcon('download');
        const sub = item.setSubmenu();
        sub.addItem(s => s.setTitle(_('importLocal')).setIcon('image').onClick(() => this.importImages(world.x, world.y)));
        sub.addItem(s => s.setTitle('导入 UAsset IR').setIcon('code').onClick(() => this.importUAssetIR(world.x, world.y)));
        sub.addItem(s => s.setTitle('导入 JSON Canvas (.canvas)').setIcon('layout-dashboard').onClick(() => this.plugin.importJSONCanvas(this, world.x, world.y)));
        sub.addItem(s => s.setTitle(_('importNet')).setIcon('link').onClick(() => {
        const win = this.containerEl.win;
        if (win.document.getElementById('pur-url-dialog')) return;
        const container = this.containerEl.children[1];
        const cx = container.clientWidth / 2;
        const cy = container.clientHeight / 3;
        const div = win.document.createElement('div');
        div.id = 'pur-url-dialog';
        div.style.cssText = 'position:absolute; left:' + (cx - 180) + 'px; top:' + cy + 'px; width:360px; z-index:100000; display:flex; flex-direction:column; background:rgba(0,0,0,0.5); border:2px solid #4a9eff; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.5); overflow:hidden; backdrop-filter:blur(4px); box-sizing:border-box;';
        div.innerHTML = '<div class="pur-drag-handle" style="display:flex; gap:6px; padding:8px 10px; background:rgba(0,0,0,0.6); border-bottom:1px solid rgba(255,255,255,0.1); align-items:center; cursor:move; user-select:none; flex-shrink:0;"><span style="color:#ccc;font-size:12px;">导入数据</span></div><textarea id="url-input" placeholder="粘贴图片链接、网址或文本... (点击空白处保存)" style="flex-grow:1; width:100%; height:80px; background:transparent; color:#eee; border:none; padding:10px; outline:none; resize:none; font-size:13px; box-sizing:border-box;"></textarea>';
        this.containerEl.appendChild(div);
        const input = div.querySelector('#url-input');
        setTimeout(() => input.focus(), 50);
        div.onmousedown = (e) => { if (e.target.tagName === 'TEXTAREA') return; e.stopPropagation(); };
        const done = () => {
            const val = input.value.trim();
            if (!val) { div.remove(); this.canvas.focus(); return; }
            if (/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(val) || val.startsWith('data:image/')) {
                this.elements.push({ id: generateId(), type: 'image', x: world.x, y: world.y, w: 300, h: 200, original: val, rotation: 0, opacity: 1 });
            } else if (/^https?:\/\//i.test(val)) {
                this.fetchAndCreateTextFromURL(val, world.x, world.y);
            } else {
                this.elements.push({ id: generateId(), type: 'text', x: world.x, y: world.y, w: 200, h: Math.max(60, val.split('\n').length * 20 + 20), content: val, bgColor: 'rgba(45, 45, 45, 0.8)', color: '#e0e0e0', fontSize: 14, rotation: 0, opacity: 1 });
            }
            this.saveHistory(); this.saveData(); this.requestRender();
            div.remove();
            this.canvas.focus();
        };
        input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') { div.remove(); this.canvas.focus(); } });
        const handle = div.querySelector('.pur-drag-handle');
        let isDragging = false, startX, startY, initX, initY;
        handle.onmousedown = (e) => { if (e.target.tagName === 'TEXTAREA') return; isDragging = true; startX = e.clientX; startY = e.clientY; initX = div.offsetLeft; initY = div.offsetTop; e.stopPropagation(); };
        const onMove = (e) => { if (!isDragging) return; div.style.left = (initX + (e.clientX - startX)) + 'px'; div.style.top = (initY + (e.clientY - startY)) + 'px'; };
        const onUp = () => isDragging = false;
        win.document.addEventListener('mousemove', onMove);
        win.document.addEventListener('mouseup', onUp);
        const outsideClick = (e) => { if (!div.contains(e.target)) { done(); win.document.removeEventListener('mousedown', outsideClick); } };
        setTimeout(() => win.document.addEventListener('mousedown', outsideClick), 100);
	      }));
	    });
    
    menu.addItem(item => {
        item.setTitle(_('saveExport') + hk('')).setIcon('folder');
        const sub = item.setSubmenu();
        sub.addItem(s => s.setTitle(_('saveAsPur')).setIcon('save').onClick(() => { this.plugin.saveStudioAs(this); }));
        sub.addItem(s => s.setTitle(_('exportMd')).setIcon('document').onClick(() => this.plugin.exportAsTextWithName(this, false)));
        sub.addItem(s => {
            s.setTitle(_('genCode')).setIcon('code');
            const codeSub = s.setSubmenu();
            codeSub.addItem(c => c.setTitle('JavaScript (.js)').setIcon('file-code').onClick(async () => { await this.exportAndRunCode('js'); }));
            codeSub.addItem(c => c.setTitle('Python (.py)').setIcon('file-code').onClick(async () => { await this.exportAndRunCode('py'); }));
        });
        sub.addSeparator();
        sub.addItem(s => s.setTitle(_('exportPng')).setIcon('image').onClick(() => this.exportStudioImg('png')));
        sub.addItem(s => s.setTitle(_('exportJpg')).setIcon('image').onClick(() => this.exportStudioImg('jpg')));
        sub.addItem(s => s.setTitle('导出 JSON Canvas (.canvas)').setIcon('layout-dashboard').onClick(() => this.plugin.exportJSONCanvas(this)));
    });
    menu.addSeparator();
    menu.addItem(item => item.setTitle('适应视图 (F)').setIcon('maximize').onClick(() => this.fitToView()));
    const isPopout = this.isPurInPopout();
    menu.addItem(item => item.setTitle(isPopout ? '合并到主窗口' : '弹出为独立窗口').setIcon(isPopout ? 'minimize' : 'external-link').onClick(() => {
        if (isPopout) this.mergeToMainWindow();
        else this.popOutAndPin();
    }));
    menu.addItem(item => item.setIcon(this.isPinned ? "pin" : "pin").setTitle(this.isPinned ? '取消系统置顶' : '启动系统置顶').onClick(() => this.toggleAlwaysOnTop()));

    menu.showAtMouseEvent(e);
    return;
    }
    if (!this.selectedIds.has(el.id)) { this.selectedIds.clear(); this.selectedIds.add(el.id); this.requestRender(); }
    const selCount = this.selectedIds.size;
    const sels = this.getSelectedElements();


    // === 已选中元素右键 ===
    const hasText = sels.some(s => s.type === 'text');
    const hasImage = sels.some(s => s.type === 'image');
    const hasNoteLink = sels.some(s => s.type === 'note-link');
    const hasGroup = sels.some(s => s.type === 'group');
    const hasLine = sels.some(s => s.type === 'line');
    const hasCodeNode = sels.some(s => s.type === 'code-node');
    const nonLineSels = sels.filter(s => s.type !== 'line');

    // ---- 打开/编辑 (叠加) ----
    if (hasNoteLink || hasImage) {
      if (hasNoteLink) { menu.addItem(item => item.setTitle(_('editLine')).setIcon('pencil').onClick(() => this.editNoteLink(sels.find(s => s.type === 'note-link')))); menu.addSeparator(); }
      // === 图片专属：关联笔记/取消关联 ===
      if (hasImage && !hasNoteLink) {
        const imgEl = sels.find(s => s.type === 'image');
        if (imgEl && imgEl.link) {
          menu.addItem(item => item.setTitle(_('modLinkNote')).setIcon('link').onClick(() => this.editImageNoteLink(imgEl)));
          menu.addItem(item => item.setTitle(_('unlinkNote')).setIcon('unlink').onClick(() => { delete imgEl.link; this.saveHistory(); this.saveData(); this.requestRender(); }));
          menu.addSeparator();
        } else {
          menu.addItem(item => item.setTitle(_('linkNote')).setIcon('link').onClick(() => this.editImageNoteLink(imgEl)));
          menu.addSeparator();
        }
      }
      // 嵌入当前笔记
      { const activeFile = this.app.workspace.getActiveFile();
        if (activeFile && activeFile.extension === 'md' && hasImage) {
          const imgEl = sels.find(s => s.type === 'image');
          menu.addItem(item => item.setTitle(_('embedNote')).setIcon('image-up').onClick(async () => {
            const imgName = imgEl.original.split(/[\\/]/).pop();
            const canvasName = this.canvasFile ? this.canvasFile.basename : '附件图管理';
            const embed = `![${imgName}](https://pur.studio/${encodeURIComponent(canvasName)}/${encodeURIComponent(imgName)})\n`;
            await this.app.vault.process(activeFile, (data) => data + '\n' + embed);
            new Notice(_('embeddedTo') + ': ' + activeFile.basename);
          }));
          menu.addSeparator();
        } }
      menu.addItem(item => item.setTitle(_('open')).setIcon('external-link').onClick(() => this.openElement(sels.find(s => s.type === 'note-link' && s.link) || sels.find(s => s.original), 'active')));
      menu.addItem(item => item.setTitle(_('openNewTab')).setIcon('file-plus').onClick(() => this.openElement(sels.find(s => s.type === 'note-link' && s.link) || sels.find(s => s.original), 'tab')));
      menu.addItem(item => item.setTitle(_('openRight')).setIcon('split').onClick(() => this.openElement(sels.find(s => s.type === 'note-link' && s.link) || sels.find(s => s.original), 'right')));
      menu.addSeparator();
    }
    if (hasText || hasCodeNode || hasNoteLink) {
      const editable = sels.find(s => s.type === 'text' || s.type === 'code-node' || s.type === 'note-link');
      menu.addItem(item => item.setTitle(_('edit')).setIcon('pencil').onClick(() => this.editTextElement(editable)));
      // 快速添加引脚（智能命名：从代码提取未映射变量）
      menu.addItem(item => item.setTitle(_('addInPin')).setIcon('git-commit').onClick(() => {
        if (!editable.inputs) editable.inputs = [];
        const cur = editable.inputs.map(p=>p.label).filter(Boolean);
        let found=[];const m=(editable.content||editable.code||'').match(/const\s*\{\s*([^}]+)\s*\}\s*=\s*inputs/);
        if(m)found=m[1].split(',').map(s=>s.trim().split('=')[0].trim()).filter(Boolean);
        const u=found.filter(l=>!cur.includes(l));
        editable.inputs.push({ id: generateId(), label: u.length>0?u[0]:'' });
        this.saveHistory(); this.saveData(); this.requestRender();
      }));
      menu.addItem(item => item.setTitle(_('addOutPin')).setIcon('git-commit').onClick(() => {
        if (!editable.outputs) editable.outputs = [];
        const cur = editable.outputs.map(p=>p.label).filter(Boolean);
        let found=[];const m=(editable.content||editable.code||'').match(/return\s*\{([^}]+)\}/);
        if(m)found=m[1].split(',').map(s=>s.trim().split(':')[0].trim()).filter(Boolean);
        const u=found.filter(l=>!cur.includes(l));
        editable.outputs.push({ id: generateId(), label: u.length>0?u[0]:'' });
        this.saveHistory(); this.saveData(); this.requestRender();
      }));
      // 删除输入引脚（列出所有可删除的输入引脚）
      if (editable.inputs && editable.inputs.length > 0) {
        menu.addItem(item => {
          item.setTitle(_('delInPin')).setIcon('minus');
          const pinSub = item.setSubmenu();
          editable.inputs.forEach((pin, idx) => {
            pinSub.addItem(s => s.setTitle(pin.label || ('输入' + (idx + 1))).onClick(() => {
              editable.inputs.splice(idx, 1);
              // 同时删除与此节点相关的旧连线
              this.elements = this.elements.filter(el => !(el.type === 'line' && el.to === editable.id && el.toPin === pin.id));
              this.saveHistory(); this.saveData(); this.requestRender();
            }));
          });
        });
      }
      // 删除输出引脚（列出所有可删除的输出引脚）
      if (editable.outputs && editable.outputs.length > 0) {
        menu.addItem(item => {
          item.setTitle(_('delOutPin')).setIcon('minus');
          const pinSub = item.setSubmenu();
          editable.outputs.forEach((pin, idx) => {
            pinSub.addItem(s => s.setTitle(pin.label || ('输出' + (idx + 1))).onClick(() => {
              editable.outputs.splice(idx, 1);
              // 同时删除与此节点相关的旧连线
              this.elements = this.elements.filter(el => !(el.type === 'line' && el.from === editable.id && el.fromPin === pin.id));
              this.saveHistory(); this.saveData(); this.requestRender();
            }));
          });
        });
      }
      menu.addSeparator();
    }
    if (hasGroup) {
      const grp = sels.find(s => s.type === 'group');
      menu.addItem(item => item.setTitle(_('editLabel')).setIcon('pencil').onClick(() => this.editGroupLabel(grp)));
      if (grp.link) {
        menu.addItem(item => item.setTitle(_('modLinkNote')).setIcon('link').onClick(() => this.editGroupNoteLink(grp)));
        menu.addItem(item => item.setTitle(_('unlinkNote')).setIcon('unlink').onClick(() => { delete grp.link; this.saveHistory(); this.saveData(); this.requestRender(); }));
      } else {
        menu.addItem(item => item.setTitle(_('linkNote')).setIcon('link').onClick(() => this.editGroupNoteLink(grp)));
      }
      menu.addSeparator();
    }
    if (hasLine) {
      menu.addItem(item => item.setTitle(_('editLine')).setIcon('pencil').onClick(() => this.editLineLabel(sels.find(s => s.type === 'line'))));
      menu.addSeparator();
    }

    // ---- 复制/粘贴/删除 ----
    menu.addItem(item => item.setTitle(_('copy')).setIcon('copy').onClick(() => this.copySelected()));
    menu.addItem(item => item.setTitle(_('duplicate')).setIcon('plus-circle').onClick(() => this.duplicateSelected()));
    menu.addItem(item => item.setTitle(_('delete')).setIcon('trash').onClick(() => this.deleteSelected()));
    menu.addSeparator();

    // ---- 群组/连线 (按数量) ----
    if (hasGroup) {
      menu.addItem(item => item.setTitle(_('ungroup')).setIcon('ungroup').onClick(() => this.ungroupSelected()));
      menu.addSeparator();
    }
    if (selCount === 2 && nonLineSels.length === 2) {
      menu.addItem(item => item.setTitle(_('line')).setIcon('link').onClick(() => this.connectSelected()));
      menu.addSeparator();
    }
    if (selCount >= 2 && nonLineSels.length >= 2) {
      menu.addItem(item => item.setTitle(_('group')).setIcon('group').onClick(() => this.groupSelected()));
      menu.addSeparator();
    }

    // ---- 排列对齐 (2个以上) ----
    if (nonLineSels.length >= 2) {
      menu.addItem(item => {
        item.setTitle(_('arrange')).setIcon('layout-grid'); const sub = item.setSubmenu();
        sub.addItem(s => s.setTitle(_('arrange')).onClick(() => this.arrangeElements()));
        sub.addSeparator();
        sub.addItem(s => s.setTitle(_('alignTop')).onClick(() => this.alignElements('top')));
        sub.addItem(s => s.setTitle(_('alignLeft')).onClick(() => this.alignElements('left')));
        sub.addItem(s => s.setTitle(_('alignCenter')).onClick(() => this.alignElements('center')));
        sub.addItem(s => s.setTitle(_('distH')).onClick(() => this.alignElements('distribute-h')));
      });
    }

    // ---- 统一缩放 (2个以上) ----
    if (nonLineSels.length >= 2) {
      menu.addItem(item => {
        item.setTitle(_('scaleUni')).setIcon('scaling'); const sub = item.setSubmenu();
        sub.addItem(s => s.setTitle(_('sameHeight')).onClick(() => this.scaleElements('height')));
        sub.addItem(s => s.setTitle(_('sameWidth')).onClick(() => this.scaleElements('width')));
      });
    }

    // ---- 层级 ----
    if (nonLineSels.length > 0) {
      menu.addItem(item => {
        item.setTitle(_('layer')).setIcon('layers'); const sub = item.setSubmenu();
        sub.addItem(s => s.setTitle(_('bringToFront')).setIcon('arrow-up-to-line').onClick(() => this.bringToFront()));
        sub.addItem(s => s.setTitle(_('moveUp')).setIcon('arrow-up').onClick(() => this.bringForward()));
        sub.addItem(s => s.setTitle(_('moveDown')).setIcon('arrow-down').onClick(() => this.sendBackward()));
        sub.addItem(s => s.setTitle(_('sendToBack')).setIcon('arrow-down-to-line').onClick(() => this.sendToBack()));
      });
    }

    // ---- 透明度 ----
    if (nonLineSels.length > 0 && !hasGroup) {
      menu.addItem(item => {
        item.setTitle(_('opacity')).setIcon('droplet');
        const dom = item.dom;
        let popup = null, hideTimer = null;
        dom.addEventListener('mouseenter', () => {
          clearTimeout(hideTimer);
          const win = this.containerEl.win;
          if (win.document.getElementById('pur-hover-slider')) return;
          popup = win.document.createElement('div');
          popup.id = 'pur-hover-slider';
          popup.style.cssText = 'position:fixed; background:rgba(30,30,30,0.98); padding:8px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); z-index:1000001; display:flex; align-items:center; gap:8px; box-shadow:0 4px 16px rgba(0,0,0,0.6);';
          const itemRect = dom.getBoundingClientRect();
          popup.style.left = (itemRect.right + 2) + 'px';
          popup.style.top = itemRect.top + 'px';
          const currentOp = this.getSelectedElements()[0]?.opacity ?? 1;
          popup.innerHTML = '<span style="color:#4a9eff;font-size:12px;width:35px;">' + Math.round(currentOp*100) + '%</span><input type="range" min="0" max="1" step="0.05" value="' + currentOp + '" style="width:100px; cursor:pointer;">';
          win.document.body.appendChild(popup);
          const slider = popup.querySelector('input');
          const span = popup.querySelector('span');
          slider.oninput = (ev) => { span.innerText = Math.round(ev.target.value*100) + '%'; for (const s of this.getSelectedElements()) s.opacity = parseFloat(ev.target.value); this.requestRender(); };
          slider.onchange = () => { this.saveHistory(); this.saveData(); };
          popup.addEventListener('mouseenter', () => clearTimeout(hideTimer));
          popup.addEventListener('mouseleave', () => { hideTimer = setTimeout(() => { if (popup) popup.remove(); }, 300); });
        });
        dom.addEventListener('mouseleave', () => { hideTimer = setTimeout(() => { if (popup) popup.remove(); }, 300); });
      });
    }

    // ---- 锁定 + 链接相关 ----
    menu.addItem(item => item.setTitle(nonLineSels.some(s => s.locked) ? '解锁位置' : '锁定位置').setIcon(el.locked ? 'unlock' : 'lock').onClick(() => { const hasLocked = nonLineSels.some(s => s.locked); for (const s of nonLineSels) { s.locked = !hasLocked; if (s.locked) s._lockTime = Date.now(); } this.saveHistory(); this.saveData(); }));
    if (hasNoteLink || hasImage) {
      menu.addSeparator();
      menu.addItem(item => item.setTitle(_('copyLink')).setIcon('link').onClick(() => { const nl = sels.find(s => s.type === 'note-link' && s.link); const img = sels.find(s => s.original); navigator.clipboard.writeText(nl ? '[[' + nl.link.replace('.md','') + ']]' : img ? img.original : ''); new Notice(_('copied')); }));
      menu.addItem(item => item.setTitle(_('revealExplorer')).setIcon('folder-search').onClick(() => this.revealInExplorer(sels.find(s => s.type === 'note-link' && s.link) || sels.find(s => s.original))));
    }

    // ---- 全局 ----
    menu.addSeparator();
    menu.addItem(item => item.setTitle('适应视图 (F)').setIcon('maximize').onClick(() => this.fitToView()));
    menu.addItem(item => {
        item.setTitle(_('saveExport') + hk('')).setIcon('folder');
        const sub = item.setSubmenu();
        sub.addItem(s => s.setTitle(_('saveAsPur')).setIcon('save').onClick(() => { this.plugin.saveStudioAs(this); }));
        // 单个 .md 菜单项：如果选中了文本/代码节点则仅导出选中内容，否则导出全画布
        const selOnlyMd = this.selectedIds.size > 0 && this.getSelectedElements().some(s => s.type === 'text' || s.type === 'code-node');
        sub.addItem(s => s.setTitle(_('exportMd')).setIcon('document').onClick(() => this.plugin.exportAsTextWithName(this, selOnlyMd)));
        sub.addItem(s => {
            s.setTitle(_('genCode')).setIcon('code');
            const codeSub = s.setSubmenu();
            codeSub.addItem(c => c.setTitle('JavaScript (.js)').setIcon('file-code').onClick(async () => { await this.exportAndRunCode('js'); }));
            codeSub.addItem(c => c.setTitle('Python (.py)').setIcon('file-code').onClick(async () => { await this.exportAndRunCode('py'); }));
        });
        sub.addSeparator();
        sub.addItem(s => s.setTitle(_('exportPng')).setIcon('image').onClick(() => this.exportStudioImg('png')));
        sub.addItem(s => s.setTitle(_('exportJpg')).setIcon('image').onClick(() => this.exportStudioImg('jpg')));
        sub.addItem(s => s.setTitle('导出 JSON Canvas (.canvas)').setIcon('layout-dashboard').onClick(() => this.plugin.exportJSONCanvas(this)));
    });
    const isPopout2 = this.isPurInPopout();
    menu.addItem(item => item.setTitle(isPopout2 ? '合并到主窗口' : '弹出为独立窗口').setIcon(isPopout2 ? 'minimize' : 'external-link').onClick(() => {
        if (isPopout2) this.mergeToMainWindow();
        else this.popOutAndPin();
    }));
    menu.addItem(item => item.setIcon(this.isPinned ? "pin" : "pin").setTitle(this.isPinned ? '取消系统置顶' : '启动系统置顶').onClick(() => this.toggleAlwaysOnTop()));


    menu.showAtMouseEvent(e);
  }

  // ================== 添加元素 ==================
  addTextBlock(worldX, worldY) { 
    this.elements.push({ id: generateId(), type: 'text', x: worldX, y: worldY, w: 200, h: 60, content: '双击编辑文本', bgColor: 'rgba(30,30,30,0.8)', color: '#e0e0e0', fontSize: 14, rotation: 0, opacity: 1 }); 
    this.saveHistory(); this.saveData(); this.requestRender(); 
  }
  

  addCodeNode(worldX, worldY, preset) {
    const inputs = (preset.inputs || []).map(label => ({ id: generateId(), label }));
    const outputs = (preset.outputs || []).map(label => ({ id: generateId(), label }));
    const code = preset.code || 'function process() {\n  return {};\n}';
    this.elements.push({
      id: generateId(), type: 'code-node',
      title: preset.title || '节点',
      x: worldX, y: worldY,
      w: 260, h: calcNodeHeight({ inputs, outputs }),
      inputs, outputs,
      code, content: code,
      bgColor: 'rgba(32, 34, 38, 0.92)',
      color: '#ffffff', fontSize: 13, rotation: 0, opacity: 1
    });
    this.saveHistory(); this.saveData(); this.requestRender();
  }
importImages(worldX, worldY) {
    const input = document.createElement('input'); input.type = 'file'; input.multiple = true; input.accept = '*';
    const view = this;
    input.onchange = async (e) => {
      let spacing = 0;
      for (const file of Array.from(e.target.files)) {
        try {
          if (file.type.startsWith('image/')) {
            const dataURL = await view.readImageAsDataURL(file);
            const fname = file.name || 'image';
            if (dataURL) { view.elements.push({ id: generateId(), type: 'image', x: worldX + spacing, y: worldY, w: 300, h: 200, original: fname, dataURL, rotation: 0, flipH: false, flipV: false, opacity: 1 }); spacing += 320; }
          } else {
            // 文本文件：读取内容生成文本框
            const text = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.readAsText(file);
            });
            const lines = text.split('\n');
            view.elements.push({ id: generateId(), type: 'text', x: worldX + spacing, y: worldY, w: 480, h: Math.min(400, Math.max(80, lines.length * 22 + 20)), content: text, bgColor: 'rgba(35,35,40,0.85)', color: '#e0e0e0', fontSize: 14, rotation: 0, opacity: 1 });
            spacing += 500;
          }
        } catch (err) { new Notice((file.type.startsWith('image/') ?_('importFailed') : _('importFailed')) + ': ' + (err?.message || err)); }
      }
      view.saveHistory(); view.saveData(); view.requestRender();
    }; input.click();
  }
  async readImageAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  addNoteLink(worldX, worldY) {
    const view = this;
    new (class extends FuzzySuggestModal {
      getItems() { return this.app.vault.getMarkdownFiles(); }
      getItemText(file) { return file.basename; }
      async onChooseItem(file) {
        const folderColor = view.getGraphColorForFile(file);
        const el = { id: generateId(), type: 'note-link', x: worldX, y: worldY, w: 280, h: 0, content: file.basename, link: file.path, rotation: 0, opacity: 1, cardColor: folderColor };
        // 优先 frontmatter 引脚，否则代码解析。同时存代码到 content
        try {
          const raw = await view.app.vault.read(file);
          // 提取纯代码（去掉 frontmatter 和 markdown 标记）
          let code = raw.replace(/^---[\s\S]*?---\n*/, '').trim();
          const codeBlock = code.match(/```(?:javascript|js)?\n([\s\S]*?)\n```/);
          if (codeBlock) code = codeBlock[1];
          if (code.includes('function process') || code.includes('return {')) el.content = code;
          const fm = raw.match(/^---\n([\s\S]*?)\n---/);
          if (fm) {
            const fmi = fm[1].match(/^inputs:\s*(.+)$/m);
            const fmo = fm[1].match(/^outputs:\s*(.+)$/m);
            if (fmi) el.inputs = fmi[1].split(',').map(s=>{const[p,n]=s.trim().split('=');return{id:n||p,label:p}});
            if (fmo) el.outputs = fmo[1].split(',').map(s=>{const[p,n]=s.trim().split('=');return{id:n||p,label:p}});
          }
          if (!el.inputs&&!el.outputs) {
            const retm = code.match(/return\s*\{([^}]+)\}/);
            if (retm) el.outputs = retm[1].split(',').map(s=>s.trim().split(':')[0].trim()).filter(Boolean).map(k=>({id:k,label:k.toUpperCase()}));
            const paramm = code.match(/const\s*\{\s*([^}]+)\s*\}\s*=\s*inputs/);
            if (paramm) el.inputs = paramm[1].split(',').map(s=>s.trim().split('=')[0].trim()).filter(Boolean).map(k=>({id:k,label:k.toUpperCase()}));
          }
        } catch(e) { console.error(e); }
        el.h = 60 + Math.max((el.inputs||[]).length, (el.outputs||[]).length, 1) * 28 + 40;
        view.elements.push(el);
        view.saveHistory(); view.saveData(); view.updateNoteLinkInfo(file.path); view.requestRender();
      }
    })(this.app).open();
  }
  // 图片关联/修改关联笔记
  editImageNoteLink(imgEl) {
    const view = this;
    new (class extends FuzzySuggestModal {
      getItems() { return this.app.vault.getMarkdownFiles(); }
      getItemText(file) { return file.basename; }
      onChooseItem(file) {
        if (!imgEl) return;
        imgEl.link = file.path;
        if (!imgEl.content || imgEl.content === file.path) imgEl.content = file.basename;
        view.saveHistory(); view.saveData(); view.requestRender();
        new Notice(t(view.plugin, 'linkedNotice') + ': ' + file.basename);
      }
    })(this.app).open();
  }
  // 群组关联/修改关联笔记
  editGroupNoteLink(grp) {
    const view = this;
    new (class extends FuzzySuggestModal {
      getItems() { return this.app.vault.getMarkdownFiles(); }
      getItemText(file) { return file.basename; }
      onChooseItem(file) {
        if (!grp) return;
        grp.link = file.path;
        view.saveHistory(); view.saveData(); view.requestRender();
        new Notice(t(view.plugin, 'groupLinked') + ': ' + file.basename);
      }
    })(this.app).open();
  }

  async updateNoteLinkInfo(filePath) {
    const el = this.elements.find(e => e.type === 'note-link' && e.link === filePath);
    if (!el) return;
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file) el.backlinks = this.app.metadataCache.getBacklinksForFile(file)?.keys()?.length || 0;
    try {
      const content = await this.app.vault.read(file);
      el.renderedText = content.replace(/^---[\s\S]*?---\n*/, '').replace(/#+\s/g, '').replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/`{1,3}[^`]*`{1,3}/g, '').replace(/\n+/g, ' ').trim().substring(0, 200);
    } catch (e) { el.renderedText = ''; }
    this.requestRender();
  }

  // ================== 撤销 / 重做 ==================
  saveHistory() {
    const state = JSON.stringify(this.elements);
    if (this.history.length > 0 && this.historyIndex >= 0 && this.history[this.historyIndex] === state) return;
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(state);
    if (this.history.length > this.maxHistory) this.history.shift();
    this.historyIndex = this.history.length - 1;
  }
  undo() { if (this.historyIndex <= 0) return; this.historyIndex--; this.elements = JSON.parse(this.history[this.historyIndex]); this.selectedIds.clear(); this.saveData(); this.requestRender(); }
  redo() { if (this.historyIndex >= this.history.length - 1) return; this.historyIndex++; this.elements = JSON.parse(this.history[this.historyIndex]); this.selectedIds.clear(); this.saveData(); this.requestRender(); }
  _isViewActive() {
    try { return this.app.workspace.activeLeaf && this.app.workspace.activeLeaf.view === this; }
    catch (e) { return false; }
  }
  onResize() { const c = this.containerEl.children[1]; this.canvas.width = c.clientWidth; this.canvas.height = c.clientHeight; this.requestRender(); }

  // ================== 导入 UAsset IR ==================
  importUAssetIR(worldX, worldY) {
    const win = this.containerEl.win;
    if (win.document.getElementById('pur-ir-dialog')) return;

    const div = win.document.createElement('div');
    div.id = 'pur-ir-dialog';
    div.style.cssText = 'position:absolute; left:calc(50% - 300px); top:10%; width:600px; max-height:80%; z-index:100001; display:flex; flex-direction:column; background:rgba(25,25,25,0.98); border:2px solid #4a9eff; border-radius:10px; box-shadow:0 10px 40px rgba(0,0,0,0.6); overflow:hidden;';
    div.innerHTML = `
      <div class="pur-drag-handle" style="display:flex; gap:6px; padding:10px 14px; background:rgba(0,0,0,0.5); border-bottom:1px solid rgba(255,255,255,0.08); align-items:center; cursor:move; user-select:none; flex-shrink:0;">
        <span style="color:#4a9eff;font-size:13px;font-weight:bold;">📥 导入 UAsset IR</span>
        <span style="color:#888;font-size:11px;margin-left:12px;">粘贴蓝图/材质 YAML 或 JSON</span>
      </div>
      <textarea id="pur-ir-input" placeholder="粘贴 IR 内容...
支持格式:
  YAML: schema: blueprint-ir/v1 → graphs → nodes → pins → links
  JSON: {&quot;graphs&quot;:[{&quot;nodes&quot;:[...],&quot;links&quot;:[...]}]}

示例:
schema: blueprint-ir/v1
source: &quot;/Game/Blueprints/BP_Test&quot;
graphs:
  - name: &quot;EventGraph&quot;
    nodes:
      - id: node_0
        title: &quot;BeginPlay&quot;
        type: Event
        pins:
          - name: &quot;then&quot;
            direction: &quot;output&quot;
            category: &quot;exec&quot;
    links:
      - from: node_0.then
        to: node_1.execute" style="flex:1; width:100%; min-height:300px; background:#111; color:#ccc; border:none; padding:14px; outline:none; resize:vertical; font-size:12px; font-family:Consolas,Monaco,monospace; box-sizing:border-box; line-height:1.5;"></textarea>
      <div style="display:flex; gap:8px; justify-content:flex-end; padding:10px 14px; border-top:1px solid rgba(255,255,255,0.08); background:rgba(0,0,0,0.3); flex-shrink:0;">
        <button id="pur-ir-cancel" style="background:transparent; color:#999; border:1px solid #444; border-radius:4px; padding:6px 14px; font-size:12px; cursor:pointer;">取消</button>
        <button id="pur-ir-import" style="background:#4a9eff; color:#fff; border:none; border-radius:4px; padding:6px 18px; font-size:12px; font-weight:bold; cursor:pointer;">导入到画布</button>
      </div>
    `;
    this.containerEl.appendChild(div);

    const textarea = div.querySelector('#pur-ir-input');
    setTimeout(() => textarea.focus(), 50);

    // Drag
    let isDragging = false, sx, sy, ix, iy;
    const handle = div.querySelector('.pur-drag-handle');
    handle.onmousedown = (e) => { if (e.target.tagName === 'TEXTAREA') return; isDragging = true; sx = e.clientX; sy = e.clientY; ix = div.offsetLeft; iy = div.offsetTop; e.stopPropagation(); };
    win.document.addEventListener('mousemove', (e) => { if (!isDragging) return; div.style.left = (ix + e.clientX - sx) + 'px'; div.style.top = (iy + e.clientY - sy) + 'px'; });
    win.document.addEventListener('mouseup', () => isDragging = false);

    const close = () => { div.remove(); this.canvas.focus(); };
    div.querySelector('#pur-ir-cancel').onclick = close;

    div.querySelector('#pur-ir-import').onclick = () => {
      const raw = textarea.value.trim();
      if (!raw) { new Notice('请粘贴 IR 内容'); return; }

      let ir;
      try {
        // Try JSON first
        ir = JSON.parse(raw);
      } catch (e) {
        // Try YAML → simple conversion for this IR format
        try { ir = parseSimpleYAML(raw); }
        catch (e2) { new Notice('无法解析 IR：不是有效的 JSON 或 YAML'); return; }
      }

      if (!ir) { new Notice('解析失败'); return; }

      const result = irToElements(ir, worldX, worldY);
      if (!result || result.length === 0) { new Notice('IR 中没有找到节点'); return; }

      this.elements.push(...result);
      this.saveHistory(); this.saveData(); this.requestRender();
      close();
      new Notice(`✅ 已导入 ${result.filter(e => e.type === 'group').length} 群组、${result.reduce((s, g) => s + (g.children || []).filter(c => c.type === 'text').length, 0)} 节点、${result.reduce((s, g) => s + (g.children || []).filter(c => c.type === 'line').length, 0)} 连线`);
    };
  }

}

// ================== 主插件 ==================
module.exports = class PurStudioPlugin extends Plugin {
  settings = DEFAULT_SETTINGS;
  imageCache = {};

  async onload() {
    await this.loadSettings();

    addIcon('pur-icon', `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/><circle cx="15" cy="15" r="2"/></svg>`);

    this.registerView('pur-studio', (leaf) => new PurStudioView(leaf, this));
    this.registerExtensions(['PurStudio', 'purstudio'], 'pur-studio');

    this.addCommand({ id: 'open-pur-studio', name: '打开 Pur Studio', callback: () => this.activateView() });
    this.addCommand({ id: 'new-pur-studio', name: '新建 Pur Studio 画布', callback: () => this.createNewStudio() });
    this.addCommand({ id: 'save-pur-studio-as', name: '保存 Pur Studio 文件...', callback: () => this.saveCurrentStudioAs() });
    // 画布快捷键命令（在 Obsidian 设置→快捷键 中搜索 Pur Studio 自定义）
    const v = () => this.app.workspace.getLeavesOfType('pur-studio')[0]?.view;
    // 热键由画布 onKeyDown 处理，不注册 Obsidian 全局热键（会覆盖原生快捷键）
    this.addCommand({ id: 'pur-delete', name: 'Pur Studio: 删除选中', callback: () => v()?.deleteSelected() });
    this.addCommand({ id: 'pur-group', name: 'Pur Studio: 创建群组', callback: () => v()?.groupSelected() });
    this.addCommand({ id: 'pur-ungroup', name: 'Pur Studio: 取消群组', callback: () => v()?.ungroupSelected() });
    this.addCommand({ id: 'pur-duplicate', name: 'Pur Studio: 创建副本', callback: () => v()?.duplicateSelected() });
    this.addCommand({ id: 'pur-fit-view', name: 'Pur Studio: 适应视图', callback: () => v()?.fitToView() });
    this.addCommand({ id: 'pur-export-md', name: 'Pur Studio: 导出 Markdown', callback: () => v()?.exportAsText() });
    this.addCommand({ id: 'pur-select-all', name: 'Pur Studio: 全选', callback: () => { const w=v(); if(w){w.selectedIds.clear();w.elements.forEach(el=>w.selectedIds.add(el.id));w.requestRender();} } });
    this.addCommand({ id: 'pur-undo', name: 'Pur Studio: 撤销', callback: () => v()?.undo() });
    this.addCommand({ id: 'pur-redo', name: 'Pur Studio: 重做', callback: () => v()?.redo() });
    this.addCommand({ id: 'pur-copy', name: 'Pur Studio: 复制', callback: () => v()?.copySelected() });
    this.addCommand({ id: 'pur-paste', name: 'Pur Studio: 粘贴', callback: () => v()?.pasteClipboard() });
    this.addCommand({ id: 'pur-popout', name: 'Pur Studio: 弹出独立窗口', callback: () => v()?.popOutAndPin() });
    this.addCommand({ id: 'pur-save-as', name: 'Pur Studio: 另存为...', callback: () => v()?.plugin.saveStudioAs(v()) });

    this.addRibbonIcon('pur-icon', 'Pur Studio', () => this.activateView());

    this.pendingLocateTarget = null;
    // 全局去重：打开 PurStudio 时检查是否已有相同文件
    this.registerEvent(this.app.workspace.on('file-open', (file) => {
      if (!file || file.extension !== 'PurStudio') return;
      // 延迟检查——等 Obsidian 创建完叶子后
      setTimeout(() => {
        const leaves = this.app.workspace.getLeavesOfType('pur-studio');
        if (leaves.length < 2) return;
        const matching = leaves.filter(l => {
          const st = l.view?.getState();
          return st && st.file === file.path;
        });
        if (matching.length > 1) {
          this.app.workspace.revealLeaf(matching[0]);
          for (let i = 1; i < matching.length; i++) matching[i].detach();
        }
      }, 100);
    }));
    this.registerEvent(this.app.workspace.on('active-leaf-change', (leaf) => { if (leaf && leaf.view && leaf.view.file && leaf.view.file.extension === 'md') { this.pendingLocateTarget = leaf.view.file.path; } }));
    this.registerEvent(this.app.workspace.on('file-menu', (menu, file) => {
      if (file instanceof TFile && file.extension === 'PurStudio') {
        menu.addItem(item => item.setTitle('打开 Pur Studio').setIcon('pur-icon').onClick(() => {
          // 查找已有叶子并聚焦
          const existing = this.app.workspace.getLeavesOfType('pur-studio').find(l => {
            const st = l.view?.getState();
            return st && st.file === file.path;
          });
          if (existing) { this.app.workspace.revealLeaf(existing); return; }
          this.app.workspace.openLinkText(file.path, '', false);
        }));
      }
          }));
    this.addSettingTab(new PurStudioSettingTab(this.app, this));

    // https://pur.studio/画布名/图片名 → MutationObserver 全程拦截
    const processImg = async (img) => {
      const src = img.getAttribute('src') || '';
      const m = src.match(/https:\/\/pur\.studio\/([^/]+)\/(.+)$/);
      if (!m) return;
      const canvasName = decodeURIComponent(m[1]), imageName = decodeURIComponent(m[2]);
      try {
        // 递归搜索 Pur画布/ 子目录（先精确，再递归）
        let cfile = this.app.vault.getAbstractFileByPath('Pur画布/' + canvasName + '.PurStudio');
        if (!cfile) {
          const allFiles = this.app.vault.getFiles();
          cfile = allFiles.find(f => f.path.startsWith('Pur画布/') && f.path.endsWith('/' + canvasName + '.PurStudio'));
        }
        if (!cfile) return;
        const json = await this.app.vault.adapter.read(cfile.path);
        const data = JSON.parse(json);
        const find = (els) => {
          for (const e of els) {
            if (e.type==='image' && e.original && e.original.includes(imageName)) return e.dataURL || e.original || null;
            if (e.children) { const r=find(e.children); if(r) return r; }
          }
          return null;
        };
        const result = find(data.elements);
        if (!result) { img.alt = '[pur:未找到]'; return; }
        if (result.startsWith('data:')) { img.src = result; return; }
        const vf = this.app.vault.getAbstractFileByPath(result);
        if (vf) { img.src = this.app.vault.getResourcePath(vf); return; }
        img.alt = '[pur:文件丢失]';
      } catch(e) { img.alt = '[pur:解析失败]'; }
    };

    // 方案A: post-processor
    this.registerMarkdownPostProcessor(async (el) => {
      for (const img of el.querySelectorAll('img[src*="pur.studio"]')) await processImg(img);
    });

    // 方案B: MutationObserver 兜底——监听任何新增的 img 标签
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeName === 'IMG' && (node.getAttribute('src')||'').includes('pur.studio')) processImg(node);
          if (node.querySelectorAll) {
            for (const img of node.querySelectorAll('img[src*="pur.studio"]')) processImg(img);
          }
        }
      }
    });
    this._purObserver = obs;
    obs.observe(document.body, { childList: true, subtree: true });
  }

  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType('pur-studio')[0];
    if (!leaf) { leaf = this.app.workspace.getLeaf('tab'); await leaf.setViewState({ type: 'pur-studio', active: true }); }
    this.app.workspace.revealLeaf(leaf);
  }

  async createNewStudio(name = '新画布') {
    const adapter = this.app.vault.adapter, basePath = 'Pur画布';
    if (!(await adapter.exists(basePath))) await adapter.mkdir(basePath);
    let fileName = `${name}.PurStudio`, counter = 1;
    while (await adapter.exists(normalizePath(`${basePath}/${fileName}`))) { fileName = `${name}_${counter}.PurStudio`; counter++; }
    const filePath = normalizePath(`${basePath}/${fileName}`);
    await this.app.vault.create(filePath, JSON.stringify({ elements: [], viewState: { offsetX: 0, offsetY: 0, scale: 1 } }, null, 2));
    new Notice(`已创建：${filePath}`); 
    await this.app.workspace.openLinkText(filePath, '', false);
  }

  async saveCurrentStudioAs() {
    const view = this.app.workspace.getLeavesOfType('pur-studio').find(l => l === this.app.workspace.activeLeaf)?.view;
    if (!view || !(view instanceof PurStudioView)) { new Notice('没有打开的画布'); return; }
    await this.saveStudioAs(view);
  }


  async exportAsTextWithName(view, exportSelectedOnly = false) {
    const defaultName = view.canvasFile?.basename ? view.canvasFile.basename : '未命名';
    const win = view.containerEl.win;
    const oldDialog = win.document.getElementById('pur-export-dialog');
    if (oldDialog) oldDialog.remove();
    const container = view.containerEl.children[1];
    const cx = container.clientWidth / 2;
    const cy = container.clientHeight / 3;
    const div = win.document.createElement('div');
    div.id = 'pur-export-dialog';
    div.style.cssText = 'position:absolute; left:' + (cx - 150) + 'px; top:' + cy + 'px; width:300px; z-index:100000; display:flex; flex-direction:column; background:rgba(0,0,0,0.5); border:2px solid #4a9eff; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.5); overflow:hidden; backdrop-filter:blur(4px); box-sizing:border-box;';
    div.innerHTML = '<div class="pur-drag-handle" style="display:flex; gap:6px; padding:8px 10px; background:rgba(0,0,0,0.6); border-bottom:1px solid rgba(255,255,255,0.1); align-items:center; cursor:move; user-select:none; flex-shrink:0;"><span style="color:#ccc;font-size:12px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a9eff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> 保存为 .md</span></div><input type="text" id="save-name-input" value="' + defaultName + '" placeholder="文件名..." style="background:#222;color:#eee;border:1px solid #444;border-radius:4px;padding:8px 10px;margin:10px;outline:none;font-size:13px;">';
    view.containerEl.appendChild(div);
    const input = div.querySelector('#save-name-input');
    setTimeout(() => { input.focus(); input.select(); }, 50);
    div.onmousedown = (e) => { if (e.target.tagName === 'INPUT') return; e.stopPropagation(); };
    const doExport = async () => {
        const name = input.value.trim();
        if (!name) { div.remove(); view.canvas.focus(); return; }
        try {
            await view.exportAsText(name, exportSelectedOnly);
        } catch (err) { new Notice(t(this, 'saveFailed') + ': ' + err.message); }
        div.remove();
        view.canvas.focus();
    };
    input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); doExport(); } if (e.key === 'Escape') { div.remove(); view.canvas.focus(); } });
    const handle = div.querySelector('.pur-drag-handle');
    let isDragging = false, startX, startY, initX, initY;
    handle.onmousedown = (e) => { if (e.target.tagName === 'INPUT') return; isDragging = true; startX = e.clientX; startY = e.clientY; initX = div.offsetLeft; initY = div.offsetTop; e.stopPropagation(); };
    const onMove = (e) => { if (!isDragging) return; div.style.left = (initX + (e.clientX - startX)) + 'px'; div.style.top = (initY + (e.clientY - startY)) + 'px'; };
    const onUp = () => isDragging = false;
    win.document.addEventListener('mousemove', onMove);
    win.document.addEventListener('mouseup', onUp);
    const btnRow = win.document.createElement('div');
    btnRow.style.cssText = 'display:flex; gap:6px; justify-content:flex-end; padding:4px 10px 8px;';
    btnRow.innerHTML = '<button id="save-cancel" style="background:transparent;color:#aaa;border:1px solid #555;border-radius:4px;padding:5px 14px;cursor:pointer;font-size:12px;">取消</button><button id="save-confirm" style="background:#4a9eff;color:#fff;border:none;border-radius:4px;padding:5px 16px;cursor:pointer;font-size:12px;">确定</button>';
    div.appendChild(btnRow);
    btnRow.querySelector('#save-confirm').onclick = doExport;
    btnRow.querySelector('#save-cancel').onclick = () => { div.remove(); view.canvas.focus(); };
  }

  async saveStudioAs(view) {
    const defaultName = view.canvasFile?.basename ? view.canvasFile.basename + '_副本' : '新画布';
    const win = view.containerEl.win;
    if (win.document.getElementById('pur-save-dialog')) return;
    const container = view.containerEl.children[1];
    const cx = container.clientWidth / 2;
    const cy = container.clientHeight / 3;
    const div = win.document.createElement('div');
    div.id = 'pur-save-dialog';
    div.style.cssText = 'position:absolute; left:' + (cx - 150) + 'px; top:' + cy + 'px; width:300px; z-index:100000; display:flex; flex-direction:column; background:rgba(0,0,0,0.5); border:2px solid #4a9eff; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.5); overflow:hidden; backdrop-filter:blur(4px); box-sizing:border-box;';
    div.innerHTML = '<div class="pur-drag-handle" style="display:flex; gap:6px; padding:8px 10px; background:rgba(0,0,0,0.6); border-bottom:1px solid rgba(255,255,255,0.1); align-items:center; cursor:move; user-select:none; flex-shrink:0;"><span style="color:#ccc;font-size:12px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a9eff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> 保存画布</span></div><input type="text" id="save-name-input" value="' + defaultName + '" placeholder="画布名称..." style="background:#222;color:#eee;border:1px solid #444;border-radius:4px;padding:8px 10px;margin:10px;outline:none;font-size:13px;">';
    view.containerEl.appendChild(div);
    const input = div.querySelector('#save-name-input');
    setTimeout(() => { input.focus(); input.select(); }, 50);
    div.onmousedown = (e) => { if (e.target.tagName === 'INPUT') return; e.stopPropagation(); };
    const doSave = async () => {
        const name = input.value.trim();
        if (!name) { div.remove(); view.canvas.focus(); return; }
        try {
            const basePath = 'Pur画布';
            const adapter = this.app.vault.adapter;
            if (!(await adapter.exists(basePath))) await adapter.mkdir(basePath);
            let fileName = name + '.PurStudio', counter = 1;
            while (await adapter.exists(normalizePath(basePath + '/' + fileName))) { fileName = name + '_' + counter + '.PurStudio'; counter++; }
            const filePath = normalizePath(basePath + '/' + fileName);
            const payload = JSON.stringify({ elements: view.elements, viewState: view.viewState }, null, 2);
            const existingFile = this.app.vault.getAbstractFileByPath(filePath);
            let newFile;
            if (existingFile instanceof TFile) { await this.app.vault.modify(existingFile, payload); newFile = existingFile; }
            else { newFile = await this.app.vault.create(filePath, payload); }
            new Notice('已保存：' + filePath);
            view.canvasFile = newFile;
            const leaf = this.app.workspace.getLeavesOfType('pur-studio').find(l => l.view === view);
            if (leaf) leaf.setViewState({ type: 'pur-studio', state: { file: filePath }, active: true });
        } catch (err) { new Notice(t(this, 'saveFailed') + ': ' + err.message); }
        div.remove();
        view.canvas.focus();
    };
    input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); doSave(); } if (e.key === 'Escape') { div.remove(); view.canvas.focus(); } });
    const handle = div.querySelector('.pur-drag-handle');
    let isDragging = false, startX, startY, initX, initY;
    handle.onmousedown = (e) => { if (e.target.tagName === 'INPUT') return; isDragging = true; startX = e.clientX; startY = e.clientY; initX = div.offsetLeft; initY = div.offsetTop; e.stopPropagation(); };
    const onMove = (e) => { if (!isDragging) return; div.style.left = (initX + (e.clientX - startX)) + 'px'; div.style.top = (initY + (e.clientY - startY)) + 'px'; };
    const onUp = () => isDragging = false;
    win.document.addEventListener('mousemove', onMove);
    win.document.addEventListener('mouseup', onUp);
    const btnRow = win.document.createElement('div');
    btnRow.style.cssText = 'display:flex; gap:6px; justify-content:flex-end; padding:4px 10px 8px;';
    btnRow.innerHTML = '<button id="save-cancel" style="background:transparent;color:#aaa;border:1px solid #555;border-radius:4px;padding:5px 14px;cursor:pointer;font-size:12px;">取消</button><button id="save-confirm" style="background:#4a9eff;color:#fff;border:none;border-radius:4px;padding:5px 16px;cursor:pointer;font-size:12px;">确定</button>';
    div.appendChild(btnRow);
    btnRow.querySelector('#save-confirm').onclick = doSave;
    btnRow.querySelector('#save-cancel').onclick = () => { div.remove(); view.canvas.focus(); };
  }

  async saveDefaultAsFile(view) { await this.saveStudioAs(view); }

  
  async copyImage(file, canvasName) {
    const basePath = '附件';
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(basePath))) await adapter.mkdir(basePath);
    const ext = path.extname(file.name) || '.png', baseName = path.basename(file.name, ext) || 'paste';
    const buf = await file.arrayBuffer();
    const crypto = require('crypto');
    const newHash = crypto.createHash('sha256').update(Buffer.from(buf)).digest('hex');
    // 内容去重：同名文件只有内容完全一致才复用，否则走 _1/_2 后缀，避免不同来源同名图片静默覆盖
    let fileName = `${baseName}${ext}`, counter = 1;
    while (true) {
      const candidate = normalizePath(`${basePath}/${fileName}`);
      if (await adapter.exists(candidate)) {
        const existingHash = crypto.createHash('sha256').update(Buffer.from(await adapter.readBinary(candidate))).digest('hex');
        if (existingHash === newHash) return candidate;
        fileName = `${baseName}_${counter}${ext}`; counter++;
      } else {
        await adapter.writeBinary(candidate, buf);
        return candidate;
      }
    }
  }


  async exportJSONCanvas(view) {
    const baseName = view.canvasFile ? view.canvasFile.basename : '画布';
    try {
      const basePath = 'Pur画布';
      const adapter = this.app.vault.adapter;
      if (!(await adapter.exists(basePath))) await adapter.mkdir(basePath);
      let fileName = baseName + '.canvas', counter = 1;
      while (await adapter.exists(normalizePath(basePath + '/' + fileName))) { fileName = baseName + '_' + counter + '.canvas'; counter++; }
      const filePath = normalizePath(basePath + '/' + fileName);
      const payload = JSON.stringify(elementsToJSONCanvas(view.elements), null, 2);
      const existingFile = this.app.vault.getAbstractFileByPath(filePath);
      if (existingFile instanceof TFile) { await this.app.vault.modify(existingFile, payload); }
      else { await this.app.vault.create(filePath, payload); }
      new Notice('已导出 JSON Canvas：' + filePath);
    } catch (err) { new Notice('导出失败：' + err.message); }
  }

  async importJSONCanvas(view, worldX, worldY) {
    const win = (view.containerEl && view.containerEl.win) || window;
    const input = win.document.createElement('input');
    input.type = 'file'; input.accept = '.canvas,application/json';
    input.onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const elements = jsonCanvasToElements(data);
        elements.forEach(el => { el.x += worldX; el.y += worldY; });
        view.elements.push(...elements);
        view.saveHistory(); view.saveData(); view.requestRender();
        new Notice('已导入 ' + elements.length + ' 个元素');
      } catch (err) { new Notice('导入失败：' + err.message); }
    };
    input.click();
  }
  async loadImage(urlOrPath, view) {
    if (this.imageCache[urlOrPath]) return;

    const applyImageSize = (img) => {
      const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
      if (!iw || !ih) return;
      const fixEl = (el) => {
        if (!el) return false;
        let changed = false;
        if (el.type === 'image' && el.original === urlOrPath) {
          const oldH = el.h;
          if (el.w === 300 && el.h === 200) {
            el.w = iw; el.h = ih; changed = true;
          } else {
            const expectedH = Math.round(el.w * (ih / iw));
            if (Math.abs(el.h - expectedH) > 2) { el.h = expectedH; changed = true; }
          }
          return changed;
        }
        if (el.children) {
          for (const ch of el.children) { if (fixEl(ch)) changed = true; }
          if (changed) {
            // 校正后重新计算群组框：确保所有子元素在框内
            let maxR = 0, maxB = 0;
            for (const ch of el.children) {
              const r = ch.x + (ch.w || 0), b = ch.y + (ch.h || 0);
              if (r > maxR) maxR = r;
              if (b > maxB) maxB = b;
            }
            if (maxR > el.w - 20) el.w = maxR + 20;
            if (maxB > el.h - 20) el.h = maxB + 20;
          }
          return changed;
        }
        return false;
      };
      const leaves = this.app.workspace.getLeavesOfType('pur-studio');
      for (const leaf of leaves) {
        if (leaf.view && leaf.view.elements) {
          let changed = false;
          for (const el of leaf.view.elements) {
            if (fixEl(el)) changed = true;
          }
          if (changed && leaf.view.requestRender) leaf.view.requestRender();
        }
      }
      if (view) view.requestRender();
    };

    // Base64 内嵌图片 - 浏览器原生支持，直接赋值 src
    if (urlOrPath.startsWith('data:image/')) {
      const img = new Image();
      img.onload = () => { this.imageCache[urlOrPath] = img; applyImageSize(img); };
      img.src = urlOrPath;
      return;
    }

    if (urlOrPath.startsWith('http')) {
      try {
          const { requestUrl } = require('obsidian');
          const req = await requestUrl({ url: urlOrPath });
          const blob = new Blob([req.arrayBuffer], { type: req.headers['content-type'] || 'image/jpeg' });
          const img = new Image();
          img.onload = () => { this.imageCache[urlOrPath] = img; applyImageSize(img); };
          img.src = URL.createObjectURL(blob);
      } catch (e) { console.error(e); } return;
    }

    const file = this.app.vault.getAbstractFileByPath(urlOrPath);
    if (file instanceof TFile) {
      const img = new Image();
      img.onload = () => { this.imageCache[urlOrPath] = img; applyImageSize(img); };
      img.src = this.app.vault.getResourcePath(file);
    } else {
      this.app.vault.adapter.readBinary(urlOrPath).then(arrayBuf => {
        const img = new Image();
        img.onload = () => { this.imageCache[urlOrPath] = img; applyImageSize(img); };
        img.src = URL.createObjectURL(new Blob([arrayBuf]));
      }).catch(() => {});
    }
  }

  async loadSettings() { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()); }
  async saveSettings() { await this.saveData(this.settings); }
};

// ================== 设置面板 ==================
class PurStudioSettingTab extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
  display() {
    const { containerEl } = this; containerEl.empty();
    const _ = (k) => t(this.plugin, k);
    containerEl.createEl('h2', { text: _('settingsTitle') });
    new Setting(containerEl).setName(_('lang')).setDesc('中文 / English').addDropdown(d => d
      .addOption('zh', '中文').addOption('en', 'English')
      .setValue(this.plugin.settings.preferences.lang)
      .onChange(async (v) => { this.plugin.settings.preferences.lang = v; await this.plugin.saveSettings(); this.display(); }));
    new Setting(containerEl).setName(_('bgColor')).setDesc(_('bgColorDesc')).addText(text => text.setValue(this.plugin.settings.preferences.backgroundColor).onChange(async (v) => { this.plugin.settings.preferences.backgroundColor = v; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName(_('gridColor')).setDesc(_('gridColorDesc')).addText(text => text.setValue(this.plugin.settings.preferences.gridColor).onChange(async (v) => { this.plugin.settings.preferences.gridColor = v; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName(_('showGrid')).addToggle(toggle => toggle.setValue(this.plugin.settings.preferences.showGrid).onChange(async (v) => { this.plugin.settings.preferences.showGrid = v; await this.plugin.saveSettings(); }));
  }
}
