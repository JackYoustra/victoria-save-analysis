import * as fs from "fs";
import * as path from "path";
import { parse } from "../../logic/v2parser";
import _ from "lodash";
import {box} from "../../logic/collections/collections";
import stripBom from "strip-bom";
import {
    Effects,
    EventList,
    Event,
    TimedHours,
    CountryTag, Trigger
} from "../../logic/types/configuration/hoiEvent";
import {Focus, FocusFile, FocusTree} from "../../logic/types/configuration/hoiFocus";
import {DecisionCategoryFile, DecisionFile} from "../../logic/types/configuration/hoiDecision";
import {OnActionFile, StartupActions} from "../../logic/types/configuration/hoiOnActions";
import cytoscape from "cytoscape";
import {StringBoolean} from "../../logic/types/save/save";
import {RandomList, SetVariable} from "../../logic/types/configuration/hoiEffects";
import ScriptDocs from '../../../hoidocs/script_documentation.json';
import assert from "assert";


const home = '/Users/jack/Library/Application Support/Steam/steamapps/workshop/content/394360/2438003901';

// test('Doc2TS', () => {
//     fs.readFileSync(, "utf-8")
//     htmlparse()
// });

function dotSanitize(name: string): string {
    // try {
        return name.replace(/\.|-|'|!/g, '_');
    // } catch (e) {
    //     console.log("hi");
    // }
    // return "";
}

function* parseVickyFiles(location: string): any {
    for (const file of fs.readdirSync(location)) {
        yield parse(stripBom(fs.readFileSync(path.join(location, file), "utf-8")));
    }
}

type Entry<T> = {
    [K in keyof T]: [K, T[K]];
}[keyof T];

type Entries<T> = Entry<T>[];

const countryTagRegex = new RegExp("^[A-Z]{3}$");
const stateIDRegex = new RegExp("^[0-9]+$");

enum Scope {
    Global,
    Country,
    State,
    UnitLeader,
}

function docsString(scope: Scope): string {
    switch (scope) {
        case Scope.Global:
            return "GLOBAL";
        case Scope.Country:
            return "COUNTRY";
        case Scope.State:
            return "STATE";
        case Scope.UnitLeader:
            return "UNIT_LEADER";
    }
}

type ScopeType = {
    kind: Scope.Global,
} | {
    kind: Scope.Country,
    country: CountryTag,
} | {
    kind: Scope.State,
    state: number,
} | {
    kind: Scope.UnitLeader,
    country: CountryTag,
    state: string,
    unit: string,
};

enum ScopeReference {
    ROOT,
    THIS,
    PREV,
    FROM,
}

interface EventNodeInterface {
    globalState: ScopedState,
    // Attacker to defender
    wars: { [attackerTag: string]: string[] | undefined },
    // For branching
    lastEventID: string,
}

export type UnitID = `${string}.${string}`;

type EventNode = EventNodeInterface & { [tag in CountryTag]?: ScopedState } & { [stateID: number]: ScopedState | undefined } & { [unitID in UnitID]?: ScopedState };

interface ScopedState {
    variables: {},
    ideas: { [idea: string]: string },
    flags: { [flag: string]: StringBoolean },
}

function newScopedState(): ScopedState {
    return {
        flags: {},
        ideas: {},
        variables: {}
    };
}

function stateForScope(scope: ScopeType, node: EventNode): ScopedState {
    switch (scope.kind) {
        case Scope.Global:
            return node.globalState;
        case Scope.Country:
            if (_.isUndefined(node[scope.country])) {
                node[scope.country] = newScopedState();
            }
            return node[scope.country]!;
        case Scope.State:
            if (_.isUndefined(node[scope.state])) {
                node[scope.state] = newScopedState();
            }
            return node[scope.state]!;
        case Scope.UnitLeader:
            const id = `${scope.state}.${scope.unit}`;
            if (_.isUndefined(node[id])) {
                node[id] = newScopedState();
            }
            return node[id]!;
    }
}

function passesAnd(node: EventNode, trigger: Trigger, scope: ScopeType): boolean {
    for (const [kind, predicate] of Object.entries(trigger)) {
        for (const currentPredicate of box(predicate)) {
            if (!passesTriggerCondition(node, trigger, scope, kind, currentPredicate)) {
                return false;
            }
        }
    }
    return true;
}

function passesOr(node: EventNode, trigger: Trigger, scope: ScopeType): boolean {
    for (const [kind, predicate] of Object.entries(trigger)) {
        for (const currentPredicate of box(predicate)) {
            if (!passesTriggerCondition(node, trigger, scope, kind, currentPredicate)) {
                return true;
            }
        }
    }
    return false;
}

function passesTriggerCondition(node: EventNode, trigger: Trigger, scope: ScopeType, kind: string, predicate: any): boolean {
    // Go over each entry in the trigger, and check if the contiion of "kind" is met by the predicate
    switch (kind.toLowerCase()) {
        case "and":
            return passesAnd(node, predicate, scope);
        case "not":
            return !passesOr(node, predicate, scope);
        case "or":
            return passesOr(node, predicate, scope);
        case "tag":
            // Check variable resolution too!
            return (scope.kind === Scope.Country && scope.country === predicate);
        case "original_tag":
            // TODO: not techically right, have to introduce country history
            return (scope.kind === Scope.Country && scope.country === predicate);
        case "has_country_flag":
            assert (_.isString(predicate), "If not true, have to implement expanded form of this flag");
            return (scope.kind === Scope.Country && stateForScope(scope, node).flags[predicate] === "yes");
        case "has_global_flag":
            assert (_.isString(predicate), "If not true, have to implement expanded form of this flag");
            return node.globalState.flags[predicate] === "yes";
        case "is_ai":
            return false;
        case "has_game_rule":
            return false;
        case "has_idea":
            assert(scope.kind === Scope.Country);
            return stateForScope(scope, node).ideas[predicate] !== undefined;
        case "has_war_with":
            assert(scope.kind === Scope.Country);
            return (node.wars[predicate]?.includes(scope.country) ?? false) || (node.wars[scope.country]?.includes(predicate) ?? false);
        case "check_variable":

            const variable = stateForScope(scope, node).variables[predicate];
        default:
            if (predicate === "yes" || predicate === "no") {
                // Just checking if we have a flag on current scope
                return stateForScope(scope, node).flags[kind] === predicate;
            }
            assert(false, `Unknown trigger kind ${kind}`);
    }
}

function passesTrigger(node: EventNode, trigger: Trigger, scope: ScopeType): boolean {
    return passesAnd(node, trigger, scope);
}

function passesLimit(node: EventNode, limitable: any, scope: ScopeType): boolean {
    return (_.isUndefined(limitable.limit) || passesTrigger(node, limitable.limit, scope));
}

test('Prototype front-driven',  () => {
    // Add start actions
    const graph = cytoscape();

    // Pre-populate events for driven additions
    const folder = `${home}/events`;
    const eventFiles = fs.readdirSync(folder);
    const eventFileStructures: EventList[] = [];
    for (const file of eventFiles) {
        try {
            eventFileStructures.push(parse(stripBom(fs.readFileSync(path.join(folder, file), "utf-8"))));
        } catch (e) {
            console.log(e);
        }
    }

    const events = eventFileStructures.flatMap(value => _.concat(
        box(value.country_event),
        box(value.country_Event),
        box(value.news_event)
    ));

    const eventIDs: { [event: string]: Event | undefined } = {};

    for (const event of events) {
        eventIDs[event.id] = event;
        graph.add({
            group: 'nodes',
            data: {
                id: event.id,
            }
        });
    }

    // Processes all effects inside of a scope (defined by brackets)
    // Assert transitions: https://hoi4.paradoxwikis.com/Scopes
    function addEffect(effect: Effects, scopeType: ScopeType, eventNode: EventNode) {
        if(_.isUndefined(effect)) {
            let echo = 4;
        }
        const entries = Object.entries(effect) as Entries<Effects>;
        // Contexts is action context - the trailing predicate. May be more than one
        for (const [action, contexts] of entries) {
            const scopeString = docsString(scopeType.kind);
            // assert(ScriptDocs.effects[action].supported_scope.includes(scopeString) || ScriptDocs.effects[action].supported_scope.includes("any"), `${action} is not valid for scope ${scopeString}`);
            const scopeState = stateForScope(scopeType, eventNode);
            if (countryTagRegex.test(action)) {
                // It's a tag, switch scopes and recurse
                const tag = action as CountryTag;
                for (const context of box(contexts)) {
                    addEffect(context, {kind: Scope.Country, country: tag}, eventNode);
                }
            } else if (stateIDRegex.test(action)) {
                for (const context of box(contexts)) {
                    addEffect(context, {kind: Scope.State, state: action as unknown as number}, eventNode);
                }
            } else {
                let current = 0
                for (const actionContextUntyped of box(contexts)) {
                    const actionContext = actionContextUntyped as unknown as Effects;
                    switch (action) {
                        case "country_event":
                        case "news_event":
                            if (scopeType.kind !== Scope.Country) {
                                console.log("hi")
                            }
                            assert (scopeType.kind === Scope.Country, "country_event can only be used in country scope");
                            const eventContext = actionContext as unknown as Event;
                            // Adding the event performed when going over the event files

                            // Add edge with the mtth as the weight
                            const event_id = eventContext.id;
                            const event = eventIDs[event_id];
                            assert(event, "Event should exist");

                            // Only recurse if we haven't seen this event before
                            const edge_id = `${eventNode.lastEventID}_${eventContext.id}`;
                            if (!graph.getElementById(edge_id)) {
                                graph.add({
                                    group: 'edges',
                                    data: {
                                        id: edge_id,
                                        source: eventNode.lastEventID,
                                        target: eventContext.id,
                                        weight: TimedHours(eventContext),
                                    }
                                });

                                for (const immediate of box(event.immediate)) {
                                    addEffect(immediate, scopeType, eventNode);
                                }

                                for (const option of box(event.option)) {
                                    if (_.isUndefined(option.trigger) || passesTrigger(eventNode, option.trigger, scopeType)) {
                                        addEffect(option, scopeType, _.cloneDeep(eventNode));
                                    }
                                }
                            }
                            break;
                        // Handle if and else in a pairwise manner
                        case "if":
                            // assert(scopeType.kind === Scope.Country, "if can only be used in country scope");
                            const elseContexts = box(entries["else"]);
                            const ifContext = actionContext as unknown as Event;
                            assert(elseContexts.length === 0 || elseContexts.length === box(contexts).length, "Each if must correspond to exactly one else");
                            if (passesLimit(eventNode, ifContext, scopeType)) {
                                addEffect(ifContext, scopeType, eventNode);
                            } else if (elseContexts.length > 0) {
                                addEffect(elseContexts[current], scopeType, eventNode);
                            }
                            break;
                        case "else":
                            // Handled above
                            break;
                        case "set_variable":
                            const variableContext = actionContext as unknown as SetVariable;
                            // Add the variable to gameState
                            scopeState.variables[variableContext.var] = variableContext.value;
                            break;
                        case "random_list":
                            const randomListContext = actionContext as RandomList;
                            // Branch the graph at this point and recurse
                            break;
                        case "clr_country_flag":
                            delete scopeState.variables[actionContext as unknown as string];
                            break;
                        case "set_country_flag":
                            scopeState.variables[actionContext as unknown as string] = "yes";
                            break;
                        case "every_country":
                            // Look for countries defined on the event node (these are the countries that exist)
                            // and run the country event on them
                            for (const country of Object.entries(eventNode)) {
                                const tag = country[0];
                                if (countryTagRegex.test(tag)) {
                                    const predicate = country[1] as ScopedState;
                                    const scope: ScopeType = {
                                        kind: Scope.Country,
                                        country: tag as CountryTag
                                    };
                                    if (passesLimit(eventNode, actionContext, scope)) {
                                        addEffect(actionContext, scope, eventNode);
                                    }
                                }
                            }
                            break;
                        case "random_country":
                            const eligibleCountries: CountryTag[] = [];
                            for (const country of Object.entries(eventNode)) {
                                const tag = country[0];
                                if (countryTagRegex.test(tag)) {
                                    const predicate = country[1];
                                    const scope: ScopeType = {
                                        kind: Scope.Country,
                                        country: tag as CountryTag
                                    };
                                    if (passesLimit(eventNode, actionContext, scope)) {
                                        eligibleCountries.push(tag as unknown as CountryTag);
                                    }
                                }
                            }
                            const country = _.sample(eligibleCountries);
                            if (!_.isUndefined(country)) {
                                addEffect(actionContext, {kind: Scope.Country, country}, eventNode);
                            }
                            break;
                        case "every_state":
                            for (const state of Object.entries(eventNode)) {
                                const tag = state[0];
                                if (stateIDRegex.test(tag)) {
                                    addEffect(actionContext, {kind: Scope.State, state: state as number}, eventNode);
                                }
                            }
                            break;
                        case "hidden_effect":
                            // Just not shown on tooltips, keep going
                            addEffect(actionContext, scopeType, eventNode);
                            break;
                        default:
                            // None of these are effects, so check if they're flags
                            const defaultContext = actionContext as unknown as string;
                            if (Object.values(StringBoolean).some((v) => v === defaultContext)) {
                                // It's a flag, add to gameState
                                scopeState.flags[action] = defaultContext as StringBoolean;
                            } else {
                                console.log(`Effect \"${action}\" not handled!!!`);
                            }
                    }
                    current += 1
                }
            }
        }
    }

    const startStoryID = "story_start";

    graph.add({
        group: 'nodes',
        data: {
            id: startStoryID,
        }
    });

    const startNode = { globalState: newScopedState(), lastEventID: startStoryID, wars: {} };

    const onActions = `${home}/common/on_actions`;
    for (const file of fs.readdirSync(onActions)) {
        const fullPath = path.join(onActions, file);
        const data = stripBom(fs.readFileSync(fullPath, "utf-8"));
        const result: OnActionFile = parse(data);
        for (const action of box(result.on_actions)) {
            for (const onStartupAction of box(action.on_startup)) {
                for (const startupAction of box(onStartupAction)) {
                    for (const startupEffect of box(startupAction.effect)) {
                        addEffect(startupEffect, { kind: Scope.Global }, startNode);
                    }
                }
            }
        }
    }
});

test('Prototype',  () => {
    const folder = `${home}/events`;
    // expect(eventFileStructures).not.toHaveProperty("dd_namespace");
    const dir = fs.readdirSync(folder);

    let errors = 0;
    let eventFileStructures: EventList[] = [];
    for (const file of dir) {
        const fullPath = path.join(folder, file);
        const data = stripBom(fs.readFileSync(fullPath, "utf-8"));
        try {
            const result = parse(data);
            // Heck my parser is DEFINITELY not working correctly: should be no dd_namespace item
            // _.merge(eventFileStructures, result);
            eventFileStructures.push(result);
        } catch (e) {
            fs.writeFileSync("lasterror.txt", data);
            errors += 1;
            console.log(`Couldn't do ${fullPath} due to ${e} at ${JSON.stringify(e.location)}`)
        }
    }
    console.log(`Errored on ${errors} / ${dir.length} (${errors / dir.length * 100.0}%)`)
    fs.writeFileSync("event_json.txt", JSON.stringify(eventFileStructures));

    const defined_events = eventFileStructures.flatMap(value => _.concat(
        box(value.country_event),
        box(value.country_Event),
        box(value.news_event)
    ));

// ...sea of nodes? Events don't have immediate preconditions, they just require certain conditions to be met
// This can be true, but a lot can be achieved via the hidden_effect field
// This can trigger other country eventFileStructures
// Just draw these for now
    let paths: string[][] = [];

    let scriptedEffectsList: any[] = []
    for (const file of fs.readdirSync(`${home}/common/scripted_effects`)) {
        const fullPath = path.join(`${home}/common/scripted_effects`, file);
        const data = stripBom(fs.readFileSync(fullPath, "utf-8"));
        const result = parse(data);
        scriptedEffectsList.push(result);
    }

    let scriptedEffects = _.merge({}, ...scriptedEffectsList);

    const traverse = (obj: any, idToAdd: string, root = true) => {
        for (let k in obj) {
            if (obj[k] && typeof obj[k] === 'object') {
                traverse(obj[k], idToAdd, false)
            } else if (!root) {
                // Do something with obj[k]
                if (k == "id") {
                    let hiddenID = obj[k];
                    if (!_.isString(hiddenID) && _.isObject(hiddenID)) {
                        hiddenID = hiddenID["id"];
                    }
                    // The hiddenEffect is undefined if the countryevent is actually a string
                    if (_.isString(hiddenID)) {
                        paths.push([idToAdd, dotSanitize(hiddenID)]);
                    }
                } else if (obj[k] == "yes" && scriptedEffects[k]) {
                    paths.push([idToAdd, dotSanitize(k)]);
                } else if (k == "tree") {
                    // All instances of "tree" are from "load_focus_tree"
                    paths.push([idToAdd, dotSanitize(obj[k])]);
                }
            }
        }
    }

    for (const [name, effect] of Object.entries(scriptedEffects)) {
        traverse(effect, dotSanitize(name));
    }

    for (const event of defined_events) {
        if (_.isString(event.id)) {
            const eventID = dotSanitize(event.id as string);
            traverse(event, eventID);
        }
    }

    // const edges = defined_events.flatMap(event => {
    //     return box(event.option).flatMap(option => {
    //         return box(option.hidden_effect).flatMap(hiddenEffect => {
    //             const eventID = event.id.replaceAll("_", "").replaceAll(".", "") as string;
    //             const events = box(hiddenEffect.country_event);
    //             return events.map(hiddenEffect => {
    //                 // country_event also has a days field. I'm also guessing that the country_event ID is implicitly prefixed by the country tag.
    //                 // Must figure out if that's actually true...
    //                 let hiddenID: string | undefined = undefined;
    //                 // The hiddenEffect is undefined if the countryevent is actually a string
    //                 if (_.isString(hiddenEffect.id) || _.isUndefined(hiddenEffect.id)) {
    //                     hiddenID = (hiddenEffect.id ?? hiddenEffect as string).replaceAll("_", "").replaceAll(".", "");
    //                 } else {
    //                     hiddenID = `${event.id.substring(0, (event.id as string).indexOf('.'))}.${hiddenEffect.id}`;
    //                 }
    //                 return [eventID, hiddenID as string];
    //             });
    //         });
    //     });
    // });

    // Add national focuses
    const focuses = `${home}/common/national_focus`;

    function processFocus(focus: Focus, tree?: FocusTree) {
        const foucsID = dotSanitize(focus.id);
        const prereqs = box(focus.prerequisite);
        if (prereqs.length > 0) {
            for (const prereq of prereqs) {
                for (const prereqFocus of box(prereq.focus)) {
                    paths.push([dotSanitize(prereqFocus), foucsID]);
                }
            }
        } else if (tree) {
            // No prereqs, so add path from tree ID to focus
            paths.push([dotSanitize(tree.id), foucsID]);
        }
        // Add all events, similar to get via trigger
        // TODO: make select_effect chain come before completion_reward chain.
        // Probably want to do this during the time-flatten phase
        traverse(focus, foucsID);
    }

    for (const file of fs.readdirSync(focuses)) {
        const result: FocusFile = parse(stripBom(fs.readFileSync(path.join(focuses, file), "utf-8")));
        for (const shared of box(result.shared_focus)) {
            processFocus(shared);
        }
        for (const focusTree of box(result.focus_tree)) {
            for (const focus of box(focusTree.focus)) {
                processFocus(focus, focusTree);
            }
            for (const shared_id of box(focusTree.shared_focus)) {
                paths.push([dotSanitize(focusTree.id), dotSanitize(shared_id)]);
            }
        }
    }

    const onActions = `${home}/common/on_actions`;
    for (const file of fs.readdirSync(onActions)) {
        const fullPath = path.join(onActions, file);
        const data = stripBom(fs.readFileSync(fullPath, "utf-8"));
        const result: OnActionFile = parse(data);
        for (const action of box(result.on_actions)) {
            for (const onStartupAction of box(action.on_startup)) {
                for (const startupAction of box(onStartupAction)) {
                    for (const startupEffect of box(startupAction.effect)) {
                        for (const [tagMaybe, actionObject] of Object.entries(startupEffect)) {
                            traverse(actionObject, `${tagMaybe}_start`, false);
                        }
                    }
                }
            }
        }
    }


    // Decisions
    const decisions = `${home}/common/decisions`;
    for (const file of fs.readdirSync(decisions, {withFileTypes: true})) {
        const name = file.name;
        if (file.isDirectory()) {
            continue;
            for (const categoryFile of fs.readdirSync(decisions)) {
                const fullPath = path.join(decisions, name, categoryFile);
                const data = stripBom(fs.readFileSync(fullPath, "utf-8"));
                const result: DecisionCategoryFile = parse(data);
            }
        } else {
            const fullPath = path.join(decisions, name);
            const data = stripBom(fs.readFileSync(fullPath, "utf-8"));
            const result: DecisionFile = parse(data);
            for (const [categoryName, categoryItems] of Object.entries(result)) {
                for (const decisionsDeclarations of box(categoryItems)) {
                    for (const [decisionName, decisions] of Object.entries(decisionsDeclarations)) {
                        for (const decision of box(decisions)) {
                            // Add all events, similar to get via trigger
                            traverse(decision, dotSanitize(decisionName));
                        }
                    }
                }
            }
        }
    }
    const cy = cytoscape({
        elements: _.concat(
            [... new Set(paths.flat(1))]
            .map(node => ({group: 'nodes', data: {id: node}})),
            // @ts-ignore
            paths.map(([from, to]) => ({group: 'edges', data: {id: `${from}_${to}`, source: from, target: to}}))
        ),
    });

    const jap_start = cy.getElementById("JAP_start");
    const jap_path = jap_start.successors();
    // @ts-ignore
    paths = jap_path.filter(x => x.source()?.length).map(x => [x.source().id(), x.target().id()]);


    const dotlist = paths.map(value => {
        return value.join(" -> ")
    }).join("\n");

    const saveText = `digraph EventGraph\n{\n${dotlist}\n}`;
    fs.writeFileSync("events_cy.dot", saveText);
    expect(paths).toHaveLength(45603);
});