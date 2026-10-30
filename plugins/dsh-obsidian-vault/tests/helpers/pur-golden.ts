/**
 * Golden vectors captured by running the upstream Pur Studio `main.js` data
 * layer over {@link GOLDEN_ELEMENTS}. The kernel must reproduce them exactly.
 * @module dsh-obsidian-vault/tests/helpers/pur-golden
 */
import type { PurCanvasDocument } from '../../src/pur-kernel/canvas-types.ts'
import type { PurElement } from '../../src/pur-kernel/types.ts'

/** Fixture elements handed to `elementsToJsonCanvas`. */
export const GOLDEN_ELEMENTS: PurElement[] = [
  {
    "id": "t1",
    "type": "text",
    "x": 10,
    "y": 20,
    "w": 100,
    "h": 50,
    "content": "hello\nworld",
    "color": "#e0e0e0",
    "fontSize": 14,
    "rotation": 0,
    "opacity": 1
  },
  {
    "id": "img1",
    "type": "image",
    "x": 0,
    "y": 0,
    "w": 300,
    "h": 200,
    "original": "附件/pic.png",
    "dataURL": "data:image/png;base64,AA",
    "rotation": 0,
    "opacity": 1
  },
  {
    "id": "nl1",
    "type": "note-link",
    "x": 0,
    "y": 0,
    "w": 280,
    "h": 80,
    "content": "笔记",
    "link": "笔记/目标.md",
    "rotation": 0,
    "opacity": 1
  },
  {
    "id": "nl2",
    "type": "note-link",
    "x": 0,
    "y": 0,
    "w": 280,
    "h": 80,
    "content": "https://example.com",
    "link": "https://example.com",
    "rotation": 0
  },
  {
    "id": "c1",
    "type": "code-node",
    "x": 0,
    "y": 0,
    "w": 250,
    "h": 120,
    "content": "",
    "code": "function process(inputs) { return inputs }",
    "inputs": [
      {
        "id": "p1",
        "label": "a"
      }
    ],
    "outputs": [
      {
        "id": "p2",
        "label": "sum"
      }
    ],
    "title": "加法",
    "rotation": 0,
    "opacity": 1
  },
  {
    "id": "g1",
    "type": "group",
    "x": 100,
    "y": 100,
    "w": 400,
    "h": 300,
    "content": "组",
    "color": "#ff0000",
    "rotation": 0,
    "opacity": 1,
    "children": [
      {
        "id": "t2",
        "type": "text",
        "x": 10,
        "y": 10,
        "w": 80,
        "h": 40,
        "content": "inner"
      },
      {
        "id": "g2",
        "type": "group",
        "x": 50,
        "y": 50,
        "w": 200,
        "h": 150,
        "content": "内层组",
        "children": [
          {
            "id": "t3",
            "type": "text",
            "x": 5,
            "y": 5,
            "w": 60,
            "h": 30,
            "content": "deep"
          }
        ]
      },
      {
        "id": "l1",
        "type": "line",
        "from": "t2",
        "to": "t1",
        "fromSide": "right",
        "toSide": "left",
        "content": "虚线",
        "color": "#00ff00",
        "fromPin": "p2",
        "toPin": "p1",
        "style": "curve",
        "arrow": true,
        "arrowSize": 8,
        "width": 2
      }
    ]
  },
  {
    "id": "l2",
    "type": "line",
    "from": "",
    "to": "c1",
    "content": "",
    "width": 2
  }
]

