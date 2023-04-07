import './App.css';
import Navbar from './components/Navbar';
import Settings from './components/settings/Settings';
import {Routes, Route} from 'react-router-dom';

const Home = () => {
  return(
    <h1>Home!!</h1>
  )
}

function App() {
  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />}> </Route>
        <Route path="/settings" element={<Settings />}></Route>
      </Routes>
    </div>
    
  );
}

export default App;
