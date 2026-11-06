/**
 * Element model for the platform-neutral Pur kernel. Positions and sizes use
 * Pur's `w`/`h`; the JSON Canvas wire format in `canvas-types.ts` uses
 * `width`/`height` and is converted at the boundary.
 * @module dsh-obsidian-vault/pur-kernel/types
 */

/** The six element kinds a Pur canvas holds. */
export type PurElementType = 'text' | 'image' | 'note-link' | 'code-node' | 'group' | 'line'

/** The edge of an element a line leaves from or arrives at. */
export type PurSide = 'left' | 'right' | 'top' | 'bottom'

/** How a line is routed between its endpoints. */
export type PurLineStyle = 'curve' | 'straight' | 'rect'

/** One connection point on a code node or note-link. */
export interface PurPin {
  /** Stable pin id, referenced by `line.fromPin` / `line.toPin`. */
  id: string
  /** The variable name the pin carries, drawn beside the node. */
  label: string
}

/** Properties every non-line element shares. */
export interface PurElementBase {
  /** Stable element id, referenced by lines and group membership. */
  id: string
  /** Left edge, relative to the parent group when nested. */
  x: number
  /** Top edge, relative to the parent group when nested. */
  y: number
  /** Width. */
  w: number
  /** Height. */
  h: number
  /** Degrees around the element centre. */
  rotation?: number
  /** Drawn alpha, 0–1. */
  opacity?: number
  /** Hex colour, when the element kind draws one. */
  color?: string
  /** Card fill, a CSS colour or `rgba(...)`. */
  bgColor?: string
  /** Text colour of labels and bodies, a CSS colour. */
  textColor?: string
  /** Text size in px, for the element's own label or body. */
  fontSize?: number
  /** CSS font family for the element's own label or body. */
  fontFamily?: string
  /** Mirror horizontally about the element centre. */
  flipH?: boolean
  /** Mirror vertically about the element centre. */
  flipV?: boolean
  /** When true the element accepts no edits or moves. */
  locked?: boolean
  /** Timestamp of the moment the element was locked; drives the badge pulse and is persisted. */
  _lockTime?: number
  /** Input pins drawn on the left edge, in order; any element kind may carry them. */
  inputs?: PurPin[]
  /** Output pins drawn on the right edge, in order. */
  outputs?: PurPin[]
}

/** A free-text card. */
export interface PurTextElement extends PurElementBase {
  type: 'text'
  /** Card text; newlines are preserved. */
  content: string
  /** Input pins the card declares; a card with pins can be wired. */
  inputs?: PurPin[]
  /** Output pins the card declares. */
  outputs?: PurPin[]
  /** When true the body renders bold. */
  bold?: boolean
  /** Body fill alpha, defaulting to 0.92. */
  bgOpacity?: number
  /** Card heading, set by IR import for nodes that carry a graph title. */
  title?: string
}

/** An image stored either as a vault path or as an inline data URL. */
export interface PurImageElement extends PurElementBase {
  type: 'image'
  /** Vault path of the image, empty when only a data URL exists. */
  original: string
  /** Inline `data:` URL, used when the file is not in the vault. */
  dataURL?: string
  /** Vault path of a note the image is linked to, when one is. */
  link?: string
  /** Small copy drawn when the card is too small to be worth a full decode. */
  thumb?: string
}

/** A card pointing at a vault note or at an external URL. */
export interface PurNoteLinkElement extends PurElementBase {
  type: 'note-link'
  /** Cached note text or the URL, shown inside the card. */
  content: string
  /** Vault path or `http(s)` URL the card opens. */
  link: string
  /** Card fill, overriding the purple default. */
  cardColor?: string
  /** Secondary note text drawn under the title. */
  note?: string
  /** Note text size in px, defaulting to 11. */
  noteFontSize?: number
  /** Note text CSS font family. */
  noteFontFamily?: string
}

/** A visual-programming node: pins plus the `process` body it evaluates. */
export interface PurCodeNodeElement extends PurElementBase {
  type: 'code-node'
  /** Card text; empty for preset nodes, which draw their title instead. */
  content: string
  /** Body of `function process(inputs)`, for preset nodes. */
  code?: string
  /** Node title shown on the card. */
  title?: string
  /** Values the last run produced, keyed by output pin label and serialized as JSON text. */
  values?: Record<string, string>
  /** Outcome of the last run, drawn on the card. */
  run?: { ok: boolean; ms: number; error?: string }
}

/** A frame that owns child elements positioned relative to its origin. */
export interface PurGroupElement extends PurElementBase {
  type: 'group'
  /** Group label drawn at the top edge; unset until labelled. */
  content?: string
  /** Frame stroke, overriding {@link PurElementBase.color} and the default. */
  borderColor?: string
  /** Vault path of a note the group is linked to, when one is. */
  link?: string
  /** Owned elements; their `x`/`y` are group-relative. */
  children: PurElement[]
}

/** A connection between two elements, optionally between two pins. */
export interface PurLineElement {
  type: 'line'
  /** Stable element id. */
  id: string
  /** Source element id, empty while the line is unbound. */
  from: string
  /** Target element id, empty while the line is unbound. */
  to: string
  /** Source edge used for routing. */
  fromSide?: PurSide
  /** Target edge used for routing. */
  toSide?: PurSide
  /** Source code-node output pin id. */
  fromPin?: string
  /** Target code-node input pin id. */
  toPin?: string
  /** Stroke pattern. */
  style?: PurLineStyle
  /** Whether an arrowhead is drawn at the target. */
  arrow?: boolean
  /** Arrowhead length in px. */
  arrowSize?: number
  /** Stroke width in px. */
  width?: number
  /** Label drawn along the line, or its note. */
  content?: string
  /** Hex stroke colour. */
  color?: string
  /** Label text size in px, defaulting to 12. */
  fontSize?: number
  /** Label CSS font family, defaulting to sans-serif. */
  fontFamily?: string
  /** Label colour, overriding the stroke colour. */
  textColor?: string
  /** Degrees around the element centre. */
  rotation?: number
  /** Mirror horizontally; stored but not drawn for lines. */
  flipH?: boolean
  /** Mirror vertically; stored but not drawn for lines. */
  flipV?: boolean
  /** Drawn alpha, 0–1. */
  opacity?: number
  /** When true the line accepts no edits or moves. */
  locked?: boolean
  /** Timestamp of the moment the line was locked; persisted like the other kinds. */
  _lockTime?: number
  /** Left edge, when the line stores one. */
  x?: number
  /** Top edge, when the line stores one. */
  y?: number
  /** Width, when the line stores one. */
  w?: number
  /** Height, when the line stores one. */
  h?: number
}

/** Any canvas element. Narrow on `type`. */
export type PurElement =
  | PurTextElement
  | PurImageElement
  | PurNoteLinkElement
  | PurCodeNodeElement
  | PurGroupElement
  | PurLineElement

/** Every element kind the canvas places at a position. */
export type PurNodeElement = Exclude<PurElement, PurLineElement>

/** Canvas viewport: world point shown at the top-left, then zoom. */
export interface PurViewState {
  /** Horizontal pan in screen px. */
  offsetX: number
  /** Vertical pan in screen px. */
  offsetY: number
  /** Zoom factor, 1 draws at natural size. */
  scale: number
}

/** A `.PurStudio` document: the element tree plus its viewport. */
export interface PurStudioDocument {
  /** Top-level elements; groups own the rest. */
  elements: PurElement[]
  /** Viewport saved with the document. */
  viewState: PurViewState
}
