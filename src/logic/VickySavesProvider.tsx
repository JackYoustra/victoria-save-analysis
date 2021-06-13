import React from "react";
import VickyObjects from "./vickyObjects";

type Action = {type: 'add', value: VickyObjects} | {type: 'remove'}
type Dispatch = (action: Action) => void
type State = VickyObjects | undefined
type VickySavesProviderProps = {children: React.ReactNode}

const VickySavesContext = React.createContext<
  {state: State; dispatch: Dispatch} | undefined
  >(undefined);

function saveReducer(state: State, action: Action): VickyObjects | undefined {
  switch (action.type) {
    case 'add': {
      return action.value
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`)
    }
  }
}

export default function VickySavesProvider({children}: VickySavesProviderProps) {
  const [state, dispatch] = React.useReducer(saveReducer, undefined);
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