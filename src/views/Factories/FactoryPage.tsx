import VickyContext from "../../logic/processing/vickyContext";
import {useSave} from "../../logic/VickySavesProvider";
import React, {useLayoutEffect, useRef, useState} from "react";
import {War} from "../../logic/types/save/save";
import {ForceGraph3D} from "react-force-graph";
import {getType, ProductionTypes} from "../../logic/types/configuration/factory";
import SpriteText from "three-spritetext";
import {BufferAttribute, BufferGeometry, Line, LineBasicMaterial} from "three";
import {scaleOrdinal, schemeRdYlGn} from "d3";

const mock: ProductionTypes = {
  "factory_template": {
    "efficiency": {
      "cement": 0.5,
      "machine_parts": 0.05
    },
    "owner": {
      "poptype": "capitalists",
      "effect": "input",
      "effect_multiplier": -2.5
    },
    "employees": [
      {
        "poptype": "craftsmen",
        "effect": "throughput",
        "amount": 0.8
      },
      {
        "poptype": "clerks",
        "effect": "output",
        "effect_multiplier": 1.5,
        "amount": 0.2
      }
    ],
    "type": "factory",
    "workforce": 10000
  },
  "cheap_factory_template": {
    "efficiency": {
      "cement": 0.25
    },
    "owner": {
      "poptype": "capitalists",
      "effect": "input",
      "effect_multiplier": -1.5
    },
    "employees": [
      {
        "poptype": "craftsmen",
        "effect": "throughput",
        "amount": 0.8
      },
      {
        "poptype": "clerks",
        "effect": "output",
        "effect_multiplier": 1.5,
        "amount": 0.2
      }
    ],
    "type": "factory",
    "workforce": 10000
  },
  "machine_part_user_template": {
    "efficiency": {
      "cement": 0.5
    },
    "owner": {
      "poptype": "capitalists",
      "effect": "input",
      "effect_multiplier": -2.5
    },
    "employees": [
      {
        "poptype": "craftsmen",
        "effect": "throughput",
        "amount": 0.8
      },
      {
        "poptype": "clerks",
        "effect": "output",
        "effect_multiplier": 1.5,
        "amount": 0.2
      }
    ],
    "type": "factory",
    "workforce": 10000
  },
  "cement_template": {
    "efficiency": {
      "iron": 2.3,
      "machine_parts": 0.05
    },
    "owner": {
      "poptype": "capitalists",
      "effect": "input",
      "effect_multiplier": -2.5
    },
    "employees": [
      {
        "poptype": "craftsmen",
        "effect": "throughput",
        "amount": 0.8
      },
      {
        "poptype": "clerks",
        "effect": "output",
        "effect_multiplier": 1.5,
        "amount": 0.2
      }
    ],
    "type": "factory",
    "workforce": 10000
  },
  "aeroplane_factory": {
    "template": "machine_part_user_template",
    "input_goods": {
      "machine_parts": 1.11,
      "electric_gear": 2,
      "rubber": 1,
      "lumber": 3.3
    },
    "output_goods": "aeroplanes",
    "value": 0.91,
    "bonus": [
      {
        "trigger": {
          "has_building": "machine_parts_factory"
        },
        "value": 0.25
      },
      {
        "trigger": {
          "has_building": "electric_gear_factory"
        },
        "value": 0.25
      }
    ]
  },
  "barrel_factory": {
    "template": "machine_part_user_template",
    "input_goods": {
      "automobiles": 0.3,
      "machine_parts": 0.85,
      "electric_gear": 1,
      "rubber": 1
    },
    "output_goods": "barrels",
    "value": 1,
    "bonus": [
      {
        "trigger": {
          "has_building": "automobile_factory"
        },
        "value": 0.1
      },
      {
        "trigger": {
          "has_building": "machine_parts_factory"
        },
        "value": 0.1
      },
      {
        "trigger": {
          "has_building": "electric_gear_factory"
        },
        "value": 0.05
      }
    ]
  },
  "automobile_factory": {
    "template": "machine_part_user_template",
    "input_goods": {
      "machine_parts": 1.05,
      "electric_gear": 1.5,
      "rubber": 1,
      "steel": 2.25
    },
    "output_goods": "automobiles",
    "value": 1.43,
    "bonus": [
      {
        "trigger": {
          "has_building": "machine_parts_factory"
        },
        "value": 0.1
      },
      {
        "trigger": {
          "has_building": "steel_factory"
        },
        "value": 0.1
      },
      {
        "trigger": {
          "has_building": "electric_gear_factory"
        },
        "value": 0.05
      }
    ]
  },
  "radio_factory": {
    "template": "factory_template",
    "input_goods": {
      "glass": 10,
      "electric_gear": 3
    },
    "output_goods": "radio",
    "value": 6.5,
    "bonus": [
      {
        "trigger": {
          "has_building": "electric_gear_factory"
        },
        "value": 0.15
      },
      {
        "trigger": {
          "has_building": "glass_factory"
        },
        "value": 0.1
      }
    ]
  },
  "telephone_factory": {
    "template": "factory_template",
    "input_goods": {
      "glass": 15,
      "electric_gear": 2.5
    },
    "output_goods": "telephones",
    "value": 6.5,
    "bonus": [
      {
        "trigger": {
          "has_building": "electric_gear_factory"
        },
        "value": 0.15
      },
      {
        "trigger": {
          "has_building": "glass_factory"
        },
        "value": 0.1
      }
    ]
  },
  "electric_gear_factory": {
    "template": "factory_template",
    "input_goods": {
      "rubber": 4,
      "coal": 5,
      "iron": 5
    },
    "output_goods": "electric_gear",
    "value": 5,
    "bonus": [
      {
        "trigger": {
          "trade_goods_in_state": "rubber"
        },
        "value": 0.15
      },
      {
        "trigger": {
          "trade_goods_in_state": "coal"
        },
        "value": 0.05
      },
      {
        "trigger": {
          "trade_goods_in_state": "iron"
        },
        "value": 0.05
      }
    ]
  },
  "machine_parts_factory": {
    "template": "factory_template",
    "input_goods": {
      "steel": 9,
      "coal": 5
    },
    "output_goods": "machine_parts",
    "value": 2,
    "bonus": [
      {
        "trigger": {
          "has_building": "steel_factory"
        },
        "value": 0.125
      },
      {
        "trigger": {
          "trade_goods_in_state": "coal"
        },
        "value": 0.125
      }
    ]
  },
  "synthetic_oil_factory": {
    "template": "factory_template",
    "input_goods": {
      "coal": 12
    },
    "output_goods": "oil",
    "value": 2.5,
    "bonus": {
      "trigger": {
        "trade_goods_in_state": "coal"
      },
      "value": 0.25
    }
  },
  "fuel_refinery": {
    "template": "factory_template",
    "input_goods": {
      "oil": 2.5
    },
    "output_goods": "fuel",
    "value": 2,
    "bonus": {
      "trigger": {
        "OR": {
          "trade_goods_in_state": "oil",
          "has_building": "synthetic_oil_factory"
        }
      },
      "value": 0.25
    }
  },
  "steamer_shipyard": {
    "template": "factory_template",
    "input_goods": {
      "steel": 22,
      "coal": 30
    },
    "output_goods": "steamer_convoy",
    "is_coastal": "yes",
    "value": 3,
    "bonus": [
      {
        "trigger": {
          "has_building": "steel_factory"
        },
        "value": 0.125
      },
      {
        "trigger": {
          "trade_goods_in_state": "coal"
        },
        "value": 0.125
      }
    ]
  },
  "luxury_clothes_factory": {
    "template": "factory_template",
    "input_goods": {
      "regular_clothes": 0.9,
      "silk": 3.9
    },
    "output_goods": "luxury_clothes",
    "value": 1,
    "bonus": [
      {
        "trigger": {
          "has_building": "regular_clothes_factory"
        },
        "value": 0.2
      },
      {
        "trigger": {
          "trade_goods_in_state": "silk"
        },
        "value": 0.05
      }
    ]
  },
  "luxury_furniture_factory": {
    "template": "factory_template",
    "input_goods": {
      "furniture": 2,
      "tropical_wood": 7.5
    },
    "output_goods": "luxury_furniture",
    "value": 1.1,
    "bonus": [
      {
        "trigger": {
          "has_building": "furniture_factory"
        },
        "value": 0.2
      },
      {
        "trigger": {
          "trade_goods_in_state": "tropical_wood"
        },
        "value": 0.05
      }
    ]
  },
  "steel_factory": {
    "template": "factory_template",
    "input_goods": {
      "iron": 20,
      "coal": 5
    },
    "output_goods": "steel",
    "value": 20,
    "bonus": [
      {
        "trigger": {
          "trade_goods_in_state": "iron"
        },
        "value": 0.125
      },
      {
        "trigger": {
          "trade_goods_in_state": "coal"
        },
        "value": 0.125
      }
    ]
  },
  "artillery_factory": {
    "template": "factory_template",
    "input_goods": {
      "explosives": 1,
      "steel": 8
    },
    "output_goods": "artillery",
    "value": 1.3,
    "bonus": [
      {
        "trigger": {
          "has_building": "steel_factory"
        },
        "value": 0.15
      },
      {
        "trigger": {
          "has_building": "explosives_factory"
        },
        "value": 0.1
      }
    ]
  },
  "clipper_shipyard": {
    "template": "factory_template",
    "input_goods": {
      "fabric": 100,
      "timber": 100,
      "steel": 30
    },
    "output_goods": "clipper_convoy",
    "is_coastal": "yes",
    "value": 10,
    "bonus": [
      {
        "trigger": {
          "has_building": "fabric_factory"
        },
        "value": 0.1
      },
      {
        "trigger": {
          "has_building": "steel_factory"
        },
        "value": 0.1
      },
      {
        "trigger": {
          "trade_goods_in_state": "timber"
        },
        "value": 0.05
      }
    ]
  },
  "small_arms_factory": {
    "template": "factory_template",
    "input_goods": {
      "ammunition": 2,
      "steel": 3
    },
    "output_goods": "small_arms",
    "value": 2,
    "bonus": [
      {
        "trigger": {
          "has_building": "steel_factory"
        },
        "value": 0.15
      },
      {
        "trigger": {
          "has_building": "ammunition_factory"
        },
        "value": 0.1
      }
    ]
  },
  "furniture_factory": {
    "template": "factory_template",
    "input_goods": {
      "lumber": 20,
      "timber": 20
    },
    "output_goods": "furniture",
    "value": 12,
    "bonus": [
      {
        "trigger": {
          "has_building": "lumber_mill"
        },
        "value": 0.15
      },
      {
        "trigger": {
          "trade_goods_in_state": "timber"
        },
        "value": 0.1
      }
    ]
  },
  "paper_mill": {
    "template": "factory_template",
    "input_goods": {
      "timber": 50
    },
    "output_goods": "paper",
    "value": 20,
    "bonus": {
      "trigger": {
        "trade_goods_in_state": "timber"
      },
      "value": 0.25
    }
  },
  "regular_clothes_factory": {
    "template": "factory_template",
    "input_goods": {
      "fabric": 40
    },
    "output_goods": "regular_clothes",
    "value": 15,
    "bonus": {
      "trigger": {
        "has_building": "fabric_factory"
      },
      "value": 0.25
    }
  },
  "explosives_factory": {
    "template": "factory_template",
    "input_goods": {
      "fertilizer": 3,
      "ammunition": 0.8
    },
    "output_goods": "explosives",
    "value": 3,
    "bonus": [
      {
        "trigger": {
          "has_building": "fertilizer_factory"
        },
        "value": 0.15
      },
      {
        "trigger": {
          "has_building": "ammunition_factory"
        },
        "value": 0.1
      }
    ]
  },
  "ammunition_factory": {
    "template": "cheap_factory_template",
    "input_goods": {
      "sulphur": 2,
      "iron": 4
    },
    "output_goods": "ammunition",
    "value": 2,
    "bonus": [
      {
        "trigger": {
          "trade_goods_in_state": "sulphur"
        },
        "value": 0.15
      },
      {
        "trigger": {
          "trade_goods_in_state": "iron"
        },
        "value": 0.1
      }
    ]
  },
  "canned_food_factory": {
    "template": "cheap_factory_template",
    "input_goods": {
      "iron": 0.5,
      "cattle": 4,
      "grain": 4,
      "fish": 4
    },
    "output_goods": "canned_food",
    "value": 2,
    "bonus": [
      {
        "trigger": {
          "trade_goods_in_state": "grain"
        },
        "value": 0.1
      },
      {
        "trigger": {
          "OR": {
            "trade_goods_in_state": [
              "fish",
              "cattle"
            ]
          }
        },
        "value": 0.1
      },
      {
        "trigger": {
          "trade_goods_in_state": "iron"
        },
        "value": 0.05
      }
    ]
  },
  "dye_factory": {
    "template": "cheap_factory_template",
    "input_goods": {
      "coal": 9
    },
    "output_goods": "dye",
    "value": 2.5,
    "bonus": {
      "trigger": {
        "trade_goods_in_state": "coal"
      },
      "value": 0.25
    }
  },
  "liquor_distillery": {
    "template": "cheap_factory_template",
    "input_goods": {
      "grain": 5,
      "glass": 4
    },
    "output_goods": "liquor",
    "value": 5,
    "bonus": [
      {
        "trigger": {
          "has_building": "glass_factory"
        },
        "value": 0.15
      },
      {
        "trigger": {
          "trade_goods_in_state": "grain"
        },
        "value": 0.1
      }
    ]
  },
  "winery": {
    "template": "cheap_factory_template",
    "input_goods": {
      "fruit": 5,
      "glass": 5
    },
    "output_goods": "wine",
    "value": 3.5,
    "bonus": [
      {
        "trigger": {
          "has_building": "glass_factory"
        },
        "value": 0.15
      },
      {
        "trigger": {
          "trade_goods_in_state": "fruit"
        },
        "value": 0.1
      }
    ]
  },
  "lumber_mill": {
    "template": "factory_template",
    "input_goods": {
      "timber": 100
    },
    "output_goods": "lumber",
    "value": 110,
    "bonus": {
      "trigger": {
        "trade_goods_in_state": "timber"
      },
      "value": 0.25
    }
  },
  "fabric_factory": {
    "template": "factory_template",
    "input_goods": {
      "cotton": 18,
      "dye": 2
    },
    "output_goods": "fabric",
    "value": 45,
    "bonus": [
      {
        "trigger": {
          "trade_goods_in_state": "cotton"
        },
        "value": 0.125
      },
      {
        "trigger": {
          "OR": {
            "has_building": "dye_factory",
            "trade_goods_in_state": "dye"
          }
        },
        "value": 0.125
      }
    ]
  },
  "cement_factory": {
    "template": "cement_template",
    "input_goods": {
      "coal": 12
    },
    "output_goods": "cement",
    "value": 3,
    "bonus": {
      "trigger": {
        "trade_goods_in_state": "coal"
      },
      "value": 0.25
    }
  },
  "glass_factory": {
    "template": "factory_template",
    "input_goods": {
      "coal": 14
    },
    "output_goods": "glass",
    "value": 18,
    "bonus": {
      "trigger": {
        "trade_goods_in_state": "coal"
      },
      "value": 0.25
    }
  },
  "fertilizer_factory": {
    "template": "factory_template",
    "input_goods": {
      "sulphur": 6
    },
    "output_goods": "fertilizer",
    "value": 5,
    "bonus": {
      "trigger": {
        "trade_goods_in_state": "sulphur"
      },
      "value": 0.25
    }
  },
  "RGO_template_farmers": {
    "owner": {
      "poptype": "aristocrats",
      "effect": "output"
    },
    "employees": [
      {
        "poptype": "farmers",
        "effect": "throughput",
        "amount": 1
      },
      {
        "poptype": "slaves",
        "effect": "output",
        "amount": 1
      }
    ],
    "type": "rgo",
    "workforce": 40000
  },
  "RGO_template_labourers": {
    "owner": {
      "poptype": "aristocrats",
      "effect": "output"
    },
    "employees": [
      {
        "poptype": "labourers",
        "effect": "throughput",
        "amount": 1
      },
      {
        "poptype": "slaves",
        "effect": "output",
        "amount": 1
      }
    ],
    "type": "rgo",
    "workforce": 40000
  },
  "cattle_ranch": {
    "template": "RGO_template_farmers",
    "output_goods": "cattle",
    "value": 1.8,
    "farm": "yes"
  },
  "coal_mine": {
    "template": "RGO_template_labourers",
    "output_goods": "coal",
    "value": 2.4,
    "mine": "yes"
  },
  "coffee_plantation": {
    "template": "RGO_template_farmers",
    "output_goods": "coffee",
    "value": 1.5,
    "farm": "yes"
  },
  "cotton_plantation": {
    "template": "RGO_template_farmers",
    "output_goods": "cotton",
    "value": 2.2,
    "farm": "yes"
  },
  "dye_plantation": {
    "template": "RGO_template_farmers",
    "output_goods": "dye",
    "value": 0.22,
    "farm": "yes"
  },
  "fishing_wharf": {
    "template": "RGO_template_farmers",
    "output_goods": "fish",
    "value": 2.2,
    "farm": "yes"
  },
  "grain_farm": {
    "template": "RGO_template_farmers",
    "output_goods": "grain",
    "value": 1.8,
    "farm": "yes"
  },
  "iron_mine": {
    "template": "RGO_template_labourers",
    "output_goods": "iron",
    "value": 1.8,
    "mine": "yes"
  },
  "oil_rig": {
    "template": "RGO_template_labourers",
    "output_goods": "oil",
    "value": 1,
    "mine": "yes"
  },
  "opium_plantation": {
    "template": "RGO_template_farmers",
    "output_goods": "opium",
    "value": 0.7,
    "farm": "yes"
  },
  "orchard": {
    "template": "RGO_template_farmers",
    "output_goods": "fruit",
    "value": 2.8,
    "farm": "yes"
  },
  "precious_metal_mine": {
    "template": "RGO_template_labourers",
    "output_goods": "precious_metal",
    "value": 2,
    "mine": "yes"
  },
  "rubber_lodge": {
    "template": "RGO_template_labourers",
    "output_goods": "rubber",
    "value": 0.75,
    "farm": "yes"
  },
  "sheep_ranch": {
    "template": "RGO_template_farmers",
    "output_goods": "wool",
    "value": 5,
    "farm": "yes"
  },
  "silkworm_ranch": {
    "template": "RGO_template_farmers",
    "output_goods": "silk",
    "value": 0.25,
    "farm": "yes"
  },
  "sulphur_mine": {
    "template": "RGO_template_labourers",
    "output_goods": "sulphur",
    "value": 2,
    "mine": "yes"
  },
  "tea_plantation": {
    "template": "RGO_template_farmers",
    "output_goods": "tea",
    "value": 1.75,
    "farm": "yes"
  },
  "timber_lodge": {
    "template": "RGO_template_labourers",
    "output_goods": "timber",
    "value": 8,
    "farm": "yes"
  },
  "tobacco_plantation": {
    "template": "RGO_template_farmers",
    "output_goods": "tobacco",
    "value": 2.5,
    "farm": "yes"
  },
  "tropical_wood_lodge": {
    "template": "RGO_template_labourers",
    "output_goods": "tropical_wood",
    "value": 4,
    "farm": "yes"
  },
  "artisan_aeroplane": {
    "input_goods": {
      "machine_parts": 1.06,
      "electric_gear": 2,
      "rubber": 1,
      "lumber": 3.3
    },
    "output_goods": "aeroplanes",
    "value": 0.91,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_barrel": {
    "input_goods": {
      "automobiles": 0.3,
      "machine_parts": 0.8,
      "electric_gear": 1,
      "rubber": 1
    },
    "output_goods": "barrels",
    "value": 1,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_automobile": {
    "input_goods": {
      "machine_parts": 1,
      "electric_gear": 1.5,
      "rubber": 1,
      "steel": 2.25
    },
    "output_goods": "automobiles",
    "value": 1.43,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_radio": {
    "input_goods": {
      "glass": 10,
      "electric_gear": 3
    },
    "output_goods": "radio",
    "value": 6.5,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_telephone": {
    "input_goods": {
      "glass": 15,
      "electric_gear": 2.5
    },
    "output_goods": "telephones",
    "value": 6.5,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_electric_gear": {
    "input_goods": {
      "rubber": 4,
      "coal": 5,
      "iron": 5
    },
    "output_goods": "electric_gear",
    "value": 5,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_machine_parts": {
    "input_goods": {
      "steel": 9,
      "coal": 5
    },
    "output_goods": "machine_parts",
    "value": 2,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_fuel": {
    "input_goods": {
      "oil": 2.5
    },
    "output_goods": "fuel",
    "value": 2,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_steamer": {
    "input_goods": {
      "steel": 22,
      "coal": 30
    },
    "output_goods": "steamer_convoy",
    "is_coastal": "yes",
    "value": 3,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_luxury_clothes": {
    "input_goods": {
      "regular_clothes": 0.9,
      "silk": 3.9
    },
    "output_goods": "luxury_clothes",
    "value": 1,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_luxury_furniture": {
    "input_goods": {
      "furniture": 2,
      "tropical_wood": 7.5
    },
    "output_goods": "luxury_furniture",
    "value": 1.1,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_steel": {
    "input_goods": {
      "iron": 20,
      "coal": 5
    },
    "output_goods": "steel",
    "value": 20,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_artillery": {
    "input_goods": {
      "explosives": 1,
      "steel": 8
    },
    "output_goods": "artillery",
    "value": 1.3,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_clipper": {
    "input_goods": {
      "fabric": 100,
      "timber": 100,
      "steel": 30
    },
    "output_goods": "clipper_convoy",
    "is_coastal": "yes",
    "value": 10,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_small_arms": {
    "input_goods": {
      "ammunition": 2,
      "steel": 3
    },
    "output_goods": "small_arms",
    "value": 2,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_furniture": {
    "input_goods": {
      "lumber": 20,
      "timber": 20
    },
    "output_goods": "furniture",
    "value": 12,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_paper": {
    "input_goods": {
      "timber": 50
    },
    "output_goods": "paper",
    "value": 20,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_regular_clothes": {
    "input_goods": {
      "fabric": 40
    },
    "output_goods": "regular_clothes",
    "value": 15,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_explosives": {
    "input_goods": {
      "fertilizer": 3,
      "ammunition": 0.8
    },
    "output_goods": "explosives",
    "value": 3,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_ammunition": {
    "input_goods": {
      "sulphur": 2,
      "coal": 2,
      "iron": 5
    },
    "output_goods": "ammunition",
    "value": 3,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_canned_food": {
    "input_goods": {
      "iron": 2,
      "cattle": 12,
      "grain": 12,
      "fish": 12
    },
    "output_goods": "canned_food",
    "value": 6,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_liquor": {
    "input_goods": {
      "grain": 10,
      "glass": 8
    },
    "output_goods": "liquor",
    "value": 10,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_winery": {
    "input_goods": {
      "fruit": 10,
      "glass": 10
    },
    "output_goods": "wine",
    "value": 7,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_lumber": {
    "input_goods": {
      "timber": 100
    },
    "output_goods": "lumber",
    "value": 110,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_fabric": {
    "input_goods": {
      "cotton": 18,
      "dye": 2
    },
    "output_goods": "fabric",
    "value": 45,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_cement": {
    "input_goods": {
      "coal": 12
    },
    "output_goods": "cement",
    "value": 3,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_glass": {
    "input_goods": {
      "coal": 14
    },
    "output_goods": "glass",
    "value": 18,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  },
  "artisan_fertilizer": {
    "input_goods": {
      "sulphur": 6
    },
    "output_goods": "fertilizer",
    "value": 5,
    "owner": {
      "poptype": "artisan",
      "effect": "output"
    },
    "type": "artisan",
    "workforce": 10000
  }
} as unknown as ProductionTypes;

