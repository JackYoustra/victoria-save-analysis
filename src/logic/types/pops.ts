import {IDElement} from "./save";
import {ProductionType, SchoolReforms} from "./vanillaConfigurations";

export interface POP {
  id:              number;
  size:            number;
  // oromo?:          Religion;
  money:           number;
  ideology:        { [key: string]: number };
  issues:          { [key: string]: number };
  literacy:        number;
  random:          number;
  mil?:            number;
  con_factor?:     number;
  everyday_needs?: number;
  faction?:        IDElement;
  con?:            number;
  life_needs?:         number;
  luxury_needs?:   number;
  size_changes?:   number[];
  // Maybe should be in freeman? For now, lets keep here
  assimilated?:           number;
}

export interface Freeman extends POP {
  bank?:               number;
  movement_issue?:     SchoolReforms;
  converted?:          number;
  movement_tag?:       string;
  local_migration?:    number;
  days_of_loss?:       number;
  colonial_migration?:    number;
  external_migration?: number;
}

export interface UpperClass extends Freeman {
  demoted?:            number;
}

export interface LowerClass extends Freeman {
  promoted?:              number;
}

export interface MiddleClass extends UpperClass, LowerClass { }

export interface Artisan extends MiddleClass {
  production_type?:       ProductionType;
  stockpile?:             { [key: string]: number };
  need?:                  { [key: string]: number };
  last_spending?:         number;
  current_producing?:     number;
  percent_afforded?:      number;
  percent_sold_domestic?: number;
  percent_sold_export?:   number;
  leftover?:              number;
  throttle?:              number;
  needs_cost?:            number;
  production_income?:     number;
}