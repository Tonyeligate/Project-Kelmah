import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { secureStorage } from '../../../utils/secureStorage';

const DRAFT_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const SAVE_DELAY = 800;

const fallbackStorage = {
    get(key) {
        try {
            if (typeof window === 'undefined') {
                return null;
            }
            const raw = window.localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.warn('Draft fallback read failed:', error);
            return null;
        }
    },
    set(key, value) {
        try {
            if (typeof window === 'undefined') {
                return false;
            }
            window.localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn('Draft fallback write failed:', error);
            return false;
        }
    },
    remove(key) {
        try {
            if (typeof window === 'undefined') {
                return;
            }
            window.localStorage.removeItem(key);
        } catch (error) {
            console.warn('Draft fallback remove failed:', error);
        }
    },
};

const getDraftKey = (userId) => `kelmah:job-draft:${userId || 'guest'}`;

export const useJobDraft = ({
    values,
    isDirty,
    reset,
    defaultValues,
    dialogOpen,
    userId,
}) => {
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const [draftRestored, setDraftRestored] = useState(false);
    const [hasDraft, setHasDraft] = useState(false);
    const hydratedRef = useRef(false);
    const saveTimeoutRef = useRef(null);

    const draftKey = useMemo(() => getDraftKey(userId), [userId]);

    const readDraft = useCallback(() => {
        const stored = secureStorage.getItem(draftKey);
        return stored ?? fallbackStorage.get(draftKey);
    }, [draftKey]);

    const writeDraft = useCallback(
        (data) => {
            const payload = {
                data,
                updatedAt: Date.now(),
                version: '1.0.0',
            };
            const stored = secureStorage.setItem(draftKey, payload, DRAFT_TTL);
            if (!stored) {
                fallbackStorage.set(draftKey, payload);
            }
            setLastSavedAt(payload.updatedAt);
            setHasDraft(true);
        },
        [draftKey],
    );

    const clearDraft = useCallback(() => {
        secureStorage.removeItem(draftKey);
        fallbackStorage.remove(draftKey);
        setLastSavedAt(null);
        setHasDraft(false);
    }, [draftKey]);

    useEffect(() => {
        if (!dialogOpen || hydratedRef.current) {
            return;
        }

        const saved = readDraft();
        if (saved?.data) {
            reset({ ...defaultValues, ...saved.data });
            setDraftRestored(true);
            setHasDraft(true);
            setLastSavedAt(saved.updatedAt || Date.now());
        }

        hydratedRef.current = true;
    }, [dialogOpen, defaultValues, readDraft, reset]);

    useEffect(() => {
        if (!dialogOpen || !hydratedRef.current || !isDirty) {
            return;
        }

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            writeDraft(values);
        }, SAVE_DELAY);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [dialogOpen, isDirty, values, writeDraft]);

    const saveDraft = useCallback(() => {
        if (values) {
            writeDraft(values);
            setDraftRestored(false);
        }
    }, [values, writeDraft]);

    const discardDraft = useCallback(() => {
        clearDraft();
        reset(defaultValues);
        setDraftRestored(false);
        hydratedRef.current = true;
    }, [clearDraft, defaultValues, reset]);

    return {
        lastSavedAt,
        draftRestored,
        hasDraft,
        clearDraft,
        discardDraft,
        saveDraft,
    };
};
