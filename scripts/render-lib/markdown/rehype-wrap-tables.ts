/**
 * @module Infrastructure/RenderLib/Markdown/RehypeWrapTables
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Wrap `<table>` in a horizontally-scrollable `<div>`
 *
 * @description
 * Wraps every `<table>` element in a `<div class="rm-table-wrap">` so
 * wide tables can scroll horizontally without forcing `display: block`
 * on the `<table>` itself. Keeping the native `display: table` preserves
 * column sizing and the table semantics that assistive technology relies
 * on.
 *
 * Round-5 split: extracted from `render-lib/markdown.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Element, Root } from 'hast';
import { visit, SKIP } from 'unist-util-visit';

/**
 * Rehype plugin: wrap every `<table>` element in a
 * `<div class="rm-table-wrap">`. Idempotent — tables already wrapped in
 * a div carrying the `rm-table-wrap` class are not re-wrapped.
 */
export function rehypeWrapTables() {
  return (tree: Root): void => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'table' || !parent || typeof index !== 'number') {
        return;
      }
      if (
        parent.type === 'element' &&
        (parent as Element).tagName === 'div'
      ) {
        const className = (parent as Element).properties?.className as
          | string
          | string[]
          | undefined;
        const classNames = Array.isArray(className)
          ? className
          : (className ?? '').split(/\s+/);
        if (classNames.includes('rm-table-wrap')) {
          return;
        }
      }
      const wrapper: Element = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['rm-table-wrap'] },
        children: [node],
      };
      (parent.children as unknown as Element[])[index] = wrapper;
      return [SKIP, index + 1];
    });
  };
}
