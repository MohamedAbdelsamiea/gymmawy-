// src/hooks/useAsset.js
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { getAssetPath } from '../utils/languageUtils';

export function useAsset(path, source = 'lang') {
  const { i18n } = useTranslation();

  const assetPath = useMemo(() => {
    return getAssetPath(path, source, i18n.language);
  }, [path, source, i18n.language]);

  return assetPath;
}