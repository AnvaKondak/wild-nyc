import { useLocalSearchParams } from 'expo-router';
import { ComingSoon } from '@/components/ComingSoon';
import { getSpecies } from '@/content';

export default function SpeciesProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const species = getSpecies(id);
  return <ComingSoon kicker={species?.commonName ?? 'Neighbor'} title={species?.friendlyName ?? 'Neighbor'} accent="" step={4} />;
}
