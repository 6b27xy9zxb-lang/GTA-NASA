import React from 'react';
import { useGameStore } from './store/gameStore';
import { LandingPage } from './components/landing/LandingPage';
import { ScenarioSelect } from './components/scenario/ScenarioSelect';
import { HangarScreen } from './components/hangar/HangarScreen';
import { MissionBuilder } from './components/builder/MissionBuilder';
import { LaunchSequence } from './components/launch/LaunchSequence';
import { FlightDashboard } from './components/flight/FlightDashboard';
import { MissionReport } from './components/reports/MissionReport';
import { MultiplayerScreen } from './components/multiplayer/MultiplayerScreen';
import { TutorialScreen } from './components/tutorial/TutorialScreen';
import { SandboxScreen } from './components/sandbox/SandboxScreen';

export const App: React.FC = () => {
  const currentScreen = useGameStore((state) => state.currentScreen);

  switch (currentScreen) {
    case 'landing':
      return <LandingPage />;
    case 'scenario':
      return <ScenarioSelect />;
    case 'hangar':
      return <HangarScreen />;
    case 'builder':
      return <MissionBuilder />;
    case 'launch':
      return <LaunchSequence />;
    case 'flight':
      return <FlightDashboard />;
    case 'report':
      return <MissionReport />;
    case 'multiplayer':
      return <MultiplayerScreen />;
    case 'tutorial':
      return <TutorialScreen />;
    case 'sandbox':
      return <SandboxScreen />;
    default:
      return <LandingPage />;
  }
};

export default App;
