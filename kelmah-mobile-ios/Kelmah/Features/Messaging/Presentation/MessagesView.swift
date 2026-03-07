import SwiftUI

struct MessagesView: View {
    var body: some View {
        PlaceholderStateView(
            title: "Messaging",
            subtitle: "Prepared for realtime threads, unread counters, attachment flows, and resilient notification deep-linking.",
            bullets: [
                "Socket-compatible architecture aligned to Kelmah messaging service contracts.",
                "Prepared for local conversation caching and fast thread resume.",
                "Designed for delivery state, read receipts, and offline retry."
            ]
        )
    }
}
