import React, {MouseEventHandler, useCallback, useEffect, useRef, useState} from "react";
import {useSave} from "../../logic/VickySavesProvider";
import {makeStyles} from "@material-ui/core/styles";
import ReactTooltip from "react-tooltip";
import {ProvinceDefinition, rgbToHex} from "../../logic/vickyObjects";
import ProvinceTooltip from "../MapPage/ProvinceTooltip";
import _ from "lodash";
import {Country} from "../../logic/types/vickyCountryDefinition";

function relativeCoords(event: React.MouseEvent<HTMLImageElement, MouseEvent>) {
  let bounds = event.currentTarget.getBoundingClientRect();
  let x = event.clientX - bounds.left;
  let y = event.clientY - bounds.top;
  return {x: x, y: y};
}

export default function VickyMap() {
  const vickyContext = useSave();
  const { save: save, configuration: configuration } = vickyContext.state;
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [selectedProvince, useSelectedProvince] = useState<ProvinceDefinition | null>(null);
  const callback: MouseEventHandler<HTMLImageElement> = useCallback((event) => {
    let coords = relativeCoords(event);
    if (imageRef.current) {
      // rescale to native size for selection
      coords.x *= imageRef.current.naturalWidth / imageRef.current.width;
      coords.y *= imageRef.current.naturalHeight / imageRef.current.height;
    }
    const pixel = configuration?.provinceMap?.original.getPixelXY(Math.trunc(coords.x), Math.trunc(coords.y));
    if (pixel && configuration?.provinceLookup) {
      const hex = rgbToHex(pixel);
      const province = configuration.provinceLookup[hex] ?? null;
      useSelectedProvince(province)
    }
  }, [useSelectedProvince, configuration]);

  let backgroundColor: string | undefined = undefined;
  let province: any | undefined = undefined;
  let owningCountry: Country | undefined = undefined;

  const countries = configuration?.countries;
  if (_.isObject(countries) && selectedProvince && save) {
    const provinceMaybe = save.provinces[selectedProvince.province - 1];
    if(_.isObject(provinceMaybe) && _.isString(provinceMaybe["owner"])) {
      province = provinceMaybe;
      const countryMaybe = countries[province["owner"]];
      if (_.isObject(countryMaybe)) {
        owningCountry = countryMaybe as Country;
        const newBackgroundColor = ("#" + rgbToHex(owningCountry.color).toString(16) + "FF").toUpperCase();
        backgroundColor = newBackgroundColor;
      }
    }
  }

  if (!configuration?.provinceMap) {
    console.log("No map")
    // https://stackoverflow.com/questions/42083181/is-it-possible-to-return-empty-in-react-render-function
    return null;
  }

  return (
    <>
      <a data-tip='React-tooltip'>
        <img
          style={{
            height: '100%',
            width: '100%',
          }}
          src={configuration.provinceMap.url}
          alt={"The map of the Victoria 2 game"}
          onMouseMove={callback}
          ref={imageRef}
        />
      </a>
      <ReactTooltip
        place="top"
        type="dark"
        effect="float"
      >
        {selectedProvince ?
        <ProvinceTooltip
          selectedProvince={selectedProvince}
          fullProvince={province}
          owningCountry={owningCountry}
        /> : "No province selected"}
      </ReactTooltip>
    </>
  );
}