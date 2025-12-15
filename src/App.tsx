import React from "react";
import DatabaseExample from "./components/DatabaseExample";

const App: React.FC = () => {
  return (
    <div className="App">
      <h1 className="text-3xl font-bold underline">
        Hello, entype!
      </h1>
      <DatabaseExample />
    </div>
  );
}

export default App;