function append_default(object: Object, key: string, item: any) {
  if (object[key]) {
    object[key].push(item);
  } else {
    object[key] = [item];
  }
}

function process(factory: ProductionTypes): any {
  const producers: { [good: string]: string[] } = {};
  const consumers: { [good: string]: [string, number][] } = {};
  const nodes: any[] = [];
  for (const [production_name, production_type] of Object.entries(factory)) {
    const output: string | undefined = production_type["output_goods"];
    if (output) {
      append_default(producers, output, production_name);
    }
    const input: { [good: string]: number } | undefined = production_type["input_goods"];
    if (input) {
      for (const [good, amount] of Object.entries(input)) {
        append_default(consumers, good, [production_name, amount]);
      }
    }
    nodes.push({
      "id": production_name,
      "group": getType(production_type),
    })
  }

  const connections: any[] = [];
  for (const [producing_good, producerList] of Object.entries(producers)) {
    const consumerList = consumers[producing_good];
    if (consumerList) {
      // Make all of pairs
      for (const producer of producerList) {
        for (const [consumer, amount] of consumerList) {
          console.log(consumer);
          connections.push({"source": producer, "target": consumer, "amount": amount * 0.0001})
        }
      }
    }
  }

  return {
    "nodes": nodes,
    "links": connections,
  }
}

