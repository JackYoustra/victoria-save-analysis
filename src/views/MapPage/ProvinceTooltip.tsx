import {useSave} from "../../logic/VickySavesProvider";
import React, {useEffect, useState} from "react";
import {
  makeFlagImage,
  makeTerrainImage,
  ProvinceDefinition,
  rgbToHex,
  VickyGameConfiguration
} from "../../logic/vickyObjects";
import {Country} from "../../logic/types/vickyCountryDefinition";
import _ from "lodash";

export interface ProvinceTooltipProps {
  selectedProvince: ProvinceDefinition,
  fullProvince?: any,
  owningCountry?: Country,
}

export default function ProvinceTooltip(props: ProvinceTooltipProps) {
  const vickyContext = useSave();
  const { save: save, configuration: configuration } = vickyContext.state;

  let countryName: string = "No owner";
  let [countryFlagURL, useCountryFlagURL] = useState<React.ReactElement | null>(null);
  let [terrainURL, useTerrainURL] = useState<string | null>(null);
  if (_.isObject(props.fullProvince)) {
    const tag = props.fullProvince["owner"];
    if (_.isString(tag)) {
      countryName = tag;
      if (configuration) {
        if (_.isObject(configuration?.localisationSet)) {
          const localisation = configuration.localisationSet[tag];
          if (_.isObject(localisation) && Object.keys(localisation).length > 0) {
            // In each language
            const localisationString = localisation["english"] ?? Object.values(localisation)[0]
            if (_.isString(localisationString)) {
              countryName = localisationString;
            }
          }
        }
      }
    }
  }

  useEffect(() => {
    if (configuration) {
      if (_.isObject(props.fullProvince)) {
        const tag = props.fullProvince["owner"];
        if (_.isString(tag)) {
          makeFlagImage(configuration, tag).then((url) => {
            if (_.isString(url)) {
              useCountryFlagURL(<img style={{borderStyle: "outset"}} src={url} alt={tag + " flag"}/>);
            }
          });
        }
      }
      makeTerrainImage(configuration, props.selectedProvince.province).then(url => {
        if (_.isString(url)) {
          // useTerrainURL(<img style={{position: "absolute", zIndex: -1, top: 0, left: 0}} src={url} alt={"Terrain: " + configuration.terrainLookup?.get(props.selectedProvince.province) ?? "unknown"}/>);
          useTerrainURL(url);
        }
      })
    }
    useCountryFlagURL(null);
  }, [configuration, props.fullProvince]);

  const fallback = (<span>
      {props.selectedProvince.province + "-" + props.selectedProvince.name}
    </span>);

  let css: React.CSSProperties = {
    position: "relative",
    display: "inline-block",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    padding: "10pt",
    minWidth: "300pt",
    backgroundPosition: "center",
  };

  if (terrainURL) {
    css.backgroundImage = `url(${terrainURL})`;
  }

  if (props.owningCountry) {
    const backgroundColor = ("#" + rgbToHex(props.owningCountry.color).toString(16) + "FF").toUpperCase();
    css.borderColor = backgroundColor;
    css.borderStyle = "solid";
  }

  if (props.fullProvince) {
    return (
      <div style={css}>
        {/*<img style={{position: "absolute", zIndex: -1, top: 0, left: 0}} src={terrainURL} alt={"Terrain"}/>*/}
        <h1 style={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10pt"}}>
          {props.fullProvince["name"]}
          {countryFlagURL}
        </h1>
        <h3>
          {countryName}
        </h3>
        {fallback}
      </div>
    );
  }
  return (
    fallback
  );
}