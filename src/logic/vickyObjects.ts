import _, {omit} from "lodash";
import {FileWithDirectoryHandle} from "browser-fs-access";
import Image from "image-js";
import v2parser from "./v2parser";
import Papa, {ParseResult} from "papaparse";
import TGA from "tga";
import {TerrainInfo} from "./types/vickyTerrainDefinition";
import {terrainForColor} from "./TerrainPalette";

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

// {a: {b: c, d: e}}
// {b: {a: c}, d: {a: e}}
function swapPrimaryKey(base: Object): any {
  let retVal = {}
  for (const [rootKey, objectValue] of Object.entries(base)) {
    if (_.isObject(objectValue)) {
      for (const [key, value] of Object.entries(objectValue)) {
        const addedKey = {}
        addedKey[rootKey] = value;
        if (_.isObject(retVal[key])) {
          _.assign(retVal[key], addedKey);
        } else {
          retVal[key] = addedKey;
        }
      }
    }
  }
  return retVal;
}

// Make the key at the top level (such as pop type) as a property of the inner level
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

export interface ProvinceDefinition {
  // The numeric province ID associated with the province
  province: number,
  red: number,
  green: number,
  blue: number,
  name: string,
}

interface ProvinceLookup {
  [color_hex: number]: ProvinceDefinition | undefined
}

export function rgbToHex(array: number[]): number {
  const [r, g, b] = array;
  return ((r << 16) | (g << 8) | b);
}

function makeProvinceLookup(definitions: ProvinceDefinition[]): ProvinceLookup {
  const retVal = definitions.map((definition, index, array) => {
    const hex = rgbToHex([definition.red, definition.green, definition.blue]);
    return [hex, definition]
  });
  return Object.fromEntries(retVal);
}

// Returns a lookup from the ID to the terrain
function makeTerrainLookup(provinceMap: Image, terrainMap: Image, provinceLookup: ProvinceLookup, terrainInfo: TerrainInfo): Map<number, string> {
  // Terrain color is a red herring, use the palette file
  // const terrainColorLookup: Map<number[], string> = new Map(Object.entries(terrainInfo.categories).map(entry => {
  //   const [key, value] = entry;
  //   return [value.color, key];
  // }));

  // Find majority terrain in color
  // Take the min of both and only compute for overlapping segments
  const width = Math.min(provinceMap.width, terrainMap.width);
  const height = Math.min(provinceMap.height, terrainMap.height);

  // Province colors to count of terrain color occurances
  const provinceColorsToTerrainColors = new Map<number[], Map<number[], number>>();

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const terrainWithAlpha = terrainMap.getPixelXY(x, y);
      // dump alpha channel
      const terrain = terrainWithAlpha.slice(0, 3);
      const provinceWithAlpha = provinceMap.getPixelXY(x, y);
      const province = provinceWithAlpha.slice(0, 3);
      let provinceToTerrainColors = provinceColorsToTerrainColors.get(province);
      // Set if province is missing
      if (_.isUndefined(provinceToTerrainColors)) {
        provinceToTerrainColors = new Map();
        provinceColorsToTerrainColors.set(province, provinceToTerrainColors);
      }
      // Check if terrain color is missing
      let terrainColorCount = provinceToTerrainColors.get(terrain);
      if (_.isUndefined(terrainColorCount)) {
        terrainColorCount = 0;
      }
      provinceToTerrainColors.set(terrain, terrainColorCount + 1);
    }
  }

  const terrainLookup = new Map<number, string>();

  for (const [key, value] of provinceColorsToTerrainColors) {
    let maxCount = 0;
    let maxTerrain: number[] | undefined = undefined;
    for (const [terrain, count] of value) {
      if (count > maxCount) {
        maxCount = count;
        maxTerrain = terrain;
      }
    }

    if (_.isUndefined(maxTerrain)) {
      continue;
    }

    const terrainColorHex = rgbToHex(maxTerrain);
    const lookedUp = terrainForColor.get(terrainColorHex);
    if (_.isUndefined(lookedUp)) {
      continue;
    }

    const province = provinceLookup[rgbToHex(key)];
    if (_.isUndefined(province)) {
      continue;
    }
    terrainLookup.set(province.province, lookedUp);
  }
  return terrainLookup;
}

interface URLCachedImage {
  original: Image;
  url: string;
}

async function makeTargaImage(fileDirectoryHandle: FileWithDirectoryHandle): Promise<string | undefined> {
  const tga = new TGA(new Buffer(await fileDirectoryHandle.arrayBuffer()));
  const image = new Image(tga.width, tga.height, tga.pixels, {
    // @ts-ignore
    colorModel: 'RGB',
    bitDepth: 8,
    alpha: 1,
  })

  return image.toDataURL();
}

export async function makeTerrainImage(configuration: VickyGameConfiguration, province: number): Promise<string | undefined> {
  const terrainType = configuration.terrainLookup?.get(province);
  if (_.isUndefined(terrainType)) {
    return undefined;
  }
  const fileDirectoryHandle = configuration.terrainSources?.get(terrainType);
  if (_.isUndefined(fileDirectoryHandle)) {
    return undefined;
  }
  return makeTargaImage(fileDirectoryHandle);
}

