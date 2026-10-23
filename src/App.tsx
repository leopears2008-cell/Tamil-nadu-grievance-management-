import FortStGeorgeHero from './components/FortStGeorgeHero';
import CivicPowerFeatures from './components/CivicPowerFeatures';

export default function App() {
  const handleQuickFile = (draftText: string, detectedCategory: string) => {
    // This is only a UI hand-off. Connect it to the authenticated grievance API
    // before treating the draft as a submitted petition.
    window.dispatchEvent(new CustomEvent('grievance:draft', { detail: { draftText, detectedCategory } }));
    window.alert(`Grievance draft prepared. Category: ${detectedCategory}. Connect the official filing API to submit it.`);
  };

  const handleTrackPetition = (petitionId: string) => {
    window.dispatchEvent(new CustomEvent('grievance:track', { detail: { petitionId } }));
    window.alert(`Tracking requested for ${petitionId}. Connect the petition-status API to retrieve its live status.`);
  };

  return (
    <>
      <FortStGeorgeHero onQuickFile={handleQuickFile} onTrackPetition={handleTrackPetition} />
      <CivicPowerFeatures />
    </>
  );
}
