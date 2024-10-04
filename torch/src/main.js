import React from 'react';

import { TorchContext } from "./contexts/torch";

function Main() {
  const { torch } = React.useContext(TorchContext);

  return (
    <button onClick={() => {
      const a = torch.tensor([1, 2, 3]);
      const b = torch.tensor([4, 5, 6]);
      console.log(a.add(b));
    }}>Test</button>
  );
}

export default Main;
