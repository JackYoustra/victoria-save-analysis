import {CountryTag, Effects} from "./hoiEvent";

export interface OnActionFile {
    on_actions?: OnActions | OnActions[];
}

type CountryEffects = {[tag in keyof CountryTag]?: Effects}

export interface OnActions {
    on_startup?: Action | Action[];
}

type StartupActionEffect = Effects & CountryEffects;

export type StartupActions = StartupActionEffect[] | StartupActionEffect;

export interface Action {
    effect?: StartupActions;
}