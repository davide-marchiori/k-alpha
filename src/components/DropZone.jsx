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

export function DropZone({data, setData}) {
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
    reader.onload = async ({ target }) => {
      const csv = Papa.parse(target.result, {
        skipEmptyLines: true,
        header: false,
      });
      const parsedData = csv?.data;      
      if (!parsedData.every((row) => row.length === parsedData[0].length)) {
        setErrors("Error: All rows must have the same number of codes");
        setIsSuccess(false);
      }
      if (parsedData[0].length < 3) {
        setErrors("Error: There must be at least 3 coders");
        setIsSuccess(false);
      }
      if (parsedData.length < 2) {
        setErrors("Error: There must be at least 2 coded items");
        setIsSuccess(false);
      }
      setData(parsedData);
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
        <div className="relative flex flex-col items-center mt-4">
          {!isDragActive && "Click here or drop a file to upload!"}
          {isDragActive && !isDragReject && "Drop it here!"}
          {isDragReject && "File type not accepted, sorry!"}
          <div className="flex">(Only *.csv will be accepted)</div>
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
                  Missing codes:{" "}
                  <b>
                    {data.reduce(
                      (acc, curr) =>
                        acc +
                        curr.reduce((acc, curr) => acc + (curr === ""), 0),
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
