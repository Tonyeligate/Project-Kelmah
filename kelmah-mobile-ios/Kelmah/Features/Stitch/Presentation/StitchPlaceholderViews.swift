import SwiftUI

struct StitchScreenSpec: Identifiable, Hashable {
    let id: String
    let title: String
    let source: String
    let category: String
    let description: String
    let sections: [String]
    let primaryAction: String
}

struct StitchScreensCatalogView: View {
    private let specs = StitchScreenCatalog.all

    var body: some View {
        KelmahPremiumBackground {
            List {
                ForEach(groupedCategories, id: \.self) { category in
                    Section(category) {
                        ForEach(specs.filter { $0.category == category }) { spec in
                            NavigationLink(value: spec) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(spec.title)
                                        .font(.headline.weight(.semibold))
                                        .foregroundStyle(KelmahTheme.textPrimary)
                                    Text(spec.source)
                                        .font(.caption.weight(.medium))
                                        .foregroundStyle(KelmahTheme.textMuted)
                                }
                                .padding(.vertical, 6)
                            }
                        }
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .navigationTitle("Stitch Screens")
            .navigationDestination(for: StitchScreenSpec.self) { spec in
                StitchPlaceholderView(spec: spec)
            }
        }
    }

    private var groupedCategories: [String] {
        Array(Set(specs.map(\.category))).sorted()
    }
}

struct StitchPlaceholderView: View {
    let spec: StitchScreenSpec

    var body: some View {
        KelmahPremiumBackground {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    KelmahPanel(elevated: true) {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack(alignment: .top, spacing: 12) {
                                VStack(alignment: .leading, spacing: 5) {
                                    Text(spec.category.uppercased())
                                        .font(.caption.weight(.bold))
                                        .foregroundStyle(KelmahTheme.primary)
                                    Text(spec.title)
                                        .font(.title.weight(.bold))
                                        .foregroundStyle(KelmahTheme.textPrimary)
                                }
                                Spacer()
                                Image(systemName: "hammer.circle.fill")
                                    .font(.system(size: 38, weight: .semibold))
                                    .foregroundStyle(KelmahTheme.sun, KelmahTheme.primary)
                            }

                            Text(spec.description)
                                .font(.body)
                                .foregroundStyle(KelmahTheme.textPrimary)

                            HStack(spacing: 8) {
                                KelmahSignalChip(text: spec.source, accent: KelmahTheme.sun)
                                KelmahSignalChip(text: "Light", accent: KelmahTheme.cyan)
                                KelmahSignalChip(text: "Dark", accent: KelmahTheme.success)
                            }
                        }
                    }

                    StitchConcreteBody(spec: spec)

                    Button(spec.primaryAction) {}
                        .font(.headline.weight(.bold))
                        .frame(maxWidth: .infinity)
                        .frame(minHeight: 48)
                        .buttonStyle(.borderedProminent)
                        .tint(KelmahTheme.sun)
                        .foregroundStyle(Color.black)
                }
                .padding(16)
            }
        }
        .navigationTitle(spec.title)
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct StitchConcreteBody: View {
    let spec: StitchScreenSpec

    var body: some View {
        switch spec.category {
        case "Auth", "Onboarding": AuthTemplate(spec: spec)
        case "Wallet": WalletTemplate(spec: spec)
        case "Discovery", "Hiring": MarketplaceTemplate(spec: spec)
        case "Messaging": ChatTemplate()
        case "Projects", "Milestones", "Contracts": ProjectTemplate(spec: spec)
        case "Disputes": DisputeTemplate(spec: spec)
        case "Profile", "Settings", "Security", "Verification", "Support": SettingsTemplate(spec: spec)
        case "Admin": AdminTemplate(spec: spec)
        default: SectionCards(sections: spec.sections)
        }
    }
}

