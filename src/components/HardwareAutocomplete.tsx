"use client";

import { useEffect, useId, useState } from "react";
import type { KeyboardEvent } from "react";

type HardwareSuggestion = {
  name: string;
  slug: string;
  projectionAvailable: boolean;
};

type HardwareAutocompleteProps = {
  id: string;
  kind: "cpu" | "gpu";
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

type SearchState = {
  query: string;
  loading: boolean;
  error: boolean;
  results: HardwareSuggestion[];
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function HardwareAutocomplete({
  id,
  kind,
  value,
  placeholder,
  onChange,
}: HardwareAutocompleteProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedAvailability, setSelectedAvailability] = useState<boolean | null>(null);
  const [searchState, setSearchState] = useState<SearchState>({
    query: "",
    loading: false,
    error: false,
    results: [],
  });
  const query = normalize(value);
  const shouldSearch = open && query.length >= 2;
  const currentSearch = searchState.query === query;
  const matches = currentSearch ? searchState.results : [];
  const loading = shouldSearch && (!currentSearch || searchState.loading);
  const failed = shouldSearch && currentSearch && searchState.error;

  useEffect(() => {
    if (!open || query.length < 2) {
      return;
    }

    const controller = new AbortController();
    const searchQuery = query;
    const timer = window.setTimeout(() => {
      setSearchState({ query: searchQuery, loading: true, error: false, results: [] });
      const params = new URLSearchParams({ type: kind, q: value.trim() });

      fetch("/api/hardware?" + params.toString(), { signal: controller.signal })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Hardware catalog request failed.");
          }
          return response.json() as Promise<{ results: HardwareSuggestion[] }>;
        })
        .then((payload) => {
          setSearchState({
            query: searchQuery,
            loading: false,
            error: false,
            results: payload.results,
          });
          setActiveIndex(-1);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          setSearchState({ query: searchQuery, loading: false, error: true, results: [] });
        });
    }, 140);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [kind, open, query, value]);

  function select(option: HardwareSuggestion) {
    onChange(option.name);
    setSelectedAvailability(option.projectionAvailable);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && matches.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, matches.length - 1));
    } else if (event.key === "ArrowUp" && matches.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && matches[activeIndex]) {
      event.preventDefault();
      select(matches[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const showList = shouldSearch && matches.length > 0;

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
        aria-describedby={selectedAvailability === null ? undefined : listId + "-status"}
        aria-activedescendant={activeIndex >= 0 ? listId + "-option-" + activeIndex : undefined}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        required
        onChange={(event) => {
          onChange(event.target.value);
          setSelectedAvailability(null);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
      />
      {showList && (
        <ul className="autocomplete-list" id={listId} role="listbox">
          {matches.map((option, index) => (
            <li
              className={"autocomplete-option" + (activeIndex === index ? " is-active" : "")}
              id={listId + "-option-" + index}
              key={option.slug}
              role="option"
              aria-selected={activeIndex === index}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(option)}
            >
              <span>{option.name}</span>
              <small className={option.projectionAvailable ? "support-ready" : "support-missing"}>
                {option.projectionAvailable ? "Projection data" : "No score yet"}
              </small>
            </li>
          ))}
        </ul>
      )}
      {open && query.length < 2 && (
        <div className="autocomplete-hint">Type at least 2 characters to search the hardware catalog.</div>
      )}
      {loading && <div className="autocomplete-hint">Searching hardware catalog…</div>}
      {failed && (
        <div className="autocomplete-empty">Suggestions are unavailable right now. You can still type your model.</div>
      )}
      {shouldSearch && !loading && !failed && matches.length === 0 && (
        <div className="autocomplete-empty">No catalog match. You can keep your typed model name.</div>
      )}
      {selectedAvailability !== null && (
        <p className={"hardware-selection-status " + (selectedAvailability ? "support-ready" : "support-missing")} id={listId + "-status"}>
          {selectedAvailability
            ? "Ranking data found. This setup can receive a projected range."
            : "No ranking match yet. The estimator will withhold an FPS range for this model."}
        </p>
      )}
    </div>
  );
}
