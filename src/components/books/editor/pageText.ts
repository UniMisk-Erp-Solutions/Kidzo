/** Editable "built-in" text of a book page (titles, stories, names…).
 *
 *  The words on a page come from the memory (title / story) or from the book (name, subtitle). To let people
 *  rewrite them for ONE book without changing the original memory, edits are saved per page as
 *  `textOverrides` ({ fieldKey: text }) and applied to the page object just before it is rendered.
 *  An empty-string override blanks the field (e.g. a blank story removes the sticky note that holds it). */

import type { BookPage } from "../BookPages";

export type TextOverrides = Record<string, string>;

export type PageTextField = {
  /** Stable key stored in `textOverrides`. */
  key: string;
  /** Short label shown above the input, e.g. "Story". */
  label: string;
  /** Group heading when a page holds several memories. */
  group?: string;
  /** The text as it is in the original design (before overrides). */
  original: string;
  multiline: boolean;
};

/** The fields a user can rewrite on this page. */
export function getPageTextFields(page: BookPage): PageTextField[] {
  switch (page.kind) {
    case "cover": {
      const f: PageTextField[] = [{ key: "page:title", label: "Title", original: page.title, multiline: false }];
      if (page.subtitle) f.push({ key: "page:subtitle", label: "Subtitle", original: page.subtitle, multiline: false });
      f.push({ key: "page:childName", label: "Name", original: page.childName, multiline: false });
      return f;
    }
    case "intro":
      return [{ key: "page:title", label: "Title", original: page.title, multiline: false }];
    case "chapter":
      return [
        { key: "page:title", label: "Title", original: page.title, multiline: false },
        { key: "page:subtitle", label: "Subtitle", original: page.subtitle, multiline: false },
      ];
    case "memory":
      return [
        { key: `${page.memory.id}:title`, label: "Title", original: page.memory.title, multiline: false },
        { key: `${page.memory.id}:story`, label: "Story", original: page.memory.story ?? "", multiline: true },
      ];
    case "memory-spread":
      return page.memories.flatMap((m) => [
        { key: `${m.id}:title`, label: "Title", group: m.title, original: m.title, multiline: false },
        { key: `${m.id}:story`, label: "Story", group: m.title, original: m.story ?? "", multiline: true },
      ]);
    case "back":
      return [{ key: "page:childName", label: "Name", original: page.childName, multiline: false }];
  }
}

/** Returns the page with the user's text edits applied (the input page is not modified). */
export function applyTextOverrides(page: BookPage, overrides?: TextOverrides): BookPage {
  if (!overrides || Object.keys(overrides).length === 0) return page;
  const has = (k: string) => Object.prototype.hasOwnProperty.call(overrides, k);
  const mem = <T extends { id: string; title: string; story: string | null }>(m: T): T => ({
    ...m,
    title: has(`${m.id}:title`) ? overrides[`${m.id}:title`] : m.title,
    story: has(`${m.id}:story`) ? overrides[`${m.id}:story`] : m.story,
  });

  switch (page.kind) {
    case "cover":
      return {
        ...page,
        title: has("page:title") ? overrides["page:title"] : page.title,
        subtitle: has("page:subtitle") ? overrides["page:subtitle"] : page.subtitle,
        childName: has("page:childName") ? overrides["page:childName"] : page.childName,
      };
    case "intro":
      return { ...page, title: has("page:title") ? overrides["page:title"] : page.title };
    case "chapter":
      return {
        ...page,
        title: has("page:title") ? overrides["page:title"] : page.title,
        subtitle: has("page:subtitle") ? overrides["page:subtitle"] : page.subtitle,
      };
    case "memory":
      return { ...page, memory: mem(page.memory) };
    case "memory-spread":
      return { ...page, memories: page.memories.map(mem) };
    case "back":
      return { ...page, childName: has("page:childName") ? overrides["page:childName"] : page.childName };
  }
}
