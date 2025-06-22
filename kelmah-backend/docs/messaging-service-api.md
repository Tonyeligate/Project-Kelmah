# Messaging Service API Documentation

The Messaging Service handles real-time messaging, conversations, and notifications between users.

## Base URL

When accessing directly: `http://localhost:3003/api`
When using API Gateway: `http://localhost:5000/api/messages`

## WebSocket Connection

For real-time messaging, connect to the WebSocket endpoint:

```
ws://localhost:5000/ws/messages
```

Authentication is required via a token parameter:

```
ws://localhost:5000/ws/messages?token=your_jwt_token
```

## Message Endpoints

### Create Message

**Endpoint:** `POST /messages`

**Description:** Creates a new message in an existing conversation

**Authentication Required:** Yes

**Request Body:**

```json
{
  "sender": "user_id_1",
  "recipient": "user_id_2",
  "content": "Hello, how are you?",
  "messageType": "text",
  "attachments": [
    {
      "url": "https://example.com/file.pdf",
      "type": "document",
      "name": "document.pdf",
      "size": 1024
    }
  ],
  "relatedJob": "job_id",
  "relatedContract": "contract_id"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": {
      "id": "message_id",
      "sender": "user_id_1",
      "recipient": "user_id_2",
      "content": "Hello, how are you?",
      "messageType": "text",
      "readStatus": {
        "isRead": false,
        "readAt": null
      },
      "attachments": [
        {
          "id": "attachment_id",
          "url": "https://example.com/file.pdf",
          "type": "document",
          "name": "document.pdf",
          "size": 1024
        }
      ],
      "relatedJob": "job_id",
      "relatedContract": "contract_id",
      "createdAt": "2023-10-15T14:30:00Z"
    }
  },
  "message": "Message sent successfully"
}
```

### Get Conversation Messages

**Endpoint:** `GET /messages/conversation/:conversationId`

**Description:** Retrieves messages from a specific conversation

**Authentication Required:** Yes

**URL Parameters:**

- `conversationId`: ID of the conversation to retrieve messages from

**Query Parameters:**

- `page` (optional): The page number, defaults to 1
- `limit` (optional): Number of messages per page, defaults to 20

**Response:**

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "message_id_1",
        "sender": {
          "id": "user_id_1",
          "name": "John Doe",
          "profilePicture": "https://example.com/profile1.jpg"
        },
        "recipient": {
          "id": "user_id_2",
          "name": "Jane Smith",
          "profilePicture": "https://example.com/profile2.jpg"
        },
        "content": "Hello, how are you?",
        "messageType": "text",
        "readStatus": {
          "isRead": true,
          "readAt": "2023-10-15T14:35:00Z"
        },
        "attachments": [],
        "createdAt": "2023-10-15T14:30:00Z"
      },
      {
        "id": "message_id_2",
        "sender": {
          "id": "user_id_2",
          "name": "Jane Smith",
          "profilePicture": "https://example.com/profile2.jpg"
        },
        "recipient": {
          "id": "user_id_1",
          "name": "John Doe",
          "profilePicture": "https://example.com/profile1.jpg"
        },
        "content": "I'm good, thanks for asking!",
        "messageType": "text",
        "readStatus": {
          "isRead": false,
          "readAt": null
        },
        "attachments": [],
        "createdAt": "2023-10-15T14:40:00Z"
      }
    ],
    "totalPages": 1,
    "currentPage": 1
  }
}
```

### Delete Message

**Endpoint:** `DELETE /messages/:messageId`

**Description:** Deletes a specific message

**Authentication Required:** Yes (only the sender can delete their messages)

**URL Parameters:**

- `messageId`: ID of the message to delete

**Response:**

```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

### Get Unread Message Count

**Endpoint:** `GET /messages/unread/count`

**Description:** Gets the count of unread messages for the authenticated user

**Authentication Required:** Yes

**Response:**

