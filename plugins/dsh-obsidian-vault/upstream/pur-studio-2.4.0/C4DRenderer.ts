/**
 * C4D Renderer — Pur Studio
 * ─────────────────────────────
 * 将 C4D Scene IR 渲染为 Pur Studio 节点图。
 * 与 UE Blueprint/Material 渲染器并列。
 *
 * 架构：
 *   C4D IR (.json/.yaml) → C4DRenderer.render() → PurCanvasData (elements + viewState)
 *
 * 每个 C4D 对象 → 一个列 (object node + modifier nodes → material node)
 * 颜色方案与 c4d_to_pur.py 保持一致
 */

/** C4D IR 数据类型 */
interface C4DObject {
  id: string;
  name: string;
  type: string;
  type_id: number;
  parent: string | null;
  transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
  modifiers: C4DModifier[];
  material: string;
  children: C4DObject[];
}

interface C4DModifier {
  type: string;
  type_id: number;
  order: number;
  enabled: boolean;
  parameters: Record<string, any>;
  mograph?: { type: string; effectors?: any[] } | null;
}

interface C4DMaterial {
  id: string;
  name: string;
  type: string;
  parameters: Record<string, any>;
  redshift_nodes?: any[];
}

interface C4DSceneIR {
  schema: string;
  schema_version: string;
  engine_version: string;
  source: string;
  objects: C4DObject[];
  materials: C4DMaterial[];
  animation: any[];
  render_settings: {
    resolution: [number, number];
    fps: number;
    frame_range?: [number, number];
    renderer?: string;
  };
}

/** Pur Studio 画布数据类型 */
interface PurElement {
  id: string;
  type: 'text' | 'line' | 'group';
  title?: string;
  content?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  bgColor?: string;
  color?: string;
  fontSize?: number;
  rotation: number;
  opacity: number;
  inputs?: { id: string; label: string }[];
  outputs?: { id: string; label: string }[];
  children?: PurElement[];
  from?: string;
  fromPin?: string;
  to?: string;
  toPin?: string;
}

interface PurCanvasData {
  elements: PurElement[];
  viewState: { offsetX: number; offsetY: number; scale: number };
  metadata?: {
    source: string;
    engine: string;
    objectCount: number;
    modifierCount: number;
    materialCount: number;
  };
}

/** 颜色方案 */
const COLORS: Record<string, { bg: string; text: string }> = {
  object:    { bg: 'rgba(40,80,120,0.9)',  text: '#c8d8f0' },
  modifier:  { bg: 'rgba(80,120,40,0.9)',  text: '#d0f0c8' },
  material:  { bg: 'rgba(120,40,80,0.9)',  text: '#f0c8e0' },
  mograph:   { bg: 'rgba(40,120,120,0.9)', text: '#c8f0f0' },
  animation: { bg: 'rgba(120,80,40,0.9)',  text: '#f0e0c8' },
  render:    { bg: 'rgba(80,80,80,0.8)',   text: '#d0d0d0' },
  disabled:  { bg: 'rgba(60,60,60,0.5)',   text: '#888888' },
  dynamics:  { bg: 'rgba(160,40,40,0.9)',  text: '#f0c8c8' },
  particle:  { bg: 'rgba(40,160,80,0.9)',  text: '#c8f0d0' },
  hair:      { bg: 'rgba(160,120,40,0.9)', text: '#f0e0c8' },
};

const COL_W = 320;
const NODE_W = 260;
const NODE_H = 80;

let _idCounter = 0;
function gid(): string {
  return `c4d_${(++_idCounter).toString(16).padStart(8, '0')}`;
}

function isMoGraphType(type: string): boolean {
  const mographTypes = ['Cloner', 'Matrix', 'Fracture', 'MoInstance', 'Tracer', 'MoSpline'];
  return mographTypes.some(t => type.includes(t));
}

function isParticleType(type: string): boolean {
  return type.includes('Particle') || type.includes('Emitter');
}

function isDynamicsType(type: string): boolean {
  return ['SoftBody', 'RigidBody', 'Cloth', 'Collider', 'Connector'].some(t => type.includes(t));
}

function isHairType(type: string): boolean {
  return type.includes('Hair');
}

function getNodeColor(mod: C4DModifier): { bg: string; text: string } {
  const type = mod.type || '';
  if (!mod.enabled) return COLORS.disabled;
  if (isMoGraphType(type)) return COLORS.mograph;
  if (isParticleType(type)) return COLORS.particle;
  if (isDynamicsType(type)) return COLORS.dynamics;
  if (isHairType(type)) return COLORS.hair;
  return COLORS.modifier;
}

function formatParams(params: Record<string, any>, maxLines: number = 4): string {
  const entries = Object.entries(params).slice(0, maxLines);
  if (entries.length === 0) return '';
  return entries.map(([k, v]) => {
    const val = typeof v === 'number' ? v.toFixed(2) : String(v).slice(0, 30);
    return `${k}: ${val}`;
  }).join('\n');
}