const graphy = process(mock);

const nodeColorScale = scaleOrdinal(schemeRdYlGn[4]);

export default function FactoryPage() {
  // const vickyContext: VickyContext = useSave().state;
  // const [selectedWar, useSelectedWar] = useState<War | undefined>(undefined);
  // if (!vickyContext.save) {
  //   return (
  //     <>
  //       Please upload a save to view war information.
  //     </>
  //   )
  // }
  const ref = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | undefined>(undefined);
  useLayoutEffect(() => {
    console.log("thing");
    setRect(ref.current?.getBoundingClientRect());
  }, [ref]);
  return (
    <div ref={ref}>
      <ForceGraph3D
        width={rect?.width}
        height={rect?.height}
        graphData={graphy}
        nodeAutoColorBy="group"
        dagMode="td"
        nodeThreeObject={node => {
          const sprite = new SpriteText(node.id as string);
          // @ts-ignore
          sprite.color = node.color;
          sprite.textHeight = 4;
          return sprite;
        }}
        linkDirectionalParticles={5}
        linkDirectionalParticleSpeed="amount"
        // linkThreeObject={link => {
        //   // 2 (nodes) x 3 (r+g+b) bytes between [0, 1]
        //   // For example:
        //   // new Float32Array([
        //   //   1, 0, 0,  // source node: red
        //   //   0, 1, 0   // target node: green
        //   // ]);
        //   // const colors = new Float32Array([].concat(
        //   //   ...[link.source, link.target]
        //   //     .map(nodeColorScale)
        //   //     .map(d3.color)
        //   //     .map(({ r, g, b }) => [r, g, b].map(v => v / 255)
        //   //     )));
        //
        //   const material = new LineBasicMaterial({
        //     color: 0xffffff,
        //     linewidth: 1,
        //   });
        //   const geometry = new BufferGeometry();
        //   geometry.setAttribute('position', new BufferAttribute(new Float32Array(2 * 3), 3));
        //   geometry.setAttribute('color', new BufferAttribute(colors, 3));
        //
        //   return new Line(geometry, material);
        // }}
      />
    </div>
  );
}