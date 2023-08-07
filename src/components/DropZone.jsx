import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import Papa, { parse } from "papaparse";

const MAX_SIZE = 1048576; // 1MB

const baseStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "20px",
  borderWidth: 2,
  borderRadius: 2,
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

export function DropZone(props) {
  const [errors, setErrors] = useState("");
  const [file, setFile] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [data, setData] = useState([]);

  const onDrop = useCallback((acceptedFiles, fileRejections) => {
    setErrors("");
    setFile(acceptedFiles[0]);
    setIsSuccess(true);
    fileRejections.forEach((file) => {
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
  }, []);

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

  // clean up
  useEffect(() => {
    // If user clicks the parse button without
    // a file we show a error
    if (!file) return;

    // Initialize a reader which allows user
    // to read any file or blob.
    const reader = new FileReader();

    // Event listener on reader when the file
    // loads, we parse it and set the data.
    reader.onload = async ({ target }) => {
      const csv = Papa.parse(target.result, {
        skipEmptyLines: true,
        header: false,
      });
      const parsedData = csv?.data;
      setData(parsedData);
      console.log(parsedData);
      console.log(parsedData.includes(""));
    };
    reader.readAsText(file);
  }, [file]);

  return (
    <fieldset>
      <legend className="sr-only">Upload file</legend>
      <div {...getRootProps({ style })}>
        <input {...getInputProps()} />
        <div>Click me or drag a file to upload!</div>
        <div>(Only *.csv will be accepted)</div>
      </div>
      <div>
        {isSuccess ? (
          <>
            <p style={{ color: "green" }}>File uploaded successfully!</p>
            <p>
              File Name: <i>{file.name}</i>
            </p>
            <p>File Size: {file.size} bytes</p>
            {/* <p>File Type: {file.type}</p>
            <p>Last Modified: {file.lastModifiedDate.toLocaleString()}</p> */}
            <p>Number of coders: {data[0].length}</p>
            <p>Number of coded items: {data.length}</p>
            <p>
              Missing codes:{" "}
              {data.reduce(
                (acc, curr) =>
                  acc + curr.reduce((acc, curr) => acc + (curr === ""), 0),
                0
              )}{" "}
              out of {data[0].length * data.length}
            </p>
          </>
        ) : (
          <span style={{ color: "red" }}>{errors}</span>
        )}
      </div>
    </fieldset>
  );
}
