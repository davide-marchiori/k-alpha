import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";

const MAX_SIZE = 1048576; // 1MB

const baseStyle = {
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
};

const activeStyle = {
  borderColor: "#2196f3",
};

const acceptStyle = {
  borderColor: "#00e676",
};

const rejectStyle = {
  borderColor: "#ff1744",
};

export function DropZone({ data, setData }) {
  const [errors, setErrors] = useState("");
  const [file, setFile] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // CASE 1 :message is empty (meaning no errors). Adjust as needed
    if (!errors) {
      setIsVisible(false);
      return;
    }
    //CASE 2: error exists. Display the message and hide after 3 secs
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [errors]);

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      setErrors("");
      setFile(acceptedFiles[0]);
      setIsSuccess(true);
      rejectedFiles.forEach((file) => {
        file.errors.forEach((err) => {
          setIsSuccess(false);
          if (err.code === "file-too-large") {
            setErrors(`Error: ${err.message}`);
          }
          if (err.code === "file-invalid-type") {
            setErrors(`Error: ${err.message}`);
          }
        });
      });
    },
    [file]
  );

  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    const regex = /^(\d+|NA)(,(\d+|NA))*$/;
    reader.onload = async ({ target }) => {
      const csv = Papa.parse(target.result, {
        skipEmptyLines: true,
        header: false,
        dynamicTyping: true,
        //transform: (value) => {if (value === "NA") return null; return value},
      });
      const parsedData = csv?.data;
      let error = false;
      if (!parsedData.every((row) => row.length === parsedData[0].length)) {
        setErrors(
          "Error: Items must be evaluated by the same number of coders; check for missing codes, or redundant commas"
        );
        setIsSuccess(false);
        error = true;
      }
      if (parsedData[0].length < 2) {
        setErrors("Error: There must be at least 2 coders");
        setIsSuccess(false);
        error = true;
      }
      if (parsedData.length < 2) {
        setErrors("Error: There must be at least 2 coded items");
        setIsSuccess(false);
        error = true;
      }
      if (!regex.test(parsedData.flat())) {
        console.log(
          parsedData.flat().every((value) => {
            if (!/^\d+\.\d{0,2}$/.test(value)) return true;
            return false;
          })
        );
        if (/,,+/.test(parsedData.flat())) {
          setErrors("Error: Found consecutive or end-of-line commas");
        } else if (/(Na|na|nA)/.test(parsedData.flat())) {
          setErrors("Error: Use 'NA' for missing codes (case sensitive)");
        } else if (
          !parsedData.flat().every((value) => {
            if (!/^\d+\.\d{0,2}$/.test(value)) return true;
            return false;
          })
        ) {
          setErrors("Error: The file contains decimal values");
          console.log("found a decimal number");
        } else if (
          !parsedData.flat().every((value) => {
            if (!/^-?\d+(\.\d{1,2})?$/.test(value)) return true;
            return false;
          })
        ) {
          setErrors("Error: The file contains negative values");
          console.log("found a negative number");
        } else {
          setErrors("Error: Invalid characters found");
        }
        setIsSuccess(false);
        error = true;
      }
      if (!error) {
        // If no errors, set data
        // NAs are converted to empty strings; this is to avoid issues with the table:
        // in this way all cells are numbers or empty strings
        setData(
          parsedData.map((row) =>
            row.map((code) => (code === "NA" ? "" : code))
          )
        );
      }
    };
    reader.readAsText(file);
  }, [file]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    multiple: false,
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    maxSize: MAX_SIZE,
  });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isDragActive ? activeStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isDragActive, isDragReject, isDragAccept]
  );

  return (
    <fieldset className="border border-solid border-gray-300 p-3 m-3">
      <legend className="text-base">Upload file</legend>
      <div className="mb-3" {...getRootProps({ style })}>
        <input {...getInputProps()} />
        <div className="relative flex flex-col items-center text-gray-900 mt-4">
          {!isDragActive && "Click here or drop a file to upload!"}
          {isDragActive && !isDragReject && "Drop it here!"}
          {isDragReject && "File type not accepted, sorry!"}
          <div className="flex">(Only *.csv will be accepted)</div>
          <div className="flex">
            Check instructions on how to prepare your datafile
          </div>
        </div>
      </div>
      <div>
        {isSuccess
          ? data &&
            data[0] && (
              <>
                <p style={{ color: "green" }}>File uploaded successfully!</p>
                <p>
                  File Name: <b>{file.name}</b>
                </p>
                {/* <p>File Size: {file.size} bytes</p>
            <p>Last Modified: {file.lastModifiedDate.toLocaleString()}</p> */}
                <p>
                  Number of coders: <b>{data[0].length}</b>
                </p>
                <p>
                  Number of coded items: <b>{data.length}</b>
                </p>
                <p>
                  NA codes:{" "}
                  <b>
                    {data.reduce(
                      (acc, curr) =>
                        acc +
                        curr.reduce(
                          (acc, curr) => acc + (curr === "" ? 1 : 0),
                          0
                        ),
                      0
                    )}
                  </b>{" "}
                  out of <b>{data[0].length * data.length}</b>
                </p>
              </>
            )
          : isVisible && <span style={{ color: "red" }}>{errors}</span>}
      </div>
    </fieldset>
  );
}
