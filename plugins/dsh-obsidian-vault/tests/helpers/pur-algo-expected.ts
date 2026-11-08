/**
 * Golden vectors captured by running upstream Pur Studio's YAML reader, IR
 * importer and code generators. Generated-code strings carry the ZERO labels
 * that reproduce upstream text byte for byte.
 * @module dsh-obsidian-vault/tests/helpers/pur-algo-expected
 */
import type { PurCodegenCoreLabels, PurCodegenHtmlLabels, PurCodegenJavaScriptLabels, PurCodegenPythonLabels } from '../../src/pur-kernel/codegen-labels.ts'
import type { PurElement, PurGroupElement } from '../../src/pur-kernel/types.ts'

/** YAML documents handed to the parser. */
export const YAML_INPUTS: string[] = [
  "# top comment\nsource: \"ue.material\"  # trailing comment\ngraphs:\n  - name: Base\n    nodes:\n      - id: n1\n        type: float_add\n        title: 加法节点\n        x: 10\n        y: 20\n        pins:\n          - name: a\n            direction: input\n            display_name: A\n          - name: sum\n            direction: output\n            label: 和\n      - id: n2\n        type: multiply\n        pins:\n          - name: value\n            direction: input\n          - name: result\n            direction: output\n    links:\n      - from: n1.sum\n        to: n2.value\n  - name: Second\n    nodes:\n      - id: n3\n        event: begin_play\n        pins:\n          - name: out\n            direction: output\n",
  "nodes:\n  - id: a\n    flags: true\n    scale: 1.5\n    alias: null\n  - id: b\n    note: 'single quoted'\n    nested:\n      deep: 42\n"
]

