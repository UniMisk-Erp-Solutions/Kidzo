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

/** The user's edit for a field, or the original when there is none. */
const pick = (overrides: TextOverrides, key: string, original: string): string =>
  Object.prototype.hasOwnProperty.call(overrides, key) ? overrides[key] : original;

type WithText = { id: string; title: string; story: string | null };
const withMemoryEdits = <T extends WithText>(m: T, o: TextOverrides): T => ({
  ...m,
  title: pick(o, `${m.id}:title`, m.title),
  story: pick(o, `${m.id}:story`, m.story ?? ""),
});

/** Returns the page with the user's text edits applied (the input page is not modified). */
export function applyTextOverrides(page: BookPage, overrides?: TextOverrides): BookPage {
  if (!overrides || Object.keys(overrides).length === 0) return page;
  const title = (v: string) => pick(overrides, "page:title", v);
  const subtitle = (v: string) => pick(overrides, "page:subtitle", v);
  const name = (v: string) => pick(overrides, "page:childName", v);

  switch (page.kind) {
    case "cover":
      return { ...page, title: title(page.title), subtitle: page.subtitle ? subtitle(page.subtitle) : page.subtitle, childName: name(page.childName) };
    case "intro":
      return { ...page, title: title(page.title) };
    case "chapter":
      return { ...page, title: title(page.title), subtitle: subtitle(page.subtitle) };
    case "memory":
      return { ...page, memory: withMemoryEdits(page.memory, overrides) };
    case "memory-spread":
      return { ...page, memories: page.memories.map((m) => withMemoryEdits(m, overrides)) };
    case "back":
      return { ...page, childName: name(page.childName) };
  }
}

/** The overrides after setting one field; setting it back to the original removes the override. */
export function withFieldText(overrides: TextOverrides, key: string, original: string, value: string): TextOverrides {
  const next = { ...overrides };
  if (value === original) delete next[key];
  else next[key] = value;
  return next;
}
