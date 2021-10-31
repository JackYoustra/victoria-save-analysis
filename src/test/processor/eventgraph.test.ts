import * as fs from "fs";
import * as path from "path";
import { parse } from "../../logic/v2parser";
import _ from "lodash";
import {box} from "../../logic/collections/collections";
import stripBom from "strip-bom";
import {Effects, EventList, Event, TimedHours, CountryTag} from "../../logic/types/configuration/hoiEvent";
import {Focus, FocusFile} from "../../logic/types/configuration/hoiFocus";
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

enum Scope {
    Global,
    Country,
    State,
    UnitLeader,
}

interface EventNode {
    countryState: State,
    globalState: State,
}

interface State {
    variables: {},
}

test('Prototype front-driven',  () => {
    // Add start actions
    const graph = cytoscape();

    // Processes all effects inside of a scope (defined by brackets)
    function addEffect(effect: Effects, scopeType: Scope) {
        const entries = Object.entries(effect);
        const [countryEvents, globalEvents] = _.partition(entries, x => countryTagRegex.test(x[0])) as unknown as [[CountryTag, Effects][], Entries<Effects>];
        const eventState = { countryState: { variables: {} }, globalState: { variables: {} } };

        for (const [scope, events] of [["COUNTRY", countryEvents], ["GLOBAL", globalEvents]]) {
            for (const [action, contexts] of events) {
                assert(ScriptDocs.effects[action].contains(scope) || ScriptDocs.effects[action].contains("any"), `${action} is not valid for scope ${scope}`);
                for (const actionContext in box(contexts as any[] | any)) {
                    switch (action) {
                        case "country_event":
                            const eventContext = actionContext as Event;
                            // Add the event
                            graph.add({
                                group: 'nodes',
                                data: {
                                    id: eventContext.id,
                                }
                            });

                            // Add edge with the mtth as the weight
                            graph.add({
                                group: 'edges',
                                data: {
                                    id: `${action}_${dotSanitize(countryActionEffect[0])}`,
                                    source: tag,
                                    target: eventContext.id,
                                    weight: TimedHours(eventContext),
                                }
                            });
                            break;
                        case "set_variable":
                            const variableContext = actionContext as SetVariable;
                            // Add the variable to gameState
                            gameState.variables[variableContext.var] = variableContext.value;
                            break;
                        case "random_list":
                            const randomListContext = actionContext as RandomList;
                            // Branch the graph at this point and recurse
                            break;
                        case "clr_country_flag":
                            break;
                        case ""
                        default:
                            // None of these are effects, so check if they're flags
                            if (Object.values(StringBoolean).contains(actionContext)) {
                                // It's a flag, add to gameState
                                gameState[action] = actionContext;
                            }
                    }
                }
            }
        }


        for (const [tag, actionObjects] of countryEvents) {
            // Add to the game state before adding it to the graph
            const start_id = `${tag}_start`;

            // Handle more than one occurance of each tag
            for (const actionObject of box(actionObjects)) {
                for (const countryActionEffect of Object.entries(actionObject)) {
                    const [action, actionContext] = pair as Entry<Effects>;


                }
            }

            // Add start event to graph
            graph.add({
                group: 'nodes',
                data: {
                    id: start_id,
                    gameState,
                }
            });
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
                        addEffect(startupEffect);

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