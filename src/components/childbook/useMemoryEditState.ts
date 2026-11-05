import { useEffect, useState } from "react";
import type { Memory } from "@/hooks/useMemories";
import { useMemoryEditPhotos } from "./useMemoryEditPhotos";

/** All editable fields of a memory, reset whenever another memory is opened. */
export const useMemoryEditState = (memory: Memory | null) => {
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [happenedAt, setHappenedAt] = useState<Date>(new Date());
  const [category, setCategory] = useState("Everyday");
  const [who, setWho] = useState<string[]>([]);
  const [whoInput, setWhoInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const photos = useMemoryEditPhotos(memory);

  useEffect(() => {
    if (!memory) return;
    setTitle(memory.title);
    setStory(memory.story ?? "");
    setHappenedAt(new Date(memory.happened_at));
    setCategory(memory.category);
    setWho(memory.who_was_there ?? []);
    setTags(memory.tags ?? []);
    setWhoInput("");
    setTagInput("");
  }, [memory]);

  return {
    title, setTitle,
    story, setStory,
    happenedAt, setHappenedAt,
    category, setCategory,
    who, setWho,
    whoInput, setWhoInput,
    tags, setTags,
    tagInput, setTagInput,
    photos,
  };
};

export type MemoryEditState = ReturnType<typeof useMemoryEditState>;