private struct AuthTemplate: View {
    let spec: StitchScreenSpec

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if spec.category == "Onboarding" {
                MetricHero(title: spec.title, value: "Kelmah", subtitle: "Verified pros. Secure escrow. Track every milestone.")
                ProgressSegments(active: 2, total: 3)
            }
            SectionCards(sections: spec.sections)
            if spec.title.localizedCaseInsensitiveContains("Role") {
                ChoiceCard(title: "I want to Hire", subtitle: "Post jobs, compare proposals, and fund escrow securely.")
                ChoiceCard(title: "I want to Work", subtitle: "Find jobs, submit proposals, and build verified reputation.", selected: true)
            } else if spec.source.localizedCaseInsensitiveContains("verify") {
                HStack(spacing: 8) { ForEach(1...6, id: \.self) { OtpBox(value: "\($0)") } }
            } else {
                ForEach(["Full name", "Email address", "Phone number", "Password"], id: \.self) { label in
                    TextField(label, text: .constant(""))
                        .textFieldStyle(.roundedBorder)
                }
            }
        }
    }
}

private struct WalletTemplate: View {
    let spec: StitchScreenSpec

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            MetricHero(title: spec.title, value: spec.title.localizedCaseInsensitiveContains("Earnings") ? "GH₵ 3,240.50" : "GH₵ 4,250.00", subtitle: "Available balance and escrow activity")
            if spec.title.localizedCaseInsensitiveContains("Deposit") || spec.title.localizedCaseInsensitiveContains("Withdraw") {
                TextField("Amount", text: .constant(""))
                    .textFieldStyle(.roundedBorder)
                ChoiceCard(title: "MTN Mobile Money", subtitle: "Default payout and deposit method", selected: true)
                ChoiceCard(title: "Card Payment", subtitle: "Visa ending 4242")
            }
            TransactionRow(title: "Milestone Payment", amount: "+ GH₵ 450.00", positive: true)
            TransactionRow(title: "Withdrawal to Bank", amount: "- GH₵ 800.00", positive: false)
            TransactionRow(title: "Wallet Top-Up", amount: "+ GH₵ 950.00", positive: true)
        }
    }
}

private struct MarketplaceTemplate: View {
    let spec: StitchScreenSpec

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            TextField(spec.category == "Hiring" ? "Job title" : "Search trade or location", text: .constant(""))
                .textFieldStyle(.roundedBorder)
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 96), spacing: 8)], spacing: 8) {
                ForEach(["Plumbing", "Electrical", "Carpentry", "Painting", "Masonry"], id: \.self) { trade in
                    KelmahSignalChip(text: trade, accent: KelmahTheme.cyan)
                }
            }
            ListingCard(title: "Emergency Pipe Repair", badge: "Urgent", meta: "East Legon • GH₵ 600")
            ListingCard(title: "Kitchen Cabinet Build", badge: "Verified", meta: "Osu • GH₵ 1,000")
            ListingCard(title: "Commercial HVAC Retrofit", badge: "Large project", meta: "Accra Mall • GH₵ 1,400")
        }
    }
}

private struct ChatTemplate: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ChatBubble(text: "Hi, can you share photos of the current wiring panel?", incoming: true)
            ChatBubble(text: "Uploaded two photos and marked the location. I can start tomorrow morning.", incoming: false)
            SectionCard(title: "Job context", subtitle: "Full House Wiring • Active contract • Escrow funded")
            TextField("Message", text: .constant(""))
                .textFieldStyle(.roundedBorder)
        }
    }
}

private struct ProjectTemplate: View {
    let spec: StitchScreenSpec

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            MetricHero(title: spec.title, value: "75%", subtitle: "Project progress with escrow protection")
            TimelineRow(title: "Foundation complete", status: "Complete")
            TimelineRow(title: "Framing in progress", status: "In Progress")
            TimelineRow(title: "Final inspection pending", status: "Pending")
            ChoiceCard(title: "Terms acknowledgement", subtitle: "Scope, milestones, escrow release, and dispute policy accepted.", selected: true)
        }
    }
}

