import v2parser from "../../logic/v2parser";
import * as fs from 'fs';
import _ from "lodash";
import {Province} from "../../logic/types/save/save";
import {dateParser} from "../utilities";

const sample_province = fs.readFileSync("src/test/parser/sitka_input.txt").toString();
const sample_json = JSON.parse(fs.readFileSync("src/test/parser/sitka_output.txt").toString(), dateParser) as Province;

function comment(stringval: string): string {
  return stringval
    // end of line comments
    .replaceAll("[ \t]*\n", "# cooments")
    // comments in their own line, don't interrupt assignments so just do it at the end of tags
    .replaceAll("\"[ \t]*\n", "\n   #commenty mccommentface\n");
}

test('Parser parses Sitka correctly', () => {
  const vickyObject = v2parser.parse(sample_province);
  expect(vickyObject).toEqual(sample_json);
});

test('Parser parses comments correctly', () => {
  const commented = comment(sample_province);
  const vickyObject = v2parser.parse(commented);
  expect(vickyObject).toEqual(sample_json);
});

test('Parser parses negative numbers correctly', () => {
  const negative_sample = sample_province
    .replace("garrison=100.000", "garrison=-100.000")
    .replace("money=57200.63730", "money=-57200.63730")
    .replace("size=437", "size=-437");
  const vickyObject = v2parser.parse(comment(negative_sample));
  const negative_json = _.cloneDeep(sample_json);
  negative_json.garrison *= -1;
  if (_.isArray(negative_json.aristocrats)) {
    negative_json.aristocrats[0].money *= -1;
    negative_json.aristocrats[0].size *= -1;
  } else {
    fail("Many aristocrats should exist");
  }
  expect(vickyObject).toEqual(negative_json);
});
