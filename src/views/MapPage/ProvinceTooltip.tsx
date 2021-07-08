import {useSave} from "../../logic/VickySavesProvider";
import React, {useEffect, useState} from "react";
import {makeTargaImage, ProvinceDefinition, VickyGameConfiguration} from "../../logic/vickyObjects";
import {Country} from "../../logic/vickyFileStructures";
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
    if (_.isObject(props.fullProvince)) {
      const tag = props.fullProvince["owner"];
      if (_.isString(tag) && configuration) {
        makeTargaImage(configuration, tag).then((url) => {
          if (_.isString(url)) {
            useCountryFlagURL(<img src={url} alt={tag + " flag"}/>);
          }
        });
      }
    }
    useCountryFlagURL(null);
  }, [configuration, props.fullProvince]);

  const fallback = (<span>
      {props.selectedProvince.province + "-" + props.selectedProvince.name}
    </span>);

  if (props.fullProvince) {
    return (
      <>
        <h1>
          {props.fullProvince["name"]}
          {countryFlagURL}
        </h1>
        <h3>
          {countryName}
        </h3>
        {fallback}
      </>
    );
  }
  return (
    fallback
  );
}