function buildObjectChain(
  obj: C4DObject,
  materials: C4DMaterial[],
  yOffset: number,
  colIndex: number,
): { elements: PurElement[]; height: number } {
  const elements: PurElement[] = [];
  const objColors = COLORS.object;
  const x = 20 + colIndex * COL_W;
  let currentY = yOffset;

  // ── 对象节点 ──
  const objNode: PurElement = {
    id: gid(),
    type: 'text',
    title: obj.name,
    content: `// ${obj.type}\npos: [${obj.transform.position.map(v => v.toFixed(1)).join(', ')}]`,
    x, y: currentY,
    w: NODE_W, h: NODE_H,
    bgColor: objColors.bg, color: objColors.text,
    fontSize: 14, rotation: 0, opacity: 1,
    inputs: [],
    outputs: [{ id: 'out', label: '→' }],
  };
  elements.push(objNode);
  let prevId = objNode.id;
  let prevX = x + NODE_W + 20;
  let prevY = currentY + NODE_H / 2;

  // ── 修改器节点 ──
  const mods = (obj.modifiers || []).sort((a, b) => a.order - b.order);
  for (const mod of mods) {
    const mc = getNodeColor(mod);
    const enabled = mod.enabled ? '✓' : '✗';
    const params = formatParams(mod.parameters);

    const modNode: PurElement = {
      id: gid(),
      type: 'text',
      title: `${enabled} ${mod.type}${mod.mograph ? ' [MG]' : ''}`,
      content: params || `// order ${mod.order}`,
      x: prevX, y: prevY - NODE_H / 2,
      w: NODE_W, h: Math.max(NODE_H, 40 + (params ? params.split('\n').length * 16 : 0)),
      bgColor: mc.bg, color: mc.text,
      fontSize: 12, rotation: 0,
      opacity: mod.enabled ? 1 : 0.5,
      inputs: [{ id: 'in', label: '←' }],
      outputs: [{ id: 'out', label: '→' }],
    };
    elements.push(modNode);

    // 连线
    elements.push({
      id: gid(), type: 'line',
      from: prevId, fromPin: 'out',
      to: modNode.id, toPin: 'in',
      x: 0, y: 0, w: 0, h: 0,
      content: `order ${mod.order}`,
      rotation: 0, opacity: 0.6,
    });

    prevId = modNode.id;
    prevX = modNode.x + NODE_W + 20;
  }

  // ── 材质节点 ──
  if (obj.material) {
    const mat = materials.find(m => m.id === obj.material || m.name === obj.material);
    const matNode: PurElement = {
      id: gid(),
      type: 'text',
      title: `🟨 ${obj.material}`,
      content: mat ? `${mat.type}${mat.parameters ? '\n' + formatParams(mat.parameters, 3) : ''}` : 'Standard',
      x: prevX, y: prevY - NODE_H / 2,
      w: 180, h: NODE_H,
      bgColor: COLORS.material.bg, color: COLORS.material.text,
      fontSize: 12, rotation: 0, opacity: 1,
      inputs: [{ id: 'in', label: '←' }],
    };
    elements.push(matNode);
    elements.push({
      id: gid(), type: 'line',
      from: prevId, fromPin: 'out',
      to: matNode.id, toPin: 'in',
      x: 0, y: 0, w: 0, h: 0,
      content: 'material',
      rotation: 0, opacity: 1,
    });
  }

  const stackHeight = Math.max(NODE_H * 2, (mods.length || 0) * 100 + 120);
  return { elements, height: stackHeight };
}

function buildRenderSettingsGroup(ir: C4DSceneIR, yOffset: number): PurElement | null {
  const rs = ir.render_settings;
  if (!rs) return null;

  return {
    id: gid(),
    type: 'group',
    x: 20, y: yOffset + 20,
    w: COL_W * 2, h: 100,
    content: `📷 ${rs.renderer || 'Standard'} | ${rs.resolution[0]}×${rs.resolution[1]} @ ${rs.fps}fps`,
    rotation: 0, opacity: 1,
    children: [{
      id: gid(),
      type: 'text',
      title: 'Render Settings',
      content: `Resolution: ${rs.resolution.join('×')}\nFPS: ${rs.fps}\nRenderer: ${rs.renderer || 'Standard'}\nFrames: ${rs.frame_range ? rs.frame_range.join('–') : 'N/A'}`,
      x: 40, y: 30, w: 300, h: 70,
      bgColor: COLORS.render.bg, color: COLORS.render.text,
      fontSize: 12, rotation: 0, opacity: 1,
      inputs: [], outputs: [],
    }],
  };
}

/**
 * 主渲染函数：C4D Scene IR → Pur Studio 画布
 */
export function renderC4DToPur(irData: C4DSceneIR, mode: 'pipeline' | 'library' = 'pipeline'): PurCanvasData {
  _idCounter = 0;
  const elements: PurElement[] = [];
  const objects = irData.objects || [];
  const materials = irData.materials || [];

  if (!objects.length) {
    return { elements: [], viewState: { offsetX: 0, offsetY: 0, scale: 1 } };
  }

  let yOffset = 20;
  let colIndex = 0;
  let totalModifiers = 0;

  for (const obj of objects) {
    const chain = buildObjectChain(obj, materials, yOffset, colIndex);
    elements.push(...chain.elements);
    totalModifiers += (obj.modifiers || []).length;
    yOffset += chain.height + 20;
    colIndex = (colIndex + 1) % 2;
  }

  // 渲染设置组
  const rsGroup = buildRenderSettingsGroup(irData, yOffset);
  if (rsGroup) elements.push(rsGroup);

  return {
    elements,
    viewState: { offsetX: 0, offsetY: 0, scale: 1 },
    metadata: {
      source: irData.source,
      engine: irData.engine_version,
      objectCount: objects.length,
      modifierCount: totalModifiers,
      materialCount: materials.length,
    },
  };
}

/**
 * 从 JSON/YAML 文件路径渲染
 */
export function renderC4DFile(
  irData: C4DSceneIR,
  outputPath?: string,
  mode: 'pipeline' | 'library' = 'pipeline'
): PurCanvasData {
  return renderC4DToPur(irData, mode);
}

export default { renderC4DToPur, renderC4DFile };
