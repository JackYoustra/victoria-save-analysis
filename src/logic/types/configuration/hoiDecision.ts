import {StringBoolean} from "../save/save";
import {Effects} from "./hoiEvent";

interface DecisionTypeFile<T> {
    [categoryName: string]: T[] | T | undefined;
}

export type DecisionCategoryFile = DecisionTypeFile<DecisionCategory>;

export interface DecisionCategory {
    icon: string;
    available: any; // Maybe trigger?
    visible_when_empty: StringBoolean;
}

export type DecisionFile = DecisionTypeFile<{[decisionName: string]: Decision[] | Decision | undefined}>

export interface Decision {
    complete_effect: Effects;
    available: any;
    visible: any;
    // In political power
    cost: number;
    // Default: true
    fixed_random_seed: StringBoolean;
    ai_will_do: String;
}