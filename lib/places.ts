import { GOOGLE_PLACES_API_KEY } from "@/lib/env";

type Suggestion = {
  placeId: string;
  mainText: string;
  secondaryText: string;
};

type AddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

export type PlaceDetails = {
  placeId: string;
  name: string;
  formattedAddress: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  postcode: string;
};

export async function autocompletePlaces(input: string): Promise<Suggestion[]> {
  if (!GOOGLE_PLACES_API_KEY || !input.trim()) return [];
  try {
    const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
      },
      body: JSON.stringify({
        input: input.trim(),
        languageCode: "en",
        includedRegionCodes: ["gb"],
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("places autocomplete", response.status, await response.text());
      return [];
    }
    const json = (await response.json()) as {
      suggestions?: {
        placePrediction?: {
          placeId?: string;
          text?: { text?: string };
          structuredFormat?: {
            mainText?: { text?: string };
            secondaryText?: { text?: string };
          };
        };
      }[];
    };
    return (json.suggestions || [])
      .map((suggestion) => suggestion.placePrediction)
      .filter((prediction): prediction is NonNullable<typeof prediction> => Boolean(prediction))
      .map((prediction) => ({
        placeId: prediction.placeId || "",
        mainText: prediction.structuredFormat?.mainText?.text || prediction.text?.text || "",
        secondaryText: prediction.structuredFormat?.secondaryText?.text || "",
      }))
      .filter((suggestion) => suggestion.placeId && suggestion.mainText)
      .slice(0, 6);
  } catch (error) {
    console.error("autocompletePlaces", error);
    return [];
  }
}

function component(components: AddressComponent[], types: string[]) {
  const found = components.find((item) => item.types?.some((type) => types.includes(type)));
  return found?.longText || found?.shortText || "";
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  if (!GOOGLE_PLACES_API_KEY || !placeId) return null;
  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
          "X-Goog-FieldMask": "id,displayName,formattedAddress,addressComponents",
        },
        cache: "no-store",
      },
    );
    if (!response.ok) {
      console.error("place details", response.status, await response.text());
      return null;
    }
    const json = (await response.json()) as {
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      addressComponents?: AddressComponent[];
    };
    const components = json.addressComponents || [];
    const streetNumber = component(components, ["street_number"]);
    const route = component(components, ["route"]);
    const subpremise = component(components, ["subpremise", "premise"]);
    const locality =
      component(components, ["postal_town", "locality", "sublocality_level_1"]) || "";
    const adminArea = component(components, [
      "administrative_area_level_2",
      "administrative_area_level_1",
    ]);
    const postcode = component(components, ["postal_code"]);

    return {
      placeId: json.id || placeId,
      name: json.displayName?.text || "",
      formattedAddress: json.formattedAddress || "",
      addressLine1: [subpremise, streetNumber, route].filter(Boolean).join(" ").trim(),
      addressLine2: locality,
      addressLine3: adminArea,
      postcode,
    };
  } catch (error) {
    console.error("getPlaceDetails", error);
    return null;
  }
}
