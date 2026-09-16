import { NatureErrors } from "./NatureErrors.enum";

const { DATABASE, DOMAIN, INTERNAL, NEGOTIATE } = NatureErrors;
type SpecInfo = {
  code: string;
  description: string;
};

export const SPecificityError = {
  [DATABASE]: [{ code: "101", description: "connection" }, { code: "002", description: "query" }],
  [DOMAIN]: [{ code: "101", description: "validation" }],
  [INTERNAL]: [{ code: "102", description: "io" }],
  [NEGOTIATE]: [{ code: "103", description: "rule_businnes" },{ code: "102", description: "validation" }],
} as const satisfies Record<NatureErrors, readonly SpecInfo[]>;

export type Specificity<N extends NatureErrors = NatureErrors> =
  (typeof SPecificityError)[N][number];
export type SelectedSpecificity<N extends NatureErrors = NatureErrors> =
  (typeof SPecificityError)[N][number]["description"];

export function LoadGetSpecificity(
  nature: NatureErrors,
  s: SelectedSpecificity,
): Specificity {
  const specificityFounded = SPecificityError[nature].find(
    ({ description }) => description === s,
  );
  if (!specificityFounded) {
    throw new Error(`Specificity ${s} not found for nature ${nature}`);
  }
  return specificityFounded;
}
