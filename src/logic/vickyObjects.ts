import _, {omit} from "lodash";

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

function getPops(vickySave: any): any[] {
  const provinceTest = new RegExp('^[0-9]+$');
  const topKeys = Object.keys(vickySave);
  let pops: any[] = [];
  // May be able to abbreviate to for const key in props.vickySave
  for (const rootKey of topKeys) {
    if (provinceTest.test(rootKey)) {
      const province = vickySave[rootKey];
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

export default class VickyObjects {
  readonly pops: any[];
  readonly factories: any[];
  readonly countries: any[];
  readonly views: VickyViews;
  constructor(vickySave: any) {
    this.pops = getPops(vickySave);
    this.factories = getFactories(vickySave);
    this.countries = getCountries(vickySave);
    this.views = new VickyViews(this);
  }
}

class VickyViews {
  // Originally reaviz venn diagram
  readonly vennFlags: any[];
  constructor(object: VickyObjects) {
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

