import type { PackageInterface } from "../Database";
import type { OmitDatabase } from "../Omit";

export type PackageType = OmitDatabase<PackageInterface>;