export async function makeFlagImage(configuration: VickyGameConfiguration, tag: string): Promise<string | undefined> {
  const fileDirectoryHandle = configuration.flagSources?.get(tag);
  if (_.isUndefined(fileDirectoryHandle)) {
    return undefined;
  }
  return makeTargaImage(fileDirectoryHandle);
}

const terrainImageTest = new RegExp('^terrain_([a-zA-Z]+)\\.tga$');
const flagTest = new RegExp('^[A-Z]{3,}(?:_[a-zA-Z]+)?\\.tga$');

export class VickyGameConfiguration {
  // Source files of flags
  flagSources?: Map<string, FileWithDirectoryHandle>;
  // Sources of terrain images, from terrain type
  terrainSources?: Map<string, FileWithDirectoryHandle>;
  // Localisation key to localisation language object
  localisationSet?: any;
  // Ideology to ideology object map
  ideologies?: any;
  provinceMap?: URLCachedImage;
  // Map of province ID to terrain type
  terrainLookup?: Map<number, string>;
  // Hex definition to the color of
  provinceLookup?: ProvinceLookup;
  countries?: any;

  private constructor(flagSources?: Map<string, FileWithDirectoryHandle>, terrainSources?: Map<string, FileWithDirectoryHandle>, localisationSet?: any, ideologies?: any, provinceMap?: URLCachedImage, terrainLookup?: Map<number, string>, provinceLookup?: ProvinceLookup, countries?: any) {
    this.flagSources = flagSources;
    this.terrainSources = terrainSources;
    this.localisationSet = localisationSet;
    this.ideologies = ideologies;
    this.provinceMap = provinceMap;
    this.terrainLookup = terrainLookup;
    this.provinceLookup = provinceLookup;
    this.countries = countries;
  }

  static async parseV2(fileDirectoryHandle: FileWithDirectoryHandle): Promise<any> {
    return v2parser.parse(await fileDirectoryHandle.text());
  }

  static async makeIdeologies(fileDirectoryHandle: FileWithDirectoryHandle): Promise<any> {
    const ideologyText = await fileDirectoryHandle.text()
    const ideologyData = v2parser.parse(ideologyText);
    return lower(ideologyData, "group");
  }

  static async makeImage(fileDirectoryHandle: FileWithDirectoryHandle): Promise<URLCachedImage> {
    const image = await fileDirectoryHandle.arrayBuffer().then(Image.load);
    // @ts-ignore
    image.flipY();
    return {
      original: image,
      url: image.toDataURL(),
    };
  }

  static async makeMap(fileDirectoryHandle: FileWithDirectoryHandle): Promise<URLCachedImage> {
    const middleMapImage = await fileDirectoryHandle.arrayBuffer().then(Image.load);
    // @ts-ignore
    middleMapImage.flipY();
    return {
      original: middleMapImage,
      url: middleMapImage.toDataURL(),
    };
  }

  static async makeCountries(fileDirectoryHandle: FileWithDirectoryHandle, directory: FileWithDirectoryHandle[]): Promise<any> {
    const countries = await fileDirectoryHandle.text();
    const mapper = new Map<string, string>();
    const parsed = v2parser.parse(countries);
    // Make paths absolute
    const countriesTest = new RegExp('^countries/');
    for (const key in parsed) {
      if (parsed.hasOwnProperty(key)) {
        const countryCleaned = parsed[key].replace(countriesTest, "");
        parsed[key] = countryCleaned;
        mapper.set(countryCleaned, key);
      }
    }
    for (const fileDirectoryHandle of directory) {
      const tag = mapper.get(fileDirectoryHandle.name);
      if (tag) {
        // Yay! Replace with country definition
        console.log(countries);
        parsed[tag] = v2parser.parse(await fileDirectoryHandle.text());
      }
    }
    console.log(parsed);
    return parsed;
  }

  static makeLocalization(fileDirectoryHandle: FileWithDirectoryHandle): Promise<any> {
    const dankness = new Promise((complete, error) => {
      Papa.parse(fileDirectoryHandle, {
        header: false, // headers overwrite
        complete(results: ParseResult<[string, string, string, string, string | undefined, string]>, file?: File) {
          let localisationGroup = {}
          for (const localisation of results.data) {
            const [key, english, french, german, unknown, spanish] = localisation;
            if (key.trim().length > 0) {
              localisationGroup[key] = {
                "english": english,
                "french": french,
                "german": german,
                "spanish": spanish,
              }
            }
          }
          complete(localisationGroup);
        },
        error,
      });
    });
    return dankness;
  }

