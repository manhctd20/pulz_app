import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { StubScreen } from '../../components/StubScreen';

export default function GroupDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  return <StubScreen title={t('screens.groupDetail')} subtitle={`ID: ${id}`} />;
}
