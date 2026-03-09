import XCTest
@testable import Kelmah

final class NotificationOrderingTests: XCTestCase {
    func testSortNotificationsByCreatedAtOrdersNewestFirst() {
        let notifications = [
            AppNotificationItem(id: "older", type: "system_alert", title: "Older", content: "", actionURL: nil, priority: "medium", isRead: false, createdAt: "2026-03-09T09:15:00Z", updatedAt: nil, relatedEntityType: nil, relatedEntityId: nil),
            AppNotificationItem(id: "newest", type: "system_alert", title: "Newest", content: "", actionURL: nil, priority: "medium", isRead: false, createdAt: "2026-03-09T11:15:00Z", updatedAt: nil, relatedEntityType: nil, relatedEntityId: nil),
            AppNotificationItem(id: "middle", type: "system_alert", title: "Middle", content: "", actionURL: nil, priority: "medium", isRead: false, createdAt: "2026-03-09T10:15:00Z", updatedAt: nil, relatedEntityType: nil, relatedEntityId: nil),
        ]

        XCTAssertEqual(sortNotificationsByCreatedAt(notifications).map(\.id), ["newest", "middle", "older"])
    }

    func testSortNotificationsByCreatedAtPlacesUndatedItemsLast() {
        let notifications = [
            AppNotificationItem(id: "undated", type: "system_alert", title: "Undated", content: "", actionURL: nil, priority: "medium", isRead: false, createdAt: nil, updatedAt: nil, relatedEntityType: nil, relatedEntityId: nil),
            AppNotificationItem(id: "dated", type: "system_alert", title: "Dated", content: "", actionURL: nil, priority: "medium", isRead: false, createdAt: "2026-03-09T10:15:00Z", updatedAt: nil, relatedEntityType: nil, relatedEntityId: nil),
            AppNotificationItem(id: "invalid", type: "system_alert", title: "Invalid", content: "", actionURL: nil, priority: "medium", isRead: false, createdAt: "not-a-date", updatedAt: "2026-03-09T09:15:00Z", relatedEntityType: nil, relatedEntityId: nil),
        ]

        XCTAssertEqual(sortNotificationsByCreatedAt(notifications).map(\.id), ["dated", "undated", "invalid"])
    }

    func testActionTargetParsesConversationIdFromPath() {
        let notification = AppNotificationItem(
            id: "notification-1",
            type: "message_received",
            title: "Message",
            content: "",
            actionURL: "/messages/69aa0b13e0a41572beebe499",
            priority: "medium",
            isRead: false,
            createdAt: nil,
            updatedAt: nil,
            relatedEntityType: nil,
            relatedEntityId: nil
        )

        XCTAssertEqual(notification.actionTarget, .conversation("69aa0b13e0a41572beebe499"))
    }
}