```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

## Conversation Endpoints

### Get All Conversations

**Endpoint:** `GET /conversations`

**Description:** Gets all conversations for the current user

**Authentication Required:** Yes

**Query Parameters:**

- `page` (optional): The page number, defaults to 1
- `limit` (optional): Number of conversations per page, defaults to 20
- `sort` (optional): Sort order, values: 'latest', 'oldest', defaults to 'latest'

**Response:**

```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "conversation_id_1",
        "participants": [
          {
            "id": "user_id_1",
            "name": "John Doe",
            "profilePicture": "https://example.com/profile1.jpg"
          },
          {
            "id": "user_id_2",
            "name": "Jane Smith",
            "profilePicture": "https://example.com/profile2.jpg"
          }
        ],
        "lastMessage": {
          "content": "I'm good, thanks for asking!",
          "sender": "user_id_2",
          "createdAt": "2023-10-15T14:40:00Z"
        },
        "unreadCount": 1,
        "relatedJob": "job_id",
        "createdAt": "2023-10-15T14:30:00Z"
      },
      {
        "id": "conversation_id_2",
        "participants": [
          {
            "id": "user_id_1",
            "name": "John Doe",
            "profilePicture": "https://example.com/profile1.jpg"
          },
          {
            "id": "user_id_3",
            "name": "Bob Johnson",
            "profilePicture": "https://example.com/profile3.jpg"
          }
        ],
        "lastMessage": {
          "content": "When can you start the project?",
          "sender": "user_id_3",
          "createdAt": "2023-10-15T13:20:00Z"
        },
        "unreadCount": 2,
        "relatedJob": "job_id_2",
        "createdAt": "2023-10-15T13:00:00Z"
      }
    ],
    "totalPages": 1,
    "currentPage": 1,
    "totalConversations": 2
  }
}
```

### Create Conversation

**Endpoint:** `POST /conversations`

**Description:** Creates a new conversation between users

**Authentication Required:** Yes

**Request Body:**

```json
{
  "recipientId": "user_id_2",
  "initialMessage": "Hello, I'm interested in your services",
  "relatedJob": "job_id"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": "conversation_id",
      "participants": [
        {
          "id": "user_id_1",
          "name": "John Doe",
          "profilePicture": "https://example.com/profile1.jpg"
        },
        {
          "id": "user_id_2",
          "name": "Jane Smith",
          "profilePicture": "https://example.com/profile2.jpg"
        }
      ],
      "lastMessage": {
        "id": "message_id",
        "content": "Hello, I'm interested in your services",
        "sender": "user_id_1",
        "createdAt": "2023-10-15T15:00:00Z"
      },
      "relatedJob": "job_id",
      "createdAt": "2023-10-15T15:00:00Z"
    }
  },
  "message": "Conversation created successfully"
}
```

### Get Conversation

**Endpoint:** `GET /conversations/:conversationId`

**Description:** Gets details of a specific conversation

**Authentication Required:** Yes (user must be a participant)

**URL Parameters:**

- `conversationId`: ID of the conversation to retrieve

**Response:**

```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": "conversation_id",
      "participants": [
        {
          "id": "user_id_1",
          "name": "John Doe",
          "profilePicture": "https://example.com/profile1.jpg"
        },
        {
          "id": "user_id_2",
          "name": "Jane Smith",
          "profilePicture": "https://example.com/profile2.jpg"
        }
      ],
      "relatedJob": "job_id",
      "relatedContract": "contract_id",
      "createdAt": "2023-10-15T15:00:00Z"
    }
  }
}
```

### Mark Conversation as Read

**Endpoint:** `PUT /conversations/:conversationId/read`

**Description:** Marks all messages in a conversation as read for the authenticated user

**Authentication Required:** Yes (user must be a participant)

**URL Parameters:**

- `conversationId`: ID of the conversation to mark as read

**Response:**

```json
{
  "success": true,
  "message": "Conversation marked as read"
}
```

## Notification Endpoints

### Get All Notifications

**Endpoint:** `GET /notifications`

**Description:** Gets notifications for the authenticated user

**Authentication Required:** Yes

**Query Parameters:**

- `page` (optional): The page number, defaults to 1
- `limit` (optional): Number of notifications per page, defaults to 20
- `isRead` (optional): Filter by read status, values: 'true', 'false'

**Response:**

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notification_id_1",
        "type": "message_received",
        "title": "New Message",
        "content": "You have received a new message",
        "isRead": false,
        "actionUrl": "/messages/conversation_id",
        "relatedEntity": {
          "type": "message",
          "id": "message_id"
        },
        "createdAt": "2023-10-15T14:40:00Z"
      },
      {
        "id": "notification_id_2",
        "type": "job_application",
        "title": "New Job Application",
        "content": "Someone applied to your job posting",
        "isRead": true,
        "actionUrl": "/jobs/job_id/applications",
        "relatedEntity": {
          "type": "application",
          "id": "application_id"
        },
        "createdAt": "2023-10-15T12:30:00Z"
      }
    ],
    "totalPages": 1,
    "currentPage": 1,
    "totalNotifications": 2,
    "unreadCount": 1
  }
}
```

