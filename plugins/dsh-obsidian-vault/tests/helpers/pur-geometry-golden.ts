/**
 * Golden vectors captured by running the upstream Pur Studio `main.js` geometry
 * and hit-testing code. Text is measured as 10 units per code point.
 * @module dsh-obsidian-vault/tests/helpers/pur-geometry-golden
 */
import type { PurElement, PurPin } from '../../src/pur-kernel/types.ts'
import type { PurLineEndpointHit, PurPinHit } from '../../src/pur-kernel/hit-test.ts'
import type { PurPoint, PurRect } from '../../src/pur-kernel/geometry.ts'

/** Fixture elements handed to the upstream geometry functions. */
export const GEOMETRY_ELEMENTS: PurElement[] = [
  {
    "id": "n1",
    "type": "code-node",
    "x": 0,
    "y": 0,
    "w": 250,
    "h": 120,
    "content": "",
    "code": "",
    "inputs": [
      {
        "id": "i1",
        "label": "a"
      },
      {
        "id": "i2",
        "label": "b"
      }
    ],
    "outputs": [
      {
        "id": "o1",
        "label": "x"
      },
      {
        "id": "o2",
        "label": "y"
      }
    ]
  },
  {
    "id": "t1",
    "type": "text",
    "x": 400,
    "y": 100,
    "w": 120,
    "h": 60,
    "content": "plain"
  },
  {
    "id": "g1",
    "type": "group",
    "x": 200,
    "y": 300,
    "w": 300,
    "h": 200,
    "content": "g",
    "children": [
      {
        "id": "n2",
        "type": "code-node",
        "x": 10,
        "y": 10,
        "w": 200,
        "h": 80,
        "content": "",
        "code": "",
        "inputs": [
          {
            "id": "i3",
            "label": "c"
          }
        ],
        "outputs": [
          {
            "id": "o3",
            "label": "z"
          }
        ]
      },
      {
        "id": "l1",
        "type": "line",
        "from": "n1",
        "to": "n2",
        "fromPin": "o1",
        "toPin": "i3",
        "width": 2
      }
    ]
  },
  {
    "id": "g2",
    "type": "group",
    "x": 600,
    "y": 0,
    "w": 200,
    "h": 200,
    "content": "locked",
    "locked": true,
    "children": [
      {
        "id": "n3",
        "type": "code-node",
        "x": 10,
        "y": 10,
        "w": 100,
        "h": 60,
        "content": "",
        "code": "",
        "inputs": [],
        "outputs": [
          {
            "id": "o4",
            "label": "q"
          }
        ]
      }
    ]
  },
  {
    "id": "l2",
    "type": "line",
    "from": "n1",
    "to": "t1",
    "fromPin": "o2",
    "width": 2
  }
]

/** Upstream `wrapText` output, measured at 10 units per code point. */
export const GOLDEN_WRAP: { text: string; maxWidth: number; lines: string[] }[] = [
  {
    "text": "hello world wrap",
    "maxWidth": 60,
    "lines": [
      "hello ",
      "world ",
      "wrap"
    ]
  },
  {
    "text": "a\n\nb",
    "maxWidth": 40,
    "lines": [
      "a",
      "",
      "b"
    ]
  },
  {
    "text": "",
    "maxWidth": 40,
    "lines": [
      ""
    ]
  },
  {
    "text": "中文测试换行",
    "maxWidth": 40,
    "lines": [
      "中文测试",
      "换行"
    ]
  },
  {
    "text": "oneverylongwordwithoutspaces",
    "maxWidth": 40,
    "lines": [
      "onev",
      "eryl",
      "ongw",
      "ordw",
      "itho",
      "utsp",
      "aces"
    ]
  }
]

/** Upstream `getWorldPos` results, `rect: null` for missing ids. */
export const GOLDEN_WORLD_RECTS: { id: string; rect: PurRect | null }[] = [
  {
    "id": "n1",
    "rect": {
      "x": 0,
      "y": 0,
      "w": 250,
      "h": 120
    }
  },
  {
    "id": "t1",
    "rect": {
      "x": 400,
      "y": 100,
      "w": 120,
      "h": 60
    }
  },
  {
    "id": "n2",
    "rect": {
      "x": 210,
      "y": 310,
      "w": 200,
      "h": 80
    }
  },
  {
    "id": "n3",
    "rect": {
      "x": 610,
      "y": 10,
      "w": 100,
      "h": 60
    }
  },
  {
    "id": "g1",
    "rect": {
      "x": 200,
      "y": 300,
      "w": 300,
      "h": 200
    }
  },
  {
    "id": "g2",
    "rect": {
      "x": 600,
      "y": 0,
      "w": 200,
      "h": 200
    }
  },
  {
    "id": "missing",
    "rect": null
  }
]

/** Upstream `getPinWorldPos` results, null when the node or pin is absent. */
export const GOLDEN_PIN_WORLD: { nodeId: string; pinId: string; result: (PurPoint & { isInput: boolean }) | null }[] = [
  {"nodeId":"n1","pinId":"o1","result":{"x":250,"y":67.5,"isInput":false}},
  {"nodeId":"n1","pinId":"i2","result":{"x":0,"y":98.5,"isInput":true}},
  {"nodeId":"n2","pinId":"o3","result":{"x":410,"y":373,"isInput":false}},
  {"nodeId":"n2","pinId":"i3","result":{"x":210,"y":373,"isInput":true}},
  {"nodeId":"t1","pinId":"o1","result":null},
  {"nodeId":"n1","pinId":"nope","result":null},
  {"nodeId":"missing","pinId":"o1","result":null}
]