private struct DisputeTemplate: View {
    let spec: StitchScreenSpec

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionCards(sections: spec.sections)
            ChoiceCard(title: "Work quality issue", subtitle: "Deliverables do not match the agreed milestone.", selected: true)
            ChoiceCard(title: "Payment release issue", subtitle: "Funds are delayed or disputed after completion.")
            SectionCard(title: "Evidence upload", subtitle: "3 photos • 1 invoice • Artisan note attached")
        }
    }
}

private struct SettingsTemplate: View {
    let spec: StitchScreenSpec

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(spec.sections, id: \.self) { title in
                KelmahPanel {
                    Toggle(isOn: .constant(title.count.isMultiple(of: 2))) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(title).font(.headline.weight(.semibold))
                            Text("Configured from \(spec.source)").font(.footnote).foregroundStyle(KelmahTheme.textMuted)
                        }
                    }
                    .tint(KelmahTheme.sun)
                }
            }
        }
    }
}

private struct AdminTemplate: View {
    let spec: StitchScreenSpec

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ListingCard(title: "High priority dispute", badge: "Urgent", meta: "Assigned queue • 4 documents")
            ListingCard(title: "Identity verification pending", badge: "Review", meta: "Assigned queue • 3 documents")
            ListingCard(title: "Escrow evidence review", badge: "Review", meta: "Assigned queue • 2 documents")
        }
    }
}

private struct SectionCards: View {
    let sections: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(sections, id: \.self) { SectionCard(title: $0, subtitle: "Native component mapped from Stitch structure.") }
        }
    }
}

private struct SectionCard: View {
    let title: String
    let subtitle: String

    var body: some View {
        KelmahPanel {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "checkmark.seal.fill").foregroundStyle(KelmahTheme.success)
                VStack(alignment: .leading, spacing: 4) {
                    Text(title).font(.headline.weight(.semibold)).foregroundStyle(KelmahTheme.textPrimary)
                    Text(subtitle).font(.footnote).foregroundStyle(KelmahTheme.textMuted)
                }
            }
        }
    }
}

private struct MetricHero: View {
    let title: String
    let value: String
    let subtitle: String

