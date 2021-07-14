type Multiplicity<T> = T[] | T;

export interface Province {
  name:                   string;
  owner:                  string;
  controller:             string;
  core:                   string[];
  garrison:               number;
  fort:                   number[];
  railroad:               number[];
  aristocrats?:           Multiplicity<Aristocrats>;
  artisans?:              Multiplicity<Artisan>;
  bureaucrats?:           Multiplicity<Aristocrats>;
  capitalists?:           Multiplicity<Capitalists>;
  clergymen?:             Multiplicity<Aristocrats>;
  clerks?:                Multiplicity<Aristocrats>;
  craftsmen?:             Multiplicity<Aristocrats>;
  farmers?:               Multiplicity<Farmer>;
  officers?:              Multiplicity<Aristocrats>;
  soldiers?:              Multiplicity<Aristocrats>;
  building_construction:  BuildingConstruction;
  rgo:                    Rgo;
  life_rating:            number;
  infrastructure:         number;
  last_imigration:        string;
  last_controller_change: string;
  unit_names:             UnitNames;
  party_loyalty:          PartyLoyalty[];
}

export interface Aristocrats {
  id:              number;
  size:            number;
  // The third key contains the ethnicity as a key and the religion as a value
  // north_german?:   string;
  money:           number;
  ideology:        { [key: string]: number };
  issues:          { [key: string]: number };
  con:             number;
  literacy:        number;
  con_factor:      number;
  everyday_needs?: number;
  luxury_needs:    number;
  random:          number;
  bank?:           number;
  polish?:         string;
  mil?:            number;
  promoted?:       number;
  converted?:      number;
  demoted?:        number;
}

export interface Capitalists {
  id:           number;
  size:         number;
  north_german: string;
  money:        number;
  ideology:     { [key: string]: number };
  issues:       { [key: string]: number };
  con:          number;
  literacy:     number;
  bank:         number;
  con_factor:   number;
  demoted:      number;
  luxury_needs: number;
  random:       number;
}

export interface Artisan {
  id:                    number;
  size:                  number;
  north_german:          string;
  money:                 number;
  ideology:              { [key: string]: number };
  issues:                { [key: string]: number };
  con:                   number;
  literacy:              number;
  production_type:       string;
  stockpile:             Goods;
  need:                  Goods;
  last_spending:         number;
  current_producing:     number;
  percent_afforded:      number;
  percent_sold_domestic: number;
  percent_sold_export:   number;
  leftover:              number;
  throttle:              number;
  needs_cost:            number;
  production_income:     number;
  con_factor:            number;
  everyday_needs?:       number;
  luxury_needs:          number;
  random:                number;
}

export interface Goods {
  // (good name => amount needed)
  [goodName: string] : number;
}

export interface BuildingConstruction {
  id:          ID;
  start_date:  string;
  date:        string;
  location:    number;
  country:     string;
  input_goods: InputGoods;
  building:    number;
}

export interface ID {
  id:   number;
  type: number;
}

export interface InputGoods {
  goods_demand: Goods;
  input_goods:  Goods;
  money:        number;
}

export interface Farmer {
  id:               number;
  size:             number;
  north_german?:    string;
  money:            number;
  ideology:         { [key: string]: number };
  issues:           { [key: string]: number };
  con?:             number;
  literacy:         number;
  con_factor:       number;
  everyday_needs?:  number;
  luxury_needs:     number;
  random:           number;
  size_changes?:    number[];
  polish?:          string;
  mil?:             number;
  promoted?:        number;
  life_needs?:      number;
  faction?:         ID;
  days_of_loss?:    number;
  french?:          string;
  converted?:       number;
  local_migration?: number;
  south_german?:    string;
  demoted?:         number;
}

export interface PartyLoyalty {
  ideology:      string;
  loyalty_value: number;
}

export interface Rgo {
  employment:  Employment;
  last_income: number;
  goods_type:  string;
}

export interface Employment {
  province_id: number;
  employees:   Employees;
}

export interface Employees {
  province_pop_id: ProvincePopID;
  count:           number;
}

export interface ProvincePopID {
  province_id: number;
  index:       number;
  type:        number;
}

export interface UnitNames {
  data: Datum[];
}

export interface Datum {
  count?: number;
  id?:    number[];
}
