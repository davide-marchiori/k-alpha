import { initialSessionParams } from "@/constants/initialSessionParams";

export function sessionParamsReducer(sessionParams, action) {
  switch (action.type) {
    case "setData": {
      return sessionParams.map((param) => {
        if (param.name === "data") {
          return {
            ...param,
            value: action.value,
          };
        } else {
          return param;
        }
      });
    }

    case "setCheckedState": {
      return sessionParams.map((param) => {
        if (param.name === "checkedState") {
          return {
            ...param,
            value: action.value,
          };
        } else {
          return param;
        }
      });
    }

    case "setCISize": {
      return sessionParams.map((param) => {
        if (param.name === "CISize") {
          return {
            ...param,
            value: action.value,
          };
        } else {
          return param;
        }
      });
    }

    // case "setBootSampleSize": {
    //   return sessionParams.map((param) => {
    //     if (param.name === "bootSampleSize") {
    //       return {
    //         ...param,
    //         value: action.value,
    //       };
    //     } else {
    //       return param;
    //     }
    //   });
    // }

    case "setBootIterations": {
      return sessionParams.map((param) => {
        if (param.name === "bootIterations") {
          return {
            ...param,
            value: action.value,
          };
        } else {
          return param;
        }
      });
    }

    case "resetSessionParams": {
      return initialSessionParams;
    }
    default: {
      throw Error("Unknown action: " + action.type);
    }
  }
}