    var body: some View {
        KelmahPanel {
            VStack(alignment: .leading, spacing: 5) {
                Text(title.uppercased()).font(.caption.weight(.bold)).foregroundStyle(KelmahTheme.primary)
                Text(value).font(.largeTitle.weight(.black)).foregroundStyle(KelmahTheme.textPrimary)
                Text(subtitle).font(.subheadline).foregroundStyle(KelmahTheme.textMuted)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

private struct ChoiceCard: View {
    let title: String
    let subtitle: String
    var selected = false

    var body: some View {
        KelmahPanel {
            HStack(spacing: 10) {
                Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(selected ? KelmahTheme.primary : KelmahTheme.textMuted)
                VStack(alignment: .leading, spacing: 3) {
                    Text(title).font(.headline.weight(.semibold)).foregroundStyle(KelmahTheme.textPrimary)
                    Text(subtitle).font(.footnote).foregroundStyle(KelmahTheme.textMuted)
                }
                Spacer()
            }
        }
    }
}

private struct ListingCard: View {
    let title: String
    let badge: String
    let meta: String

    var body: some View {
        KelmahPanel {
            HStack(alignment: .top, spacing: 12) {
                RoundedRectangle(cornerRadius: 14).fill(KelmahTheme.sun.opacity(0.22)).frame(width: 56, height: 56)
                VStack(alignment: .leading, spacing: 6) {
                    KelmahSignalChip(text: badge, accent: KelmahTheme.sun)
                    Text(title).font(.headline.weight(.bold)).foregroundStyle(KelmahTheme.textPrimary)
                    Text(meta).font(.footnote).foregroundStyle(KelmahTheme.textMuted)
                }
                Spacer()
            }
        }
    }
}

private struct TransactionRow: View {
    let title: String
    let amount: String
    let positive: Bool

    var body: some View {
        KelmahPanel {
            HStack {
                VStack(alignment: .leading, spacing: 3) {
                    Text(title).font(.headline.weight(.semibold)).foregroundStyle(KelmahTheme.textPrimary)
                    Text("Today • Secured by escrow").font(.footnote).foregroundStyle(KelmahTheme.textMuted)
                }
                Spacer()
                Text(amount).font(.headline.weight(.bold)).foregroundStyle(positive ? KelmahTheme.primary : KelmahTheme.danger)
            }
        }
    }
}

private struct TimelineRow: View {
    let title: String
    let status: String

    var body: some View {
        KelmahPanel {
            HStack(spacing: 12) {
                Circle().fill(KelmahTheme.primary).frame(width: 12, height: 12)
                VStack(alignment: .leading, spacing: 3) {
                    Text(title).font(.headline.weight(.semibold)).foregroundStyle(KelmahTheme.textPrimary)
                    Text(status).font(.footnote).foregroundStyle(KelmahTheme.textMuted)
                }
                Spacer()
            }
        }
    }
}

private struct ChatBubble: View {
    let text: String
    let incoming: Bool

    var body: some View {
        HStack {
            if !incoming { Spacer(minLength: 48) }
            Text(text)
                .font(.body)
                .padding(14)
                .background(incoming ? KelmahTheme.cardRaised : KelmahTheme.sun.opacity(0.55))
                .foregroundStyle(KelmahTheme.textPrimary)
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            if incoming { Spacer(minLength: 48) }
        }
    }
}

private struct ProgressSegments: View {
    let active: Int
    let total: Int

    var body: some View {
        HStack(spacing: 6) {
            ForEach(0..<total, id: \.self) { index in
                Capsule().fill(index < active ? KelmahTheme.primary : KelmahTheme.cardRaised).frame(height: 7)
            }
        }
    }
}

private struct OtpBox: View {
    let value: String

    var body: some View {
        Text(value)
            .font(.headline.weight(.bold))
            .frame(maxWidth: .infinity, minHeight: 54)
            .background(KelmahTheme.card)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).stroke(KelmahTheme.borderSoft, lineWidth: 1))
    }
}

enum StitchScreenCatalog {
    static let all: [StitchScreenSpec] = [
        spec("splash", "Splash", "splash_screen / kelmah_app_flow", "Onboarding", "Animated brand entry point with progress indicator.", ["Logo lockup", "Loading line", "Session handoff"]),
        spec("onboarding", "Welcome Onboarding", "welcome_onboarding / walkthrough_*", "Onboarding", "Carousel for verified pros, secure escrow, and progress tracking.", ["Verified pros", "Secure escrow", "Track progress"], "Get started"),
        spec("role", "Choose Your Role", "role_selection", "Auth", "Worker or hirer role selection using large selectable cards.", ["Worker card", "Hirer card", "Continue action"]),
        spec("create-account", "Create Account", "create_account", "Auth", "Role-aware registration with password strength and social sign-up.", ["Role card", "Account fields", "Terms acceptance"], "Create account"),
        spec("reset-password", "Reset Password", "reset_password / verify_your_email", "Auth", "Email verification, reset code, and password update flow.", ["Email field", "Verification code", "New password"]),
        spec("post-job", "Post a Job", "post_a_job_1 / post_a_job_2", "Hiring", "Step-by-step job creation with job basics, budget, schedule, milestones, and review.", ["Progress stepper", "Job basics", "Budget and milestones"], "Publish"),
        spec("browse-trades", "Browse Trades", "browse_trades_1 / 2 / 3", "Discovery", "Trade category browsing with search, chips, and job cards.", ["Search bar", "Trade chips", "Recommended jobs"]),
        spec("discover-artisans", "Discover Artisans", "discover_artisans / search_workers", "Discovery", "Search and filter verified professionals by skills, distance, rating, and availability.", ["Worker cards", "Availability badges", "Filter sheet"]),
        spec("active-chat", "Active Chat", "active_chat_1 / active_chat_2", "Messaging", "Real-time conversation surface with bubbles, media attachments, job context, and composer controls.", ["Incoming and outgoing bubbles", "Image attachment", "Job context card"], "Send message"),
        spec("wallet", "Wallet & Payments", "wallet_payments / deposit_funds_*", "Wallet", "Escrow balance, deposits, withdrawals, payout methods, and transaction records.", ["Balance summary", "Payment methods", "Transaction timeline"], "Manage funds"),
        spec("earnings", "Earnings Analytics", "earnings_analytics", "Wallet", "Worker earnings insights with metrics, trends, and project income breakdowns.", ["Revenue metrics", "Chart summary", "Payout readiness"]),
        spec("payouts", "Payout Methods", "payout_methods / withdraw_funds", "Wallet", "Manage bank/mobile-money payout methods and withdraw available funds.", ["Saved payout accounts", "Withdrawal amount", "Verification status"], "Withdraw"),
        spec("transactions", "Transaction History", "transaction_history / transaction_detail_*", "Wallet", "Searchable payment activity and receipt-style transaction details.", ["Filters", "Transaction list", "Receipt detail"]),
        spec("contracts", "Contract Agreement", "contract_agreement / contract_terms", "Contracts", "Project contract review with parties, scope, milestones, terms, and signature action.", ["Parties", "Milestones", "Terms acknowledgement"], "Sign"),
        spec("milestones", "Milestone Approval", "approve_milestone / define_milestones", "Milestones", "Review deliverables, proof images, notes, and approve or request revision.", ["Deliverables", "Proof gallery", "Approval actions"], "Approve"),
        spec("disputes", "Dispute Flow", "file_a_dispute / dispute_case_detail", "Disputes", "Reason picker, evidence upload, case timeline, and moderation updates.", ["Reason cards", "Evidence upload", "Decision timeline"], "Submit dispute"),
        spec("projects", "My Projects", "my_projects / project_*", "Projects", "Active, pending, completed, finance, document, audit, and feedback project screens.", ["Status tabs", "Project cards", "Completion summary"]),
        spec("settings", "Profile Settings", "profile_settings / settings", "Profile", "Account preferences, security, notifications, payment methods, and privacy controls.", ["Personal info", "Payment methods", "Privacy controls"]),
        spec("verification", "Verification Hub", "verification_hub / identity_verification_submission", "Verification", "Identity documents, liveness checks, and review status.", ["Document upload", "Selfie liveness", "Review timeline"], "Start verification"),
        spec("security", "Security Center", "security_center_* / mfa_verification", "Security", "MFA, device sessions, password reset, and account protection controls.", ["MFA setup", "Trusted devices", "Recent activity"]),
        spec("notifications", "Notification Preferences", "notification_preferences / notification_hub_*", "Settings", "Granular push, email, SMS, job alert, and chat notification controls.", ["Channel toggles", "Quiet hours", "Job alerts"]),
        spec("portfolio", "Portfolio Management", "portfolio_management_* / portfolio_project_detail", "Profile", "Worker portfolio projects, media, descriptions, and proof of work.", ["Project gallery", "Add project", "Media management"]),
        spec("certificates", "Certificates & Badges", "certificates_badges / skills_assessment_*", "Profile", "Verified credentials, skill badges, and earned trust signals.", ["Verified badges", "Certificates", "Skill tests"]),
        spec("support", "Help & Support", "help_center_hub / support_ticket_submission", "Support", "Help categories, ticket submission, and support case tracking.", ["Help topics", "Ticket form", "Support history"], "Open ticket"),
        spec("admin", "Admin Queues", "admin_dispute_moderation / admin_verification_queue", "Admin", "Moderation and verification queues for admin review workflows.", ["Priority queue", "Evidence review", "Approve or reject"]),
    ]

    private static func spec(
        _ id: String,
        _ title: String,
        _ source: String,
        _ category: String,
        _ description: String,
        _ sections: [String],
        _ primaryAction: String = "Continue"
    ) -> StitchScreenSpec {
        StitchScreenSpec(
            id: id,
            title: title,
            source: source,
            category: category,
            description: description,
            sections: sections,
            primaryAction: primaryAction
        )
    }
}
