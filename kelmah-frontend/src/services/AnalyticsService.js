import { NODE_ENV, GA_ID, ENABLE_ANALYTICS } from '../config/env';

class AnalyticsService {
    constructor() {
        this.enabled = ENABLE_ANALYTICS;
    }

    initialize() {
        if (this.enabled && window.gtag) {
            window.gtag('config', GA_ID, {
                send_page_view: true
            });
        }
    }

    trackPageView(page) {
        if (this.enabled && window.gtag) {
            window.gtag('config', GA_ID, {
                page_path: page
            });
        }
        console.log(`Page view tracked: ${page}`);
    }

    trackEvent(category, action, label) {
        if (this.enabled && window.gtag) {
            window.gtag('event', action, {
                event_category: category,
                event_label: label
            });
        }
        console.log(`Event tracked: ${category} - ${action} - ${label}`);
    }
}

export default new AnalyticsService(); 