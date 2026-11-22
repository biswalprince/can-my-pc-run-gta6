"use client";

import { useId, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import type { HardwareOption } from "@/data/hardwareCatalog";

type HardwareAutocompleteProps = {
  id: string;
  value: string;
  options: HardwareOption[];
  placeholder: string;
  onChange: (value: string) => void;
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function HardwareAutocomplete({
  id,
  value,
  options,
  placeholder,
  onChange,
}: HardwareAutocompleteProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const query = normalize(value);

  const matches = useMemo(() => {
    const ranked = options
      .map((option) => {
        const terms = [option.name, ...(option.aliases ?? [])].map(normalize);
        const rank = query.length === 0
          ? 0
          : terms.some((term) => term.startsWith(query))
            ? 0
            : terms.some((term) => term.includes(query))
              ? 1
              : -1;
        return { option, rank };
      })
      .filter((entry) => entry.rank >= 0)
      .sort((a, b) => a.rank - b.rank || a.option.name.localeCompare(b.option.name));

    return ranked.slice(0, 8).map((entry) => entry.option);
  }, [options, query]);

  function select(option: HardwareOption) {
    onChange(option.name);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, matches.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && open && activeIndex >= 0 && matches[activeIndex]) {
      event.preventDefault();
      select(matches[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const showList = open && matches.length > 0;

  return (
    <div className="autocomplete">
      <input
        id={id}
        name={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={activeIndex >= 0 ? listId + "-option-" + activeIndex : undefined}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        required
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
      />
      {showList && (
        <ul className="autocomplete-list" id={listId} role="listbox">
          {matches.map((option, index) => (
            <li
              className={"autocomplete-option" + (activeIndex === index ? " is-active" : "")}
              id={listId + "-option-" + index}
              key={option.segment + "-" + option.name}
              role="option"
              aria-selected={activeIndex === index}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(option)}
            >
              <span>{option.name}</span>
              <small>{option.vendor} · {option.segment}</small>
            </li>
          ))}
        </ul>
      )}
      {open && query.length > 0 && matches.length === 0 && (
        <div className="autocomplete-empty">No catalog match. You can keep your typed model name.</div>
      )}
    </div>
  );
}
