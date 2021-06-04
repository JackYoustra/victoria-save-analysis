import React, {useRef, useState} from "react";
import CircularIntegration, {
  ProcessTypes,
} from "../../components/CustomInput/Progress";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import PivotTableUI from "react-pivottable/PivotTableUI.js";
import v2parser from "../../logic/v2parser";
import 'react-pivottable/pivottable.css';
import TableRenderers from 'react-pivottable/TableRenderers';
import Plot from 'react-plotly.js';
import createPlotlyRenderers from 'react-pivottable/PlotlyRenderers';
import VickyObjects from "../../logic/vickyObjects";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    input: {
      display: "none",
    },
  })
);

interface VickyTableProps {
  setVickySave: (save: VickyObjects) => void;
  vickySave: VickyObjects | undefined;
}

export default function VickyTable(props: VickyTableProps) {
  const [processState, setProcessState] = useState(ProcessTypes.Initial);
  const [topLabel, setTopLabel] = useState("Please select a file");
  const [pivotTableState, setPivotTableState] = useState<any>({});

  const inputRef = useRef<HTMLInputElement | null>(null);
  const classes = useStyles();

  // create Plotly renderers via dependency injection
  const PlotlyRenderers = createPlotlyRenderers(Plot);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.item(0);
    if (file) {
      const reader = new FileReader();
      reader.onload = (readEvent) => {
        console.log("Finished reading");
        const result = reader.result as string; // has to be, because we read as text
        if (result) {
          setTopLabel("Reading and processing " + file.name);
          const rawOutput = v2parser.parse(result);
          const objectVersion = new VickyObjects(rawOutput);
          props.setVickySave(objectVersion);
          setProcessState(ProcessTypes.Success);
          setTopLabel(file.name);
        } else {
          setProcessState(ProcessTypes.Failed);
        }
      };
      reader.onprogress = (progressEvent) => {
        console.log(
          "Loaded " + progressEvent.loaded + " out of " + progressEvent.total
        );
      };
      reader.onerror = (progressEvent) => {
        console.log("Error loading!");
      };
      reader.readAsText(file);
    } else {
      setProcessState(ProcessTypes.Cancelled);
    }
  }

  function handleClick() {
    inputRef.current?.click();
  }

  return (
    <div>
      <p>
        {topLabel}
      </p>
      { props.vickySave && <PivotTableUI
        data={props.vickySave.factories}
        onChange={setPivotTableState}
        renderers={Object.assign({}, TableRenderers, PlotlyRenderers)}
        {...pivotTableState}
      />}
      <input
        id="myInput"
        type="file"
        ref={inputRef}
        className={classes.input}
        onChange={onChange}
      />
      <CircularIntegration processState={processState} onClick={handleClick} />
    </div>
  );
}