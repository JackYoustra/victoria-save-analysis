import _ from "lodash";

export function box<T>(multiplicityMaybe: T[] | T | undefined): T[] {
  if (_.isUndefined(multiplicityMaybe)) {
    return [];
  } else if (_.isArray(multiplicityMaybe)) {
    return multiplicityMaybe;
  } else {
    return [multiplicityMaybe];
  }
}