/** Upstream output of `elementsToJSONCanvas(GOLDEN_ELEMENTS)`. */
export const GOLDEN_CANVAS: PurCanvasDocument = {
  "nodes": [
    {
      "id": "t1",
      "type": "text",
      "x": 10,
      "y": 20,
      "width": 100,
      "height": 50,
      "text": "hello\nworld",
      "__pur": {
        "type": "text",
        "content": "hello\nworld",
        "color": "#e0e0e0",
        "fontSize": 14,
        "rotation": 0,
        "opacity": 1
      }
    },
    {
      "id": "img1",
      "type": "file",
      "x": 0,
      "y": 0,
      "width": 300,
      "height": 200,
      "file": "附件/pic.png",
      "__pur": {
        "type": "image",
        "original": "附件/pic.png",
        "dataURL": "data:image/png;base64,AA",
        "rotation": 0,
        "opacity": 1
      }
    },
    {
      "id": "nl1",
      "type": "file",
      "x": 0,
      "y": 0,
      "width": 280,
      "height": 80,
      "__pur": {
        "type": "note-link",
        "content": "笔记",
        "link": "笔记/目标.md",
        "rotation": 0,
        "opacity": 1
      },
      "file": "笔记/目标.md"
    },
    {
      "id": "nl2",
      "type": "link",
      "x": 0,
      "y": 0,
      "width": 280,
      "height": 80,
      "__pur": {
        "type": "note-link",
        "content": "https://example.com",
        "link": "https://example.com",
        "rotation": 0
      },
      "url": "https://example.com"
    },
    {
      "id": "c1",
      "type": "text",
      "x": 0,
      "y": 0,
      "width": 250,
      "height": 120,
      "text": "```javascript\nfunction process(inputs) { return inputs }\n```",
      "__pur": {
        "type": "code-node",
        "content": "",
        "code": "function process(inputs) { return inputs }",
        "inputs": [
          {
            "id": "p1",
            "label": "a"
          }
        ],
        "outputs": [
          {
            "id": "p2",
            "label": "sum"
          }
        ],
        "title": "加法",
        "rotation": 0,
        "opacity": 1
      }
    },
    {
      "id": "g1",
      "type": "group",
      "x": 100,
      "y": 100,
      "width": 400,
      "height": 300,
      "label": "组",
      "color": "#ff0000",
      "__pur": {
        "type": "group",
        "content": "组",
        "color": "#ff0000",
        "rotation": 0,
        "opacity": 1
      }
    },
    {
      "id": "t2",
      "type": "text",
      "x": 110,
      "y": 110,
      "width": 80,
      "height": 40,
      "text": "inner",
      "__pur": {
        "type": "text",
        "content": "inner",
        "parentGroupId": "g1"
      }
    },
    {
      "id": "g2",
      "type": "group",
      "x": 150,
      "y": 150,
      "width": 200,
      "height": 150,
      "label": "内层组",
      "__pur": {
        "type": "group",
        "content": "内层组",
        "parentGroupId": "g1"
      }
    },
    {
      "id": "t3",
      "type": "text",
      "x": 155,
      "y": 155,
      "width": 60,
      "height": 30,
      "text": "deep",
      "__pur": {
        "type": "text",
        "content": "deep",
        "parentGroupId": "g2"
      }
    }
  ],
  "edges": [
    {
      "id": "l1",
      "fromNode": "t2",
      "toNode": "t1",
      "fromSide": "right",
      "toSide": "left",
      "color": "#00ff00",
      "label": "虚线",
      "__pur": {
        "fromPin": "p2",
        "toPin": "p1",
        "style": "curve",
        "arrow": true,
        "arrowSize": 8
      }
    },
    {
      "id": "l2",
      "fromNode": "",
      "toNode": "c1",
      "fromSide": "right",
      "toSide": "left",
      "label": "",
      "__pur": {}
    }
  ]
}

