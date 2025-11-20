import { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  registrationSchema,
  registrationDefaultValues,
  calculatePasswordStrength,
} from '../utils/registrationSchema';
import {
  loadRegistrationDraft,
  saveRegistrationDraft,
  clearRegistrationDraft,
} from '../utils/registrationDraftStorage';

const AUTOSAVE_INTERVAL = 750; // ms

export const useRegistrationForm = ({
  defaultValues,
  autosave = true,
  resolver = zodResolver(registrationSchema),
} = {}) => {
  const draft = useMemo(() => loadRegistrationDraft(), []);
  const mergedDefaults = useMemo(
    () => ({
      ...registrationDefaultValues,
      ...(draft || {}),
      ...(defaultValues || {}),
    }),
    [draft, defaultValues],
  );

  const form = useForm({
    mode: 'onBlur',
    resolver,
    defaultValues: mergedDefaults,
  });

  const lastSaveRef = useRef(0);
  const autosaveTimer = useRef(null);
  const draftLoaded = Boolean(draft);

  useEffect(() => {
    if (!autosave) {
      return undefined;
    }

    const subscription = form.watch((values) => {
      const now = Date.now();
      const shouldSave = now - lastSaveRef.current >= AUTOSAVE_INTERVAL;

      if (shouldSave) {
        saveRegistrationDraft(values);
        lastSaveRef.current = now;
      } else {
        clearTimeout(autosaveTimer.current);
        autosaveTimer.current = setTimeout(() => {
          saveRegistrationDraft(values);
          lastSaveRef.current = Date.now();
        }, AUTOSAVE_INTERVAL);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
    };
  }, [form, autosave]);

  const resetFromDraft = () => {
    const latestDraft = loadRegistrationDraft();
    form.reset(latestDraft || registrationDefaultValues, {
      keepErrors: false,
      keepDirty: false,
      keepTouched: false,
    });
  };

  const handleClearDraft = () => {
    clearRegistrationDraft();
    form.reset(registrationDefaultValues, {
      keepErrors: false,
      keepDirty: false,
      keepTouched: false,
    });
  };

  const password = form.watch('password');
  const passwordStrength = calculatePasswordStrength(password);

  return {
    ...form,
    draftLoaded,
    resetFromDraft,
    clearDraft: handleClearDraft,
    passwordStrength,
  };
};

export default useRegistrationForm;
