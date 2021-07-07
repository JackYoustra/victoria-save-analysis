import React, {MouseEventHandler, useCallback, useRef, useState} from "react";
import {useSave} from "../../logic/VickySavesProvider";
import {makeStyles} from "@material-ui/core/styles";
import ReactTooltip from "react-tooltip";
import {rgbToHex} from "../../logic/vickyObjects";

const styles = {
  img: {
    // objectFit: 'contain',
  },
};

function relativeCoords(event: React.MouseEvent<HTMLImageElement, MouseEvent>) {
  let bounds = event.currentTarget.getBoundingClientRect();
  let x = event.clientX - bounds.left;
  let y = event.clientY - bounds.top;
  return {x: x, y: y};
}

const useStyles = makeStyles(styles);

export default function VickyMap() {
  const style = useStyles();
  const vickyContext = useSave();
  const configuration = vickyContext.state.configuration;
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageCoordinates, useImageCoordinates] = useState<number | null>(null);
  const callback: MouseEventHandler<HTMLImageElement> = useCallback((event) => {
    let coords = relativeCoords(event);
    if (imageRef.current) {
      // rescale to native size for selection
      coords.x *= imageRef.current.naturalWidth / imageRef.current.width;
      coords.y *= imageRef.current.naturalHeight / imageRef.current.height;
    }
    const pixel = configuration?.provinceMap?.original.getPixelXY(Math.trunc(coords.x), Math.trunc(coords.y));
    console.log(pixel);
    if (pixel && configuration?.provinceLookup) {
      const hex = rgbToHex(pixel);
      const province: number = configuration.provinceLookup[hex];
      console.log(hex);
      console.log(province);
      useImageCoordinates(province)
    }
  }, [useImageCoordinates, configuration]);
  if (!configuration?.provinceMap) {
    console.log("No map")
    // https://stackoverflow.com/questions/42083181/is-it-possible-to-return-empty-in-react-render-function
    return null;
  }

  return (
    // <MapInteractionCSS>
    //   <img src={configuration.provinceMap.original.toDataURL()}  alt={"The map of the Victoria 2 game"}/>
    // </MapInteractionCSS>
    // <InnerImageZoom
    //   src={configuration.provinceMap.scaled.toDataURL()}
    //   zoomSrc={configuration.provinceMap.original.toDataURL()}
    //   zoomType="hover"
    //   zoomPreload={true}
    //   fullscreenOnMobile={true}
    // />
    // <ReactImageMagnify {...{
    //   smallImage: {
    //     src: configuration.provinceMap.original.toDataURL(),
    //     alt: "The map of the Victoria 2 game",
    //   },
    //   largeImage: {
    //     src: configuration.provinceMap.scaled.toDataURL(),
    //     width: 300,
    //     height: 100,
    //   },
    //   isHintEnabled: true,
    // }} />
    <>
      <a data-tip='React-tooltip'>
      <img style={{
          height: '100%',
          width: '100%',
        }}
             src={configuration.provinceMap.url}
             alt={"The map of the Victoria 2 game"}
             onMouseMove={callback}
             ref={imageRef}
        />
      </a>
      <ReactTooltip place="top" type="dark" effect="float">
        {JSON.stringify(imageCoordinates)}
      </ReactTooltip>
    </>
  );
}