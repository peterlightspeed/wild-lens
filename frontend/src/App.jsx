import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Identify from './pages/Identify';
import Encyclopedia from './pages/Encyclopedia';
import Community from './pages/Community';
import ImageGenerator from './pages/ImageGenerator';
import ImageToVideo from './pages/ImageToVideo';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Chat from './pages/Chat';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/identify" element={<Identify />} />
        <Route path="/encyclopedia" element={<Encyclopedia />} />
        <Route path="/community" element={<Community />} />
        <Route path="/image-generator" element={<ImageGenerator />} />
        <Route path="/image-to-video" element={<ImageToVideo />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
