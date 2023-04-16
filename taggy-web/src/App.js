import './App.css';
import Navbar from './components/Navbar';
import Library from './components/options/Library';
import Scan from './components/options/Scan';
import VideoPlayer from './components/video/VideoPlayer';
import VideoStream from './components/video/VideoStream';
import Videos from './components/video/Videos';
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
        <Route path="/" element={<Home />} />
        <Route path="/videos"> 
            <Route index element={<Videos />} />
            <Route path=':videoId' element={<VideoPlayer />} />
            <Route path=':videoId/stream' element={<VideoStream />} />
        </Route>
        <Route path="/library" element={<Library />} />
        <Route path='/scan' element={<Scan />} />
      </Routes>
    </div>
  );
}

export default App;
