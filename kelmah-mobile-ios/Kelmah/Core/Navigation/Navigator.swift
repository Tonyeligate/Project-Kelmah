import SwiftUI

/// Drives programmatic and deep-link navigation for a `NavigationStack`.
///
/// Inject a single `Navigator` per navigation surface via `.environmentObject(_:)`.
/// Screens read it with
/// `@EnvironmentObject private var navigator: Navigator` and call
/// `navigator.navigate(to:)` to push routes.
@MainActor
final class Navigator: ObservableObject {
    @Published var path = NavigationPath()

    init() {}

    /// Pushes a route onto the stack.
    func navigate(to route: KelmahRoute) {
        path.append(route)
    }

    /// Pops the top-most destination.
    func pop() {
        guard path.isEmpty == false else { return }
        path.removeLast()
    }

    /// Pops every destination back to the tab root.
    func popToRoot() {
        guard path.isEmpty == false else { return }
        path.removeLast(path.count)
    }

    /// Resolves a deep link URL and navigates to the matching route.
    /// Returns `true` when the URL produced a known route.
    @discardableResult
    func handleDeepLink(_ url: URL) -> Bool {
        guard let route = KelmahRoute(from: url) else { return false }
        navigate(to: route)
        return true
    }
}
