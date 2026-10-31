/**
 * Golden controller traces captured by driving the upstream Pur Studio view's
 * real methods (onMouseDown/Move/Up, onWheel, onKeyDown, commands and
 * showContextMenu) over the scenarios in {@link CONTROLLER_SCENARIOS}. Ids are
 * deterministic (id0001...) and Date.now() is pinned at 1000.
 * @module dsh-obsidian-vault/tests/helpers/pur-controller-golden
 */
import type { PurElement } from '../../src/pur-kernel/types.ts'

/** One scripted interaction step. */
export interface ControllerOp {
  op: string
  args?: unknown[]
  event?: { clientX?: number; clientY?: number; button?: number; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; deltaY?: number; key?: string }
  skipCompare?: boolean
}

/** State recorded after a step. */
export interface ControllerSnapshot {
  calls: string[]
  elements: PurElement[]
  selected: string[]
  view: { offsetX: number; offsetY: number; scale: number }
  historyIndex: number
  historyLength: number
  clipboard: PurElement[]
  zoomUntil: number | null
  handled?: boolean
}

/** A scenario: initial setup plus per-step snapshots from the upstream run. */
export interface ControllerScenario {
  name: string
  setup: { elements: PurElement[]; selected?: string[]; view?: { offsetX: number; offsetY: number; scale: number } }
  steps: { op: ControllerOp; snapshot: ControllerSnapshot }[]
}

/** One upstream context-menu tree, serialized as {t: title, i: icon, s: separatorAfter, c: children}. */
export interface MenuNode { t?: string; i: string; s: boolean; c: MenuNode[] | null }

/** A menu scenario with the tree the upstream showContextMenu built. */
export interface MenuScenario {
  name: string
  setup: { elements: PurElement[]; selected?: string[]; activeFileIsMarkdown?: boolean; isPopout?: boolean; isPinned?: boolean }
  event: { clientX: number; clientY: number }
  context: { activeFileIsMarkdown: boolean; isPopout: boolean; isPinned: boolean; supportsPopout: boolean; supportsPinTop: boolean; supportsReveal: boolean }
  menu: MenuNode[] | null
  calls: string[]
  selected: string[]
}