### Mark Notification as Read

**Endpoint:** `PUT /notifications/:notificationId/read`

**Description:** Marks a notification as read

**Authentication Required:** Yes (only for notification recipient)

**URL Parameters:**

- `notificationId`: ID of the notification to mark as read

**Response:**

```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### Mark All Notifications as Read

**Endpoint:** `PUT /notifications/read-all`

**Description:** Marks all notifications for the authenticated user as read

**Authentication Required:** Yes

**Response:**

```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

### Delete Notification

**Endpoint:** `DELETE /notifications/:notificationId`

**Description:** Deletes a specific notification

**Authentication Required:** Yes (only for notification recipient)

**URL Parameters:**

- `notificationId`: ID of the notification to delete

**Response:**

```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

## Attachment Endpoints

### Upload Attachment

**Endpoint:** `POST /conversations/:conversationId/attachments`

**Description:** Uploads a file attachment for a message

**Authentication Required:** Yes

**URL Parameters:**

- `conversationId`: ID of the conversation to attach the file to

**Request Body:**

Form data with a 'file' field containing the file to upload

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "attachment_id",
    "url": "https://storage.example.com/files/filename.pdf",
    "filename": "document.pdf",
    "contentType": "application/pdf",
    "size": 1024
  },
  "message": "File uploaded successfully"
}
```

## WebSocket Events

The messaging service provides real-time functionality through WebSockets. Here are the events you can listen for and emit:

### Client Events (to emit)

- `join-conversation`: Join a conversation room to receive real-time messages
  ```json
  {
    "conversationId": "conversation_id"
  }
  ```

- `leave-conversation`: Leave a conversation room
  ```json
  {
    "conversationId": "conversation_id"
  }
  ```

- `send-message`: Send a message to a conversation
  ```json
  {
    "conversationId": "conversation_id",
    "content": "Hello, how are you?",
    "messageType": "text",
    "attachments": [
      {
        "id": "attachment_id",
        "url": "https://example.com/file.pdf",
        "type": "document",
        "name": "document.pdf",
        "size": 1024
      }
    ]
  }
  ```

- `typing-start`: Indicate that the user has started typing
  ```json
  {
    "conversationId": "conversation_id"
  }
  ```

- `typing-end`: Indicate that the user has stopped typing
  ```json
  {
    "conversationId": "conversation_id"
  }
  ```

### Server Events (to listen for)

- `message`: Received when a new message is sent to a conversation you're in
  ```json
  {
    "id": "message_id",
    "sender": {
      "id": "user_id",
      "name": "John Doe",
      "profilePicture": "https://example.com/profile.jpg"
    },
    "content": "Hello, how are you?",
    "messageType": "text",
    "conversationId": "conversation_id",
    "attachments": [],
    "createdAt": "2023-10-15T14:30:00Z"
  }
  ```

- `typing`: Received when a user starts typing in a conversation
  ```json
  {
    "userId": "user_id",
    "userName": "John Doe",
    "conversationId": "conversation_id"
  }
  ```

- `typing-stopped`: Received when a user stops typing in a conversation
  ```json
  {
    "userId": "user_id",
    "conversationId": "conversation_id"
  }
  ```

- `notification`: Received when a new notification is created for you
  ```json
  {
    "id": "notification_id",
    "type": "message_received",
    "title": "New Message",
    "content": "You have received a new message",
    "actionUrl": "/messages/conversation_id"
  }
  