import { mockLocations } from "../data/mockLocations";

export const RANDOM_COUNTRY_VALUE = "";
export const MAX_SELECTED_COUNTRIES = 5;

export const countryOptions = Array.from(
  new Set(
    mockLocations
      .filter((location) => location.region === "europe" && location.country.trim())
      .map((location) => location.country)
  )
).sort((left, right) => left.localeCompare(right, "pt-PT"));
