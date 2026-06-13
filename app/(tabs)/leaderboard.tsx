import { useTranslation } from 'react-i18next';

import { StubScreen } from '../../components/StubScreen';

export default function LeaderboardScreen() {
  const { t } = useTranslation();
  return <StubScreen title={t('screens.leaderboard')} />;
}
