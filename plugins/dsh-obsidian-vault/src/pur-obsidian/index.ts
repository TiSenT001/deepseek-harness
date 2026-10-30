/**
 * Entry of the real-Obsidian Pur Studio plugin bundle; the default export is
 * the plugin class Obsidian instantiates. The bundler emits this entry as CJS
 * with `module.exports` assigned to the class, `obsidian` left external.
 * @module dsh-obsidian-vault/pur-obsidian
 */
import { PurStudioPlugin } from './plugin.ts'

export default PurStudioPlugin
