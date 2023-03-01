import React, { useState } from 'react';

import TopNavBar from "./components/TopNavBar";

const section = (props) => {
  
}


const App = () => {
  const [current, setCurrent] = useState('HomePage');

  return (
    <div className="App">
      <TopNavBar />
    </div>
  );
}

export default App;
