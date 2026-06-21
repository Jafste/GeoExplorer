import { countryOptions, MAX_SELECTED_COUNTRIES, RANDOM_COUNTRY_VALUE } from "../app/countryOptions";
import { useEffect, useMemo, useRef, useState } from "react";

interface CountryScopeSelectProps {
  value?: string[] | null;
  onChange: (countries: string[]) => void;
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-PT");
}

export function CountryScopeSelect({ value, onChange }: CountryScopeSelectProps) {
  const selectedCountries = value ?? [];
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const filteredCountries = useMemo(() => {
    const query = normalizeSearch(search.trim());
    const matchingCountries = query
      ? countryOptions.filter((country) => normalizeSearch(country).includes(query))
      : countryOptions;
    const selectedSet = new Set(selectedCountries);

    return matchingCountries
      .map((country, index) => ({ country, index }))
      .sort((left, right) =>
        Number(selectedSet.has(right.country)) - Number(selectedSet.has(left.country)) ||
        left.index - right.index
      )
      .map(({ country }) => country);
  }, [search, selectedCountries]);
  const triggerText =
    selectedCountries.length === 0
      ? "Aleatório"
      : selectedCountries.length === 1
        ? selectedCountries[0]
        : `${selectedCountries.length} países`;

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    searchRef.current?.focus();
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const toggleCountry = (country: string) => {
    if (selectedCountries.includes(country)) {
      onChange(selectedCountries.filter((selected) => selected !== country));
      return;
    }

    if (selectedCountries.length < MAX_SELECTED_COUNTRIES) {
      onChange([...selectedCountries, country]);
    }
  };

  return (
    <div className="setup-field country-picker" ref={pickerRef}>
      <span className="field-label">Países</span>
      <div className="country-dropdown">
        <button
          aria-expanded={open}
          className={["country-trigger", open ? "is-open" : ""].filter(Boolean).join(" ")}
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <span>{triggerText}</span>
          <span aria-hidden="true" className="country-trigger-arrow">▾</span>
        </button>
        {open ? (
          <div className="country-popover">
            <input
              aria-label="Pesquisar país"
              autoComplete="off"
              className="country-search"
              name="country-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar país…"
              ref={searchRef}
              type="search"
              value={search}
            />
            <div className="country-option-list">
              <button
                aria-pressed={selectedCountries.length === 0}
                className={["country-option-row", selectedCountries.length === 0 ? "is-selected" : ""]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onChange([])}
                type="button"
                value={RANDOM_COUNTRY_VALUE}
              >
                <span className="country-check">✓</span>
                <span>Aleatório</span>
              </button>
              {filteredCountries.map((country) => {
                const checked = selectedCountries.includes(country);
                const disabled = selectedCountries.length >= MAX_SELECTED_COUNTRIES && !checked;
                return (
                  <button
                    aria-pressed={checked}
                    className={["country-option-row", checked ? "is-selected" : ""]
                      .filter(Boolean)
                      .join(" ")}
                    disabled={disabled}
                    key={country}
                    onClick={() => toggleCountry(country)}
                    type="button"
                  >
                    <span className="country-check">✓</span>
                    <span>{country}</span>
                  </button>
                );
              })}
              {filteredCountries.length === 0 ? (
                <span className="country-empty">Sem países encontrados.</span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
      <span className="field-hint">
        {selectedCountries.length}/{MAX_SELECTED_COUNTRIES} países. Sem seleção usa toda a Europa.
      </span>
    </div>
  );
}
