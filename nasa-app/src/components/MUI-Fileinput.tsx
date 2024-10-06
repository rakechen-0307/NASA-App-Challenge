import React from "react";
import { Button } from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import Papa from "papaparse";

interface FileUploadButtonProps {
  onFileLoad: (data: any[]) => void;
  isDisabled: boolean;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({ onFileLoad, isDisabled }) => {
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      Papa.parse(file, {
        complete: (result) => {
          // Assuming you want to process data except the header
          onFileLoad(result.data.slice(1)); // Send data to parent or handler
          console.log(result.data.slice(1)[0]); // Logs the first row after header
        },
        header: false,  // Adjust this if your CSV has headers
        dynamicTyping: true,
        skipEmptyLines: true,
      });
    }
  };

  const handleButtonClick = () => {
    document.getElementById("file-input")?.click();
  };

  return (
    <>
      {/* Hidden input */}
      <input
        type="file"
        id="file-input"
        accept=".csv"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      
      {/* MUI Button to trigger file input */}
      <Button 
        variant="outlined" 
        startIcon={<UploadIcon />} 
        onClick={handleButtonClick}
        sx = {{mb: 2}}
        disabled={isDisabled}
      >
        Upload CSV
      </Button>
    </>
  );
};

export default FileUploadButton;
