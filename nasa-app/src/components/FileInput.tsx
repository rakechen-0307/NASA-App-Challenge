import React from "react";
import Papa from "papaparse";

interface FileInputProps {
  onFileLoad: (loadedData: any, std: number, widthFactor: number, smoothingStd: number) => void;
  std: number;
  widthFactor: number;
  smoothingStd: number;
}

const FileInput: React.FC<FileInputProps> = ({ onFileLoad, std, widthFactor, smoothingStd }) => {

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      Papa.parse(file, {
        complete: (result) => {
          onFileLoad(result.data.slice(1), std, widthFactor, smoothingStd); // result.data is typically an array of rows
          console.log(result.data.slice(1)[0])
        },
        header: false,
        dynamicTyping: true,
        skipEmptyLines: true,
      });
    }
  };

  return <input type="file" onChange={handleFileChange} />;
};

export default FileInput;