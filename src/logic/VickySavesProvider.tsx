import React from "react";
import VickyContext, {VickyGameConfiguration, VickySave} from "./vickyObjects";

type Action = {type: 'setSave', value: VickySave} | {type: 'setConfiguration', value: VickyGameConfiguration}
type Dispatch = (action: Action) => void
type State = VickyContext
type VickySavesProviderProps = {children: React.ReactNode}

const VickySavesContext = React.createContext<
  {state: State; dispatch: Dispatch} | undefined
  >(undefined);

function saveReducer(state: State, action: Action): VickyContext {
  switch (action.type) {
    case 'setSave': {
      return {
        save: action.value,
        ...state,
      }
    }
    case 'setConfiguration': {
      return {
        configuration: action.value,
        ...state,
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