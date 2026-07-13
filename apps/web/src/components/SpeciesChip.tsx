import type { Species } from "@vetlog/shared";

const SPECIES_LABELS: Record<Species, string> = {
  DOG: "Dog",
  CAT: "Cat",
  RABBIT: "Rabbit",
  BIRD: "Bird",
  OTHER: "Other",
};

const SPECIES_CLASSES: Record<Species, string> = {
  DOG: "bg-species-dog/15 text-species-dog",
  CAT: "bg-species-cat/15 text-species-cat",
  RABBIT: "bg-black/10 text-black/70",
  BIRD: "bg-black/10 text-black/70",
  OTHER: "bg-black/10 text-black/70",
};

export function SpeciesChip({ species }: { species: Species }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SPECIES_CLASSES[species]}`}
    >
      {SPECIES_LABELS[species]}
    </span>
  );
}
