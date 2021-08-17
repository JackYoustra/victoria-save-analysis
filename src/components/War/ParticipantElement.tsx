import {TermStructure} from "../../logic/processing/vickySave";
import React from "react";
import {dateFragment} from "./wikiFormatters";

interface ParticipantElementProps {
  terms: TermStructure,
  start: Date,
  end: Date,
}

function getDateFragment(enterLeaveWarDates: string[], props: ParticipantElementProps) {
  const fragment = dateFragment(enterLeaveWarDates, props.start, props.end);
  if (fragment) {
    return (
      <div style={{fontFamily: "serif", fontSize: "0.8rem", fontStyle: "italic"}}>
        {/*<br/>*/}
        {fragment}
      </div>
    );
  }
  return fragment;
}

export default function ParticipantElement(props: ParticipantElementProps) {
  const { terms: terms } = props;
  const entries = Object.entries(terms);
  return (
    entries.map((value) => {
      const [tag, {inWar, enterLeaveWarDates}] = value;
      return (
        <>
          <br/>
          {tag}
          {getDateFragment(enterLeaveWarDates, props)}
        </>
      );
    })
  );
}