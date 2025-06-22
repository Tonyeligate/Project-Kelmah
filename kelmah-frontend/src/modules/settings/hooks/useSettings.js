import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import settingsService from '../services/settingsService';
import { setSettings, setLoading, setError, selectSettings, selectSettingsLoading, selectSettingsError } from '../../../store/slices/settingsSlice';
import useAuth from '../../auth/hooks/useAuth';

export const useSettings = () => {
    const dispatch = useDispatch();
    const settings = useSelector(selectSettings);
    const loading = useSelector(selectSettingsLoading);
    const error = useSelector(selectSettingsError);
    const { isAuthenticated } = useAuth();
    const [languages, setLanguages] = useState([]);
    const [themes, setThemes] = useState([]);

    const loadSettings = useCallback(async () => {
        try {
            dispatch(setLoading(true));
            const settings = await settingsService.getSettings();
            dispatch(setSettings(settings));
            return settings;
        } catch (error) {
            dispatch(setError(error.message));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const updateSettings = useCallback(async (settings) => {
        try {
            dispatch(setLoading(true));
            const updatedSettings = await settingsService.updateSettings(settings);
            dispatch(setSettings(updatedSettings));
            return updatedSettings;
        } catch (error) {
            dispatch(setError(error.message));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const updateNotificationPreferences = useCallback(async (preferences) => {
        try {
            dispatch(setLoading(true));
            const updatedSettings = await settingsService.updateNotificationPreferences(preferences);
            dispatch(setSettings(updatedSettings));
            return updatedSettings;
        } catch (error) {
            dispatch(setError(error.message));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const updatePrivacySettings = useCallback(async (settings) => {
        try {
            dispatch(setLoading(true));
            const updatedSettings = await settingsService.updatePrivacySettings(settings);
            dispatch(setSettings(updatedSettings));
            return updatedSettings;
        } catch (error) {
            dispatch(setError(error.message));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const updateLanguage = useCallback(async (language) => {
        try {
            dispatch(setLoading(true));
            const updatedSettings = await settingsService.updateLanguage(language);
            dispatch(setSettings(updatedSettings));
            return updatedSettings;
        } catch (error) {
            dispatch(setError(error.message));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const updateTheme = useCallback(async (theme) => {
        try {
            dispatch(setLoading(true));
            const updatedSettings = await settingsService.updateTheme(theme);
            dispatch(setSettings(updatedSettings));
            return updatedSettings;
        } catch (error) {
            dispatch(setError(error.message));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const loadLanguages = useCallback(async () => {
        try {
            const availableLanguages = await settingsService.getLanguages();
            setLanguages(availableLanguages);
            return availableLanguages;
        } catch (error) {
            console.error('Error loading languages:', error);
            throw error;
        }
    }, []);

    const loadThemes = useCallback(async () => {
        try {
            const availableThemes = await settingsService.getThemes();
            setThemes(availableThemes);
            return availableThemes;
        } catch (error) {
            console.error('Error loading themes:', error);
            throw error;
        }
    }, []);

    const resetSettings = useCallback(async () => {
        try {
            dispatch(setLoading(true));
            const defaultSettings = await settingsService.resetSettings();
            dispatch(setSettings(defaultSettings));
            return defaultSettings;
        } catch (error) {
            dispatch(setError(error.message));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    // Load settings, languages, and themes when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            loadSettings();
            loadLanguages();
            loadThemes();
        }
    }, [isAuthenticated, loadSettings, loadLanguages, loadThemes]);

    return {
        settings,
        loading,
        error,
        languages,
        themes,
        loadSettings,
        updateSettings,
        updateNotificationPreferences,
        updatePrivacySettings,
        updateLanguage,
        updateTheme,
        loadLanguages,
        loadThemes,
        resetSettings
    };
}; 