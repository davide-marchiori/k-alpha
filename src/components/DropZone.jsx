import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
} from "react";
import { SessionParamsContext, _minRate, _maxRate } from "@/helpers";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";

const MAX_SIZE = 5 * 102400; // 500 KB

const dropzoneStyles = {
  baseStyle: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
    borderWidth: 2,
    borderRadius: 15,
    borderColor: "#eeeeee",
    borderStyle: "dashed",
    backgroundColor: "#fafafa",
    color: "#bdbdbd",
    transition: "border .3s ease-in-out",
  },
  activeStyle: { borderColor: "#2196f3" },
  acceptStyle: { borderColor: "#00e676" },
  rejectStyle: { borderColor: "#ff1744" },
};

export function DropZone() {
  const [bucketSessionParams, sessionParamsDispatch] =
    useContext(SessionParamsContext);
  const sessionParams = Object.fromEntries(
    bucketSessionParams.map((item) => Object.values(item))
  );

  const [errors, setErrors] = useState("");
  const [file, setFile] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!errors) {
      setIsVisible(false);
      return;
    }
    setIsVisible(true);
    const timer = setTimeout(() => setIsVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [errors]);

  const validateData = (parsedData) => {
    if (!parsedData.every((row) => row.length === parsedData[0].length)) {
      return "Error: Items must be evaluated by the same number of raters; check for missing codes, or redundant commas";
    }
    if (parsedData[0].length < 2) {
      return "Error: There must be at least 2 raters";
    }
    if (parsedData.length < 2) {
      return "Error: There must be at least 2 coded items";
    }
    return null;
  };

  const validateDataContent = (parsedData) => {
    const flatData = parsedData.flat();

    // Function to check if a value is a valid integer or 'NA'
    const isValidEntry = (value) => {
      if (value === "NA") return true;
      if (typeof value === "number" && Number.isInteger(value) && value >= 0)
        return true;
      return false;
    };

    // Check for invalid entries
    const invalidEntries = flatData.filter((value) => !isValidEntry(value));

    if (invalidEntries.length > 0) {
      // Categorize the error
      if (
        invalidEntries.some(
          (value) => typeof value === "number" && !Number.isInteger(value)
        )
      ) {
        return "Error: The file contains decimal values";
      }
      if (
        invalidEntries.some((value) => typeof value === "number" && value < 0)
      ) {
        return "Error: The file contains negative values";
      }
      if (invalidEntries.some((value) => value === null)) {
        return "Error: Found consecutive or start/end-of-line commas - check missing codes policy in the 'Usage Notes'";
      }
      if (
        invalidEntries.some(
          (value) => typeof value === "string" && /(Na|na|nA)/.test(value)
        )
      ) {
        return "Error: Use 'NA' for missing codes (case sensitive)";
      }
      // If none of the above, it's an unspecified invalid character
      return "Error: Invalid characters found. Only non-negative integers and 'NA' are allowed.";
    }

    return null;
  };

  const processFile = useCallback((acceptedFiles, rejectedFiles) => {
    setErrors("");

    // Check if there's a file, regardless of whether it's in acceptedFiles or rejectedFiles
    const file = acceptedFiles[0] || rejectedFiles[0];

    if (file) {
      // Check if the file is a CSV
      if (
        file.type === "text/csv" ||
        file.name.toLowerCase().endsWith(".csv")
      ) {
        setFile(file);
        setIsSuccess(true);
      } else {
        setIsSuccess(false);
        setErrors("Error: Only CSV files are accepted");
      }
    } else {
      setIsSuccess(false);
      setErrors("Error: No file was dropped");
    }

    // Still check rejectedFiles for other potential errors
    rejectedFiles.forEach((file) => {
      file.errors.forEach((err) => {
        if (err.code === "file-too-large") {
          setErrors(`Error: ${err.message}`);
        }
      });
    });
  }, []);

  const parseCSV = useCallback((fileContent) => {
    return Papa.parse(fileContent, {
      skipEmptyLines: true,
      header: false,
      dynamicTyping: true,
      delimitersToGuess: [",", ";"],
    }).data;
  }, []);

  const processData = useCallback(
    (parsedData) => {
      let error = validateData(parsedData) || validateDataContent(parsedData);

      if (error) {
        setErrors(error);
        setIsSuccess(false);
        return;
      }

      const convertedData = parsedData.map((row) =>
        row.map((code) => (code === "NA" ? "" : code))
      );

      if (_minRate(convertedData) === _maxRate(convertedData)) {
        setErrors("Error: The minimum and maximum values must be different");
        setIsSuccess(false);
      } else {
        sessionParamsDispatch({ type: "setData", value: convertedData });
      }
    },
    [sessionParamsDispatch]
  );

  useEffect(() => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async ({ target }) => {
      const parsedData = parseCSV(target.result);
      processData(parsedData);
    };
    reader.readAsText(file);
  }, [file, parseCSV, processData]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    multiple: false,
    onDrop: processFile,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"], // Some systems may use this MIME type for CSV
    },
    maxSize: MAX_SIZE,
  });

  const style = useMemo(
    () => ({
      ...dropzoneStyles.baseStyle,
      ...(isDragActive ? dropzoneStyles.activeStyle : {}),
      ...(isDragAccept ? dropzoneStyles.acceptStyle : {}),
      ...(isDragReject ? dropzoneStyles.rejectStyle : {}),
    }),
    [isDragActive, isDragReject, isDragAccept]
  );

  const renderFileInfo = () => (
    <div className="m-3">
      <p style={{ color: "green" }}>File uploaded successfully</p>
      <p>
        File Name: <b>{file.name}</b>
      </p>
      <p>
        File Size: <b>{file.size} bytes</b>
      </p>
      <p>
        Last Modified: <b>{new Date(file.lastModified).toDateString()}</b>
      </p>
      <p>
        Number of Raters: <b>{sessionParams.data[0].length}</b>
      </p>
      <p>
        Number of Rated Items: <b>{sessionParams.data.length}</b>
      </p>
      <p>
        Missing Values (NAs):{" "}
        <b>
          {sessionParams.data.reduce(
            (acc, curr) =>
              acc + curr.reduce((a, c) => a + (c === "" ? 1 : 0), 0),
            0
          )}
        </b>{" "}
        out of <b>{sessionParams.data[0].length * sessionParams.data.length}</b>
      </p>
    </div>
  );

  return (
    <fieldset className="border border-solid border-gray-300 p-3 m-3">
      <legend className="text-base">
        <b>Upload File</b>
      </legend>
      <div className="m-3" {...getRootProps({ style })}>
        <input {...getInputProps()} />
        <div className="flex flex-col text-center text-gray-900 m-3">
          {!isDragActive && "Click here or drop a file to upload"}
          {isDragActive && !isDragReject && "Drop it here"}
          {isDragReject && "File type not accepted"}
          <div>(Only *.csv will be accepted)</div>
          <div>Check the 'Usage Notes' on how to prepare your datafile</div>
        </div>
      </div>
      <div>
        {isSuccess && sessionParams.data && sessionParams.data[0]
          ? renderFileInfo()
          : isVisible && <span style={{ color: "red" }}>{errors}</span>}
      </div>
    </fieldset>
  );
}
