import {ProcessWar} from "../../logic/processing/vickySave";
import {HistoryElement, War} from "../../logic/types/save/save";


test('Unit history test', () => {
  const history: [string, HistoryElement][] = [];

  let terms = ProcessWar(history);
  expect(terms.defender.term).toEqual({});
  expect(terms.attacker.term).toEqual({});
  history.push(
    ["1936.1.1", { add_attacker: "USA" }],
    ["1936.1.2", { rem_attacker: "USA" }]
  );
  terms = ProcessWar(history);
  expect(terms.defender.term).toEqual({});
  expect(terms.attacker.term).toEqual({ USA: {inWar: false, enterLeaveWarDates: ["1936.1.1", "1936.1.2"]}});

  history.push(
    ["1936.1.1", { add_defender: "USA" }],
    ["1936.1.2", { rem_defender: "USA" }]
  );
  terms = ProcessWar(history);
  expect(terms.attacker.term).toEqual({ USA: {inWar: false, enterLeaveWarDates: ["1936.1.1", "1936.1.2"]}});
  expect(terms.defender.term).toEqual({ USA: {inWar: false, enterLeaveWarDates: ["1936.1.1", "1936.1.2"]}});
});

test('Initial attack history test (single leaders)', () => {
  const mexicanSubmit: War = {
      "name": "War of Mexican Submission",
      "history": {
        "battle": [
          {
            "name": "Morelos",
            "location": 2147,
            "result": "no",
            "attacker": {
              "country": "USA",
              "leader": "Lafayette Brown",
              "infantry": 6000,
              "losses": 1981
            },
            "defender": {
              "country": "MEX",
              "leader": "Ernesto González",
              "artillery": 3000,
              "infantry": 12000,
              "losses": 2303
            }
          },
          {
            "name": "Nogales",
            "location": 2140,
            "result": "yes",
            "attacker": {
              "country": "USA",
              "leader": "Robert Wallace",
              "artillery": 21000,
              "engineer": 3000,
              "hussar": 9000,
              "infantry": 30000,
              "losses": 9030
            },
            "defender": {
              "country": "MEX",
              "leader": "Pascual Zuloaga",
              "artillery": 8295,
              "infantry": 22731,
              "losses": 15275
            }
          },
          {
            "name": "El Paso",
            "location": 136,
            "result": "yes",
            "attacker": {
              "country": "USA",
              "leader": "Russell Sprague",
              "artillery": 15000,
              "dragoon": 3000,
              "engineer": 6000,
              "hussar": 6000,
              "infantry": 51000,
              "losses": 11268
            },
            "defender": {
              "country": "MEX",
              "leader": "Valeriano Robles",
              "artillery": 5880,
              "engineer": 8820,
              "infantry": 17640,
              "losses": 12885
            }
          },
          {
            "name": "Paso del Norte",
            "location": 2143,
            "result": "yes",
            "attacker": {
              "country": "USA",
              "leader": "Russell Sprague",
              "artillery": 14824,
              "dragoon": 3000,
              "engineer": 6000,
              "hussar": 6000,
              "infantry": 48908,
              "losses": 12400
            },
            "defender": {
              "country": "MEX",
              "leader": "Pascual Zuloaga",
              "artillery": 9557,
              "engineer": 7726,
              "infantry": 23332,
              "losses": 10798
            }
          },
          {
            "name": "Delicias",
            "location": 2144,
            "result": "yes",
            "attacker": {
              "country": "USA",
              "leader": "Russell Sprague",
              "artillery": 36000,
              "dragoon": 3000,
              "engineer": 9000,
              "hussar": 14910,
              "infantry": 57863,
              "losses": 3287
            },
            "defender": {
              "country": "MEX",
              "leader": "Pascual Zuloaga",
              "artillery": 5793,
              "engineer": 2305,
              "infantry": 24569,
              "losses": 14707
            }
          },
          {
            "name": "Laredo",
            "location": 138,
            "result": "no",
            "attacker": {
              "country": "USA",
              "leader": "Russell Sprague",
              "artillery": 14223,
              "dragoon": 2728,
              "engineer": 5700,
              "hussar": 5425,
              "infantry": 29442,
              "losses": 46076
            },
            "defender": {
              "country": "MEX",
              "leader": "Raimundo Urbina",
              "artillery": 11946,
              "cavalry": 3000,
              "engineer": 8943,
              "infantry": 68064,
              "losses": 34532
            }
          },
          {
            "name": "Delicias",
            "location": 2144,
            "result": "yes",
            "attacker": {
              "country": "USA",
              "leader": "Robert Wallace",
              "artillery": 21000,
              "engineer": 3000,
              "hussar": 9000,
              "infantry": 29443,
              "losses": 1705
            },
            "defender": {
              "country": "MEX",
              "leader": "Valeriano Robles",
              "artillery": 2001,
              "infantry": 15561,
              "losses": 5516
            }
          },
          {
            "name": "Laredo",
            "location": 138,
            "result": "yes",
            "attacker": {
              "country": "USA",
              "leader": "Robert Wallace",
              "artillery": 9848,
              "dragoon": 193,
              "infantry": 11,
              "losses": 6426
            },
            "defender": {
              "country": "CLM",
              "leader": "Raimundo Urbina",
              "artillery": 6000,
              "engineer": 3638,
              "infantry": 20826,
              "losses": 3419
            }
          },
          {
            "name": "San Antonio",
            "location": 137,
            "result": "yes",
            "attacker": {
              "country": "USA",
              "leader": "Russell Sprague",
              "artillery": 20682,
              "engineer": 2932,
              "hussar": 9000,
              "infantry": 28124,
              "losses": 2383
            },
            "defender": {
              "country": "MEX",
              "leader": "Juan José de Obaldía",
              "artillery": 6085,
              "engineer": 1955,
              "infantry": 14801,
              "losses": 16427
            }
          },
          {
            "name": "Morelos",
            "location": 2147,
            "result": "yes",
            "attacker": {
              "country": "USA",
              "leader": "Russell Sprague",
              "artillery": 21000,
              "engineer": 3000,
              "hussar": 9000,
              "infantry": 39000,
              "losses": 8505
            },
            "defender": {
              "country": "CLM",
              "leader": "Raimundo Urbina",
              "artillery": 6000,
              "engineer": 3701,
              "infantry": 16924,
              "losses": 18016
            }
          },
          {
            "name": "Monclova",
            "location": 2152,
            "result": "yes",
            "attacker": {
              "country": "USA",
              "leader": "Alexander Schofield",
              "artillery": 6000,
              "engineer": 6000,
              "infantry": 33000,
              "losses": 2398
            },
            "defender": {
              "country": "MEX",
              "leader": "Valeriano Robles",
              "cavalry": 6000,
              "infantry": 22278,
              "losses": 12995
            }
          },
          {
            "name": "Hermosillo",
            "location": 2137,
            "result": "yes",
            "attacker": {
              "country": "USA",
              "leader": "Lafayette Brown",
              "artillery": 3000,
              "infantry": 32880,
              "losses": 15726
            },
            "defender": {
              "country": "MEX",
              "leader": "Pascual Zuloaga",
              "artillery": 5328,
              "engineer": 9000,
              "infantry": 17237,
              "losses": 12479
            }
          },
          {
            "name": "Laredo",
            "location": 138,
            "result": "yes",
            "attacker": {
              "country": "USA",
              "leader": "Robert Wallace",
              "artillery": 15000,
              "dragoon": 3000,
              "engineer": 6000,
              "hussar": 6000,
              "infantry": 38424,
              "losses": 1636
            },
            "defender": {
              "country": "CLM",
              "leader": "Raimundo Urbina",
              "artillery": 2158,
              "engineer": 822,
              "infantry": 4621,
              "losses": 5849
            }
          },
          {
            "name": "Torreón",
            "location": 2155,
            "result": "yes",
            "attacker": {
              "country": "USA",
              "leader": "Alexander Schofield",
              "artillery": 6000,
              "engineer": 6000,
              "infantry": 33000,
              "losses": 2002
            },
            "defender": {
              "country": "MEX",
              "leader": "Valeriano Robles",
              "cavalry": 4864,
              "infantry": 16684,
              "losses": 3969
            }
          },
          {
            "name": "Balboa",
            "location": 1723,
            "result": "yes",
            "attacker": {
              "country": "USA",
              "leader": "Nathaniel McClellan",
              "infantry": 11760,
              "losses": 4638
            },
            "defender": {
              "country": "CLM",
              "leader": "Ezequiel de Mosquera",
              "infantry": 18000,
              "losses": 9846
            }
          },
          {
            "name": "Gulf of Panama",
            "location": 3001,
            "result": "no",
            "attacker": {
              "country": "USA",
              "leader": "Lucas Carr",
              "steam_transport": 4,
              "losses": 0
            },
            "defender": {
              "country": "CLM",
              "leader": "José Manuel Almonte",
              "clipper_transport": 10,
              "frigate": 24,
              "manowar": 24,
              "losses": 1
            }
          },
          {
            "name": "Durango",
            "location": 2153,
            "result": "yes",
            "attacker": {
              "country": "USA",
              "leader": "John Stevenson",
              "infantry": 44604,
              "losses": 3619
            },
            "defender": {
              "country": "MEX",
              "leader": "Ernesto González",
              "cavalry": 5293,
              "infantry": 17715,
              "losses": 2474
            }
          },
          {
            "name": "Guaymas",
            "location": 2141,
            "result": "yes",
            "attacker": {
              "country": "USA",
              "leader": "Chester Stevens",
              "infantry": 36000,
              "losses": 16331
            },
            "defender": {
              "country": "MEX",
              "leader": "Pascual Zuloaga",
              "artillery": 3955,
              "engineer": 7374,
              "infantry": 7757,
              "losses": 3306
            }
          },
          {
            "name": "Balboa",
            "location": 1723,
            "result": "no",
            "attacker": {
              "country": "USA",
              "leader": "Nathaniel McClellan",
              "infantry": 7122,
              "losses": 6276
            },
            "defender": {
              "country": "CLM",
              "leader": "Raimundo Urbina",
              "cavalry": 6000,
              "infantry": 12000,
              "losses": 5817
            }
          },
          {
            "name": "Tepic",
            "location": 2161,
            "result": "yes",
            "attacker": {
              "country": "USA",
              "leader": "Robert Wallace",
              "artillery": 18738,
              "engineer": 2700,
              "hussar": 7938,
              "infantry": 29515,
              "losses": 3611
            },
            "defender": {
              "country": "MEX",
              "leader": "Ernesto González",
              "cavalry": 5738,
              "infantry": 20262,
              "losses": 7241
            }
          },
          {
            "name": "Culiacán",
            "location": 2157,
            "result": "yes",
            "attacker": {
              "country": "USA",
              "leader": "Alexander Franklin",
              "artillery": 6000,
              "engineer": 6000,
              "hussar": 3000,
              "infantry": 18000,
              "losses": 3757
            },
            "defender": {
              "country": "MEX",
              "leader": "Pascual Zuloaga",
              "artillery": 2351,
              "engineer": 6029,
              "infantry": 6212,
              "losses": 6592
            }
          }
        ],
        "1899.2.4": [
          {
            "add_attacker": "USA"
          },
          {
            "add_defender": "MEX"
          }
        ],
        "1899.2.5": {
          "add_defender": "CLM"
        },
        "1899.11.24": [
          {
            "rem_attacker": "USA"
          },
          {
            "rem_defender": "MEX"
          },
          {
            "rem_defender": "CLM"
          }
        ]
      },
      "original_attacker": "USA",
      "original_defender": "MEX",
      "original_wargoal": {
        "casus_belli": "add_to_sphere",
        "actor": "USA",
        "receiver": "MEX"
      },
      "action": "1899.11.23"
    };
  const terms = ProcessWar(mexicanSubmit);
  expect(terms.attacker.term).toEqual({
    USA: {inWar: false, enterLeaveWarDates: ["1899.2.4", "1899.11.24"]},
  });

  expect(terms.defender.term).toEqual({
    MEX: {inWar: false, enterLeaveWarDates: ["1899.2.4", "1899.11.24"]},
    CLM: {inWar: false, enterLeaveWarDates: ["1899.2.5", "1899.11.24"]},
  });

  expect(terms.attacker.losses).toEqual({
    "USA": {
      "Alexander Franklin": 3757,
      "Alexander Schofield": 4400,
      "Chester Stevens": 16331,
      "John Stevenson": 3619,
      "Lafayette Brown": 17707,
      "Lucas Carr": 0,
      "Nathaniel McClellan": 10914,
      "Robert Wallace": 22408,
      "Russell Sprague": 83919
    }
  });

  expect(terms.defender.losses).toEqual({
    "CLM": {
      "Ezequiel de Mosquera": 9846,
      "José Manuel Almonte": 1,
      "Raimundo Urbina": 33101
    },
    "MEX": {
      "Ernesto González": 12018,
      "Juan José de Obaldía": 16427,
      "Pascual Zuloaga": 63157,
      "Raimundo Urbina": 34532,
      "Valeriano Robles": 35365
    }
  });
});