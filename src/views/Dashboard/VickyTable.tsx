import React, { useState} from "react";
import PivotTableUI from "react-pivottable/PivotTableUI.js";
import 'react-pivottable/pivottable.css';
import TableRenderers from 'react-pivottable/TableRenderers';
import Plot from 'react-plotly.js';
import createPlotlyRenderers from 'react-pivottable/PlotlyRenderers';
import {useSave} from "../../logic/VickySavesProvider";

interface VickyTableProps {
  field: "factories" | "pops"
}

export default function VickyTable(props: VickyTableProps) {
  const [pivotTableState, setPivotTableState] = useState<any>({});

  // create Plotly renderers via dependency injection
  const PlotlyRenderers = createPlotlyRenderers(Plot);

  const vickySave = useSave().state;

  return (
    <div>
      { vickySave && <PivotTableUI
        data={vickySave[props.field]}
        onChange={setPivotTableState}
        renderers={Object.assign({}, TableRenderers, PlotlyRenderers)}
        {...pivotTableState}
      />}
    </div>
  );
}