import type { ProductInterface } from "../Database";
import type { OmitDatabase } from "../Omit";

export type ProductType = OmitDatabase<ProductInterface>;
