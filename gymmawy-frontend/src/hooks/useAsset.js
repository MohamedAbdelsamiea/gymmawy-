// src/hooks/useAsset.js
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

export function useAsset(path, source = 'lang') {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';

  const assetPath = useMemo(() => {
    if (source === 'common') {
      return `/assets/common/${path}`;
    } else {
      // Default is language-specific
      return `/assets/${lang}/${path}`;
    }
  }, [path, source, lang]);

  return assetPath;
}