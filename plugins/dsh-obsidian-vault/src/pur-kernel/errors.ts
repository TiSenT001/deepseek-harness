/**
 * Failures raised while reading a persisted Pur document.
 * @module dsh-obsidian-vault/pur-kernel/errors
 */

/** A `.PurStudio` or JSON Canvas file whose contents cannot be interpreted. */
export class PurDocumentError extends Error {
  /**
   * @param message - what is wrong with the document.
   * @param options - standard error options; `cause` carries the parse error.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'PurDocumentError'
  }
}
