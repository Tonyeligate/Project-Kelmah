# Kelmah Frontend 2000-Item Fix & Improvement Backlog (March 19 2026)

This file continues the massive backlog expansion with another 1,000 high-impact, actionable items for the Kelmah frontend.

---

## 🧩 Core UI & UX Improvements (Items 1001–1120)

1001. Add keyboard accessibility to the `Header` menu to allow navigation via arrow keys.
1002. Ensure `Header` profile dropdown closes when clicking outside.
1003. Ensure the mobile navigation drawer is fully accessible with a screen reader.
1004. Improve `MobileBottomNav` by adding an `aria-label` for the active tab.
1005. Ensure `Footer` social icons have `aria-label` and do not rely on text.
1006. Add a "return to top" button for tall pages with improved accessibility.
1007. Add a "sticky" call-to-action bar for mobile in the job listing page.
1008. Add consistent margin/padding spacing across form fields.
1009. Add hover/active states for all buttons for better affordance.
1010. Add a visual focus ring to all focusable elements.
1011. Prevent layout shift by reserving space for images before they load.
1012. Add loading skeletons for major data sections beyond job cards.
1013. Add an "empty state" wrapper component used consistently.
1014. Add a consistent page header component that includes title, subtitle, and actions.
1015. Add consistent "back" button placement on all pages.
1016. Add a "breadcrumb" component to indicate navigation path.
1017. Ensure all navigation links use the router `Link` instead of `a` to avoid full refresh.
1018. Add a `NavLink` active state style for all top-level navigation.
1019. Add a `useScrollRestoration` hook for preserving scroll position on navigation.
1020. Add consistent "confirmation" dialogs for deleting content.
1021. Add animation smoothing between route transitions.
1022. Add a centralized `Toast` provider and enforce its use across the app.
1023. Add a `ModalManager` to avoid multiple overlapping modals.
1024. Add a `BreadcrumbNavigation` unit test to ensure it reflects routes correctly.
1025. Add a `404` page improvement by offering links to key areas.
1026. Add a `500` error page with a "report issue" button.
1027. Add a `maintenance` page that can be enabled via a remote flag.
1028. Add a "help" button to the page header for quick access.
1029. Add subtle animation for card hover to improve perceived responsiveness.
1030. Add a `tooltips` component that supports delay and accessibility.
1031. Add a `collapsible panel` component for long forms.
1032. Add a `drawer` component for mobile filters and menus.
1033. Add a `fab` action button for key actions on mobile.
1034. Add a `stepper` component for multi-step flows.
1035. Add a `progress bar` component for background tasks.
1036. Add a `toast` type for non-dismissible informational messages.
1037. Add a `notification center` where all toasts are accessible after dismissal.
1038. Add a `search` results highlight of query text.
1039. Add fuzzy search support to search inputs.
1040. Add "no results" suggestions based on closest matches.
1041. Add an input sanitizer to remove emojis or invalid characters where not allowed.
1042. Add consistent field validation messaging: position, tone, and style.
1043. Add real-time password strength meter on registration.
1044. Add password confirmation validation.
1045. Add a "show password" toggle to password fields.
1046. Add a "copy to clipboard" button for shareable links.
1047. Add "drag to reorder" functionality for sortable lists.
1048. Add "pin to top" feature in lists.
1049. Add a "filter tag" UI to show active filters.
1050. Add a "clear all filters" one-click option.
1051. Add a consistent "sort by" dropdown component.
1052. Add a "pagination size" selector.
1053. Add a "load more" button option for infinite scroll.
1054. Add an "infinite scroll" toggle for lists.
1055. Add a "scroll to top on navigation" behavior.
1056. Add a progress spinner overlay for full-page loading.
1057. Add a "ghost button" style for secondary actions.
1058. Add a "primary button" style for main actions.
1059. Add a "danger button" style for destructive actions.
1060. Add a "disabled" style for inactive buttons.
1061. Add a "confirmation" step for destructive actions.
1062. Add a "prompt" for unsaved changes when navigating away.
1063. Add a "field-level validation" for required fields.
1064. Add a "form summary" at the top of long forms.
1065. Add a "field help text" below inputs.
1066. Add a "success message" after saving data.
1067. Add a "failure message" with retry option.
1068. Add a "loading indicator" in submit buttons.
1069. Add a "network status indicator" (online/offline) in the header.
1070. Add a "global loading state" that thaw transitions when async tasks complete.
1071. Add a "breadcrumbs" component that works for nested routes.
1072. Add an "aria-current" attribute to active navigation items.
1073. Add a "news/announcement banner" system for important updates.
1074. Add a "customer support chat" link in the footer.
1075. Add a "send feedback" form accessible from the footer.
1076. Add a "keyboard shortcut" cheat sheet in the help section.
1077. Add a "visual theme switcher" (light/dark/high contrast).
1078. Add a "font size adjuster" in settings.
1079. Add a "language selector" dropdown.
1080. Add a "back to top" control for long pages.
1081. Add a "collapse all" / "expand all" for nested sections.
1082. Add a "progressive disclosure" pattern for advanced options.
1083. Add a "multi-column layout" for large dashboards.
1084. Add a "responsive grid" for card layouts.
1085. Add a "full-screen mode" for the messaging interface.
1086. Add a "dark mode" preview in settings.
1087. Add a "toggle for animations" to respect reduced motion.
1088. Add a "smart input focus" for forms (next field auto-focus).
1089. Add a "read-only" mode for certain pages when offline.
1090. Add a "cross-linking" system between related pages (e.g., job <-> worker).
1091. Add a "swap roles" shortcut for users with both roles.
1092. Add an "in-app tutorial" for key user flows.
1093. Add a "what's new" modal for major releases.
1094. Add a "release notes" link in settings.
1095. Add a "feedback prompt" after first week of usage.
1096. Add a "survey prompt" for select users.
1097. Add a "system announcement" UI for maintenance.
1098. Add a "legal policy updates" acknowledgement flow.
1099. Add a "panic button" for urgent support (e.g., safety issue).
1100. Add a "help request" form pre-populated with context.
1101. Add a "recent activity" feed for users (applications, messages).
1102. Add a "timeline" view for job progress.
1103. Add a "task checklist" for job completion.
1104. Add an "analytics dashboard" for hirers to see job metrics.
1105. Add a "performance dashboard" for workers to track earnings.
1106. Add a "currency converter" for multi-currency support.
1107. Add a "time zone converter" for scheduling.
1108. Add a "meeting scheduler" for hirers and workers.
1109. Add a "availability calendar" for workers.
1110. Add a "job reminder" email/SMS scheduler.
1111. Add a "contract template" builder.
1112. Add a "contract approval" workflow.
1113. Add a "signature capture" feature.
1114. Add a "payment split" feature for group jobs.
1115. Add a "escrow release" flow.
1116. Add a "dispute resolution" workflow.
1117. Add a "job completion survey" for both parties.
1118. Add a "safety checklist" for certain categories (electrical, roofing).
1119. Add a "tool checklist" for certain job types.
1120. Add a "materials estimate" calculator.

---

## 🧪 Accessibility & Inclusion (Items 1121–1240)

1121. Ensure all interactive components have accessible names (aria-label/title).
1122. Audit all icons to include proper aria-labels when used as buttons.
1123. Add keyboard-only focus styles for all clickable elements.
1124. Ensure all form fields have labels bound via `htmlFor`.
1125. Ensure any visual-only indicators (color) are backed with text.
1126. Ensure contrast ratio meets WCAG AA for all text.
1127. Add a "skip navigation" link at the top of each page.
1128. Add an `aria-live` region for toast messages.
1129. Ensure modal dialogs trap focus and restore focus on close.
1130. Ensure modals have proper `aria-modal` and `role=