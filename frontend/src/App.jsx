import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import WorkoutSession from './pages/WorkoutSession';
import Nutrition from './pages/Nutrition';
import Progress from './pages/Progress';
import Journal from './pages/Journal';
import Layout from './components/Layout';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const OnboardingGuard = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.onboardingComplete) return <Navigate to="/onboarding" replace />;
  return children;
};

function App() {
  return (
    <GoogleOAuthProvider clientId="898348871822-u5pt3aahb3os9gp143253l96vg3cg5nk.apps.googleusercontent.com">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
            <Route path="/" element={<OnboardingGuard><Layout /></OnboardingGuard>}>
              <Route index element={<Dashboard />} />
              <Route path="session" element={<WorkoutSession />} />
              <Route path="nutrition" element={<Nutrition />} />
              <Route path="progress" element={<Progress />} />
              <Route path="journal" element={<Journal />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
