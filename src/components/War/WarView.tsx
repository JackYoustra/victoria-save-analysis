import React, {useCallback} from "react";
import {parseDate, ProcessWar} from "../../logic/processing/vickySave";
import {War} from "../../logic/types/save";
import _ from "lodash";
import { localize } from "./wikiFormatters";
import ParticipantElement from "./ParticipantElement";
import CasualtyList from "./CasualtyList";

const headerStyle: React.CSSProperties = {
  backgroundColor: "#C3D6EF",
  textAlign: "center",
  verticalAlign: "middle",
  fontSize: "110%",
};

interface WarViewProps {
  war: War,
  onHover: (selected: War) => void,
}

export default function WarView(props: WarViewProps) {
  const { war: war, onHover: onHover } = props;

  const mouseOver = () => onHover(war);


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
        verticalAlign: "top",
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
              {/*<tr>*/}
              {/*  <th>Location</th>*/}
              {/*  <td>Look at the provinces for the continents fought on</td>*/}
              {/*</tr>*/}
              {/*<tr>*/}
              {/*  <th>Result</th>*/}
              {/*  <td>Unknown (no information in save file and no heuristics)</td>*/}
              {/*</tr>*/}
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