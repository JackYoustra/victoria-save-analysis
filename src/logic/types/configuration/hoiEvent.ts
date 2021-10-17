import { StringBoolean } from "../save/save";
import {box} from "../../collections/collections";
import _ from "lodash";
import ScriptDocs from '../../../../hoidocs/script_documentation.json';

export interface EventList {
    add_namespace?: string[] | string;
    // Evaluated at the country level
    country_event?: Event[] | Event;
    country_Event?: Event[] | Event;
    news_event?:    Event[] | Event;
    // Evaluated for each state
    state_event?:   Event[] | Event;
}

export interface TriggeredText {
    text: string,
    // Format: <variable> <|>|= <date>
    trigger: string
}

export type Title = string | TriggeredText;

interface Timed {
    // Default: one day
    // Events evaluated every 20 days, probability of event firing is 20/MTTH
    mean_time_to_happen?: MeanTimeToHappen;

    // An alternate, more efficient way to do dates
    days?: number;
    hours?: number;
    random?: number;
    random_days?: number
}

export function TimedHours(timed: Timed): number {
    if (_.isObject(timed.mean_time_to_happen)) {
        return MTTHDays(timed.mean_time_to_happen) * 24;
    }
    return (timed.hours ?? 0) + ((timed.days ?? 0) * 24) + (((timed.random_days ?? 0.0) / 2) * 24);
}

export interface Event extends Timed {
    id:                string;
    title:             string;
    desc:              string;
    picture:           string;
    // Top-level defaults to AND trigger
    trigger:           Trigger;
    // Default: false
    fire_only_once?: StringBoolean;
    // Default: 13. Number of days to respond to event.
    timeout_days?: number;
    // If false, event not shown to sending country. Default true.
    fire_for_sender?: StringBoolean;
    // Whether the event is shown. Default no.
    hidden?: StringBoolean;
    // Default no
    exclusive?: StringBoolean;
    // Default no, whether the event is shown to all countries.
    major?: StringBoolean;
    // AND trigger of which countries a major event is shown to.
    show_major?: Trigger;
    // Event option
    option?: Option[] | Option;
    // Option that happens unconditionally when the effect happens
    immediate?: Option[] | Option;
}

export interface MeanTimeToHappen {
    // All the below are any number, but decimal places are truncated (so only whole values effectively count)
    days?: number;
    months?: number;
    years?: number;

    // Combines components
    // Modifiers applied in array order
    modifier?: Modifier[] | Modifier;
}

interface ModifierInterface {
    factor?: number;
    add?: number;
}

export type Modifier = ModifierInterface & Conditioned;

// Specc'ed to https://hoi4.paradoxwikis.com/Event_modding#trigger
export function MTTHDays(mtth: MeanTimeToHappen): number {
    // Processed in object key order, so just take the last "day, month, year" appearing
    // The word is "sets base" so we don't have to worry about anything but the last
    const keys = Object.keys(mtth);
    const usingIndex = Math.max(keys.lastIndexOf("days"), keys.lastIndexOf("months"), keys.lastIndexOf("years"));
    // Default one day
    let days = 1;
    if (usingIndex != -1) {
        const key = keys[usingIndex];
        days = mtth[key];
        if (key == "months") {
            days *= 30;
        } else if (key == "years") {
            days *= 365;
        }
    }
    for (const modifier of box(mtth.modifier)) {
        // Check if conditions true first
        if ((_.isNumber(modifier.factor) || _.isNumber(modifier.add)) && isFulfilled(modifier)) {
            if (_.isNumber(modifier.factor)) {
                days *= modifier.factor; // Should truncate?
            }
            if (_.isNumber(modifier.add)) {
                days += modifier.add; // Should truncate?
            }
            // Stop early if intermediate value is zero
            if (days == 0) {
                break;
            }
        }
    }
    return days;
}

export function isFulfilled(conditioned: Conditioned): boolean {
    return true;
}

export interface CountryEventClass {
    log: string;
}

type EffectKeys = keyof typeof ScriptDocs.effects;
export type Effects = { [effect in EffectKeys]: any[] | any };

interface OptionInterface {
    // The option will only appear if trigger fulfilled
    trigger:                  Trigger;
    // Localization string. Default: 1
    name:                     string;
    // Default: 1
    ai_chance?:                number;
    // hidden_effect?:           CountryEvent[] | CountryEvent;
    // custom_effect_tooltip?:   string;
    // add_manpower?:            number;
    // tno_training_improve?:    StringBoolean;
    // tno_conscription_worsen?: StringBoolean;
    // set_country_flag?:        string;
    // remove_unit_leader?:      number[];
    // add_political_power?:     number;
    // add_stability?:           number;
    // Default no, for major events, this option is only available to direct recipient
    original_recipient_only?: StringBoolean;
}

export type Option = OptionInterface & Effects;

type Upper = 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J'|'K'|'L'|'M'|'N'|'O'|'P'|'Q'|'R'|'S'|'T'|'U'|'V'|'W'|'X'|'Y'|'Z';
export type CountryTag = `${Upper}${Upper}${Upper}`;

export enum ConditionalTypes {
    NOT = "NOT",
    AND = "AND",
    OR = "OR",
}

type Conditioned = {[key in ConditionalTypes]?: ConditionalPredicate[] | ConditionalPredicate};
type CountryConditioned = {[flag_or_tag: string]: any};
interface ConditionalPredicate {
    // tag?:            CountryTag[] | CountryTag;
    // focus_progress: PurpleFocusProgress[];
    // country_exists?: string[] | string;
    // owns_state?:     number[];
    // has_completed_focus?: string[] | string;
    // name?:               string;
    // ruling_only?:        StringBoolean;
    // has_country_flag?:   string[] | string;
    // has_government?:     HasGovernment;
    // has_country_leader?: HasCountryLeaderElement;
    // has_idea?:           string;
    // has_global_flag?:     string[];
    // check_variable: { [key: string]: number };
    // is_in_faction_with?: CountryTag;
    // always?:              StringBoolean;
    // all_of_scopes?:       AllOfScopes;
    // any_of_scopes?:       TriggerAnyOfScopes;
    // original_tag?:        string;
    // has_war_with: string;
}

type TriggerKeys = keyof typeof ScriptDocs.triggers;
type Triggered = { [effect in TriggerKeys]: any[] | any };

export type Trigger = ConditionalPredicate & Triggered & Conditioned & CountryConditioned;