/** Upstream `parseSimpleYAML` output for each of {@link YAML_INPUTS}. */
export const GOLDEN_YAML: Record<string, unknown>[] = [
  {
    "source": "ue.material",
    "graphs": [
      {
        "name": "Base",
        "nodes": [
          {
            "id": "n1",
            "type": "float_add",
            "title": "加法节点",
            "x": 10,
            "y": 20,
            "pins": [
              {
                "name": "a",
                "direction": "input",
                "display_name": "A"
              },
              {
                "name": "sum",
                "direction": "output",
                "label": "和"
              }
            ]
          },
          {
            "id": "n2",
            "type": "multiply",
            "pins": [
              {
                "name": "value",
                "direction": "input"
              },
              {
                "name": "result",
                "direction": "output"
              }
            ]
          }
        ],
        "links": [
          {
            "from": "n1.sum",
            "to": "n2.value"
          }
        ]
      },
      {
        "name": "Second",
        "nodes": [
          {
            "id": "n3",
            "event": "begin_play",
            "pins": [
              {
                "name": "out",
                "direction": "output"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "nodes": [
      {
        "id": "a",
        "flags": true,
        "scale": 1.5,
        "alias": null
      },
      {
        "id": "b",
        "note": "single quoted",
        "nested": {
          "deep": 42
        }
      }
    ]
  }
]

/** IR object handed to the importer. */
export const IR_INPUT: unknown = {
  "source": "material",
  "graphs": [
    {
      "name": "Base",
      "nodes": [
        {
          "id": "n1",
          "type": "float_add",
          "title": "加法",
          "x": 5,
          "y": 10,
          "pins": [
            {
              "name": "a",
              "direction": "input",
              "display_name": "A"
            },
            {
              "name": "b",
              "direction": "input"
            },
            {
              "name": "sum",
              "direction": "output",
              "label": "和"
            }
          ]
        },
        {
          "id": "n2",
          "type": "multiply",
          "x": 400,
          "y": 200,
          "function": "process_mul",
          "pins": [
            {
              "name": "value",
              "direction": "input"
            },
            {
              "name": "result",
              "direction": "output"
            }
          ]
        }
      ],
      "links": [
        {
          "from": "n1.sum",
          "to": "n2.value"
        },
        {
          "from": "n1.sum",
          "to": "missing.value"
        },
        {
          "from": "bad",
          "to": "n2.value"
        }
      ]
    },
    {
      "name": "Second",
      "nodes": [
        {
          "id": "n3",
          "event": "begin_play",
          "x": 10,
          "y": 10,
          "pins": [
            {
              "name": "out",
              "direction": "output"
            }
          ]
        }
      ]
    }
  ]
}

/** Upstream `irToElements(IR_INPUT, 50, 50)` output. */
export const GOLDEN_IR: PurGroupElement[] | null = [
  {
    "id": "id001003",
    "type": "group",
    "x": 50,
    "y": 50,
    "w": 740,
    "h": 330,
    "content": "📦 Base (2节点 1连线)",
    "children": [
      {
        "id": "id001000",
        "type": "text",
        "title": "加法",
        "content": "// float_add",
        "inputs": [
          {
            "id": "a",
            "label": "A"
          },
          {
            "id": "b",
            "label": "b"
          }
        ],
        "outputs": [
          {
            "id": "sum",
            "label": "和"
          }
        ],
        "x": 5,
        "y": 48,
        "w": 300,
        "h": 116,
        "bgColor": "rgba(20,50,40,0.92)",
        "color": "#c8ffe0",
        "fontSize": 14,
        "rotation": 0,
        "opacity": 1
      },
      {
        "id": "id001001",
        "type": "text",
        "title": "multiply",
        "content": "// process_mul",
        "inputs": [
          {
            "id": "value",
            "label": "value"
          }
        ],
        "outputs": [
          {
            "id": "result",
            "label": "result"
          }
        ],
        "x": 400,
        "y": 200,
        "w": 300,
        "h": 90,
        "bgColor": "rgba(20,50,40,0.92)",
        "color": "#c8ffe0",
        "fontSize": 14,
        "rotation": 0,
        "opacity": 1
      },
      {
        "id": "id001002",
        "type": "line",
        "from": "id001000",
        "fromPin": "sum",
        "to": "id001001",
        "toPin": "value",
        "content": ""
      }
    ],
    "rotation": 0,
    "opacity": 1
  },
  {
    "id": "id001005",
    "type": "group",
    "x": 1450,
    "y": 50,
    "w": 440,
    "h": 190,
    "content": "📦 Second (1节点 0连线)",
    "children": [
      {
        "id": "id001004",
        "type": "text",
        "title": "Node",
        "content": "// event: begin_play",
        "inputs": [],
        "outputs": [
          {
            "id": "out",
            "label": "out"
          }
        ],
        "x": 10,
        "y": 48,
        "w": 300,
        "h": 90,
        "bgColor": "rgba(20,50,40,0.92)",
        "color": "#c8ffe0",
        "fontSize": 14,
        "rotation": 0,
        "opacity": 1
      }
    ],
    "rotation": 0,
    "opacity": 1
  }
]

/** Elements handed to the upstream code generators. */
export const ALGO_ELEMENTS: PurElement[] = [
  {
    "id": "g1",
    "type": "group",
    "x": 0,
    "y": 0,
    "w": 400,
    "h": 300,
    "content": "组",
    "children": [
      {
        "id": "n1",
        "type": "code-node",
        "x": 0,
        "y": 0,
        "w": 250,
        "h": 120,
        "content": "",
        "code": "function process({a,b}) { return { sum: a + b }; }",
        "title": "加法",
        "inputs": [
          {
            "id": "a",
            "label": "a"
          },
          {
            "id": "b",
            "label": "b"
          }
        ],
        "outputs": [
          {
            "id": "sum",
            "label": "sum"
          }
        ]
      },
      {
        "id": "l1",
        "type": "line",
        "from": "n1",
        "to": "n2",
        "fromPin": "sum",
        "toPin": "value"
      }
    ]
  },
  {
    "id": "n2",
    "type": "code-node",
    "x": 0,
    "y": 0,
    "w": 250,
    "h": 120,
    "content": "",
    "code": "function process({value}) { return { double: value * 2 }; }",
    "title": "倍数",
    "inputs": [
      {
        "id": "value",
        "label": "value"
      }
    ],
    "outputs": [
      {
        "id": "double",
        "label": "double"
      }
    ]
  },
  {
    "id": "t1",
    "type": "text",
    "x": 0,
    "y": 0,
    "w": 200,
    "h": 60,
    "content": "function process(inputs) { return { y: inputs.x }; }",
    "title": "纯文本",
    "inputs": [
      {
        "id": "x",
        "label": "x"
      }
    ],
    "outputs": [
      {
        "id": "y",
        "label": "y"
      }
    ]
  },
  {
    "id": "l2",
    "type": "line",
    "from": "n2",
    "to": "t1",
    "fromPin": "double",
    "toPin": "x"
  },
  {
    "id": "l3",
    "type": "line",
    "from": "n1",
    "to": "n2"
  }
]

/** Elements whose pin connections form a cycle. */
export const CYCLE_ELEMENTS: PurElement[] = [
  {
    "id": "c1",
    "type": "code-node",
    "x": 0,
    "y": 0,
    "w": 250,
    "h": 120,
    "content": "",
    "code": "",
    "title": "A",
    "inputs": [
      {
        "id": "i",
        "label": "i"
      }
    ],
    "outputs": [
      {
        "id": "o",
        "label": "o"
      }
    ]
  },
  {
    "id": "c2",
    "type": "code-node",
    "x": 0,
    "y": 0,
    "w": 250,
    "h": 120,
    "content": "",
    "code": "",
    "title": "B",
    "inputs": [
      {
        "id": "i",
        "label": "i"
      }
    ],
    "outputs": [
      {
        "id": "o",
        "label": "o"
      }
    ]
  },
  {
    "id": "c3",
    "type": "line",
    "from": "c1",
    "to": "c2",
    "fromPin": "o",
    "toPin": "i"
  },
  {
    "id": "c4",
    "type": "line",
    "from": "c2",
    "to": "c1",
    "fromPin": "o",
    "toPin": "i"
  }
]

/** Header the upstream generators wrote at the fixed timestamp. */
export const GOLDEN_HEADER = "3 个节点 / 2 条连线 | FIXED"

/** Upstream JavaScript output for {@link ALGO_ELEMENTS}. */
export const GOLDEN_JS: string = "// Pur Studio - 3 个节点 / 2 条连线 | FIXED\n\n// [节点 1] 加法\nconst node_0_加法 = (() => {\n  function process({a,b}) { return { sum: a + b }; }\n  return { process };\n})();\n\n// [节点 2] 倍数\nconst node_1_倍数 = (() => {\n  function process({value}) { return { double: value * 2 }; }\n  return { process };\n})();\n\n// [节点 3] 纯文本\nconst node_2_纯文本 = (() => {\n  function process(inputs) { return { y: inputs.x }; }\n  return { process };\n})();\n\n// ---------- 执行流水线 ----------\nfunction executePipeline() {\n  const results = {};\n\n  // ===== 节点 [1]: 加法 =====\n  const node_0_加法_inputs = {};\n  node_0_加法_inputs['a'] = undefined;\n  node_0_加法_inputs['b'] = undefined;\n  results['node_0_加法'] = node_0_加法.process(node_0_加法_inputs);\n\n  // ===== 节点 [2]: 倍数 =====\n  const node_1_倍数_inputs = {};\n  node_1_倍数_inputs['value'] = results['node_0_加法'] ? results['node_0_加法']['sum'] : undefined;\n  results['node_1_倍数'] = node_1_倍数.process(node_1_倍数_inputs);\n\n  // ===== 节点 [3]: 纯文本 =====\n  const node_2_纯文本_inputs = {};\n  node_2_纯文本_inputs['x'] = results['node_1_倍数'] ? results['node_1_倍数']['double'] : undefined;\n  results['node_2_纯文本'] = node_2_纯文本.process(node_2_纯文本_inputs);\n\n  return results;\n}\n\ntry {\n  const pipelineResult = executePipeline();\n  console.log('✅ Pur Studio 执行结果:', pipelineResult);\n} catch (err) {\n  console.error('❌ Pur Studio 执行出错:', err);\n}\n"

/** Upstream HTML output for {@link ALGO_ELEMENTS}. */
export const GOLDEN_HTML: string = "<!DOCTYPE html>\n<html lang=\"zh-CN\">\n<head>\n<meta charset=\"UTF-8\">\n<title>Pur Studio - 3 个节点 / 2 条连线 | FIXED</title>\n<style>\n  body { font-family: -apple-system, 'Segoe UI', sans-serif; background: #0d1117; color: #e6edf3; margin: 0; padding: 24px; }\n  h1 { margin: 0 0 8px 0; font-size: 20px; color: #4a9eff; }\n  .meta { color: #8b949e; font-size: 12px; margin-bottom: 20px; }\n  .toolbar { margin-bottom: 20px; }\n  .toolbar button { background: #4a9eff; color: #fff; border: none; border-radius: 4px; padding: 8px 18px; font-size: 13px; font-weight: bold; cursor: pointer; }\n  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }\n  .node-card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 12px; }\n  .node-title { font-weight: bold; color: #4a9eff; font-size: 13px; margin-bottom: 8px; border-bottom: 1px solid #21262d; padding-bottom: 6px; }\n  .node-pins { display: flex; gap: 12px; margin-bottom: 10px; font-size: 11px; }\n  .pin-col { flex: 1; }\n  .pin-head { color: #8b949e; margin-bottom: 4px; font-weight: bold; }\n  .pin-row { display: flex; justify-content: space-between; padding: 2px 0; }\n  .pin-label { color: #c9d1d9; }\n  .pin-val { color: #f0883e; font-family: monospace; }\n  .pin-empty { color: #6e7681; font-style: italic; }\n  .node-src { background: #010409; border: 1px solid #21262d; border-radius: 4px; padding: 8px; font-size: 10px; color: #8b949e; margin: 0; overflow: auto; max-height: 100px; }\n  .output { margin-top: 24px; background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 14px; font-family: monospace; font-size: 12px; white-space: pre-wrap; }\n  .error { background: #3a1d1d; border-color: #7a3636; color: #ff8b8b; }\n</style>\n</head>\n<body>\n<div class=\"meta\">3 个节点 / 2 条连线 | FIXED</div>\n<div class=\"toolbar\"><button id=\"run-btn\">▶ 执行流水线</button></div>\n<div class=\"grid\"><div class=\"node-card\">\n          <div class=\"node-title\">节点 1 · 加法</div>\n          <div class=\"node-pins\">\n            <div class=\"pin-col\"><div class=\"pin-head\">输入</div><div class=\"pin-row\"><span class=\"pin-label\">a</span><span class=\"pin-val\" id=\"in-node_0_加法-a\">—</span></div><div class=\"pin-row\"><span class=\"pin-label\">b</span><span class=\"pin-val\" id=\"in-node_0_加法-b\">—</span></div></div>\n            <div class=\"pin-col\"><div class=\"pin-head\">输出</div><div class=\"pin-row\"><span class=\"pin-label\">sum</span><span class=\"pin-val\" id=\"out-node_0_加法-sum\">—</span></div></div>\n          </div>\n          <pre class=\"node-src\">function process({a,b}) { return { sum: a + b }; }</pre>\n        </div><div class=\"node-card\">\n          <div class=\"node-title\">节点 2 · 倍数</div>\n          <div class=\"node-pins\">\n            <div class=\"pin-col\"><div class=\"pin-head\">输入</div><div class=\"pin-row\"><span class=\"pin-label\">value</span><span class=\"pin-val\" id=\"in-node_1_倍数-value\">—</span></div></div>\n            <div class=\"pin-col\"><div class=\"pin-head\">输出</div><div class=\"pin-row\"><span class=\"pin-label\">double</span><span class=\"pin-val\" id=\"out-node_1_倍数-double\">—</span></div></div>\n          </div>\n          <pre class=\"node-src\">function process({value}) { return { double: value * 2 }; }</pre>\n        </div><div class=\"node-card\">\n          <div class=\"node-title\">节点 3 · 纯文本</div>\n          <div class=\"node-pins\">\n            <div class=\"pin-col\"><div class=\"pin-head\">输入</div><div class=\"pin-row\"><span class=\"pin-label\">x</span><span class=\"pin-val\" id=\"in-node_2_纯文本-x\">—</span></div></div>\n            <div class=\"pin-col\"><div class=\"pin-head\">输出</div><div class=\"pin-row\"><span class=\"pin-label\">y</span><span class=\"pin-val\" id=\"out-node_2_纯文本-y\">—</span></div></div>\n          </div>\n          <pre class=\"node-src\">function process(inputs) { return { y: inputs.x }; }</pre>\n        </div></div>\n<div class=\"output\" id=\"output\">点击「执行流水线」查看结果…</div>\n\n<script>\n  // ---- 节点函数 ----\n  const node_0_加法 = (() => {\n  function process({a,b}) { return { sum: a + b }; }\n  return { process };\n  })();\n\n  const node_1_倍数 = (() => {\n  function process({value}) { return { double: value * 2 }; }\n  return { process };\n  })();\n\n  const node_2_纯文本 = (() => {\n  function process(inputs) { return { y: inputs.x }; }\n  return { process };\n  })();\n\n  // ---- 渲染辅助 ----\n  function pretty(v) {\n    if (v === undefined) return 'undefined';\n    if (v === null) return 'null';\n    try { return typeof v === 'object' ? JSON.stringify(v, null, 0) : String(v); }\n    catch (e) { return String(v); }\n  }\n  function renderNode(name, inputs, outputs) {\n    Object.keys(inputs || {}).forEach(k => {\n      const el = document.getElementById('in-' + name + '-' + k);\n      if (el) el.textContent = pretty(inputs[k]);\n    });\n    Object.keys(outputs || {}).forEach(k => {\n      const el = document.getElementById('out-' + name + '-' + k);\n      if (el) el.textContent = pretty(outputs[k]);\n    });\n  }\n\n  // ---- 执行流水线 ----\n  function executePipeline() {\n    const results = {};\n  // ===== [1] 加法 =====\n  const node_0_加法_inputs = {};\n  node_0_加法_inputs['a'] = undefined;\n  node_0_加法_inputs['b'] = undefined;\n  results['node_0_加法'] = node_0_加法.process(node_0_加法_inputs);\n  renderNode('node_0_加法', node_0_加法_inputs, results['node_0_加法']);\n  // ===== [2] 倍数 =====\n  const node_1_倍数_inputs = {};\n  node_1_倍数_inputs['value'] = results['node_0_加法'] ? results['node_0_加法']['sum'] : undefined;\n  results['node_1_倍数'] = node_1_倍数.process(node_1_倍数_inputs);\n  renderNode('node_1_倍数', node_1_倍数_inputs, results['node_1_倍数']);\n  // ===== [3] 纯文本 =====\n  const node_2_纯文本_inputs = {};\n  node_2_纯文本_inputs['x'] = results['node_1_倍数'] ? results['node_1_倍数']['double'] : undefined;\n  results['node_2_纯文本'] = node_2_纯文本.process(node_2_纯文本_inputs);\n  renderNode('node_2_纯文本', node_2_纯文本_inputs, results['node_2_纯文本']);\n    return results;\n  }\n\n  document.getElementById('run-btn').onclick = function () {\n    const out = document.getElementById('output');\n    out.classList.remove('error');\n    try {\n      const r = executePipeline();\n      out.textContent = '✅ 执行完成！\\n\\n最终结果：\\n' + JSON.stringify(r, null, 2);\n    } catch (err) {\n      out.classList.add('error');\n      out.textContent = '❌ 执行出错：\\n' + (err.message || err);\n      console.error(err);\n    }\n  };\n</script>\n</body>\n</html>"

/** Upstream Python output for {@link ALGO_ELEMENTS}. */
export const GOLDEN_PY: string = "# Pur Studio - 3 个节点 / 2 条连线 | FIXED\n# 拓扑顺序: node_0_加法 → node_1_倍数 → node_2_纯文本\n\n# ====== [节点 1] 加法 ======\ndef node_0_加法_process(inputs):\n    return {}\n\n# ====== [节点 2] 倍数 ======\ndef node_1_倍数_process(inputs):\n    return {}\n\n# ====== [节点 3] 纯文本 ======\ndef node_2_纯文本_process(inputs):\n    return {}\n\n# ============ 执行流水线 ============\ndef execute_pipeline():\n    results = {}\n\n    # [1] 加法\n    node_0_加法_inputs = {}\n    node_0_加法_inputs['a'] = None\n    node_0_加法_inputs['b'] = None\n    results['node_0_加法'] = node_0_加法_process(node_0_加法_inputs)\n\n    # [2] 倍数\n    node_1_倍数_inputs = {}\n    node_1_倍数_inputs['value'] = results['node_0_加法']['sum'] if results.get('node_0_加法') else None\n    results['node_1_倍数'] = node_1_倍数_process(node_1_倍数_inputs)\n\n    # [3] 纯文本\n    node_2_纯文本_inputs = {}\n    node_2_纯文本_inputs['x'] = results['node_1_倍数']['double'] if results.get('node_1_倍数') else None\n    results['node_2_纯文本'] = node_2_纯文本_process(node_2_纯文本_inputs)\n\n    return results\n\nif __name__ == '__main__':\n    try:\n        r = execute_pipeline()\n        import json\n        print('✅ Pur Studio 执行结果:')\n        print(json.dumps(r, indent=2, default=str))\n    except Exception as err:\n        print('❌ Pur Studio 执行出错:', err)\n"

/** Whether upstream generated code for {@link CYCLE_ELEMENTS}; false means it refused. */
export const GOLDEN_CYCLE_REFUSED: boolean = true

/** Console messages upstream produced while refusing the cyclic graph. */
export const GOLDEN_CYCLE_NOTICES: string[] = ["错误：节点图存在循环依赖，无法生成代码！"]

/** Labels that reproduce upstream's simplified-Chinese output byte for byte. */
export const UPSTREAM_CORE: PurCodegenCoreLabels = {
  header: (nodes, edges, time) => nodes + ' 个节点 / ' + edges + ' 条连线 | ' + time,
  resultBanner: '✅ Pur Studio 执行结果:',
  errorBanner: '❌ Pur Studio 执行出错:',
}

/** JavaScript labels matching upstream text. */
export const UPSTREAM_JS: PurCodegenJavaScriptLabels = {
  nodeHeading: (index, title) => '[节点 ' + index + '] ' + title,
  nodeSection: (index, title) => '===== 节点 [' + index + ']: ' + title + ' =====',
  pipelineHeading: '---------- 执行流水线 ----------',
}

/** HTML labels matching upstream text. */
export const UPSTREAM_HTML: PurCodegenHtmlLabels = {
  lang: 'zh-CN',
  title: (headerText) => 'Pur Studio - ' + headerText,
  inputs: '输入',
  outputs: '输出',
  noPins: '(无)',
  card: (index, title) => '节点 ' + index + ' · ' + title,
  nodesHeading: '// ---- 节点函数 ----',
  helpersHeading: '// ---- 渲染辅助 ----',
  runnerHeading: '// ---- 执行流水线 ----',
  runnerSection: (index, title) => '===== [' + index + '] ' + title + ' =====',
  runButton: '▶ 执行流水线',
  runPrompt: '点击「执行流水线」查看结果…',
  success: '✅ 执行完成！\\n\\n最终结果：\\n',
  failure: '❌ 执行出错：\\n',
}

/** Python labels matching upstream text. */
export const UPSTREAM_PY: PurCodegenPythonLabels = {
  topology: (names) => '拓扑顺序: ' + names.join(' → '),
  nodeHeading: (index, title) => '====== [节点 ' + index + '] ' + title + ' ======',
  nodeSection: (index, title) => '[' + index + '] ' + title,
  pipelineHeading: '============ 执行流水线 ============',
}
