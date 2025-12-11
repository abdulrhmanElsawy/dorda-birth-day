import './App.css';
import { Routes, Route } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';

import Website from './components/Website';

function App() {


  return (
    <div className="App">
      <Routes>
        <Route path="/" element={
          <>
          <Website />
          </>
        } />

    
      </Routes>
    </div>
  );
}


export default App;
