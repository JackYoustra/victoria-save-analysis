import _, {omit} from "lodash";
import {FileWithDirectoryHandle} from "browser-fs-access";
import Image from "image-js";
import v2parser from "./v2parser";
import Papa, {ParseResult} from "papaparse";

declare global {
  interface ObjectConstructor {
    flatten(data: any): any;

    sortedByKeys(input: any): any;
  }
}

Object.flatten = function(data) {
  var result = {};
  function recurse (cur, prop) {
    if (Object(cur) !== cur) {
      result[prop] = cur;
    } else if (Array.isArray(cur)) {
      for(var i=0, l=cur.length; i<l; i++)
        recurse(cur[i], prop + "[" + i + "]");
      if (l == 0)
        result[prop] = [];
    } else {
      var isEmpty = true;
      for (var p in cur) {
        isEmpty = false;
        recurse(cur[p], prop ? prop+"."+p : p);
      }
      if (isEmpty && prop)
        result[prop] = {};
    }
  }
  recurse(data, "");
  return result;
}

Object.sortedByKeys = function (input: any): any {
  return Object.keys(input).sort().reduce(
    (obj, key) => {
      obj[key] = input[key];
      return obj;
    },
    {}
  );
}

function box(maybeArray: any): any[] {
  if (!Array.isArray(maybeArray)) {
    // Box
    maybeArray = [maybeArray];
  }
  return maybeArray;
}

function getProvinces(vickySave: any): any[] {
  const provinceTest = new RegExp('^[0-9]+$');
  const topKeys = Object.keys(vickySave);
  let provinces: any[] = [];
  for (const rootKey of topKeys) {
    if (provinceTest.test(rootKey)) {
      const province = vickySave[rootKey];
      provinces.push(province);
    }
  }
  return provinces;
}

function getPops(provinces: any[]): any[] {
  let pops: any[] = [];
  for (const province of provinces) {
    for (let [popTitle, popMaybeArr] of Object.entries(province) as [string, any]) {
      // Pops have an ideology tag associated with them, use that to distinguish pop from fake pop
      // https://stackoverflow.com/questions/3476255/in-javascript-how-can-i-tell-if-a-field-exists-inside-an-object
      popMaybeArr = box(popMaybeArr);
      for (const popMaybe of popMaybeArr) {
        if (popMaybe.hasOwnProperty('ideology')) {
          // We're looking at an actual pop, great!
          // Need to remove ethnicity or it's a mess!
          // Should be the third property
          const ethnicity = Object.keys(popMaybe)[2];
          const culture = popMaybe[ethnicity];
          // https://stackoverflow.com/a/34710102/998335
          const cleanedPop = omit(popMaybe, ethnicity);
          const pop = {
            home: province['name'],
            nationality: province['owner'],
            occupation: popTitle,
            ethnicity: ethnicity,
            culture: culture,
            // @ts-ignore
            ...Object.flatten(cleanedPop)
          }
          // https://stackoverflow.com/questions/5467129/sort-javascript-object-by-key
          // @ts-ignore
          const orderedPop = Object.sortedByKeys(pop)
          pops.push(orderedPop);
        }
      }
    }
  }
  return pops;
}

function getCountries(vickySave: any): any[] {
  const countryTest = new RegExp('^[A-Z]{3}$');
  const topKeys = Object.keys(vickySave);
  let countries: any[] = [];
  for (const countryTag of topKeys.filter(value => { return countryTest.test(value); })) {
    const country = {
      tag: countryTag,
      ...vickySave[countryTag]
    };
    countries.push(Object.sortedByKeys(country))
  }
  return countries;
}

function getFactories(vickySave: any): any[] {
  const countryTest = new RegExp('^[A-Z]{3}$');
  const topKeys = Object.keys(vickySave);
  let factories: any[] = [];
  const validCountries = topKeys.filter(value => { return countryTest.test(value); });
  for (const countryTag of validCountries) {
    const country = vickySave[countryTag];
    if (country.hasOwnProperty('state')) {
      for (const state of box(country['state'])) {
        const state_id = state["id"]["id"];
        if (state.hasOwnProperty('state_buildings')) {
          for (const building of box(state['state_buildings'])) {
            const employmentTag = "employment";
            const cleanedBuilding = omit(building, employmentTag);
            const employment = building[employmentTag];

            const employeeTag = "employees";
            const cleanedEmployment = omit(employment, employeeTag);
            const employees = box(employment[employeeTag] ?? []);
            let newEmployees = employees.reduce((previousValue, currentValue) => {
              const currentPop = currentValue["province_pop_id"];
              const type = currentPop['type'];
              const count = currentValue['count'];
              if (previousValue.hasOwnProperty(type)) {
                previousValue[type] += count;
              } else {
                previousValue[type] = count;
              }
              return previousValue;
            }, {});

            const factory = {
              country: countryTag,
              state: state_id,
              employment: {
                employees: newEmployees,
                ...cleanedEmployment
              },
              ...cleanedBuilding
            }
            factories.push(Object.sortedByKeys(Object.flatten(factory)));
          }
        }
      }
    }
  }
  return factories;
}

