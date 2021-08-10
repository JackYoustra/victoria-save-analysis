import React, {useCallback, useState} from "react";
import {useSave} from "../../logic/VickySavesProvider";
import VickyContext from "../../logic/processing/vickyContext";
import {box} from "../../logic/collections/collections";
import {Battle, HistoryElement, War} from "../../logic/types/save";
import _ from "lodash";
import {LossesType, parseDate, ProcessWar, TermStructure} from "../../logic/processing/vickySave";

interface VickyBattleViewProps {
  battle: Battle,
}

function VickyBattleView(props: VickyBattleViewProps) {
  const { battle: battle } = props;
  return (
    <div>
      <h3>
        {"Battle of " + battle.name}
      </h3>
      <h4>
        {battle.attacker.country + " attacking " + battle.defender.country}
      </h4>
    </div>
  )
}

function dateFragment(stringDates: string[], start: Date, end: Date): string | null {
  const dates = stringDates.map(x => parseDate(x));
  const localized: string[] = [];
  if (dates.length % 2 == 1) {
    localized.push("unknown");
  } else if (dates.length == 2 && dates[0] && dates[1]) {
    // There's only the enterance and exit day, see if they're within range of the start and end
    // Remove (qualify) if within five days
    const acceptanceThreshold = 1000*60*60*24*5;
    const startQualified = ((dates[0].getTime() - start.getTime()) < acceptanceThreshold);
    const endQualified = ((end.getTime() - dates[1].getTime()) < acceptanceThreshold);
    if (startQualified && endQualified) {
      return null;
    } else if (endQualified) {
      return `${localize(dates[0])} -`;
    } else if (startQualified) {
      return `- ${localize(dates[1])}`;
    }
  }

  return _.chunk(dates, 2).map(chunk => {
    const [entrance, departure] = chunk;
    return entrance + "-" + departure;
  }).join(", ");
}

interface ParticipantElementProps {
  terms: TermStructure,
  start: Date,
  end: Date,
}

function ParticipantElement(props: ParticipantElementProps) {
  const { terms: terms } = props;
  const entries = Object.entries(terms);
  return (
    entries.map((value) => {
      const [tag, {inWar, enterLeaveWarDates}] = value;
      return (
        <>
          <br/>
          {tag}
          <br/>
          {dateFragment(enterLeaveWarDates, props.start, props.end)}
        </>
      );
    })
  );
}

interface CasualtyListProps {
  losses: LossesType,
}

function CasualtyList(props: CasualtyListProps) {
  // Largest first
  const lossList: [string, string, number][] = Object.entries(props.losses).flatMap(tuple => {
    const [country, leaders] = tuple;
    const retVal: [string, string, number][] = Object.entries(leaders).map(x => {
      const [leader, loss] = x;
      return [country, leader, loss];
    });
    return retVal;
  });
  const sorted = lossList
    .filter(x => x[2] != 0)
    .sort(((a, b) => b[2] - a[2]));
  const text = sorted.map(x => {
    const battleTitle = `${x[2]} from ${x[0]}`;
    // Sometimes, the leader name can be empty (No Leader). Not undefined, not "No Leader", just empty. Thx Paradox.
    if (x[1].length > 0) {
      return `${battleTitle} (led by ${x[1]})`;
    } else {
      return `${battleTitle} (No leader!)`;
    }
  }).join("\n");
  const total = `Total: ${lossList.reduce((previousValue, currentValue) => previousValue + currentValue[2], 0)}`;
  return (
    // https://stackoverflow.com/a/60909422
    <>
      <br/>
      {text}
      <br/>
      <b>
        {total}
      </b>
    </>
  )
}

interface VickyWarViewProps {
  war: War,
  onHover: (selected: War) => void,
}

const headerStyle: React.CSSProperties = {
  backgroundColor: "#C3D6EF",
  textAlign: "center",
  verticalAlign: "middle",
  fontSize: "110%",
};

function localize(date: Date): string {
  return date.toLocaleDateString(navigator.languages[0] ?? "en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function VickyWarView(props: VickyWarViewProps) {
  const { war: war, onHover: onHover } = props;

  const mouseOver = useCallback(() => onHover(war), [war, onHover]);

  const belligerentTerms = ProcessWar(war);
  return (
    <div style={{whiteSpace: "pre-wrap"}} onMouseOver={mouseOver}>
      <table style={{
        fontFamily: "sans-serif",
        border: "1px",
        borderSpacing: "3px",
        backgroundColor: "#f8f9fa",
        color: "black",
        // margin: 0.5em 0 0.5em 1em,
        padding: "0.2em",
        // float: "right",
        // clear: "right",
        fontSize: "88%",
        lineHeight: "1.5em",
        width: "22em",
      }}>
        <tbody style={{
          display: "table-row-group",
          verticalAlign: "middle",
        }}>
          <tr>
            <th colSpan={2} style={headerStyle}>
              {war.name}
            </th>
          </tr>
          <tr>
            <td colSpan={2}>
              <table style={{
                width: "100%",
                margin: 0,
                padding: 0,
                border: 0,
              }}>
                <tbody>
                  <tr>
                    <th>Date</th>
                    <td>{localize(belligerentTerms.start)} - {localize(belligerentTerms.end)}</td>
                  </tr>
                  <tr>
                    <th>Location</th>
                    <td>Look at the provinces for the continents fought on</td>
                  </tr>
                  <tr>
                    <th>Result</th>
                    <td>Unknown (no information in save file and no heuristics)</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <th colSpan={2} style={headerStyle}>Belligerents</th>
          </tr>
          <tr>
            <td style={{display: "table-cell"}}>
              <b>Attackers</b>
              {ParticipantElement({terms: belligerentTerms.attacker.term, start: belligerentTerms.start, end: belligerentTerms.end})}
            </td>
            <td>
              <b>Defenders</b>
              {ParticipantElement({terms: belligerentTerms.defender.term, start: belligerentTerms.start, end: belligerentTerms.end})}
            </td>
          </tr>
          {/*<tr>*/}
          {/*  <th>Commanders and leaders</th>*/}
          {/*</tr>*/}
          <tr>
            <th colSpan={2} style={headerStyle}>Casualties and losses (broken down by commander)</th>
          </tr>
          <tr>
            <td>
              <b>Attackers</b>
              {CasualtyList({losses: belligerentTerms.attacker.losses})}
            </td>
            <td>
              <b>Defenders</b>
              {CasualtyList({losses: belligerentTerms.defender.losses})}
            </td>
          </tr>
        <td>
          {}
        </td>
        </tbody>
      </table>
    </div>
  )
}

const styles: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  // justifyContent: "space-around",
  overflow: "scroll",
  gap: "8pt",
}

export default function WarsView() {
  const vickyContext: VickyContext = useSave().state;
  const [selectedWar, useSelectedWar] = useState<War | undefined>(undefined);
  if (!vickyContext.save) {
    return (
      <>
        Please upload a save to view war information.
      </>
    )
  }
  const wars = box(vickyContext.save?.original.previous_war).concat(box(vickyContext.save?.original.active_war));
  return (
    <div style={styles}>
      <div style={{flexDirection: "column"}}>
        {wars.map(war => VickyWarView({ war: war, onHover: useSelectedWar }))}
      </div>
      <div style={{flexDirection: "column"}}>
        {selectedWar ?
          box(selectedWar.history.battle).map(battle => VickyBattleView({ battle: battle }))
          : null}
      </div>
    </div>
  );
}