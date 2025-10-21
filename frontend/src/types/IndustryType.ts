export const IndustryType = {
  GROCERIES: "groceries",
  UTILITIES: "utilities",
  AUTOMOBILES: "automobiles",
  HOUSING: "housing",
  HOUSEHOLD_GOODS: "household goods",
  ENTERTAINMENT: "entertainment",
  LUXURY: "luxury",
} as const;

// Optional: Define a type representing the possible string values
export type IndustryTypeValue =
  (typeof IndustryType)[keyof typeof IndustryType];