/** Pin row offsets per card kind: code nodes start below their header, text cards do not. */
export const GOLDEN_PIN_OFFSETS: {
  w: number
  h: number
  inputCount: number
  outputCount: number
  isInput: boolean
  index: number
  result: PurPoint
}[] = [
  {"w":250,"h":120,"inputCount":2,"outputCount":2,"isInput":false,"index":0,"result":{"x":250,"y":67.5}},
  {"w":250,"h":120,"inputCount":2,"outputCount":2,"isInput":false,"index":1,"result":{"x":250,"y":98.5}},
  {"w":250,"h":120,"inputCount":2,"outputCount":2,"isInput":true,"index":1,"result":{"x":0,"y":98.5}},
  {"w":200,"h":80,"inputCount":1,"outputCount":1,"isInput":false,"index":0,"result":{"x":200,"y":63}},
  {"w":100,"h":60,"inputCount":0,"outputCount":1,"isInput":false,"index":0,"result":{"x":100,"y":52}},
  {"w":0,"h":0,"inputCount":0,"outputCount":0,"isInput":true,"index":0,"result":{"x":0,"y":63}}
]

/** Upstream grid spacing for each zoom level. */
export const GOLDEN_GRID: { scale: number; step: number }[] = [
  {
    "scale": 0.05,
    "step": 1000
  },
  {
    "scale": 0.1,
    "step": 500
  },
  {
    "scale": 0.25,
    "step": 200
  },
  {
    "scale": 0.5,
    "step": 100
  },
  {
    "scale": 0.8,
    "step": 50
  },
  {
    "scale": 1,
    "step": 50
  },
  {
    "scale": 1.5,
    "step": 20
  },
  {
    "scale": 2,
    "step": 20
  },
  {
    "scale": 2.5,
    "step": 20
  },
  {
    "scale": 3,
    "step": 20
  },
  {
    "scale": 4,
    "step": 10
  },
  {
    "scale": 5,
    "step": 10
  },
  {
    "scale": 7,
    "step": 5
  },
  {
    "scale": 8,
    "step": 5
  },
  {
    "scale": 10,
    "step": 5
  },
  {
    "scale": 20,
    "step": 2
  },
  {
    "scale": 50,
    "step": 1
  },
  {
    "scale": 100,
    "step": 0.5
  }
]

/** Upstream `getElementAt` results, `id: null` when nothing is hit. */
export const GOLDEN_ELEMENT_AT: { x: number; y: number; scale: number; id: string | null }[] = [
  {
    "x": 100,
    "y": 100,
    "scale": 1,
    "id": "n1"
  },
  {
    "x": 410,
    "y": 110,
    "scale": 1,
    "id": "t1"
  },
  {
    "x": 250,
    "y": 400,
    "scale": 1,
    "id": "g1"
  },
  {
    "x": 260,
    "y": 340,
    "scale": 1,
    "id": "n2"
  },
  {
    "x": 610,
    "y": 20,
    "scale": 1,
    "id": "g2"
  },
  {
    "x": -10,
    "y": -10,
    "scale": 1,
    "id": null
  },
  {
    "x": 292.5,
    "y": 95,
    "scale": 1,
    "id": "l2"
  },
  {
    "x": 492.5,
    "y": 95,
    "scale": 0.1,
    "id": "l2"
  },
  {
    "x": 492.5,
    "y": 95,
    "scale": 1,
    "id": null
  },
  {
    "x": 492.5,
    "y": 95,
    "scale": 0.04,
    "id": "l2"
  }
]

/** Upstream `getPinAt` results. */
export const GOLDEN_PIN_AT: { x: number; y: number; scale: number; hit: PurPinHit | null }[] = [
  {"x":251,"y":19,"scale":1,"hit":null},
  {"x":-1,"y":19,"scale":1,"hit":null},
  {"x":-1,"y":103,"scale":1,"hit":{"nodeId":"n1","pinId":"i2","isOutput":false}},
  {"x":212,"y":323,"scale":1,"hit":null},
  {"x":251,"y":19,"scale":0.5,"hit":null},
  {"x":600,"y":10,"scale":1,"hit":null}
]

/** Upstream `getLineEndpointAt` results. */
export const GOLDEN_LINE_ENDPOINT_AT: { x: number; y: number; scale: number; hit: PurLineEndpointHit | null }[] = [
  {"x":251,"y":19,"scale":1,"hit":null},
  {"x":211,"y":323,"scale":1,"hit":null},
  {"x":251,"y":19,"scale":0.5,"hit":null},
  {"x":252,"y":104,"scale":1,"hit":{"lineId":"l2","isFrom":true,"nodeId":"n1","pinId":"o2"}},
  {"x":0,"y":0,"scale":1,"hit":null}
]

/** Pin of the fixture's first code node, usable in tests that rebuild a node. */
export const EXAMPLE_PIN: PurPin = { id: 'i1', label: 'a' }
