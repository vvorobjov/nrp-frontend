import "./App.css";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div>HOME</div>
        <div>EXPERIMENTS</div>
        <div>
          <a href="https://neurorobotics.net/" target="_blank">
            NEUROROBOTICS.AI
          </a>
        </div>
      </header>

      <div className="app-banner">
        <h1>
          NEUROROBOTICS <br /> PLATFORM
        </h1>
      </div>

      <div className="app-sidebar-left"></div>
      <div className="app-experiments-left">
        <p>image placeholder</p>
        <p>see full list of experiments</p>
      </div>
      <div className="app-experiments-right">
        <p>Most recent</p>
        <p>Experiment 1 Placeholder</p>
        <p>Experiment 2 Placeholder</p>
      </div>
      <div className="app-sidebar-right"></div>
    </div>
  );
}

export default App;
