import React from 'react';
import logo from './logo.svg';
import './App.css';

import { TorchContext } from "./contexts/torch";

import Main from "./main";
import P5Sketch from "./components/p5-sketch";

function App() {
  const [torch, setTorch] = React.useState(null);

  React.useEffect(() => {
    const interval = setInterval(() => {
      console.log(torch);
      if (window.torch) {
        setTorch(window.torch);
        clearInterval(interval);
      }
    }, 10);
  }, []);

  return (
    <TorchContext.Provider value={{ torch }}>
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          <Main />
          <P5Sketch width={400} height={400} />
        </header>
      </div>
    </TorchContext.Provider>
  );
}

export default App;
