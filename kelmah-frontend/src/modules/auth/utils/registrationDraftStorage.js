import secureStorage from '../../../utils/secureStorage';
import { registrationDefaultValues } from './registrationSchema';

export const REGISTRATION_DRAFT_KEY = 'registration_draft_v2';
const DRAFT_TTL = 12 * 60 * 60 * 1000; // 12 hours
const SAFE_FIELDS = [
    'role',
    'firstName',
    'lastName',
    'email',
    'phone',
    'companyName',
    'trades',
    'experienceYears',
    'acceptTerms',
    'step',
];

const canUseStorage = () => typeof window !== 'undefined';

const sanitizeDraft = (values = {}) => {
    const safePayload = {};

    SAFE_FIELDS.forEach((field) => {
        if (values[field] !== undefined) {
            safePayload[field] = values[field];
        }
    });

    return safePayload;
};

export const saveRegistrationDraft = (values) => {
    if (!canUseStorage() || !values) {
        return;
    }

    const sanitized = sanitizeDraft(values);
    secureStorage.setItem(REGISTRATION_DRAFT_KEY, sanitized, DRAFT_TTL);
};

export const loadRegistrationDraft = () => {
    if (!canUseStorage()) {
        return null;
    }

    const draft = secureStorage.getItem(REGISTRATION_DRAFT_KEY, DRAFT_TTL);
    if (!draft) {
        return null;
    }

    return {
        ...registrationDefaultValues,
        ...draft,
        trades: Array.isArray(draft.trades) ? draft.trades : [],
        step: typeof draft.step === 'number' ? draft.step : 0,
    };
};

export const clearRegistrationDraft = () => {
    if (!canUseStorage()) {
        return;
    }
    secureStorage.removeItem(REGISTRATION_DRAFT_KEY);
};