/** Upstream output of `jsonCanvasToElements(GOLDEN_CANVAS)`. */
export const GOLDEN_IMPORTED: PurElement[] = [
  {
    "id": "g1",
    "type": "group",
    "x": 100,
    "y": 100,
    "w": 400,
    "h": 300,
    "content": "组",
    "rotation": 0,
    "opacity": 1,
    "color": "#ff0000",
    "children": [
      {
        "id": "t2",
        "x": 10,
        "y": 10,
        "w": 80,
        "h": 40,
        "type": "text",
        "content": "inner"
      }
    ]
  },
  {
    "id": "g2",
    "type": "group",
    "x": 150,
    "y": 150,
    "w": 200,
    "h": 150,
    "content": "内层组",
    "rotation": 0,
    "opacity": 1,
    "children": [
      {
        "id": "t3",
        "x": 5,
        "y": 5,
        "w": 60,
        "h": 30,
        "type": "text",
        "content": "deep"
      }
    ]
  },
  {
    "id": "t1",
    "x": 10,
    "y": 20,
    "w": 100,
    "h": 50,
    "type": "text",
    "content": "hello\nworld",
    "color": "#e0e0e0",
    "fontSize": 14,
    "rotation": 0,
    "opacity": 1
  },
  {
    "id": "img1",
    "x": 0,
    "y": 0,
    "w": 300,
    "h": 200,
    "type": "image",
    "original": "附件/pic.png",
    "dataURL": "data:image/png;base64,AA",
    "rotation": 0,
    "opacity": 1
  },
  {
    "id": "nl1",
    "x": 0,
    "y": 0,
    "w": 280,
    "h": 80,
    "type": "note-link",
    "content": "笔记",
    "link": "笔记/目标.md",
    "rotation": 0,
    "opacity": 1
  },
  {
    "id": "nl2",
    "x": 0,
    "y": 0,
    "w": 280,
    "h": 80,
    "type": "note-link",
    "content": "https://example.com",
    "link": "https://example.com",
    "rotation": 0
  },
  {
    "id": "c1",
    "x": 0,
    "y": 0,
    "w": 250,
    "h": 120,
    "type": "code-node",
    "content": "",
    "code": "function process(inputs) { return inputs }",
    "inputs": [
      {
        "id": "p1",
        "label": "a"
      }
    ],
    "outputs": [
      {
        "id": "p2",
        "label": "sum"
      }
    ],
    "title": "加法",
    "rotation": 0,
    "opacity": 1
  },
  {
    "id": "l1",
    "type": "line",
    "from": "t2",
    "to": "t1",
    "fromSide": "right",
    "toSide": "left",
    "color": "#00ff00",
    "width": 2,
    "content": "虚线",
    "fromPin": "p2",
    "toPin": "p1",
    "style": "curve",
    "arrow": true,
    "arrowSize": 8
  },
  {
    "id": "l2",
    "type": "line",
    "from": "",
    "to": "c1",
    "fromSide": "right",
    "toSide": "left",
    "width": 2,
    "content": ""
  }
]

/** Upstream output of `jsonCanvasToElements` for a canvas without `__pur`. */
export const GOLDEN_LEGACY_ELEMENTS: PurElement[] = [
  {
    "id": "g1",
    "type": "group",
    "x": 0,
    "y": 0,
    "w": 10,
    "h": 10,
    "content": "g",
    "rotation": 0,
    "opacity": 1,
    "children": []
  },
  {
    "id": "f1",
    "type": "image",
    "x": 0,
    "y": 0,
    "w": 100,
    "h": 60,
    "original": "pic.jpg",
    "rotation": 0,
    "opacity": 1
  },
  {
    "id": "f2",
    "type": "note-link",
    "x": 0,
    "y": 0,
    "w": 160,
    "h": 90,
    "content": "笔记/a.md",
    "link": "笔记/a.md",
    "rotation": 0,
    "opacity": 1
  },
  {
    "id": "l1",
    "type": "note-link",
    "x": 0,
    "y": 0,
    "w": 50,
    "h": 20,
    "content": "https://x.test",
    "link": "https://x.test",
    "rotation": 0,
    "opacity": 1
  },
  {
    "id": "x1",
    "type": "text",
    "x": 5,
    "y": 5,
    "w": 30,
    "h": 20,
    "content": "plain",
    "bgColor": "rgba(30,30,30,0.8)",
    "color": "#123456",
    "fontSize": 14,
    "rotation": 0,
    "opacity": 1
  },
  {
    "id": "e1",
    "type": "line",
    "from": "",
    "to": "x1",
    "fromSide": "right",
    "toSide": "left",
    "width": 2,
    "content": "edge"
  }
]