/** Command and pointer scenarios with upstream snapshots. */
export const CONTROLLER_SCENARIOS: ControllerScenario[] = [
  {
    "name": "align",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 0,
          "y": 0,
          "w": 100,
          "h": 50,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "t2",
          "type": "text",
          "x": 200,
          "y": 100,
          "w": 150,
          "h": 80,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "t3",
          "type": "text",
          "x": 400,
          "y": 300,
          "w": 120,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ],
      "selected": [
        "t1",
        "t2",
        "t3"
      ]
    },
    "steps": [
      {
        "op": {
          "op": "alignElements",
          "args": [
            "left"
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 100,
              "h": 50,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 0,
              "y": 100,
              "w": 150,
              "h": 80,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t3",
              "type": "text",
              "x": 0,
              "y": 300,
              "w": 120,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1",
            "t2",
            "t3"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "alignElements",
          "args": [
            "center"
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 100,
              "h": 50,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": -25,
              "y": -15,
              "w": 150,
              "h": 80,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t3",
              "type": "text",
              "x": -10,
              "y": -5,
              "w": 120,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1",
            "t2",
            "t3"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 1,
          "historyLength": 2,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "alignElements",
          "args": [
            "distribute-h"
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 285,
              "y": 0,
              "w": 100,
              "h": 50,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": -25,
              "y": -15,
              "w": 150,
              "h": 80,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t3",
              "type": "text",
              "x": 145,
              "y": -5,
              "w": 120,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1",
            "t2",
            "t3"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 2,
          "historyLength": 3,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "alignElements",
          "args": [
            "top"
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 285,
              "y": 0,
              "w": 100,
              "h": 50,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": -25,
              "y": 0,
              "w": 150,
              "h": 80,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t3",
              "type": "text",
              "x": 145,
              "y": 0,
              "w": 120,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1",
            "t2",
            "t3"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 3,
          "historyLength": 4,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "scale",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 0,
          "y": 0,
          "w": 100,
          "h": 50,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "t2",
          "type": "text",
          "x": 200,
          "y": 100,
          "w": 150,
          "h": 80,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "t3",
          "type": "text",
          "x": 400,
          "y": 300,
          "w": 120,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ],
      "selected": [
        "t1",
        "t2",
        "t3"
      ]
    },
    "steps": [
      {
        "op": {
          "op": "scaleElements",
          "args": [
            "width"
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 100,
              "h": 50,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 200,
              "y": 100,
              "w": 100,
              "h": 53.33333333333333,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t3",
              "type": "text",
              "x": 400,
              "y": 300,
              "w": 100,
              "h": 50,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1",
            "t2",
            "t3"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "scaleElements",
          "args": [
            "height"
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 100,
              "h": 50,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 200,
              "y": 100,
              "w": 93.75000000000001,
              "h": 50,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t3",
              "type": "text",
              "x": 400,
              "y": 300,
              "w": 100,
              "h": 50,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1",
            "t2",
            "t3"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 1,
          "historyLength": 2,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "arrange-selected",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 0,
          "y": 0,
          "w": 100,
          "h": 50,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "t2",
          "type": "text",
          "x": 200,
          "y": 100,
          "w": 150,
          "h": 80,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "t3",
          "type": "text",
          "x": 400,
          "y": 300,
          "w": 120,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ],
      "selected": [
        "t1",
        "t2",
        "t3"
      ]
    },
    "steps": [
      {
        "op": {
          "op": "arrangeElements"
        },
        "snapshot": {
          "calls": [
            "save",
            "render",
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 100,
              "h": 50,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 150,
              "h": 80,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t3",
              "type": "text",
              "x": 165,
              "y": 0,
              "w": 120,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1",
            "t2",
            "t3"
          ],
          "view": {
            "offsetX": 66.66666666666663,
            "offsetY": 233.33333333333331,
            "scale": 1.6666666666666667
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "arrange-all",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 0,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "t2",
          "type": "text",
          "x": 500,
          "y": 300,
          "w": 220,
          "h": 90,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "l1",
          "type": "line",
          "from": "t1",
          "to": "t2",
          "content": ""
        },
        {
          "id": "g",
          "type": "group",
          "x": 700,
          "y": 500,
          "w": 300,
          "h": 200,
          "children": [],
          "rotation": 0,
          "opacity": 1
        }
      ]
    },
    "steps": [
      {
        "op": {
          "op": "arrangeElements"
        },
        "snapshot": {
          "calls": [
            "save",
            "render",
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 235,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 220,
              "h": 90,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "l1",
              "type": "line",
              "from": "t1",
              "to": "t2",
              "content": ""
            },
            {
              "id": "g",
              "type": "group",
              "x": 700,
              "y": 500,
              "w": 300,
              "h": 200,
              "children": [],
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 29.629629629629676,
            "offsetY": 40.74074074074076,
            "scale": 0.7407407407407407
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "connect",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 0,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "t2",
          "type": "text",
          "x": 300,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ],
      "selected": [
        "t1",
        "t2"
      ]
    },
    "steps": [
      {
        "op": {
          "op": "connectSelected"
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0001",
              "type": "line",
              "from": "t1",
              "to": "t2",
              "color": "rgba(150, 150, 150, 0.7)",
              "width": 2
            }
          ],
          "selected": [
            "t1",
            "t2"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "connect-needs-two",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 0,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ],
      "selected": [
        "t1"
      ]
    },
    "steps": [
      {
        "op": {
          "op": "connectSelected"
        },
        "snapshot": {
          "calls": [
            "notice:请选择两个元素进行连线"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "connect-duplicate",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 0,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "t2",
          "type": "text",
          "x": 300,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "l1",
          "type": "line",
          "from": "t1",
          "to": "t2",
          "content": ""
        }
      ],
      "selected": [
        "t1",
        "t2"
      ]
    },
    "steps": [
      {
        "op": {
          "op": "connectSelected"
        },
        "snapshot": {
          "calls": [],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "l1",
              "type": "line",
              "from": "t1",
              "to": "t2",
              "content": ""
            }
          ],
          "selected": [
            "t1",
            "t2"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "delete-nested",
    "setup": {
      "elements": [
        {
          "id": "g",
          "type": "group",
          "x": 0,
          "y": 0,
          "w": 300,
          "h": 300,
          "children": [
            {
              "id": "c1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "t2",
          "type": "text",
          "x": 400,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "l1",
          "type": "line",
          "from": "c1",
          "to": "t2",
          "content": ""
        },
        {
          "id": "t3",
          "type": "text",
          "x": 600,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ],
      "selected": [
        "g"
      ]
    },
    "steps": [
      {
        "op": {
          "op": "deleteSelected"
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "t2",
              "type": "text",
              "x": 400,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "l1",
              "type": "line",
              "from": "c1",
              "to": "t2",
              "content": ""
            },
            {
              "id": "t3",
              "type": "text",
              "x": 600,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "copy-paste",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 0,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "t2",
          "type": "text",
          "x": 300,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ],
      "selected": [
        "t1",
        "t2"
      ]
    },
    "steps": [
      {
        "op": {
          "op": "copySelected"
        },
        "snapshot": {
          "calls": [
            "notice:已复制 2 个元素"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1",
            "t2"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [
            {
              "id": "t1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "pasteClipboard",
          "args": []
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0001",
              "type": "text",
              "x": 50,
              "y": 50,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 350,
              "y": 50,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "id0001",
            "id0002"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [
            {
              "id": "t1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "pasteClipboard",
          "args": [
            500,
            500
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0001",
              "type": "text",
              "x": 50,
              "y": 50,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 350,
              "y": 50,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 500,
              "y": 500,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 500,
              "y": 500,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "id0003",
            "id0004"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 1,
          "historyLength": 2,
          "clipboard": [
            {
              "id": "t1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "duplicate",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 0,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ],
      "selected": [
        "t1"
      ]
    },
    "steps": [
      {
        "op": {
          "op": "duplicateSelected"
        },
        "snapshot": {
          "calls": [
            "save",
            "render",
            "notice:已复制 1 个元素"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0001",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "id0001"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "group-ungroup",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 0,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "t2",
          "type": "text",
          "x": 300,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "t3",
          "type": "text",
          "x": 600,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ],
      "selected": [
        "t1",
        "t2"
      ]
    },
    "steps": [
      {
        "op": {
          "op": "groupSelected"
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "t3",
              "type": "text",
              "x": 600,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0001",
              "type": "group",
              "x": -10,
              "y": -10,
              "w": 520,
              "h": 80,
              "children": [
                {
                  "id": "t1",
                  "type": "text",
                  "x": 10,
                  "y": 10,
                  "w": 200,
                  "h": 60,
                  "content": "hello",
                  "bgColor": "rgba(30,30,30,0.8)",
                  "color": "#e0e0e0",
                  "fontSize": 14,
                  "rotation": 0,
                  "opacity": 1
                },
                {
                  "id": "t2",
                  "type": "text",
                  "x": 310,
                  "y": 10,
                  "w": 200,
                  "h": 60,
                  "content": "hello",
                  "bgColor": "rgba(30,30,30,0.8)",
                  "color": "#e0e0e0",
                  "fontSize": 14,
                  "rotation": 0,
                  "opacity": 1
                }
              ],
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "id0001"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "ungroupSelected"
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "t3",
              "type": "text",
              "x": 600,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 1,
          "historyLength": 2,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "group-notice",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 0,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "l1",
          "type": "line",
          "from": "t1",
          "to": "t1",
          "content": ""
        }
      ],
      "selected": [
        "t1",
        "l1"
      ]
    },
    "steps": [
      {
        "op": {
          "op": "groupSelected"
        },
        "snapshot": {
          "calls": [
            "notice:select2group"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "l1",
              "type": "line",
              "from": "t1",
              "to": "t1",
              "content": ""
            }
          ],
          "selected": [
            "l1",
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "group-single",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 0,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ],
      "selected": [
        "t1"
      ]
    },
    "steps": [
      {
        "op": {
          "op": "groupSelected"
        },
        "snapshot": {
          "calls": [],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "z-order",
    "setup": {
      "elements": [
        {
          "id": "e1",
          "type": "text",
          "x": 0,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "e2",
          "type": "text",
          "x": 50,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "e3",
          "type": "text",
          "x": 100,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ]
    },
    "steps": [
      {
        "op": {
          "op": "select",
          "args": [
            [
              "e1"
            ]
          ]
        },
        "snapshot": {
          "calls": [],
          "elements": [
            {
              "id": "e1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "e2",
              "type": "text",
              "x": 50,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "e3",
              "type": "text",
              "x": 100,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "e1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "bringToFront"
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "e2",
              "type": "text",
              "x": 50,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "e3",
              "type": "text",
              "x": 100,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "e1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "e1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "select",
          "args": [
            [
              "e3"
            ]
          ]
        },
        "snapshot": {
          "calls": [],
          "elements": [
            {
              "id": "e2",
              "type": "text",
              "x": 50,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "e3",
              "type": "text",
              "x": 100,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "e1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "e3"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "sendToBack"
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "e3",
              "type": "text",
              "x": 100,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "e2",
              "type": "text",
              "x": 50,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "e1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "e3"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 1,
          "historyLength": 2,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "select",
          "args": [
            [
              "e2"
            ]
          ]
        },
        "snapshot": {
          "calls": [],
          "elements": [
            {
              "id": "e3",
              "type": "text",
              "x": 100,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "e2",
              "type": "text",
              "x": 50,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "e1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "e2"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 1,
          "historyLength": 2,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "bringForward"
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "e3",
              "type": "text",
              "x": 100,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "e1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "e2",
              "type": "text",
              "x": 50,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "e2"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 2,
          "historyLength": 3,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "sendBackward"
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "e3",
              "type": "text",
              "x": 100,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "e2",
              "type": "text",
              "x": 50,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "e1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "e2"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 3,
          "historyLength": 4,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "reset-transform",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 0,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 45,
          "opacity": 1,
          "flipH": true
        }
      ],
      "selected": [
        "t1"
      ]
    },
    "steps": [
      {
        "op": {
          "op": "resetTransform"
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1,
              "flipH": false,
              "flipV": false
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "lock",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 0,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ],
      "selected": [
        "t1"
      ]
    },
    "steps": [
      {
        "op": {
          "op": "toggleLock"
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1,
              "locked": true,
              "_lockTime": 1000
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "toggleLock"
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1,
              "locked": false,
              "_lockTime": 1000
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 1,
          "historyLength": 2,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "fit-selected",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 100,
          "y": 100,
          "w": 200,
          "h": 100,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "t2",
          "type": "text",
          "x": 900,
          "y": 700,
          "w": 200,
          "h": 100,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ],
      "selected": [
        "t1"
      ]
    },
    "steps": [
      {
        "op": {
          "op": "fitToView"
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 100,
              "y": 100,
              "w": 200,
              "h": 100,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 900,
              "y": 700,
              "w": 200,
              "h": 100,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": -171.42857142857144,
            "offsetY": -128.57142857142856,
            "scale": 2.857142857142857
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "fit-all",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 100,
          "y": 100,
          "w": 200,
          "h": 100,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "t2",
          "type": "text",
          "x": 900,
          "y": 700,
          "w": 200,
          "h": 100,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ]
    },
    "steps": [
      {
        "op": {
          "op": "fitToView"
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 100,
              "y": 100,
              "w": 200,
              "h": 100,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 900,
              "y": 700,
              "w": 200,
              "h": 100,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": -44.4444444444444,
            "offsetY": -33.333333333333314,
            "scale": 0.7407407407407407
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "add-text",
    "setup": {
      "elements": []
    },
    "steps": [
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            100,
            200
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 100,
              "y": 200,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "add-code",
    "setup": {
      "elements": []
    },
    "steps": [
      {
        "op": {
          "op": "addCodeNode",
          "args": [
            50,
            60,
            {
              "inputs": [
                "a",
                "b"
              ],
              "outputs": [
                "sum"
              ],
              "code": "CODE"
            }
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0004",
              "type": "code-node",
              "title": "节点",
              "x": 50,
              "y": 60,
              "w": 260,
              "h": 116,
              "inputs": [
                {
                  "id": "id0001",
                  "label": "a"
                },
                {
                  "id": "id0002",
                  "label": "b"
                }
              ],
              "outputs": [
                {
                  "id": "id0003",
                  "label": "sum"
                }
              ],
              "code": "CODE",
              "content": "CODE",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "history-cap-branch",
    "setup": {
      "elements": []
    },
    "steps": [
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            0,
            0
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            1,
            1
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 1,
          "historyLength": 2,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            2,
            2
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 2,
          "historyLength": 3,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            3,
            3
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 3,
          "historyLength": 4,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            4,
            4
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 4,
          "historyLength": 5,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            5,
            5
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 5,
          "historyLength": 6,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            6,
            6
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 6,
          "historyLength": 7,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            7,
            7
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 7,
          "historyLength": 8,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            8,
            8
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 8,
          "historyLength": 9,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            9,
            9
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 9,
          "historyLength": 10,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            10,
            10
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 10,
          "historyLength": 11,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            11,
            11
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 11,
          "historyLength": 12,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            12,
            12
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 12,
          "historyLength": 13,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            13,
            13
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 13,
          "historyLength": 14,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            14,
            14
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 14,
          "historyLength": 15,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            15,
            15
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 15,
          "historyLength": 16,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            16,
            16
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 16,
          "historyLength": 17,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            17,
            17
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 17,
          "historyLength": 18,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            18,
            18
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 18,
          "historyLength": 19,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            19,
            19
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 19,
          "historyLength": 20,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            20,
            20
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 20,
          "historyLength": 21,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            21,
            21
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 21,
          "historyLength": 22,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            22,
            22
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 22,
          "historyLength": 23,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            23,
            23
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 23,
          "historyLength": 24,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            24,
            24
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 24,
          "historyLength": 25,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            25,
            25
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 25,
          "historyLength": 26,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            26,
            26
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 26,
          "historyLength": 27,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            27,
            27
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 27,
          "historyLength": 28,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            28,
            28
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 28,
          "historyLength": 29,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            29,
            29
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 29,
          "historyLength": 30,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            30,
            30
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 30,
          "historyLength": 31,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            31,
            31
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 31,
          "historyLength": 32,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            32,
            32
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 32,
          "historyLength": 33,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            33,
            33
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 33,
          "historyLength": 34,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            34,
            34
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0035",
              "type": "text",
              "x": 34,
              "y": 34,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 34,
          "historyLength": 35,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            35,
            35
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0035",
              "type": "text",
              "x": 34,
              "y": 34,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0036",
              "type": "text",
              "x": 35,
              "y": 35,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 35,
          "historyLength": 36,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            36,
            36
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0035",
              "type": "text",
              "x": 34,
              "y": 34,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0036",
              "type": "text",
              "x": 35,
              "y": 35,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0037",
              "type": "text",
              "x": 36,
              "y": 36,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 36,
          "historyLength": 37,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            37,
            37
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0035",
              "type": "text",
              "x": 34,
              "y": 34,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0036",
              "type": "text",
              "x": 35,
              "y": 35,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0037",
              "type": "text",
              "x": 36,
              "y": 36,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0038",
              "type": "text",
              "x": 37,
              "y": 37,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 37,
          "historyLength": 38,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            38,
            38
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0035",
              "type": "text",
              "x": 34,
              "y": 34,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0036",
              "type": "text",
              "x": 35,
              "y": 35,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0037",
              "type": "text",
              "x": 36,
              "y": 36,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0038",
              "type": "text",
              "x": 37,
              "y": 37,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0039",
              "type": "text",
              "x": 38,
              "y": 38,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 38,
          "historyLength": 39,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            39,
            39
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0035",
              "type": "text",
              "x": 34,
              "y": 34,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0036",
              "type": "text",
              "x": 35,
              "y": 35,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0037",
              "type": "text",
              "x": 36,
              "y": 36,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0038",
              "type": "text",
              "x": 37,
              "y": 37,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0039",
              "type": "text",
              "x": 38,
              "y": 38,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0040",
              "type": "text",
              "x": 39,
              "y": 39,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 39,
          "historyLength": 40,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            40,
            40
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0035",
              "type": "text",
              "x": 34,
              "y": 34,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0036",
              "type": "text",
              "x": 35,
              "y": 35,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0037",
              "type": "text",
              "x": 36,
              "y": 36,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0038",
              "type": "text",
              "x": 37,
              "y": 37,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0039",
              "type": "text",
              "x": 38,
              "y": 38,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0040",
              "type": "text",
              "x": 39,
              "y": 39,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0041",
              "type": "text",
              "x": 40,
              "y": 40,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 40,
          "historyLength": 41,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            41,
            41
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0035",
              "type": "text",
              "x": 34,
              "y": 34,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0036",
              "type": "text",
              "x": 35,
              "y": 35,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0037",
              "type": "text",
              "x": 36,
              "y": 36,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0038",
              "type": "text",
              "x": 37,
              "y": 37,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0039",
              "type": "text",
              "x": 38,
              "y": 38,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0040",
              "type": "text",
              "x": 39,
              "y": 39,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0041",
              "type": "text",
              "x": 40,
              "y": 40,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0042",
              "type": "text",
              "x": 41,
              "y": 41,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 41,
          "historyLength": 42,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            42,
            42
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0035",
              "type": "text",
              "x": 34,
              "y": 34,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0036",
              "type": "text",
              "x": 35,
              "y": 35,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0037",
              "type": "text",
              "x": 36,
              "y": 36,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0038",
              "type": "text",
              "x": 37,
              "y": 37,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0039",
              "type": "text",
              "x": 38,
              "y": 38,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0040",
              "type": "text",
              "x": 39,
              "y": 39,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0041",
              "type": "text",
              "x": 40,
              "y": 40,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0042",
              "type": "text",
              "x": 41,
              "y": 41,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0043",
              "type": "text",
              "x": 42,
              "y": 42,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 42,
          "historyLength": 43,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            43,
            43
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0035",
              "type": "text",
              "x": 34,
              "y": 34,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0036",
              "type": "text",
              "x": 35,
              "y": 35,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0037",
              "type": "text",
              "x": 36,
              "y": 36,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0038",
              "type": "text",
              "x": 37,
              "y": 37,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0039",
              "type": "text",
              "x": 38,
              "y": 38,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0040",
              "type": "text",
              "x": 39,
              "y": 39,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0041",
              "type": "text",
              "x": 40,
              "y": 40,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0042",
              "type": "text",
              "x": 41,
              "y": 41,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0043",
              "type": "text",
              "x": 42,
              "y": 42,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0044",
              "type": "text",
              "x": 43,
              "y": 43,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 43,
          "historyLength": 44,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            44,
            44
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0035",
              "type": "text",
              "x": 34,
              "y": 34,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0036",
              "type": "text",
              "x": 35,
              "y": 35,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0037",
              "type": "text",
              "x": 36,
              "y": 36,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0038",
              "type": "text",
              "x": 37,
              "y": 37,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0039",
              "type": "text",
              "x": 38,
              "y": 38,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0040",
              "type": "text",
              "x": 39,
              "y": 39,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0041",
              "type": "text",
              "x": 40,
              "y": 40,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0042",
              "type": "text",
              "x": 41,
              "y": 41,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0043",
              "type": "text",
              "x": 42,
              "y": 42,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0044",
              "type": "text",
              "x": 43,
              "y": 43,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0045",
              "type": "text",
              "x": 44,
              "y": 44,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 44,
          "historyLength": 45,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            45,
            45
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0035",
              "type": "text",
              "x": 34,
              "y": 34,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0036",
              "type": "text",
              "x": 35,
              "y": 35,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0037",
              "type": "text",
              "x": 36,
              "y": 36,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0038",
              "type": "text",
              "x": 37,
              "y": 37,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0039",
              "type": "text",
              "x": 38,
              "y": 38,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0040",
              "type": "text",
              "x": 39,
              "y": 39,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0041",
              "type": "text",
              "x": 40,
              "y": 40,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0042",
              "type": "text",
              "x": 41,
              "y": 41,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0043",
              "type": "text",
              "x": 42,
              "y": 42,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0044",
              "type": "text",
              "x": 43,
              "y": 43,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0045",
              "type": "text",
              "x": 44,
              "y": 44,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0046",
              "type": "text",
              "x": 45,
              "y": 45,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 45,
          "historyLength": 46,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            46,
            46
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0035",
              "type": "text",
              "x": 34,
              "y": 34,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0036",
              "type": "text",
              "x": 35,
              "y": 35,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0037",
              "type": "text",
              "x": 36,
              "y": 36,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0038",
              "type": "text",
              "x": 37,
              "y": 37,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0039",
              "type": "text",
              "x": 38,
              "y": 38,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0040",
              "type": "text",
              "x": 39,
              "y": 39,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0041",
              "type": "text",
              "x": 40,
              "y": 40,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0042",
              "type": "text",
              "x": 41,
              "y": 41,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0043",
              "type": "text",
              "x": 42,
              "y": 42,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0044",
              "type": "text",
              "x": 43,
              "y": 43,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0045",
              "type": "text",
              "x": 44,
              "y": 44,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0046",
              "type": "text",
              "x": 45,
              "y": 45,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0047",
              "type": "text",
              "x": 46,
              "y": 46,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 46,
          "historyLength": 47,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            47,
            47
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0035",
              "type": "text",
              "x": 34,
              "y": 34,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0036",
              "type": "text",
              "x": 35,
              "y": 35,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0037",
              "type": "text",
              "x": 36,
              "y": 36,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0038",
              "type": "text",
              "x": 37,
              "y": 37,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0039",
              "type": "text",
              "x": 38,
              "y": 38,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0040",
              "type": "text",
              "x": 39,
              "y": 39,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0041",
              "type": "text",
              "x": 40,
              "y": 40,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0042",
              "type": "text",
              "x": 41,
              "y": 41,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0043",
              "type": "text",
              "x": 42,
              "y": 42,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0044",
              "type": "text",
              "x": 43,
              "y": 43,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0045",
              "type": "text",
              "x": 44,
              "y": 44,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0046",
              "type": "text",
              "x": 45,
              "y": 45,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0047",
              "type": "text",
              "x": 46,
              "y": 46,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0048",
              "type": "text",
              "x": 47,
              "y": 47,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 47,
          "historyLength": 48,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            48,
            48
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0035",
              "type": "text",
              "x": 34,
              "y": 34,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0036",
              "type": "text",
              "x": 35,
              "y": 35,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0037",
              "type": "text",
              "x": 36,
              "y": 36,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0038",
              "type": "text",
              "x": 37,
              "y": 37,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0039",
              "type": "text",
              "x": 38,
              "y": 38,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0040",
              "type": "text",
              "x": 39,
              "y": 39,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0041",
              "type": "text",
              "x": 40,
              "y": 40,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0042",
              "type": "text",
              "x": 41,
              "y": 41,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0043",
              "type": "text",
              "x": 42,
              "y": 42,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0044",
              "type": "text",
              "x": 43,
              "y": 43,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0045",
              "type": "text",
              "x": 44,
              "y": 44,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0046",
              "type": "text",
              "x": 45,
              "y": 45,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0047",
              "type": "text",
              "x": 46,
              "y": 46,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0048",
              "type": "text",
              "x": 47,
              "y": 47,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0049",
              "type": "text",
              "x": 48,
              "y": 48,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 48,
          "historyLength": 49,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            49,
            49
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0035",
              "type": "text",
              "x": 34,
              "y": 34,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0036",
              "type": "text",
              "x": 35,
              "y": 35,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0037",
              "type": "text",
              "x": 36,
              "y": 36,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0038",
              "type": "text",
              "x": 37,
              "y": 37,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0039",
              "type": "text",
              "x": 38,
              "y": 38,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0040",
              "type": "text",
              "x": 39,
              "y": 39,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0041",
              "type": "text",
              "x": 40,
              "y": 40,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0042",
              "type": "text",
              "x": 41,
              "y": 41,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0043",
              "type": "text",
              "x": 42,
              "y": 42,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0044",
              "type": "text",
              "x": 43,
              "y": 43,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0045",
              "type": "text",
              "x": 44,
              "y": 44,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0046",
              "type": "text",
              "x": 45,
              "y": 45,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0047",
              "type": "text",
              "x": 46,
              "y": 46,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0048",
              "type": "text",
              "x": 47,
              "y": 47,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0049",
              "type": "text",
              "x": 48,
              "y": 48,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0050",
              "type": "text",
              "x": 49,
              "y": 49,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 49,
          "historyLength": 50,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            50,
            50
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0035",
              "type": "text",
              "x": 34,
              "y": 34,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0036",
              "type": "text",
              "x": 35,
              "y": 35,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0037",
              "type": "text",
              "x": 36,
              "y": 36,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0038",
              "type": "text",
              "x": 37,
              "y": 37,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0039",
              "type": "text",
              "x": 38,
              "y": 38,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0040",
              "type": "text",
              "x": 39,
              "y": 39,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0041",
              "type": "text",
              "x": 40,
              "y": 40,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0042",
              "type": "text",
              "x": 41,
              "y": 41,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0043",
              "type": "text",
              "x": 42,
              "y": 42,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0044",
              "type": "text",
              "x": 43,
              "y": 43,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0045",
              "type": "text",
              "x": 44,
              "y": 44,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0046",
              "type": "text",
              "x": 45,
              "y": 45,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0047",
              "type": "text",
              "x": 46,
              "y": 46,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0048",
              "type": "text",
              "x": 47,
              "y": 47,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0049",
              "type": "text",
              "x": 48,
              "y": 48,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0050",
              "type": "text",
              "x": 49,
              "y": 49,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0051",
              "type": "text",
              "x": 50,
              "y": 50,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 49,
          "historyLength": 50,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            51,
            51
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0035",
              "type": "text",
              "x": 34,
              "y": 34,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0036",
              "type": "text",
              "x": 35,
              "y": 35,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0037",
              "type": "text",
              "x": 36,
              "y": 36,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0038",
              "type": "text",
              "x": 37,
              "y": 37,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0039",
              "type": "text",
              "x": 38,
              "y": 38,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0040",
              "type": "text",
              "x": 39,
              "y": 39,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0041",
              "type": "text",
              "x": 40,
              "y": 40,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0042",
              "type": "text",
              "x": 41,
              "y": 41,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0043",
              "type": "text",
              "x": 42,
              "y": 42,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0044",
              "type": "text",
              "x": 43,
              "y": 43,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0045",
              "type": "text",
              "x": 44,
              "y": 44,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0046",
              "type": "text",
              "x": 45,
              "y": 45,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0047",
              "type": "text",
              "x": 46,
              "y": 46,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0048",
              "type": "text",
              "x": 47,
              "y": 47,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0049",
              "type": "text",
              "x": 48,
              "y": 48,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0050",
              "type": "text",
              "x": 49,
              "y": 49,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0051",
              "type": "text",
              "x": 50,
              "y": 50,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0052",
              "type": "text",
              "x": 51,
              "y": 51,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 49,
          "historyLength": 50,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            52,
            52
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0035",
              "type": "text",
              "x": 34,
              "y": 34,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0036",
              "type": "text",
              "x": 35,
              "y": 35,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0037",
              "type": "text",
              "x": 36,
              "y": 36,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0038",
              "type": "text",
              "x": 37,
              "y": 37,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0039",
              "type": "text",
              "x": 38,
              "y": 38,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0040",
              "type": "text",
              "x": 39,
              "y": 39,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0041",
              "type": "text",
              "x": 40,
              "y": 40,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0042",
              "type": "text",
              "x": 41,
              "y": 41,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0043",
              "type": "text",
              "x": 42,
              "y": 42,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0044",
              "type": "text",
              "x": 43,
              "y": 43,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0045",
              "type": "text",
              "x": 44,
              "y": 44,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0046",
              "type": "text",
              "x": 45,
              "y": 45,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0047",
              "type": "text",
              "x": 46,
              "y": 46,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0048",
              "type": "text",
              "x": 47,
              "y": 47,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0049",
              "type": "text",
              "x": 48,
              "y": 48,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0050",
              "type": "text",
              "x": 49,
              "y": 49,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0051",
              "type": "text",
              "x": 50,
              "y": 50,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0052",
              "type": "text",
              "x": 51,
              "y": 51,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0053",
              "type": "text",
              "x": 52,
              "y": 52,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 49,
          "historyLength": 50,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            53,
            53
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0035",
              "type": "text",
              "x": 34,
              "y": 34,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0036",
              "type": "text",
              "x": 35,
              "y": 35,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0037",
              "type": "text",
              "x": 36,
              "y": 36,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0038",
              "type": "text",
              "x": 37,
              "y": 37,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0039",
              "type": "text",
              "x": 38,
              "y": 38,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0040",
              "type": "text",
              "x": 39,
              "y": 39,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0041",
              "type": "text",
              "x": 40,
              "y": 40,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0042",
              "type": "text",
              "x": 41,
              "y": 41,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0043",
              "type": "text",
              "x": 42,
              "y": 42,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0044",
              "type": "text",
              "x": 43,
              "y": 43,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0045",
              "type": "text",
              "x": 44,
              "y": 44,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0046",
              "type": "text",
              "x": 45,
              "y": 45,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0047",
              "type": "text",
              "x": 46,
              "y": 46,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0048",
              "type": "text",
              "x": 47,
              "y": 47,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0049",
              "type": "text",
              "x": 48,
              "y": 48,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0050",
              "type": "text",
              "x": 49,
              "y": 49,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0051",
              "type": "text",
              "x": 50,
              "y": 50,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0052",
              "type": "text",
              "x": 51,
              "y": 51,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0053",
              "type": "text",
              "x": 52,
              "y": 52,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0054",
              "type": "text",
              "x": 53,
              "y": 53,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 49,
          "historyLength": 50,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            54,
            54
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0035",
              "type": "text",
              "x": 34,
              "y": 34,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0036",
              "type": "text",
              "x": 35,
              "y": 35,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0037",
              "type": "text",
              "x": 36,
              "y": 36,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0038",
              "type": "text",
              "x": 37,
              "y": 37,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0039",
              "type": "text",
              "x": 38,
              "y": 38,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0040",
              "type": "text",
              "x": 39,
              "y": 39,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0041",
              "type": "text",
              "x": 40,
              "y": 40,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0042",
              "type": "text",
              "x": 41,
              "y": 41,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0043",
              "type": "text",
              "x": 42,
              "y": 42,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0044",
              "type": "text",
              "x": 43,
              "y": 43,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0045",
              "type": "text",
              "x": 44,
              "y": 44,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0046",
              "type": "text",
              "x": 45,
              "y": 45,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0047",
              "type": "text",
              "x": 46,
              "y": 46,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0048",
              "type": "text",
              "x": 47,
              "y": 47,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0049",
              "type": "text",
              "x": 48,
              "y": 48,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0050",
              "type": "text",
              "x": 49,
              "y": 49,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0051",
              "type": "text",
              "x": 50,
              "y": 50,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0052",
              "type": "text",
              "x": 51,
              "y": 51,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0053",
              "type": "text",
              "x": 52,
              "y": 52,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0054",
              "type": "text",
              "x": 53,
              "y": 53,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0055",
              "type": "text",
              "x": 54,
              "y": 54,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 49,
          "historyLength": 50,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "key",
          "event": {
            "key": "z",
            "ctrlKey": true
          }
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0035",
              "type": "text",
              "x": 34,
              "y": 34,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0036",
              "type": "text",
              "x": 35,
              "y": 35,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0037",
              "type": "text",
              "x": 36,
              "y": 36,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0038",
              "type": "text",
              "x": 37,
              "y": 37,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0039",
              "type": "text",
              "x": 38,
              "y": 38,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0040",
              "type": "text",
              "x": 39,
              "y": 39,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0041",
              "type": "text",
              "x": 40,
              "y": 40,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0042",
              "type": "text",
              "x": 41,
              "y": 41,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0043",
              "type": "text",
              "x": 42,
              "y": 42,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0044",
              "type": "text",
              "x": 43,
              "y": 43,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0045",
              "type": "text",
              "x": 44,
              "y": 44,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0046",
              "type": "text",
              "x": 45,
              "y": 45,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0047",
              "type": "text",
              "x": 46,
              "y": 46,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0048",
              "type": "text",
              "x": 47,
              "y": 47,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0049",
              "type": "text",
              "x": 48,
              "y": 48,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0050",
              "type": "text",
              "x": 49,
              "y": 49,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0051",
              "type": "text",
              "x": 50,
              "y": 50,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0052",
              "type": "text",
              "x": 51,
              "y": 51,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0053",
              "type": "text",
              "x": 52,
              "y": 52,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0054",
              "type": "text",
              "x": 53,
              "y": 53,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 48,
          "historyLength": 50,
          "clipboard": [],
          "zoomUntil": null,
          "handled": true
        }
      },
      {
        "op": {
          "op": "key",
          "event": {
            "key": "z",
            "ctrlKey": true
          }
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0035",
              "type": "text",
              "x": 34,
              "y": 34,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0036",
              "type": "text",
              "x": 35,
              "y": 35,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0037",
              "type": "text",
              "x": 36,
              "y": 36,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0038",
              "type": "text",
              "x": 37,
              "y": 37,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0039",
              "type": "text",
              "x": 38,
              "y": 38,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0040",
              "type": "text",
              "x": 39,
              "y": 39,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0041",
              "type": "text",
              "x": 40,
              "y": 40,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0042",
              "type": "text",
              "x": 41,
              "y": 41,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0043",
              "type": "text",
              "x": 42,
              "y": 42,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0044",
              "type": "text",
              "x": 43,
              "y": 43,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0045",
              "type": "text",
              "x": 44,
              "y": 44,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0046",
              "type": "text",
              "x": 45,
              "y": 45,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0047",
              "type": "text",
              "x": 46,
              "y": 46,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0048",
              "type": "text",
              "x": 47,
              "y": 47,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0049",
              "type": "text",
              "x": 48,
              "y": 48,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0050",
              "type": "text",
              "x": 49,
              "y": 49,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0051",
              "type": "text",
              "x": 50,
              "y": 50,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0052",
              "type": "text",
              "x": 51,
              "y": 51,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0053",
              "type": "text",
              "x": 52,
              "y": 52,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 47,
          "historyLength": 50,
          "clipboard": [],
          "zoomUntil": null,
          "handled": true
        }
      },
      {
        "op": {
          "op": "addTextBlock",
          "args": [
            999,
            999
          ]
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0035",
              "type": "text",
              "x": 34,
              "y": 34,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0036",
              "type": "text",
              "x": 35,
              "y": 35,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0037",
              "type": "text",
              "x": 36,
              "y": 36,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0038",
              "type": "text",
              "x": 37,
              "y": 37,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0039",
              "type": "text",
              "x": 38,
              "y": 38,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0040",
              "type": "text",
              "x": 39,
              "y": 39,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0041",
              "type": "text",
              "x": 40,
              "y": 40,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0042",
              "type": "text",
              "x": 41,
              "y": 41,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0043",
              "type": "text",
              "x": 42,
              "y": 42,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0044",
              "type": "text",
              "x": 43,
              "y": 43,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0045",
              "type": "text",
              "x": 44,
              "y": 44,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0046",
              "type": "text",
              "x": 45,
              "y": 45,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0047",
              "type": "text",
              "x": 46,
              "y": 46,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0048",
              "type": "text",
              "x": 47,
              "y": 47,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0049",
              "type": "text",
              "x": 48,
              "y": 48,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0050",
              "type": "text",
              "x": 49,
              "y": 49,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0051",
              "type": "text",
              "x": 50,
              "y": 50,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0052",
              "type": "text",
              "x": 51,
              "y": 51,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0053",
              "type": "text",
              "x": 52,
              "y": 52,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0056",
              "type": "text",
              "x": 999,
              "y": 999,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 48,
          "historyLength": 49,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "key",
          "event": {
            "key": "y",
            "ctrlKey": true
          }
        },
        "snapshot": {
          "calls": [],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0002",
              "type": "text",
              "x": 1,
              "y": 1,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0003",
              "type": "text",
              "x": 2,
              "y": 2,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0004",
              "type": "text",
              "x": 3,
              "y": 3,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0005",
              "type": "text",
              "x": 4,
              "y": 4,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0006",
              "type": "text",
              "x": 5,
              "y": 5,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0007",
              "type": "text",
              "x": 6,
              "y": 6,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0008",
              "type": "text",
              "x": 7,
              "y": 7,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0009",
              "type": "text",
              "x": 8,
              "y": 8,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0010",
              "type": "text",
              "x": 9,
              "y": 9,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0011",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0012",
              "type": "text",
              "x": 11,
              "y": 11,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0013",
              "type": "text",
              "x": 12,
              "y": 12,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0014",
              "type": "text",
              "x": 13,
              "y": 13,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0015",
              "type": "text",
              "x": 14,
              "y": 14,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0016",
              "type": "text",
              "x": 15,
              "y": 15,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0017",
              "type": "text",
              "x": 16,
              "y": 16,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0018",
              "type": "text",
              "x": 17,
              "y": 17,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0019",
              "type": "text",
              "x": 18,
              "y": 18,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0020",
              "type": "text",
              "x": 19,
              "y": 19,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0021",
              "type": "text",
              "x": 20,
              "y": 20,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0022",
              "type": "text",
              "x": 21,
              "y": 21,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0023",
              "type": "text",
              "x": 22,
              "y": 22,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0024",
              "type": "text",
              "x": 23,
              "y": 23,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0025",
              "type": "text",
              "x": 24,
              "y": 24,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0026",
              "type": "text",
              "x": 25,
              "y": 25,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0027",
              "type": "text",
              "x": 26,
              "y": 26,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0028",
              "type": "text",
              "x": 27,
              "y": 27,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0029",
              "type": "text",
              "x": 28,
              "y": 28,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0030",
              "type": "text",
              "x": 29,
              "y": 29,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0031",
              "type": "text",
              "x": 30,
              "y": 30,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0032",
              "type": "text",
              "x": 31,
              "y": 31,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0033",
              "type": "text",
              "x": 32,
              "y": 32,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0034",
              "type": "text",
              "x": 33,
              "y": 33,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0035",
              "type": "text",
              "x": 34,
              "y": 34,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0036",
              "type": "text",
              "x": 35,
              "y": 35,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0037",
              "type": "text",
              "x": 36,
              "y": 36,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0038",
              "type": "text",
              "x": 37,
              "y": 37,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0039",
              "type": "text",
              "x": 38,
              "y": 38,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0040",
              "type": "text",
              "x": 39,
              "y": 39,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0041",
              "type": "text",
              "x": 40,
              "y": 40,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0042",
              "type": "text",
              "x": 41,
              "y": 41,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0043",
              "type": "text",
              "x": 42,
              "y": 42,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0044",
              "type": "text",
              "x": 43,
              "y": 43,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0045",
              "type": "text",
              "x": 44,
              "y": 44,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0046",
              "type": "text",
              "x": 45,
              "y": 45,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0047",
              "type": "text",
              "x": 46,
              "y": 46,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0048",
              "type": "text",
              "x": 47,
              "y": 47,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0049",
              "type": "text",
              "x": 48,
              "y": 48,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0050",
              "type": "text",
              "x": 49,
              "y": 49,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0051",
              "type": "text",
              "x": 50,
              "y": 50,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0052",
              "type": "text",
              "x": 51,
              "y": 51,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0053",
              "type": "text",
              "x": 52,
              "y": 52,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0056",
              "type": "text",
              "x": 999,
              "y": 999,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 48,
          "historyLength": 49,
          "clipboard": [],
          "zoomUntil": null,
          "handled": false
        }
      }
    ]
  },
  {
    "name": "keys",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 0,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "t2",
          "type": "text",
          "x": 300,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ],
      "selected": [
        "t1"
      ]
    },
    "steps": [
      {
        "op": {
          "op": "key",
          "event": {
            "key": "Delete"
          }
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null,
          "handled": true
        }
      },
      {
        "op": {
          "op": "key",
          "event": {
            "key": "Delete"
          }
        },
        "snapshot": {
          "calls": [],
          "elements": [
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null,
          "handled": false
        }
      },
      {
        "op": {
          "op": "key",
          "event": {
            "key": "a",
            "ctrlKey": true
          }
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t2"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null,
          "handled": true
        }
      },
      {
        "op": {
          "op": "key",
          "event": {
            "key": "c",
            "ctrlKey": true
          }
        },
        "snapshot": {
          "calls": [
            "notice:已复制 1 个元素"
          ],
          "elements": [
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t2"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "zoomUntil": null,
          "handled": true
        }
      },
      {
        "op": {
          "op": "key",
          "event": {
            "key": "v",
            "ctrlKey": true
          }
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0001",
              "type": "text",
              "x": 350,
              "y": 50,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "id0001"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 1,
          "historyLength": 2,
          "clipboard": [
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "zoomUntil": null,
          "handled": true
        }
      },
      {
        "op": {
          "op": "key",
          "event": {
            "key": "g",
            "ctrlKey": true
          }
        },
        "snapshot": {
          "calls": [],
          "elements": [
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0001",
              "type": "text",
              "x": 350,
              "y": 50,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "id0001"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 1,
          "historyLength": 2,
          "clipboard": [
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "zoomUntil": null,
          "handled": true
        }
      },
      {
        "op": {
          "op": "key",
          "event": {
            "key": "s",
            "ctrlKey": true
          }
        },
        "snapshot": {
          "calls": [
            "save",
            "notice:saved"
          ],
          "elements": [
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0001",
              "type": "text",
              "x": 350,
              "y": 50,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "id0001"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 1,
          "historyLength": 2,
          "clipboard": [
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "zoomUntil": null,
          "handled": true
        }
      },
      {
        "op": {
          "op": "key",
          "event": {
            "key": "m",
            "ctrlKey": true
          }
        },
        "snapshot": {
          "calls": [
            "export-text"
          ],
          "elements": [
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0001",
              "type": "text",
              "x": 350,
              "y": 50,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "id0001"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 1,
          "historyLength": 2,
          "clipboard": [
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "zoomUntil": null,
          "handled": true
        }
      },
      {
        "op": {
          "op": "key",
          "event": {
            "key": "f"
          }
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0001",
              "type": "text",
              "x": 350,
              "y": 50,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "id0001"
          ],
          "view": {
            "offsetX": -885.7142857142858,
            "offsetY": 71.42857142857142,
            "scale": 2.857142857142857
          },
          "historyIndex": 1,
          "historyLength": 2,
          "clipboard": [
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "zoomUntil": null,
          "handled": true
        }
      },
      {
        "op": {
          "op": "key",
          "event": {
            "key": "q"
          }
        },
        "snapshot": {
          "calls": [],
          "elements": [
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0001",
              "type": "text",
              "x": 350,
              "y": 50,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "id0001"
          ],
          "view": {
            "offsetX": -885.7142857142858,
            "offsetY": 71.42857142857142,
            "scale": 2.857142857142857
          },
          "historyIndex": 1,
          "historyLength": 2,
          "clipboard": [
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "zoomUntil": null,
          "handled": false
        }
      }
    ]
  },
  {
    "name": "click-select",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 10,
          "y": 10,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ]
    },
    "steps": [
      {
        "op": {
          "op": "down",
          "event": {
            "clientX": 20,
            "clientY": 20
          }
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "up",
          "event": {
            "clientX": 20,
            "clientY": 20
          }
        },
        "snapshot": {
          "calls": [
            "save",
            "cursor:default",
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "down",
          "event": {
            "clientX": 500,
            "clientY": 500
          }
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "up",
          "event": {
            "clientX": 500,
            "clientY": 500
          }
        },
        "snapshot": {
          "calls": [
            "cursor:default",
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "ctrl-click",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 10,
          "y": 10,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "t2",
          "type": "text",
          "x": 300,
          "y": 10,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ]
    },
    "steps": [
      {
        "op": {
          "op": "down",
          "event": {
            "clientX": 20,
            "clientY": 20
          }
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "up",
          "event": {
            "clientX": 20,
            "clientY": 20
          }
        },
        "snapshot": {
          "calls": [
            "save",
            "cursor:default",
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "down",
          "event": {
            "clientX": 310,
            "clientY": 20,
            "ctrlKey": true
          }
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1",
            "t2"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "up",
          "event": {
            "clientX": 310,
            "clientY": 20,
            "ctrlKey": true
          }
        },
        "snapshot": {
          "calls": [
            "cursor:default",
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1",
            "t2"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "down",
          "event": {
            "clientX": 310,
            "clientY": 20,
            "ctrlKey": true
          }
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "up",
          "event": {
            "clientX": 310,
            "clientY": 20,
            "ctrlKey": true
          }
        },
        "snapshot": {
          "calls": [
            "cursor:default",
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "drag-move",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 10,
          "y": 10,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "t2",
          "type": "text",
          "x": 400,
          "y": 10,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ]
    },
    "steps": [
      {
        "op": {
          "op": "down",
          "event": {
            "clientX": 20,
            "clientY": 20
          }
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 400,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "move",
          "event": {
            "clientX": 70,
            "clientY": 50
          }
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 60,
              "y": 40,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 400,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "up",
          "event": {
            "clientX": 70,
            "clientY": 50
          }
        },
        "snapshot": {
          "calls": [
            "save",
            "cursor:default",
            "render"
          ],
          "elements": [
            {
              "id": "t2",
              "type": "text",
              "x": 400,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t1",
              "type": "text",
              "x": 60,
              "y": 40,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "drag-into-group",
    "setup": {
      "elements": [
        {
          "id": "g",
          "type": "group",
          "x": 0,
          "y": 0,
          "w": 300,
          "h": 300,
          "children": [],
          "rotation": 0,
          "opacity": 1,
          "content": "grp"
        },
        {
          "id": "t1",
          "type": "text",
          "x": 500,
          "y": 500,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ]
    },
    "steps": [
      {
        "op": {
          "op": "down",
          "event": {
            "clientX": 510,
            "clientY": 510
          }
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "g",
              "type": "group",
              "x": 0,
              "y": 0,
              "w": 300,
              "h": 300,
              "children": [],
              "rotation": 0,
              "opacity": 1,
              "content": "grp"
            },
            {
              "id": "t1",
              "type": "text",
              "x": 500,
              "y": 500,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "move",
          "event": {
            "clientX": 210,
            "clientY": 210
          }
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "g",
              "type": "group",
              "x": 0,
              "y": 0,
              "w": 300,
              "h": 300,
              "children": [],
              "rotation": 0,
              "opacity": 1,
              "content": "grp"
            },
            {
              "id": "t1",
              "type": "text",
              "x": 200,
              "y": 200,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "up",
          "event": {
            "clientX": 210,
            "clientY": 210
          }
        },
        "snapshot": {
          "calls": [
            "save",
            "cursor:default",
            "render"
          ],
          "elements": [
            {
              "id": "g",
              "type": "group",
              "x": 0,
              "y": 0,
              "w": 300,
              "h": 300,
              "children": [
                {
                  "id": "t1",
                  "type": "text",
                  "x": 200,
                  "y": 200,
                  "w": 200,
                  "h": 60,
                  "content": "hello",
                  "bgColor": "rgba(30,30,30,0.8)",
                  "color": "#e0e0e0",
                  "fontSize": 14,
                  "rotation": 0,
                  "opacity": 1
                }
              ],
              "rotation": 0,
              "opacity": 1,
              "content": "grp"
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "drag-out-of-group",
    "setup": {
      "elements": [
        {
          "id": "g",
          "type": "group",
          "x": 0,
          "y": 0,
          "w": 300,
          "h": 300,
          "children": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "rotation": 0,
          "opacity": 1,
          "content": "grp"
        }
      ]
    },
    "steps": [
      {
        "op": {
          "op": "down",
          "event": {
            "clientX": 20,
            "clientY": 20
          }
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "g",
              "type": "group",
              "x": 0,
              "y": 0,
              "w": 300,
              "h": 300,
              "children": [
                {
                  "id": "t1",
                  "type": "text",
                  "x": 10,
                  "y": 10,
                  "w": 200,
                  "h": 60,
                  "content": "hello",
                  "bgColor": "rgba(30,30,30,0.8)",
                  "color": "#e0e0e0",
                  "fontSize": 14,
                  "rotation": 0,
                  "opacity": 1
                }
              ],
              "rotation": 0,
              "opacity": 1,
              "content": "grp"
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "move",
          "event": {
            "clientX": 520,
            "clientY": 520
          }
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "g",
              "type": "group",
              "x": 0,
              "y": 0,
              "w": 300,
              "h": 300,
              "children": [
                {
                  "id": "t1",
                  "type": "text",
                  "x": 510,
                  "y": 510,
                  "w": 200,
                  "h": 60,
                  "content": "hello",
                  "bgColor": "rgba(30,30,30,0.8)",
                  "color": "#e0e0e0",
                  "fontSize": 14,
                  "rotation": 0,
                  "opacity": 1
                }
              ],
              "rotation": 0,
              "opacity": 1,
              "content": "grp"
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "up",
          "event": {
            "clientX": 520,
            "clientY": 520
          }
        },
        "snapshot": {
          "calls": [
            "save",
            "cursor:default",
            "render"
          ],
          "elements": [
            {
              "id": "g",
              "type": "group",
              "x": 0,
              "y": 0,
              "w": 300,
              "h": 300,
              "children": [],
              "rotation": 0,
              "opacity": 1,
              "content": "grp"
            },
            {
              "id": "t1",
              "type": "text",
              "x": 510,
              "y": 510,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "rubber-band",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 10,
          "y": 10,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "t2",
          "type": "text",
          "x": 400,
          "y": 400,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "l1",
          "type": "line",
          "from": "t1",
          "to": "t2",
          "content": ""
        }
      ]
    },
    "steps": [
      {
        "op": {
          "op": "down",
          "event": {
            "clientX": 0,
            "clientY": 0
          }
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 400,
              "y": 400,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "l1",
              "type": "line",
              "from": "t1",
              "to": "t2",
              "content": ""
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "move",
          "event": {
            "clientX": 250,
            "clientY": 250
          }
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 400,
              "y": 400,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "l1",
              "type": "line",
              "from": "t1",
              "to": "t2",
              "content": ""
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "up",
          "event": {
            "clientX": 250,
            "clientY": 250
          }
        },
        "snapshot": {
          "calls": [
            "cursor:default",
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 400,
              "y": 400,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "l1",
              "type": "line",
              "from": "t1",
              "to": "t2",
              "content": ""
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "pin-new-line",
    "setup": {
      "elements": [
        {
          "id": "a",
          "type": "code-node",
          "title": "na",
          "x": 0,
          "y": 0,
          "w": 260,
          "h": 116,
          "inputs": [
            {
              "id": "ai0",
              "label": "a"
            },
            {
              "id": "ai1",
              "label": "b"
            }
          ],
          "outputs": [
            {
              "id": "ao0",
              "label": "sum"
            }
          ],
          "code": "function process(inputs) {\n  return {};\n}",
          "content": "",
          "bgColor": "rgba(32, 34, 38, 0.92)",
          "color": "#ffffff",
          "fontSize": 13,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "b",
          "type": "code-node",
          "title": "nb",
          "x": 400,
          "y": 0,
          "w": 260,
          "h": 88,
          "inputs": [
            {
              "id": "bi0",
              "label": "x"
            }
          ],
          "outputs": [
            {
              "id": "bo0",
              "label": "result"
            }
          ],
          "code": "function process(inputs) {\n  return {};\n}",
          "content": "",
          "bgColor": "rgba(32, 34, 38, 0.92)",
          "color": "#ffffff",
          "fontSize": 13,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "c",
          "type": "code-node",
          "title": "nc",
          "x": 400,
          "y": 300,
          "w": 260,
          "h": 88,
          "inputs": [
            {
              "id": "ci0",
              "label": "in"
            }
          ],
          "outputs": [
            {
              "id": "co0",
              "label": "out"
            }
          ],
          "code": "function process(inputs) {\n  return {};\n}",
          "content": "",
          "bgColor": "rgba(32, 34, 38, 0.92)",
          "color": "#ffffff",
          "fontSize": 13,
          "rotation": 0,
          "opacity": 1
        }
      ]
    },
    "steps": [
      {
        "op": {
          "op": "down",
          "event": {
            "clientX": 260,
            "clientY": 17.4
          }
        },
        "snapshot": {
          "calls": [
            "cursor:crosshair",
            "render"
          ],
          "elements": [
            {
              "id": "a",
              "type": "code-node",
              "title": "na",
              "x": 0,
              "y": 0,
              "w": 260,
              "h": 116,
              "inputs": [
                {
                  "id": "ai0",
                  "label": "a"
                },
                {
                  "id": "ai1",
                  "label": "b"
                }
              ],
              "outputs": [
                {
                  "id": "ao0",
                  "label": "sum"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "b",
              "type": "code-node",
              "title": "nb",
              "x": 400,
              "y": 0,
              "w": 260,
              "h": 88,
              "inputs": [
                {
                  "id": "bi0",
                  "label": "x"
                }
              ],
              "outputs": [
                {
                  "id": "bo0",
                  "label": "result"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "c",
              "type": "code-node",
              "title": "nc",
              "x": 400,
              "y": 300,
              "w": 260,
              "h": 88,
              "inputs": [
                {
                  "id": "ci0",
                  "label": "in"
                }
              ],
              "outputs": [
                {
                  "id": "co0",
                  "label": "out"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "move",
          "event": {
            "clientX": 400,
            "clientY": 44
          }
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "a",
              "type": "code-node",
              "title": "na",
              "x": 0,
              "y": 0,
              "w": 260,
              "h": 116,
              "inputs": [
                {
                  "id": "ai0",
                  "label": "a"
                },
                {
                  "id": "ai1",
                  "label": "b"
                }
              ],
              "outputs": [
                {
                  "id": "ao0",
                  "label": "sum"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "b",
              "type": "code-node",
              "title": "nb",
              "x": 400,
              "y": 0,
              "w": 260,
              "h": 88,
              "inputs": [
                {
                  "id": "bi0",
                  "label": "x"
                }
              ],
              "outputs": [
                {
                  "id": "bo0",
                  "label": "result"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "c",
              "type": "code-node",
              "title": "nc",
              "x": 400,
              "y": 300,
              "w": 260,
              "h": 88,
              "inputs": [
                {
                  "id": "ci0",
                  "label": "in"
                }
              ],
              "outputs": [
                {
                  "id": "co0",
                  "label": "out"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "up",
          "event": {
            "clientX": 400,
            "clientY": 44
          }
        },
        "snapshot": {
          "calls": [
            "cursor:default",
            "save",
            "notice:连线已创建",
            "render"
          ],
          "elements": [
            {
              "id": "a",
              "type": "code-node",
              "title": "na",
              "x": 0,
              "y": 0,
              "w": 260,
              "h": 116,
              "inputs": [
                {
                  "id": "ai0",
                  "label": "a"
                },
                {
                  "id": "ai1",
                  "label": "b"
                }
              ],
              "outputs": [
                {
                  "id": "ao0",
                  "label": "sum"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "b",
              "type": "code-node",
              "title": "nb",
              "x": 400,
              "y": 0,
              "w": 260,
              "h": 88,
              "inputs": [
                {
                  "id": "bi0",
                  "label": "x"
                }
              ],
              "outputs": [
                {
                  "id": "bo0",
                  "label": "result"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "c",
              "type": "code-node",
              "title": "nc",
              "x": 400,
              "y": 300,
              "w": 260,
              "h": 88,
              "inputs": [
                {
                  "id": "ci0",
                  "label": "in"
                }
              ],
              "outputs": [
                {
                  "id": "co0",
                  "label": "out"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "id0001",
              "type": "line",
              "from": "a",
              "fromPin": "ao0",
              "to": "b",
              "toPin": "bi0",
              "content": ""
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "pin-relink-to",
    "setup": {
      "elements": [
        {
          "id": "a",
          "type": "code-node",
          "title": "na",
          "x": 0,
          "y": 0,
          "w": 260,
          "h": 116,
          "inputs": [
            {
              "id": "ai0",
              "label": "a"
            },
            {
              "id": "ai1",
              "label": "b"
            }
          ],
          "outputs": [
            {
              "id": "ao0",
              "label": "sum"
            }
          ],
          "code": "function process(inputs) {\n  return {};\n}",
          "content": "",
          "bgColor": "rgba(32, 34, 38, 0.92)",
          "color": "#ffffff",
          "fontSize": 13,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "b",
          "type": "code-node",
          "title": "nb",
          "x": 400,
          "y": 0,
          "w": 260,
          "h": 88,
          "inputs": [
            {
              "id": "bi0",
              "label": "x"
            }
          ],
          "outputs": [
            {
              "id": "bo0",
              "label": "result"
            }
          ],
          "code": "function process(inputs) {\n  return {};\n}",
          "content": "",
          "bgColor": "rgba(32, 34, 38, 0.92)",
          "color": "#ffffff",
          "fontSize": 13,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "c",
          "type": "code-node",
          "title": "nc",
          "x": 400,
          "y": 300,
          "w": 260,
          "h": 88,
          "inputs": [
            {
              "id": "ci0",
              "label": "in"
            }
          ],
          "outputs": [
            {
              "id": "co0",
              "label": "out"
            }
          ],
          "code": "function process(inputs) {\n  return {};\n}",
          "content": "",
          "bgColor": "rgba(32, 34, 38, 0.92)",
          "color": "#ffffff",
          "fontSize": 13,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "l1",
          "type": "line",
          "from": "a",
          "to": "b",
          "content": "",
          "fromPin": "ao0",
          "toPin": "bi0"
        }
      ]
    },
    "steps": [
      {
        "op": {
          "op": "down",
          "event": {
            "clientX": 400,
            "clientY": 44
          }
        },
        "snapshot": {
          "calls": [
            "cursor:crosshair",
            "render"
          ],
          "elements": [
            {
              "id": "a",
              "type": "code-node",
              "title": "na",
              "x": 0,
              "y": 0,
              "w": 260,
              "h": 116,
              "inputs": [
                {
                  "id": "ai0",
                  "label": "a"
                },
                {
                  "id": "ai1",
                  "label": "b"
                }
              ],
              "outputs": [
                {
                  "id": "ao0",
                  "label": "sum"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "b",
              "type": "code-node",
              "title": "nb",
              "x": 400,
              "y": 0,
              "w": 260,
              "h": 88,
              "inputs": [
                {
                  "id": "bi0",
                  "label": "x"
                }
              ],
              "outputs": [
                {
                  "id": "bo0",
                  "label": "result"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "c",
              "type": "code-node",
              "title": "nc",
              "x": 400,
              "y": 300,
              "w": 260,
              "h": 88,
              "inputs": [
                {
                  "id": "ci0",
                  "label": "in"
                }
              ],
              "outputs": [
                {
                  "id": "co0",
                  "label": "out"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "l1",
              "type": "line",
              "from": "a",
              "to": "b",
              "content": "",
              "fromPin": "ao0",
              "toPin": "bi0"
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "move",
          "event": {
            "clientX": 400,
            "clientY": 344
          }
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "a",
              "type": "code-node",
              "title": "na",
              "x": 0,
              "y": 0,
              "w": 260,
              "h": 116,
              "inputs": [
                {
                  "id": "ai0",
                  "label": "a"
                },
                {
                  "id": "ai1",
                  "label": "b"
                }
              ],
              "outputs": [
                {
                  "id": "ao0",
                  "label": "sum"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "b",
              "type": "code-node",
              "title": "nb",
              "x": 400,
              "y": 0,
              "w": 260,
              "h": 88,
              "inputs": [
                {
                  "id": "bi0",
                  "label": "x"
                }
              ],
              "outputs": [
                {
                  "id": "bo0",
                  "label": "result"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "c",
              "type": "code-node",
              "title": "nc",
              "x": 400,
              "y": 300,
              "w": 260,
              "h": 88,
              "inputs": [
                {
                  "id": "ci0",
                  "label": "in"
                }
              ],
              "outputs": [
                {
                  "id": "co0",
                  "label": "out"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "l1",
              "type": "line",
              "from": "a",
              "to": "b",
              "content": "",
              "fromPin": "ao0",
              "toPin": "bi0"
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "up",
          "event": {
            "clientX": 400,
            "clientY": 344
          }
        },
        "snapshot": {
          "calls": [
            "cursor:default",
            "save",
            "notice:连线终点已重连",
            "render"
          ],
          "elements": [
            {
              "id": "a",
              "type": "code-node",
              "title": "na",
              "x": 0,
              "y": 0,
              "w": 260,
              "h": 116,
              "inputs": [
                {
                  "id": "ai0",
                  "label": "a"
                },
                {
                  "id": "ai1",
                  "label": "b"
                }
              ],
              "outputs": [
                {
                  "id": "ao0",
                  "label": "sum"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "b",
              "type": "code-node",
              "title": "nb",
              "x": 400,
              "y": 0,
              "w": 260,
              "h": 88,
              "inputs": [
                {
                  "id": "bi0",
                  "label": "x"
                }
              ],
              "outputs": [
                {
                  "id": "bo0",
                  "label": "result"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "c",
              "type": "code-node",
              "title": "nc",
              "x": 400,
              "y": 300,
              "w": 260,
              "h": 88,
              "inputs": [
                {
                  "id": "ci0",
                  "label": "in"
                }
              ],
              "outputs": [
                {
                  "id": "co0",
                  "label": "out"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "l1",
              "type": "line",
              "from": "a",
              "to": "c",
              "content": "",
              "fromPin": "ao0",
              "toPin": "ci0"
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "pin-relink-from",
    "setup": {
      "elements": [
        {
          "id": "a",
          "type": "code-node",
          "title": "na",
          "x": 0,
          "y": 0,
          "w": 260,
          "h": 116,
          "inputs": [
            {
              "id": "ai0",
              "label": "a"
            },
            {
              "id": "ai1",
              "label": "b"
            }
          ],
          "outputs": [
            {
              "id": "ao0",
              "label": "sum"
            }
          ],
          "code": "function process(inputs) {\n  return {};\n}",
          "content": "",
          "bgColor": "rgba(32, 34, 38, 0.92)",
          "color": "#ffffff",
          "fontSize": 13,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "b",
          "type": "code-node",
          "title": "nb",
          "x": 400,
          "y": 0,
          "w": 260,
          "h": 88,
          "inputs": [
            {
              "id": "bi0",
              "label": "x"
            }
          ],
          "outputs": [
            {
              "id": "bo0",
              "label": "result"
            }
          ],
          "code": "function process(inputs) {\n  return {};\n}",
          "content": "",
          "bgColor": "rgba(32, 34, 38, 0.92)",
          "color": "#ffffff",
          "fontSize": 13,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "c",
          "type": "code-node",
          "title": "nc",
          "x": 400,
          "y": 300,
          "w": 260,
          "h": 88,
          "inputs": [
            {
              "id": "ci0",
              "label": "in"
            }
          ],
          "outputs": [
            {
              "id": "co0",
              "label": "out"
            }
          ],
          "code": "function process(inputs) {\n  return {};\n}",
          "content": "",
          "bgColor": "rgba(32, 34, 38, 0.92)",
          "color": "#ffffff",
          "fontSize": 13,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "l1",
          "type": "line",
          "from": "a",
          "to": "b",
          "content": "",
          "fromPin": "ao0",
          "toPin": "bi0"
        }
      ]
    },
    "steps": [
      {
        "op": {
          "op": "down",
          "event": {
            "clientX": 271,
            "clientY": 28.4
          }
        },
        "snapshot": {
          "calls": [
            "cursor:crosshair",
            "render"
          ],
          "elements": [
            {
              "id": "a",
              "type": "code-node",
              "title": "na",
              "x": 0,
              "y": 0,
              "w": 260,
              "h": 116,
              "inputs": [
                {
                  "id": "ai0",
                  "label": "a"
                },
                {
                  "id": "ai1",
                  "label": "b"
                }
              ],
              "outputs": [
                {
                  "id": "ao0",
                  "label": "sum"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "b",
              "type": "code-node",
              "title": "nb",
              "x": 400,
              "y": 0,
              "w": 260,
              "h": 88,
              "inputs": [
                {
                  "id": "bi0",
                  "label": "x"
                }
              ],
              "outputs": [
                {
                  "id": "bo0",
                  "label": "result"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "c",
              "type": "code-node",
              "title": "nc",
              "x": 400,
              "y": 300,
              "w": 260,
              "h": 88,
              "inputs": [
                {
                  "id": "ci0",
                  "label": "in"
                }
              ],
              "outputs": [
                {
                  "id": "co0",
                  "label": "out"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "l1",
              "type": "line",
              "from": "a",
              "to": "b",
              "content": "",
              "fromPin": "ao0",
              "toPin": "bi0"
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "move",
          "event": {
            "clientX": 660,
            "clientY": 344
          }
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "a",
              "type": "code-node",
              "title": "na",
              "x": 0,
              "y": 0,
              "w": 260,
              "h": 116,
              "inputs": [
                {
                  "id": "ai0",
                  "label": "a"
                },
                {
                  "id": "ai1",
                  "label": "b"
                }
              ],
              "outputs": [
                {
                  "id": "ao0",
                  "label": "sum"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "b",
              "type": "code-node",
              "title": "nb",
              "x": 400,
              "y": 0,
              "w": 260,
              "h": 88,
              "inputs": [
                {
                  "id": "bi0",
                  "label": "x"
                }
              ],
              "outputs": [
                {
                  "id": "bo0",
                  "label": "result"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "c",
              "type": "code-node",
              "title": "nc",
              "x": 400,
              "y": 300,
              "w": 260,
              "h": 88,
              "inputs": [
                {
                  "id": "ci0",
                  "label": "in"
                }
              ],
              "outputs": [
                {
                  "id": "co0",
                  "label": "out"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "l1",
              "type": "line",
              "from": "a",
              "to": "b",
              "content": "",
              "fromPin": "ao0",
              "toPin": "bi0"
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "up",
          "event": {
            "clientX": 660,
            "clientY": 344
          }
        },
        "snapshot": {
          "calls": [
            "cursor:default",
            "save",
            "notice:连线起点已重连",
            "render"
          ],
          "elements": [
            {
              "id": "a",
              "type": "code-node",
              "title": "na",
              "x": 0,
              "y": 0,
              "w": 260,
              "h": 116,
              "inputs": [
                {
                  "id": "ai0",
                  "label": "a"
                },
                {
                  "id": "ai1",
                  "label": "b"
                }
              ],
              "outputs": [
                {
                  "id": "ao0",
                  "label": "sum"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "b",
              "type": "code-node",
              "title": "nb",
              "x": 400,
              "y": 0,
              "w": 260,
              "h": 88,
              "inputs": [
                {
                  "id": "bi0",
                  "label": "x"
                }
              ],
              "outputs": [
                {
                  "id": "bo0",
                  "label": "result"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "c",
              "type": "code-node",
              "title": "nc",
              "x": 400,
              "y": 300,
              "w": 260,
              "h": 88,
              "inputs": [
                {
                  "id": "ci0",
                  "label": "in"
                }
              ],
              "outputs": [
                {
                  "id": "co0",
                  "label": "out"
                }
              ],
              "code": "function process(inputs) {\n  return {};\n}",
              "content": "",
              "bgColor": "rgba(32, 34, 38, 0.92)",
              "color": "#ffffff",
              "fontSize": 13,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "l1",
              "type": "line",
              "from": "c",
              "to": "b",
              "content": "",
              "fromPin": "co0",
              "toPin": "bi0"
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "resize",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 10,
          "y": 10,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ],
      "selected": [
        "t1"
      ]
    },
    "steps": [
      {
        "op": {
          "op": "down",
          "event": {
            "clientX": 210,
            "clientY": 70
          }
        },
        "snapshot": {
          "calls": [],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "move",
          "event": {
            "clientX": 250,
            "clientY": 90
          }
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 240,
              "h": 80,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "up",
          "event": {
            "clientX": 250,
            "clientY": 90
          }
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 240,
              "h": 80,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "pan-momentum",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 10,
          "y": 10,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ]
    },
    "steps": [
      {
        "op": {
          "op": "down",
          "event": {
            "clientX": 400,
            "clientY": 300,
            "button": 1
          }
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "move",
          "event": {
            "clientX": 430,
            "clientY": 320,
            "button": 1
          }
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 30,
            "offsetY": 20,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "move",
          "event": {
            "clientX": 460,
            "clientY": 340,
            "button": 1
          }
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 60,
            "offsetY": 40,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "up",
          "event": {
            "clientX": 460,
            "clientY": 340,
            "button": 1
          }
        },
        "snapshot": {
          "calls": [
            "render",
            "cursor:default",
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 87,
            "offsetY": 58,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "momentum"
        },
        "snapshot": {
          "calls": [
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render",
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 325.56573511756966,
            "offsetY": 217.04382341171305,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "right-click-menu",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 10,
          "y": 10,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ],
      "selected": [
        "t1"
      ]
    },
    "steps": [
      {
        "op": {
          "op": "down",
          "event": {
            "clientX": 20,
            "clientY": 20,
            "button": 2
          }
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      },
      {
        "op": {
          "op": "up",
          "event": {
            "clientX": 20,
            "clientY": 20,
            "button": 2
          }
        },
        "snapshot": {
          "calls": [
            "menu:20,20",
            "cursor:default",
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [
            "t1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "wheel-zoom",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 10,
          "y": 10,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ]
    },
    "steps": [
      {
        "op": {
          "op": "wheel",
          "event": {
            "clientX": 100,
            "clientY": 100,
            "deltaY": -100
          }
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": -14.999999999999986,
            "offsetY": -14.999999999999986,
            "scale": 1.15
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": 3000
        }
      },
      {
        "op": {
          "op": "wheel",
          "event": {
            "clientX": 100,
            "clientY": 100,
            "deltaY": 100
          }
        },
        "snapshot": {
          "calls": [
            "render"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 2.250000000000014,
            "offsetY": 2.250000000000014,
            "scale": 0.9774999999999999
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": 3000
        }
      }
    ]
  },
  {
    "name": "dblclick-empty",
    "setup": {
      "elements": []
    },
    "steps": [
      {
        "op": {
          "op": "dblclick",
          "event": {
            "clientX": 100,
            "clientY": 100
          }
        },
        "snapshot": {
          "calls": [
            "save",
            "render"
          ],
          "elements": [
            {
              "id": "id0001",
              "type": "text",
              "x": 100,
              "y": 100,
              "w": 200,
              "h": 60,
              "content": "双击编辑文本",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": 0,
          "historyLength": 1,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "dblclick-text",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 10,
          "y": 10,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ]
    },
    "steps": [
      {
        "op": {
          "op": "dblclick",
          "event": {
            "clientX": 20,
            "clientY": 20
          }
        },
        "snapshot": {
          "calls": [
            "edit-text:t1"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "dblclick-line",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 0,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "t2",
          "type": "text",
          "x": 300,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "l1",
          "type": "line",
          "from": "t1",
          "to": "t2",
          "content": ""
        }
      ]
    },
    "steps": [
      {
        "op": {
          "op": "dblclick",
          "event": {
            "clientX": 250,
            "clientY": 30
          }
        },
        "snapshot": {
          "calls": [
            "edit-line:l1"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "l1",
              "type": "line",
              "from": "t1",
              "to": "t2",
              "content": ""
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "dblclick-locked",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 10,
          "y": 10,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1,
          "locked": true
        }
      ]
    },
    "steps": [
      {
        "op": {
          "op": "dblclick",
          "event": {
            "clientX": 20,
            "clientY": 20
          }
        },
        "snapshot": {
          "calls": [
            "notice:lockedNotice"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 10,
              "y": 10,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1,
              "locked": true
            }
          ],
          "selected": [],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  },
  {
    "name": "line-click-edit",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 0,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "t2",
          "type": "text",
          "x": 300,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "l1",
          "type": "line",
          "from": "t1",
          "to": "t2",
          "content": ""
        }
      ]
    },
    "steps": [
      {
        "op": {
          "op": "down",
          "event": {
            "clientX": 250,
            "clientY": 30
          }
        },
        "snapshot": {
          "calls": [
            "edit-line:l1"
          ],
          "elements": [
            {
              "id": "t1",
              "type": "text",
              "x": 0,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "t2",
              "type": "text",
              "x": 300,
              "y": 0,
              "w": 200,
              "h": 60,
              "content": "hello",
              "bgColor": "rgba(30,30,30,0.8)",
              "color": "#e0e0e0",
              "fontSize": 14,
              "rotation": 0,
              "opacity": 1
            },
            {
              "id": "l1",
              "type": "line",
              "from": "t1",
              "to": "t2",
              "content": ""
            }
          ],
          "selected": [
            "l1"
          ],
          "view": {
            "offsetX": 0,
            "offsetY": 0,
            "scale": 1
          },
          "historyIndex": -1,
          "historyLength": 0,
          "clipboard": [],
          "zoomUntil": null
        }
      }
    ]
  }
]

/** Context-menu scenarios with upstream trees. */
export const MENU_SCENARIOS: MenuScenario[] = [
  {
    "name": "menu-blank",
    "setup": {
      "elements": []
    },
    "event": {
      "clientX": 50,
      "clientY": 50
    },
    "context": {
      "activeFileIsMarkdown": false, "supportsPopout": true, "supportsPinTop": true, "supportsReveal": true,
      "isPopout": false,
      "isPinned": false
    },
    "menu": [
      {
        "t": "newCanvas",
        "i": "plus",
        "s": false,
        "c": null
      },
      {
        "t": "newText",
        "i": "file-text",
        "s": false,
        "c": null
      },
      {
        "t": "addNoteLink",
        "i": "link",
        "s": false,
        "c": null
      },
      {
        "t": "添加代码节点",
        "i": "terminal",
        "s": true,
        "c": [
          {
            "t": "数学",
            "i": "",
            "s": false,
            "c": [
              {
                "t": "加法",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "减法",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "乘法",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "除法",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "取模",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "幂",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "平方根",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "绝对值",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "向上取整",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "向下取整",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "四舍五入",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "正弦",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "余弦",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "随机数",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "最小值",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "最大值",
                "i": "code",
                "s": false,
                "c": null
              }
            ]
          },
          {
            "t": "逻辑",
            "i": "",
            "s": false,
            "c": [
              {
                "t": "与",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "或",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "非",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "异或",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "大于",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "小于",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "等于",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "条件分支",
                "i": "code",
                "s": false,
                "c": null
              }
            ]
          },
          {
            "t": "字符串",
            "i": "",
            "s": false,
            "c": [
              {
                "t": "拼接",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "转大写",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "转小写",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "长度",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "分割",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "替换",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "截取",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "包含",
                "i": "code",
                "s": false,
                "c": null
              }
            ]
          },
          {
            "t": "数组",
            "i": "",
            "s": false,
            "c": [
              {
                "t": "创建数组",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "数组长度",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "追加",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "合并",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "映射",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "过滤",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "排序",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "求和",
                "i": "code",
                "s": false,
                "c": null
              }
            ]
          },
          {
            "t": "对象",
            "i": "",
            "s": false,
            "c": [
              {
                "t": "创建对象",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "取键",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "取所有键",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "取所有值",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "合并对象",
                "i": "code",
                "s": false,
                "c": null
              }
            ]
          },
          {
            "t": "控制流",
            "i": "",
            "s": false,
            "c": [
              {
                "t": "范围",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "求和循环",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "阶乘",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "斐波那契",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "计数器",
                "i": "code",
                "s": false,
                "c": null
              }
            ]
          },
          {
            "t": "工具",
            "i": "",
            "s": false,
            "c": [
              {
                "t": "打印",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "恒等",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "常量",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "时间戳",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "当前日期",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "类型判断",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "转数字",
                "i": "code",
                "s": false,
                "c": null
              },
              {
                "t": "转字符串",
                "i": "code",
                "s": false,
                "c": null
              }
            ]
          }
        ]
      },
      {
        "t": "import",
        "i": "download",
        "s": false,
        "c": [
          {
            "t": "importLocal",
            "i": "image",
            "s": false,
            "c": null
          },
          {
            "t": "导入 UAsset IR",
            "i": "code",
            "s": false,
            "c": null
          },
          {
            "t": "导入 JSON Canvas (.canvas)",
            "i": "layout-dashboard",
            "s": false,
            "c": null
          },
          {
            "t": "importNet",
            "i": "link",
            "s": false,
            "c": null
          }
        ]
      },
      {
        "t": "saveExport",
        "i": "folder",
        "s": true,
        "c": [
          {
            "t": "saveAsPur",
            "i": "save",
            "s": false,
            "c": null
          },
          {
            "t": "exportMd",
            "i": "document",
            "s": false,
            "c": null
          },
          {
            "t": "genCode",
            "i": "code",
            "s": true,
            "c": [
              {
                "t": "JavaScript (.js)",
                "i": "file-code",
                "s": false,
                "c": null
              },
              {
                "t": "Python (.py)",
                "i": "file-code",
                "s": false,
                "c": null
              }
            ]
          },
          {
            "t": "exportPng",
            "i": "image",
            "s": false,
            "c": null
          },
          {
            "t": "exportJpg",
            "i": "image",
            "s": false,
            "c": null
          },
          {
            "t": "导出 JSON Canvas (.canvas)",
            "i": "layout-dashboard",
            "s": false,
            "c": null
          }
        ]
      },
      {
        "t": "适应视图 (F)",
        "i": "maximize",
        "s": false,
        "c": null
      },
      {
        "t": "弹出为独立窗口",
        "i": "external-link",
        "s": false,
        "c": null
      },
      {
        "t": "启动系统置顶",
        "i": "pin",
        "s": false,
        "c": null
      }
    ],
    "calls": [
      "menu:50,50"
    ],
    "selected": []
  },
  {
    "name": "menu-text",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 0,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ],
      "selected": [
        "t1"
      ]
    },
    "event": {
      "clientX": 10,
      "clientY": 10
    },
    "context": {
      "activeFileIsMarkdown": false, "supportsPopout": true, "supportsPinTop": true, "supportsReveal": true,
      "isPopout": false,
      "isPinned": false
    },
    "menu": [
      {
        "t": "edit",
        "i": "pencil",
        "s": false,
        "c": null
      },
      {
        "t": "addInPin",
        "i": "git-commit",
        "s": false,
        "c": null
      },
      {
        "t": "addOutPin",
        "i": "git-commit",
        "s": true,
        "c": null
      },
      {
        "t": "copy",
        "i": "copy",
        "s": false,
        "c": null
      },
      {
        "t": "duplicate",
        "i": "plus-circle",
        "s": false,
        "c": null
      },
      {
        "t": "delete",
        "i": "trash",
        "s": true,
        "c": null
      },
      {
        "t": "layer",
        "i": "layers",
        "s": false,
        "c": [
          {
            "t": "bringToFront",
            "i": "arrow-up-to-line",
            "s": false,
            "c": null
          },
          {
            "t": "moveUp",
            "i": "arrow-up",
            "s": false,
            "c": null
          },
          {
            "t": "moveDown",
            "i": "arrow-down",
            "s": false,
            "c": null
          },
          {
            "t": "sendToBack",
            "i": "arrow-down-to-line",
            "s": false,
            "c": null
          }
        ]
      },
      {
        "t": "opacity",
        "i": "droplet",
        "s": false,
        "c": null
      },
      {
        "t": "锁定位置",
        "i": "lock",
        "s": true,
        "c": null
      },
      {
        "t": "适应视图 (F)",
        "i": "maximize",
        "s": false,
        "c": null
      },
      {
        "t": "saveExport",
        "i": "folder",
        "s": false,
        "c": [
          {
            "t": "saveAsPur",
            "i": "save",
            "s": false,
            "c": null
          },
          {
            "t": "exportMd",
            "i": "document",
            "s": false,
            "c": null
          },
          {
            "t": "genCode",
            "i": "code",
            "s": true,
            "c": [
              {
                "t": "JavaScript (.js)",
                "i": "file-code",
                "s": false,
                "c": null
              },
              {
                "t": "Python (.py)",
                "i": "file-code",
                "s": false,
                "c": null
              }
            ]
          },
          {
            "t": "exportPng",
            "i": "image",
            "s": false,
            "c": null
          },
          {
            "t": "exportJpg",
            "i": "image",
            "s": false,
            "c": null
          },
          {
            "t": "导出 JSON Canvas (.canvas)",
            "i": "layout-dashboard",
            "s": false,
            "c": null
          }
        ]
      },
      {
        "t": "弹出为独立窗口",
        "i": "external-link",
        "s": false,
        "c": null
      },
      {
        "t": "启动系统置顶",
        "i": "pin",
        "s": false,
        "c": null
      }
    ],
    "calls": [
      "menu:10,10"
    ],
    "selected": [
      "t1"
    ]
  },
  {
    "name": "menu-text-pins",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 0,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1,
          "inputs": [
            {
              "id": "p1",
              "label": "a"
            },
            {
              "id": "p2",
              "label": ""
            }
          ],
          "outputs": [
            {
              "id": "p3",
              "label": "sum"
            }
          ]
        }
      ],
      "selected": [
        "t1"
      ]
    },
    "event": {
      "clientX": 10,
      "clientY": 10
    },
    "context": {
      "activeFileIsMarkdown": false, "supportsPopout": true, "supportsPinTop": true, "supportsReveal": true,
      "isPopout": false,
      "isPinned": false
    },
    "menu": [
      {
        "t": "edit",
        "i": "pencil",
        "s": false,
        "c": null
      },
      {
        "t": "addInPin",
        "i": "git-commit",
        "s": false,
        "c": null
      },
      {
        "t": "addOutPin",
        "i": "git-commit",
        "s": false,
        "c": null
      },
      {
        "t": "delInPin",
        "i": "minus",
        "s": false,
        "c": [
          {
            "t": "a",
            "i": "",
            "s": false,
            "c": null
          },
          {
            "t": "输入2",
            "i": "",
            "s": false,
            "c": null
          }
        ]
      },
      {
        "t": "delOutPin",
        "i": "minus",
        "s": true,
        "c": [
          {
            "t": "sum",
            "i": "",
            "s": false,
            "c": null
          }
        ]
      },
      {
        "t": "copy",
        "i": "copy",
        "s": false,
        "c": null
      },
      {
        "t": "duplicate",
        "i": "plus-circle",
        "s": false,
        "c": null
      },
      {
        "t": "delete",
        "i": "trash",
        "s": true,
        "c": null
      },
      {
        "t": "layer",
        "i": "layers",
        "s": false,
        "c": [
          {
            "t": "bringToFront",
            "i": "arrow-up-to-line",
            "s": false,
            "c": null
          },
          {
            "t": "moveUp",
            "i": "arrow-up",
            "s": false,
            "c": null
          },
          {
            "t": "moveDown",
            "i": "arrow-down",
            "s": false,
            "c": null
          },
          {
            "t": "sendToBack",
            "i": "arrow-down-to-line",
            "s": false,
            "c": null
          }
        ]
      },
      {
        "t": "opacity",
        "i": "droplet",
        "s": false,
        "c": null
      },
      {
        "t": "锁定位置",
        "i": "lock",
        "s": true,
        "c": null
      },
      {
        "t": "适应视图 (F)",
        "i": "maximize",
        "s": false,
        "c": null
      },
      {
        "t": "saveExport",
        "i": "folder",
        "s": false,
        "c": [
          {
            "t": "saveAsPur",
            "i": "save",
            "s": false,
            "c": null
          },
          {
            "t": "exportMd",
            "i": "document",
            "s": false,
            "c": null
          },
          {
            "t": "genCode",
            "i": "code",
            "s": true,
            "c": [
              {
                "t": "JavaScript (.js)",
                "i": "file-code",
                "s": false,
                "c": null
              },
              {
                "t": "Python (.py)",
                "i": "file-code",
                "s": false,
                "c": null
              }
            ]
          },
          {
            "t": "exportPng",
            "i": "image",
            "s": false,
            "c": null
          },
          {
            "t": "exportJpg",
            "i": "image",
            "s": false,
            "c": null
          },
          {
            "t": "导出 JSON Canvas (.canvas)",
            "i": "layout-dashboard",
            "s": false,
            "c": null
          }
        ]
      },
      {
        "t": "弹出为独立窗口",
        "i": "external-link",
        "s": false,
        "c": null
      },
      {
        "t": "启动系统置顶",
        "i": "pin",
        "s": false,
        "c": null
      }
    ],
    "calls": [
      "menu:10,10"
    ],
    "selected": [
      "t1"
    ]
  },
  {
    "name": "menu-two",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 0,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "t2",
          "type": "text",
          "x": 300,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        }
      ],
      "selected": [
        "t1",
        "t2"
      ]
    },
    "event": {
      "clientX": 10,
      "clientY": 10
    },
    "context": {
      "activeFileIsMarkdown": false, "supportsPopout": true, "supportsPinTop": true, "supportsReveal": true,
      "isPopout": false,
      "isPinned": false
    },
    "menu": [
      {
        "t": "edit",
        "i": "pencil",
        "s": false,
        "c": null
      },
      {
        "t": "addInPin",
        "i": "git-commit",
        "s": false,
        "c": null
      },
      {
        "t": "addOutPin",
        "i": "git-commit",
        "s": true,
        "c": null
      },
      {
        "t": "copy",
        "i": "copy",
        "s": false,
        "c": null
      },
      {
        "t": "duplicate",
        "i": "plus-circle",
        "s": false,
        "c": null
      },
      {
        "t": "delete",
        "i": "trash",
        "s": true,
        "c": null
      },
      {
        "t": "line",
        "i": "link",
        "s": true,
        "c": null
      },
      {
        "t": "group",
        "i": "group",
        "s": true,
        "c": null
      },
      {
        "t": "arrange",
        "i": "layout-grid",
        "s": false,
        "c": [
          {
            "t": "arrange",
            "i": "",
            "s": true,
            "c": null
          },
          {
            "t": "alignTop",
            "i": "",
            "s": false,
            "c": null
          },
          {
            "t": "alignLeft",
            "i": "",
            "s": false,
            "c": null
          },
          {
            "t": "alignCenter",
            "i": "",
            "s": false,
            "c": null
          },
          {
            "t": "distH",
            "i": "",
            "s": false,
            "c": null
          }
        ]
      },
      {
        "t": "scaleUni",
        "i": "scaling",
        "s": false,
        "c": [
          {
            "t": "sameHeight",
            "i": "",
            "s": false,
            "c": null
          },
          {
            "t": "sameWidth",
            "i": "",
            "s": false,
            "c": null
          }
        ]
      },
      {
        "t": "layer",
        "i": "layers",
        "s": false,
        "c": [
          {
            "t": "bringToFront",
            "i": "arrow-up-to-line",
            "s": false,
            "c": null
          },
          {
            "t": "moveUp",
            "i": "arrow-up",
            "s": false,
            "c": null
          },
          {
            "t": "moveDown",
            "i": "arrow-down",
            "s": false,
            "c": null
          },
          {
            "t": "sendToBack",
            "i": "arrow-down-to-line",
            "s": false,
            "c": null
          }
        ]
      },
      {
        "t": "opacity",
        "i": "droplet",
        "s": false,
        "c": null
      },
      {
        "t": "锁定位置",
        "i": "lock",
        "s": true,
        "c": null
      },
      {
        "t": "适应视图 (F)",
        "i": "maximize",
        "s": false,
        "c": null
      },
      {
        "t": "saveExport",
        "i": "folder",
        "s": false,
        "c": [
          {
            "t": "saveAsPur",
            "i": "save",
            "s": false,
            "c": null
          },
          {
            "t": "exportMd",
            "i": "document",
            "s": false,
            "c": null
          },
          {
            "t": "genCode",
            "i": "code",
            "s": true,
            "c": [
              {
                "t": "JavaScript (.js)",
                "i": "file-code",
                "s": false,
                "c": null
              },
              {
                "t": "Python (.py)",
                "i": "file-code",
                "s": false,
                "c": null
              }
            ]
          },
          {
            "t": "exportPng",
            "i": "image",
            "s": false,
            "c": null
          },
          {
            "t": "exportJpg",
            "i": "image",
            "s": false,
            "c": null
          },
          {
            "t": "导出 JSON Canvas (.canvas)",
            "i": "layout-dashboard",
            "s": false,
            "c": null
          }
        ]
      },
      {
        "t": "弹出为独立窗口",
        "i": "external-link",
        "s": false,
        "c": null
      },
      {
        "t": "启动系统置顶",
        "i": "pin",
        "s": false,
        "c": null
      }
    ],
    "calls": [
      "menu:10,10"
    ],
    "selected": [
      "t1",
      "t2"
    ]
  },
  {
    "name": "menu-group",
    "setup": {
      "elements": [
        {
          "id": "g",
          "type": "group",
          "x": 0,
          "y": 0,
          "w": 300,
          "h": 300,
          "children": [],
          "rotation": 0,
          "opacity": 1,
          "content": "grp"
        }
      ],
      "selected": [
        "g"
      ]
    },
    "event": {
      "clientX": 10,
      "clientY": 10
    },
    "context": {
      "activeFileIsMarkdown": false, "supportsPopout": true, "supportsPinTop": true, "supportsReveal": true,
      "isPopout": false,
      "isPinned": false
    },
    "menu": [
      {
        "t": "editLabel",
        "i": "pencil",
        "s": false,
        "c": null
      },
      {
        "t": "linkNote",
        "i": "link",
        "s": true,
        "c": null
      },
      {
        "t": "copy",
        "i": "copy",
        "s": false,
        "c": null
      },
      {
        "t": "duplicate",
        "i": "plus-circle",
        "s": false,
        "c": null
      },
      {
        "t": "delete",
        "i": "trash",
        "s": true,
        "c": null
      },
      {
        "t": "ungroup",
        "i": "ungroup",
        "s": true,
        "c": null
      },
      {
        "t": "layer",
        "i": "layers",
        "s": false,
        "c": [
          {
            "t": "bringToFront",
            "i": "arrow-up-to-line",
            "s": false,
            "c": null
          },
          {
            "t": "moveUp",
            "i": "arrow-up",
            "s": false,
            "c": null
          },
          {
            "t": "moveDown",
            "i": "arrow-down",
            "s": false,
            "c": null
          },
          {
            "t": "sendToBack",
            "i": "arrow-down-to-line",
            "s": false,
            "c": null
          }
        ]
      },
      {
        "t": "锁定位置",
        "i": "lock",
        "s": true,
        "c": null
      },
      {
        "t": "适应视图 (F)",
        "i": "maximize",
        "s": false,
        "c": null
      },
      {
        "t": "saveExport",
        "i": "folder",
        "s": false,
        "c": [
          {
            "t": "saveAsPur",
            "i": "save",
            "s": false,
            "c": null
          },
          {
            "t": "exportMd",
            "i": "document",
            "s": false,
            "c": null
          },
          {
            "t": "genCode",
            "i": "code",
            "s": true,
            "c": [
              {
                "t": "JavaScript (.js)",
                "i": "file-code",
                "s": false,
                "c": null
              },
              {
                "t": "Python (.py)",
                "i": "file-code",
                "s": false,
                "c": null
              }
            ]
          },
          {
            "t": "exportPng",
            "i": "image",
            "s": false,
            "c": null
          },
          {
            "t": "exportJpg",
            "i": "image",
            "s": false,
            "c": null
          },
          {
            "t": "导出 JSON Canvas (.canvas)",
            "i": "layout-dashboard",
            "s": false,
            "c": null
          }
        ]
      },
      {
        "t": "弹出为独立窗口",
        "i": "external-link",
        "s": false,
        "c": null
      },
      {
        "t": "启动系统置顶",
        "i": "pin",
        "s": false,
        "c": null
      }
    ],
    "calls": [
      "menu:10,10"
    ],
    "selected": [
      "g"
    ]
  },
  {
    "name": "menu-line",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 0,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "t2",
          "type": "text",
          "x": 300,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1
        },
        {
          "id": "l1",
          "type": "line",
          "from": "t1",
          "to": "t2",
          "content": ""
        }
      ],
      "selected": [
        "l1"
      ]
    },
    "event": {
      "clientX": 200,
      "clientY": 30
    },
    "context": {
      "activeFileIsMarkdown": false, "supportsPopout": true, "supportsPinTop": true, "supportsReveal": true,
      "isPopout": false,
      "isPinned": false
    },
    "menu": [
      {
        "t": "edit",
        "i": "pencil",
        "s": false,
        "c": null
      },
      {
        "t": "addInPin",
        "i": "git-commit",
        "s": false,
        "c": null
      },
      {
        "t": "addOutPin",
        "i": "git-commit",
        "s": true,
        "c": null
      },
      {
        "t": "copy",
        "i": "copy",
        "s": false,
        "c": null
      },
      {
        "t": "duplicate",
        "i": "plus-circle",
        "s": false,
        "c": null
      },
      {
        "t": "delete",
        "i": "trash",
        "s": true,
        "c": null
      },
      {
        "t": "layer",
        "i": "layers",
        "s": false,
        "c": [
          {
            "t": "bringToFront",
            "i": "arrow-up-to-line",
            "s": false,
            "c": null
          },
          {
            "t": "moveUp",
            "i": "arrow-up",
            "s": false,
            "c": null
          },
          {
            "t": "moveDown",
            "i": "arrow-down",
            "s": false,
            "c": null
          },
          {
            "t": "sendToBack",
            "i": "arrow-down-to-line",
            "s": false,
            "c": null
          }
        ]
      },
      {
        "t": "opacity",
        "i": "droplet",
        "s": false,
        "c": null
      },
      {
        "t": "锁定位置",
        "i": "lock",
        "s": true,
        "c": null
      },
      {
        "t": "适应视图 (F)",
        "i": "maximize",
        "s": false,
        "c": null
      },
      {
        "t": "saveExport",
        "i": "folder",
        "s": false,
        "c": [
          {
            "t": "saveAsPur",
            "i": "save",
            "s": false,
            "c": null
          },
          {
            "t": "exportMd",
            "i": "document",
            "s": false,
            "c": null
          },
          {
            "t": "genCode",
            "i": "code",
            "s": true,
            "c": [
              {
                "t": "JavaScript (.js)",
                "i": "file-code",
                "s": false,
                "c": null
              },
              {
                "t": "Python (.py)",
                "i": "file-code",
                "s": false,
                "c": null
              }
            ]
          },
          {
            "t": "exportPng",
            "i": "image",
            "s": false,
            "c": null
          },
          {
            "t": "exportJpg",
            "i": "image",
            "s": false,
            "c": null
          },
          {
            "t": "导出 JSON Canvas (.canvas)",
            "i": "layout-dashboard",
            "s": false,
            "c": null
          }
        ]
      },
      {
        "t": "弹出为独立窗口",
        "i": "external-link",
        "s": false,
        "c": null
      },
      {
        "t": "启动系统置顶",
        "i": "pin",
        "s": false,
        "c": null
      }
    ],
    "calls": [
      "render",
      "menu:200,30"
    ],
    "selected": [
      "t1"
    ]
  },
  {
    "name": "menu-note-link",
    "setup": {
      "elements": [
        {
          "id": "n1",
          "type": "note-link",
          "x": 0,
          "y": 0,
          "w": 280,
          "h": 80,
          "content": "note",
          "link": "note.md",
          "rotation": 0,
          "opacity": 1
        }
      ],
      "selected": [
        "n1"
      ]
    },
    "event": {
      "clientX": 10,
      "clientY": 10
    },
    "context": {
      "activeFileIsMarkdown": false, "supportsPopout": true, "supportsPinTop": true, "supportsReveal": true,
      "isPopout": false,
      "isPinned": false
    },
    "menu": [
      {
        "t": "editLine",
        "i": "pencil",
        "s": true,
        "c": null
      },
      {
        "t": "open",
        "i": "external-link",
        "s": false,
        "c": null
      },
      {
        "t": "openNewTab",
        "i": "file-plus",
        "s": false,
        "c": null
      },
      {
        "t": "openRight",
        "i": "split",
        "s": true,
        "c": null
      },
      {
        "t": "edit",
        "i": "pencil",
        "s": false,
        "c": null
      },
      {
        "t": "addInPin",
        "i": "git-commit",
        "s": false,
        "c": null
      },
      {
        "t": "addOutPin",
        "i": "git-commit",
        "s": true,
        "c": null
      },
      {
        "t": "copy",
        "i": "copy",
        "s": false,
        "c": null
      },
      {
        "t": "duplicate",
        "i": "plus-circle",
        "s": false,
        "c": null
      },
      {
        "t": "delete",
        "i": "trash",
        "s": true,
        "c": null
      },
      {
        "t": "layer",
        "i": "layers",
        "s": false,
        "c": [
          {
            "t": "bringToFront",
            "i": "arrow-up-to-line",
            "s": false,
            "c": null
          },
          {
            "t": "moveUp",
            "i": "arrow-up",
            "s": false,
            "c": null
          },
          {
            "t": "moveDown",
            "i": "arrow-down",
            "s": false,
            "c": null
          },
          {
            "t": "sendToBack",
            "i": "arrow-down-to-line",
            "s": false,
            "c": null
          }
        ]
      },
      {
        "t": "opacity",
        "i": "droplet",
        "s": false,
        "c": null
      },
      {
        "t": "锁定位置",
        "i": "lock",
        "s": true,
        "c": null
      },
      {
        "t": "copyLink",
        "i": "link",
        "s": false,
        "c": null
      },
      {
        "t": "revealExplorer",
        "i": "folder-search",
        "s": true,
        "c": null
      },
      {
        "t": "适应视图 (F)",
        "i": "maximize",
        "s": false,
        "c": null
      },
      {
        "t": "saveExport",
        "i": "folder",
        "s": false,
        "c": [
          {
            "t": "saveAsPur",
            "i": "save",
            "s": false,
            "c": null
          },
          {
            "t": "exportMd",
            "i": "document",
            "s": false,
            "c": null
          },
          {
            "t": "genCode",
            "i": "code",
            "s": true,
            "c": [
              {
                "t": "JavaScript (.js)",
                "i": "file-code",
                "s": false,
                "c": null
              },
              {
                "t": "Python (.py)",
                "i": "file-code",
                "s": false,
                "c": null
              }
            ]
          },
          {
            "t": "exportPng",
            "i": "image",
            "s": false,
            "c": null
          },
          {
            "t": "exportJpg",
            "i": "image",
            "s": false,
            "c": null
          },
          {
            "t": "导出 JSON Canvas (.canvas)",
            "i": "layout-dashboard",
            "s": false,
            "c": null
          }
        ]
      },
      {
        "t": "弹出为独立窗口",
        "i": "external-link",
        "s": false,
        "c": null
      },
      {
        "t": "启动系统置顶",
        "i": "pin",
        "s": false,
        "c": null
      }
    ],
    "calls": [
      "menu:10,10"
    ],
    "selected": [
      "n1"
    ]
  },
  {
    "name": "menu-image-md",
    "setup": {
      "elements": [
        {
          "id": "i1",
          "type": "image",
          "x": 0,
          "y": 0,
          "w": 300,
          "h": 200,
          "original": "p.png",
          "link": "note.md",
          "rotation": 0,
          "opacity": 1
        }
      ],
      "selected": [
        "i1"
      ],
      "activeFileIsMarkdown": true
    },
    "event": {
      "clientX": 10,
      "clientY": 10
    },
    "context": {
      "activeFileIsMarkdown": true, "supportsPopout": true, "supportsPinTop": true, "supportsReveal": true,
      "isPopout": false,
      "isPinned": false
    },
    "menu": [
      {
        "t": "modLinkNote",
        "i": "link",
        "s": false,
        "c": null
      },
      {
        "t": "unlinkNote",
        "i": "unlink",
        "s": true,
        "c": null
      },
      {
        "t": "openLinkedNote",
        "i": "link",
        "s": false,
        "c": null
      },
      {
        "t": "openEmbeddedNote",
        "i": "file-text",
        "s": false,
        "c": null
      },
      {
        "t": "embedNote",
        "i": "image-up",
        "s": true,
        "c": null
      },
      {
        "t": "open",
        "i": "external-link",
        "s": false,
        "c": null
      },
      {
        "t": "openNewTab",
        "i": "file-plus",
        "s": false,
        "c": null
      },
      {
        "t": "openRight",
        "i": "split",
        "s": true,
        "c": null
      },
      {
        "t": "copy",
        "i": "copy",
        "s": false,
        "c": null
      },
      {
        "t": "duplicate",
        "i": "plus-circle",
        "s": false,
        "c": null
      },
      {
        "t": "delete",
        "i": "trash",
        "s": true,
        "c": null
      },
      {
        "t": "layer",
        "i": "layers",
        "s": false,
        "c": [
          {
            "t": "bringToFront",
            "i": "arrow-up-to-line",
            "s": false,
            "c": null
          },
          {
            "t": "moveUp",
            "i": "arrow-up",
            "s": false,
            "c": null
          },
          {
            "t": "moveDown",
            "i": "arrow-down",
            "s": false,
            "c": null
          },
          {
            "t": "sendToBack",
            "i": "arrow-down-to-line",
            "s": false,
            "c": null
          }
        ]
      },
      {
        "t": "opacity",
        "i": "droplet",
        "s": false,
        "c": null
      },
      {
        "t": "锁定位置",
        "i": "lock",
        "s": true,
        "c": null
      },
      {
        "t": "copyLink",
        "i": "link",
        "s": false,
        "c": null
      },
      {
        "t": "revealExplorer",
        "i": "folder-search",
        "s": true,
        "c": null
      },
      {
        "t": "适应视图 (F)",
        "i": "maximize",
        "s": false,
        "c": null
      },
      {
        "t": "saveExport",
        "i": "folder",
        "s": false,
        "c": [
          {
            "t": "saveAsPur",
            "i": "save",
            "s": false,
            "c": null
          },
          {
            "t": "exportMd",
            "i": "document",
            "s": false,
            "c": null
          },
          {
            "t": "genCode",
            "i": "code",
            "s": true,
            "c": [
              {
                "t": "JavaScript (.js)",
                "i": "file-code",
                "s": false,
                "c": null
              },
              {
                "t": "Python (.py)",
                "i": "file-code",
                "s": false,
                "c": null
              }
            ]
          },
          {
            "t": "exportPng",
            "i": "image",
            "s": false,
            "c": null
          },
          {
            "t": "exportJpg",
            "i": "image",
            "s": false,
            "c": null
          },
          {
            "t": "导出 JSON Canvas (.canvas)",
            "i": "layout-dashboard",
            "s": false,
            "c": null
          }
        ]
      },
      {
        "t": "弹出为独立窗口",
        "i": "external-link",
        "s": false,
        "c": null
      },
      {
        "t": "启动系统置顶",
        "i": "pin",
        "s": false,
        "c": null
      }
    ],
    "calls": [
      "menu:10,10"
    ],
    "selected": [
      "i1"
    ]
  },
  {
    "name": "menu-locked",
    "setup": {
      "elements": [
        {
          "id": "t1",
          "type": "text",
          "x": 0,
          "y": 0,
          "w": 200,
          "h": 60,
          "content": "hello",
          "bgColor": "rgba(30,30,30,0.8)",
          "color": "#e0e0e0",
          "fontSize": 14,
          "rotation": 0,
          "opacity": 1,
          "locked": true,
          "_lockTime": 500
        }
      ],
      "selected": [
        "t1"
      ]
    },
    "event": {
      "clientX": 10,
      "clientY": 10
    },
    "context": {
      "activeFileIsMarkdown": false, "supportsPopout": true, "supportsPinTop": true, "supportsReveal": true,
      "isPopout": false,
      "isPinned": false
    },
    "menu": [
      {
        "t": "edit",
        "i": "pencil",
        "s": false,
        "c": null
      },
      {
        "t": "addInPin",
        "i": "git-commit",
        "s": false,
        "c": null
      },
      {
        "t": "addOutPin",
        "i": "git-commit",
        "s": true,
        "c": null
      },
      {
        "t": "copy",
        "i": "copy",
        "s": false,
        "c": null
      },
      {
        "t": "duplicate",
        "i": "plus-circle",
        "s": false,
        "c": null
      },
      {
        "t": "delete",
        "i": "trash",
        "s": true,
        "c": null
      },
      {
        "t": "layer",
        "i": "layers",
        "s": false,
        "c": [
          {
            "t": "bringToFront",
            "i": "arrow-up-to-line",
            "s": false,
            "c": null
          },
          {
            "t": "moveUp",
            "i": "arrow-up",
            "s": false,
            "c": null
          },
          {
            "t": "moveDown",
            "i": "arrow-down",
            "s": false,
            "c": null
          },
          {
            "t": "sendToBack",
            "i": "arrow-down-to-line",
            "s": false,
            "c": null
          }
        ]
      },
      {
        "t": "opacity",
        "i": "droplet",
        "s": false,
        "c": null
      },
      {
        "t": "解锁位置",
        "i": "unlock",
        "s": true,
        "c": null
      },
      {
        "t": "适应视图 (F)",
        "i": "maximize",
        "s": false,
        "c": null
      },
      {
        "t": "saveExport",
        "i": "folder",
        "s": false,
        "c": [
          {
            "t": "saveAsPur",
            "i": "save",
            "s": false,
            "c": null
          },
          {
            "t": "exportMd",
            "i": "document",
            "s": false,
            "c": null
          },
          {
            "t": "genCode",
            "i": "code",
            "s": true,
            "c": [
              {
                "t": "JavaScript (.js)",
                "i": "file-code",
                "s": false,
                "c": null
              },
              {
                "t": "Python (.py)",
                "i": "file-code",
                "s": false,
                "c": null
              }
            ]
          },
          {
            "t": "exportPng",
            "i": "image",
            "s": false,
            "c": null
          },
          {
            "t": "exportJpg",
            "i": "image",
            "s": false,
            "c": null
          },
          {
            "t": "导出 JSON Canvas (.canvas)",
            "i": "layout-dashboard",
            "s": false,
            "c": null
          }
        ]
      },
      {
        "t": "弹出为独立窗口",
        "i": "external-link",
        "s": false,
        "c": null
      },
      {
        "t": "启动系统置顶",
        "i": "pin",
        "s": false,
        "c": null
      }
    ],
    "calls": [
      "menu:10,10"
    ],
    "selected": [
      "t1"
    ]
  }
]

/** Preset id to upstream title, for resolving kernel labelKeys. */
export const PRESET_TITLES: Record<string, string> = {
  "math-add": "加法",
  "math-sub": "减法",
  "math-mul": "乘法",
  "math-div": "除法",
  "math-mod": "取模",
  "math-pow": "幂",
  "math-sqrt": "平方根",
  "math-abs": "绝对值",
  "math-ceil": "向上取整",
  "math-floor": "向下取整",
  "math-round": "四舍五入",
  "math-sin": "正弦",
  "math-cos": "余弦",
  "math-random": "随机数",
  "math-min": "最小值",
  "math-max": "最大值",
  "logic-and": "与",
  "logic-or": "或",
  "logic-not": "非",
  "logic-xor": "异或",
  "logic-gt": "大于",
  "logic-lt": "小于",
  "logic-eq": "等于",
  "logic-if": "条件分支",
  "str-concat": "拼接",
  "str-upper": "转大写",
  "str-lower": "转小写",
  "str-len": "长度",
  "str-split": "分割",
  "str-replace": "替换",
  "str-slice": "截取",
  "str-includes": "包含",
  "arr-make": "创建数组",
  "arr-len": "数组长度",
  "arr-push": "追加",
  "arr-concat": "合并",
  "arr-map": "映射",
  "arr-filter": "过滤",
  "arr-sort": "排序",
  "arr-sum": "求和",
  "obj-make": "创建对象",
  "obj-get": "取键",
  "obj-keys": "取所有键",
  "obj-values": "取所有值",
  "obj-merge": "合并对象",
  "ctrl-range": "范围",
  "ctrl-sumrange": "求和循环",
  "ctrl-factorial": "阶乘",
  "ctrl-fib": "斐波那契",
  "ctrl-counter": "计数器",
  "util-log": "打印",
  "util-identity": "恒等",
  "util-const": "常量",
  "util-now": "时间戳",
  "util-date": "当前日期",
  "util-typeof": "类型判断",
  "util-tonum": "转数字",
  "util-tostr": "转字符串"
}

/** Kernel category key to upstream category title. */
export const CATEGORY_TITLES: Record<string, string> = {
  "math": "数学",
  "logic": "逻辑",
  "string": "字符串",
  "array": "数组",
  "object": "对象",
  "control": "控制流",
  "utility": "工具"
}

/** Kernel labelKey to upstream literal title, for entries upstream never translates. */
export const LITERAL_TITLES: Record<string, string> = {
  "fitViewF": "适应视图 (F)",
  "addCodeNodes": "添加代码节点",
  "importIr": "导入 UAsset IR",
  "importCanvas": "导入 JSON Canvas (.canvas)",
  "genCodeJs": "JavaScript (.js)",
  "genCodePy": "Python (.py)",
  "exportCanvas": "导出 JSON Canvas (.canvas)",
  "popOut": "弹出为独立窗口",
  "mergeToMain": "合并到主窗口",
  "pinTop": "启动系统置顶",
  "unpinTop": "取消系统置顶",
  "lockPosition": "锁定位置",
  "unlockPosition": "解锁位置"
}
