import * as fs from "fs";
import * as path from "path";
import { parse } from "../../logic/v2parser";
import _ from "lodash";
import {box} from "../../logic/collections/collections";
import stripBom from "strip-bom";
import {EventList} from "../../logic/types/configuration/hoiEvent";
import {Focus, FocusFile} from "../../logic/types/configuration/hoiFocus";
import {DecisionCategoryFile, DecisionFile} from "../../logic/types/configuration/hoiDecision";
import {OnActionFile} from "../../logic/types/configuration/hoiOnActions";

const home = '/Users/jack/Library/Application Support/Steam/steamapps/workshop/content/394360/2438003901'

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
    const paths: string[][] = [];
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
                        hiddenID = paths.push([idToAdd, dotSanitize(hiddenID)]);
                    }
                }
            }
        }
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

    function processFocus(focus: Focus) {
        const foucsID = dotSanitize(focus.id);
        for (const prereq of box(focus.prerequisite)) {
            for (const prereqFocus of box(prereq.focus)) {
                paths.push([dotSanitize(prereqFocus), foucsID]);
            }
        }
        // Add all events, similar to get via trigger
        // TODO: make select_effect chain come before completion_reward chain.
        // Probably want to do this during the time-flatten phase
        traverse(focus, foucsID);
    }

    for (const file of fs.readdirSync(focuses)) {
        const fullPath = path.join(focuses, file);
        const data = stripBom(fs.readFileSync(fullPath, "utf-8"));
        const result: FocusFile = parse(data);
        for (const shared of box(result.shared_focus)) {
            processFocus(shared);
        }
        for (const focusTree of box(result.focus_tree)) {
            for (const focus of box(focusTree.focus)) {
                processFocus(focus);
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

    const dotlist = paths.map(value => {
        return value.join(" -> ")
    }).join("\n");

    const saveText = `digraph EventGraph\n{\n${dotlist}\n}`;
    fs.writeFileSync("events.dot", saveText);
    expect(paths).toHaveLength(45603);
});