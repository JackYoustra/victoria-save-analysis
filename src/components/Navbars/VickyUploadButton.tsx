import React, {useRef, useState} from "react";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import v2parser from "../../logic/v2parser";
import {VickySave} from "../../logic/vickyObjects";
import CircularIntegration, {ProcessTypes} from "../CustomInput/Progress";
import _ from "lodash";
import {useSave} from "../../logic/VickySavesProvider";

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

export default function VickyUploadButton() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const classes = useStyles();

  const [topLabel, setTopLabel] = useState("Please select a file");
  const [processState, setProcessState] = useState(ProcessTypes.Initial);

  function handleClick() {
    inputRef.current?.click();
  }

  const vickyContext = useSave();

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.item(0);
    if (file) {
      const reader = new FileReader();
      reader.onload = (readEvent) => {
        console.log("Finished reading");
        const result = reader.result; // has to be, because we read as text
        if (_.isString(result)) {
          setTopLabel("Reading and processing " + file.name);
          const rawOutput = v2parser.parse(result);
          const objectVersion = new VickySave(rawOutput);
          vickyContext.dispatch({ type: "setSave", value: objectVersion});
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
  return (
    <div className={classes.vickyUpload}>
      <p>
        {topLabel}
      </p>
      <input
        id="myInput"
        type="file"
        ref={inputRef}
        className={classes.input}
        onChange={onChange}
      />

      <CircularIntegration processState={processState} onClick={handleClick}>
        Upload your savegame
      </CircularIntegration>
    </div>
  );

}