// Put the top level as a property of the inner level
function lower(top: any, loweringKey: string): any {
  // Top of the object - want to take these entries and lower them
  Object.entries(top).reduce((prior, current, {}, {}) => {
    // This 'key' is what we want to be incorporated into the values
    // If there's no key, *ignore*
    const [topKey, value] = current;
    if (_.isObject(value)) {
      return Object.entries(value).reduce((accum, newCurrent, {}, {}) => {
        const [settingKey, settingValue] = newCurrent;
        if (_.isObject(settingValue)) {
          accum[settingKey] = {
            ...settingValue
          }
          accum[settingKey][loweringKey] = topKey
        }
        return accum
      }, prior);
    } else {
      return value as any;
    }
  }, {});
}

interface ProvinceDefinition {
  province: number,
  red: number,
  green: number,
  blue: number,
  x: string,
}

export function rgbToHex(array: number[]): string {
  const [r, g, b] = array;
  return ((r << 16) | (g << 8) | b).toString(16);
}

function makeProvinceLookup(definitions: ProvinceDefinition[]): any {
  const retVal = definitions.map((definition, index, array) => {
    const hex = rgbToHex([definition.red, definition.green, definition.blue]);
    return [hex, definition.province]
  });
  return Object.fromEntries(retVal);
}

interface URLCachedImage {
  original: Image;
  url: string;
}

export class VickyGameConfiguration {
  // Ideology to ideology object map
  ideologies?: any;
  provinceMap?: URLCachedImage;
  provinceLookup?: any;

  private constructor(ideologies?: any, provinceMap?: URLCachedImage, provinceLookup?: any) {
    this.ideologies = ideologies;
    this.provinceMap = provinceMap;
    this.provinceLookup = provinceLookup;
  }

  public static async createSave(saveDirectory: FileWithDirectoryHandle[]): Promise<VickyGameConfiguration> {
    let promises: Promise<any>[] = Array(3).fill(Promise.reject(new Error("File not found")));
    for (const fileDirectoryHandle of saveDirectory) {
      console.log("Found " + fileDirectoryHandle.name);
      if (fileDirectoryHandle.name == "ideologies.txt") {
        console.log("Found it");
        promises[0] = fileDirectoryHandle.text();
      } else if (fileDirectoryHandle.name == "provinces.bmp") {
        // Province locations and colors
        console.log("Found map");
        promises[1] = fileDirectoryHandle.arrayBuffer().then(Image.load);
      } else if (fileDirectoryHandle.name == "definition.csv") {
        // Province definition
        promises[2] = new Promise((complete, error) => {
          Papa.parse(fileDirectoryHandle, {
            header: true,
            complete(results: ParseResult<ProvinceDefinition>, file?: File) {
              complete(results.data);
            },
            error,
          });
        });
      }
    }
    for (const promise of promises) {
      promise.catch(reason => {
        console.error("Error loading: " + reason);
      })
    }
    const results = await Promise.allSettled(promises);

    const [ideologyText, rawMapImage, provinceDefinitionsMaybe] = results;
    let ideologies: any | undefined = undefined;
    let mapImage: URLCachedImage | undefined = undefined;
    let provinceLookup: any | undefined = undefined;
    if (ideologyText.status == "fulfilled") {
      const ideologyData = v2parser.parse(ideologyText.value);
      console.log(ideologyData);
      ideologies = lower(ideologyData, "group");
    }
    if (rawMapImage.status == "fulfilled") {
      let middleMapImage = rawMapImage.value;
      // @ts-ignore
      middleMapImage.flipY();
      mapImage = {
        original: middleMapImage,
        url: middleMapImage.toDataURL(),
      };
    }
    if (provinceDefinitionsMaybe.status == "fulfilled") {
      let provinceDefinitions = provinceDefinitionsMaybe.value;
      provinceLookup = makeProvinceLookup(provinceDefinitions);
      console.log(provinceLookup);
    }
    return new VickyGameConfiguration(ideologies, mapImage, provinceLookup);
  }
}

export class VickySave {
  readonly provinces: any[];
  readonly pops: any[];
  readonly factories: any[];
  readonly countries: any[];
  readonly views: VickyViews;
  constructor(vickySave: any) {
    this.provinces = getProvinces(vickySave);
    this.pops = getPops(this.provinces);
    this.factories = getFactories(vickySave);
    this.countries = getCountries(vickySave);
    this.views = new VickyViews(this);
  }
}

class VickyViews {
  // Originally reaviz venn diagram
  readonly vennFlags: any[];
  constructor(object: VickySave) {
    this.vennFlags = object.countries
      .filter(country => {
      return Object.keys(country.flags).length > 0;
    })
      .map( (country) => {
      return {
        key: Object.keys(country.flags),
        data: 4,//country.tag as string,
      }
    });
    console.log(this.vennFlags);
  }
}

export default interface VickyContext {
  readonly save?: VickySave;
  readonly configuration?: VickyGameConfiguration;
}

