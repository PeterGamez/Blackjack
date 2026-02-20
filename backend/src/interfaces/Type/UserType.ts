import { UserInterface } from "../Database";
import { OmitDatabase } from "../Omit";

export type UserType = OmitDatabase<UserInterface>;
