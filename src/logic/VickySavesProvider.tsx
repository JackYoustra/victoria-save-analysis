import React from "react";
import VickyContext, {VickyGameConfiguration, VickySave} from "./processing/vickySave";
import _ from "lodash";

type Action = {type: 'setSave', value: VickySave} | {type: 'mergeConfiguration', value: VickyGameConfiguration}
type Dispatch = (action: Action) => void
type State = VickyContext
type VickySavesProviderProps = {children: React.ReactNode}

const VickySavesContext = React.createContext<
  {state: State; dispatch: Dispatch} | undefined
  >(undefined);

function saveReducer(state: State, action: Action): VickyContext {
  console.log("Reducer");
  console.log(state.configuration);
  switch (action.type) {
    case 'setSave': {
      return {
        ...state,
        save: action.value,
      }
    }
    case 'mergeConfiguration': {
      return {
        ...state,
        // @ts-ignore
        configuration: _.assign({... state.configuration}, _.pickBy(action.value, v => !_.isUndefined(v))),
      }
    }
  }
}

export default function VickySavesProvider({children}: VickySavesProviderProps) {
  const [state, dispatch] = React.useReducer(saveReducer, {});
  const value = {state, dispatch};
  return <VickySavesContext.Provider value={value}>
    {children}
  </VickySavesContext.Provider>
}

export function useSave() {
  const context = React.useContext(VickySavesContext)
  if (context === undefined) {
    throw new Error('useSave must be used within a SaveProvider')
  }
  return context
}