  public static async createSave(saveDirectory: FileWithDirectoryHandle[]): Promise<VickyGameConfiguration> {
    let promises: (Promise<any> | null)[] = Array(6).fill(null);

    let localisations: [Promise<any>, FileWithDirectoryHandle][] = [];
    let flagFiles = new Map<string, FileWithDirectoryHandle>();
    let terrainInterfaceImageFiles = new Map<string, FileWithDirectoryHandle>();
    for (const fileDirectoryHandle of saveDirectory) {
      console.log("Found " + fileDirectoryHandle.name);
      if (fileDirectoryHandle.name == "ideologies.txt") {
        console.log("Found ideologies");
        promises[0] = this.makeIdeologies(fileDirectoryHandle);
      } else if (fileDirectoryHandle.name == "provinces.bmp") {
        // Province locations and colors
        console.log("Found map");
        promises[1] = this.makeMap(fileDirectoryHandle);
      } else if (fileDirectoryHandle.name == "terrain.bmp") {
        // Province locations and colors
        console.log("Found terrain");
        promises[2] = this.makeImage(fileDirectoryHandle);
      } else if (fileDirectoryHandle.name == "definition.csv") {
        console.log("Found province definitions");
        // Province definition
        promises[3] = new Promise<ProvinceDefinition[]>((complete, error) => {
          Papa.parse(fileDirectoryHandle, {
            header: false, // headers overwrite
            complete(results: ParseResult<[string, string, string, string, string, 'x']>, file?: File) {
              const result = results.data.map((current, index, array) => {
                const [province, r, g, b, provinceName] = current;
                return {
                  province: parseInt(province),
                  red: parseInt(r),
                  green: parseInt(g),
                  blue: parseInt(b),
                  name: provinceName,
                }
              });
              complete(result);
            },
            error,
          });
        });
      } else if (fileDirectoryHandle.name == "countries.txt") {
        console.log("Found country definitions");
        promises[4] = this.makeCountries(fileDirectoryHandle, saveDirectory);
      } else if (fileDirectoryHandle.name == "terrain.txt") {
        console.log("Found terrain definitions");
        promises[5] = this.parseV2(fileDirectoryHandle);
      } else if (fileDirectoryHandle.directoryHandle?.name.includes("localisation")) {
        localisations.push([this.makeLocalization(fileDirectoryHandle), fileDirectoryHandle]);
      } else if (flagTest.test(fileDirectoryHandle.name)) {
        flagFiles.set(fileDirectoryHandle.name.substring(0, fileDirectoryHandle.name.length - 4), fileDirectoryHandle);
      } else {
        const match = fileDirectoryHandle.name.match(terrainImageTest);
        if (!_.isNull(match)) {
          const terrainName = match[1];
          // Could check to see if we need it, but may've not read it yet so just retrieve all terrains
          terrainInterfaceImageFiles.set(terrainName, fileDirectoryHandle);
        }
      }
    }

    console.log(flagFiles);

    localisations.sort(([{}, a], [{}, b]) => a.name.localeCompare(b.name));
    let localisationSet = {};
    for (const [localisation, {}] of localisations) {
      try {
        _.assign(localisationSet, await localisation);
      } catch (error) {
        console.log("Error assigning stuff, I'm stuff, so is " + error);
      }
    }
    console.log(localisationSet);

    for (const promise of promises) {
      promise?.catch(reason => {
        console.error("Error loading: " + reason);
      })
    }
    const results = await Promise.allSettled(promises.map(x => x ?? Promise.reject("Can't find")));

    const [ideologyText, rawMapImage, rawTerrainImage, provinceDefinitionsMaybe, countriesMaybe, terrainDefinitionsMaybe] = results;
    let ideologies: any | undefined = undefined;
    let mapImage: URLCachedImage | undefined = undefined;
    let provinceLookup: ProvinceLookup | undefined = undefined;
    let countries: any | undefined = undefined;
    let filledTerrainImage: URLCachedImage | undefined;
    let terrainInfo: TerrainInfo | undefined = undefined;
    let terrainLookup: Map<number, string> | undefined = undefined;
    if (ideologyText.status == "fulfilled") {
      ideologies = ideologyText;
    }
    if (countriesMaybe.status == "fulfilled") {
      countries = countriesMaybe.value;
    }
    if (rawMapImage.status == "fulfilled") {
      mapImage = rawMapImage.value;
    }
    if (rawTerrainImage.status == "fulfilled") {
      filledTerrainImage = rawTerrainImage.value;
    }
    if (terrainDefinitionsMaybe.status == "fulfilled") {
      terrainInfo = terrainDefinitionsMaybe.value;
    }
    if (provinceDefinitionsMaybe.status == "fulfilled" && provinceDefinitionsMaybe.value) {
      let provinceDefinitions = provinceDefinitionsMaybe.value;
      provinceLookup = makeProvinceLookup(provinceDefinitions);
    }
    if (filledTerrainImage && mapImage && provinceLookup && terrainInfo) {
      // make both
      terrainLookup = makeTerrainLookup(mapImage.original, filledTerrainImage.original, provinceLookup, terrainInfo);
    }
    // const localisationLanguages = swapPrimaryKey(localisationSet);
    return new VickyGameConfiguration(flagFiles.size == 0 ? undefined : flagFiles,
      terrainInterfaceImageFiles.size == 0 ? undefined : terrainInterfaceImageFiles,
      Object.keys(localisationSet).length == 0 ? undefined : localisationSet,
      ideologies,
      mapImage,
      terrainLookup,
      provinceLookup,
      countries);
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

