import React, {useRef, useState} from "react";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import {VickyGameConfiguration} from "../../logic/processing/vickySave";
import CircularIntegration, {ProcessTypes} from "../CustomInput/Progress";
import {useSave} from "../../logic/VickySavesProvider";
import {directoryOpen} from "browser-fs-access";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    input: {
      display: "none",
    },
    vickyUpload: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
    },
  })
);

export default function VickySetConfigurationButton() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const classes = useStyles();

  const [topLabel, setTopLabel] = useState("Please select a file");
  const [processState, setProcessState] = useState(ProcessTypes.Initial);

  const vickyContext = useSave();

  async function handleClick() {
    const blobsInDirectory = await directoryOpen({
      recursive: true,
    });
    const config = await VickyGameConfiguration.createSave(blobsInDirectory);
    vickyContext.dispatch({ type: "mergeConfiguration", value: config});
  }

  return (
    <div className={classes.vickyUpload}>
      <p>
        {topLabel}
      </p>
      <CircularIntegration processState={processState} onClick={handleClick}>
        Upload configuration files
      </CircularIntegration>
    </div>
  );

}