import { useReducer, createContext } from "react";
import { sessionParamsReducer } from "@/helpers";
import { initialSessionParams } from "@/constants";

export const SessionParamsContext = createContext();

export function SessionParamsContextProvider({ children }) {
  const [state, dispatch] = useReducer(
    sessionParamsReducer,
    initialSessionParams
  );

  return (
    <SessionParamsContext.Provider value={[state, dispatch]}>
      {children}
    </SessionParamsContext.Provider>
  );
}
