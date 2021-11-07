import {Effects} from "./hoiEvent";

export interface SetVariable {
    // The variable
    "var": string,
    // The value to set the variable to
    value: number,
}

export interface RandomList {
    [probability: number]: Effects[] | Effects | undefined;
}