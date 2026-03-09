import XCTest
@testable import Kelmah

final class NotificationOrderingTests: XCTestCase {
    func testSortNotificationsByCreatedAtOrdersNewestFirst() {
        let notifications = [
            AppNotificationItem(id: "older", type: "system_alert", title: "Older", content: "", actionURL: nil, priority: "medium", isRead: false, createdAt: "2026-03-09T09:15:00Z", relatedEntityType: nil, relatedEntityId: nil),
            AppNotificationItem(id: "newest", type: "system_alert", title: "Newest", content: "", actionURL: nil, priority: "medium", isRead: false, createdAt: "2026-03-09T11:15:00Z", relatedEntityType: nil, relatedEntityId: nil),
            AppNotificationItem(id: "middle", type: "system_alert", title: "Middle", content: "", actionURL: nil, priority: "medium", isRead: false, createdAt: "2026-03-09T10:15:00Z", relatedEntityType: nil, relatedEntityId: nil),
        ]

        XCTAssertEqual(sortNotificationsByCreatedAt(notifications).map(\.id), ["newest", "middle", "older"])
    }

    func testSortNotificationsByCreatedAtPlacesUndatedItemsLast() {
        let notifications = [
            AppNotificationItem(id: "undated", type: "system_alert", title: "Undated", content: "", actionURL: nil, priority: "medium", isRead: false, createdAt: nil, relatedEntityType: nil, relatedEntityId: nil),
            AppNotificationItem(id: "dated", type: "system_alert", title: "Dated", content: "", actionURL: nil, priority: "medium", isRead: false, createdAt: "2026-03-09T10:15:00Z", relatedEntityType: nil, relatedEntityId: nil),
            AppNotificationItem(id: "invalid", type: "system_alert", title: "Invalid", content: "", actionURL: nil, priority: "medium", isRead: false, createdAt: "not-a-date", relatedEntityType: nil, relatedEntityId: nil),
        ]

        XCTAssertEqual(sortNotificationsByCreatedAt(notifications).map(\.id), ["dated", "undated", "invalid"])
    }
}