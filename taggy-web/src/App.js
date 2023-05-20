import './App.css';
import Home from './components/homepage/Home';
import Navbar from './components/Navbar';
import Library from './components/options/Library';
import Scan from './components/options/Scan';
import VideoPlayer from './components/videos/VideoPlayer';
import VideoStream from './components/videos/VideoStream';
import Videos from './components/videos/Videos';
import Tags from './components/tags/Tags';
import TagDetail from './components/tags/TagDetail';
import {Routes, Route} from 'react-router-dom';

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
        <Route path='/tags'>
          <Route index element={<Tags />} />
          <Route path=':tagId' element={<TagDetail />} />
        </Route>
        <Route path="/library" element={<Library />} />
        <Route path='/scan' element={<Scan />} />
      </Routes>
    </div>
  );
}

export default App;
