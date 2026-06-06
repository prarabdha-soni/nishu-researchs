import { useState } from "react";
import Welcome from "./components/Welcome";
import Terminal from "./components/Terminal";

function App() {
  const [entered, setEntered] = useState(false);

  const enter = () => {
    setEntered(true);
  };

  return entered
    ? <Terminal onReplayIntro={() => setEntered(false)} />
    : <Welcome onEnter={enter} />;
}

export default App;
