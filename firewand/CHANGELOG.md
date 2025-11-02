# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.8] - 2025-01-23

### Fixed
- Invoice queries now correctly fetch from both `customers/{uid}/invoices` and `customers/{uid}/subscriptions/*/invoices` paths
- Removed dependency on non-existent `uid` field in stored invoice documents
- `getCurrentUserInvoices` now queries both customer-level and subscription-level invoices separately and merges results
- `onCurrentUserInvoiceUpdate` now sets up dual listeners to monitor both invoice paths
- Properly filters collectionGroup results by document path to match security rules

## [0.6.7] - 2025-01-23

### Fixed
- Invoice queries now properly filter by `uid` field instead of `customer` field to match Firestore security rules `customers/{uid}/invoices/{document=**}`
- Corrected collectionGroup queries to access invoices from the correct customer path

## [0.6.6] - 2025-01-23

### Fixed
- Export invoice functions (`getCurrentUserInvoice`, `getCurrentUserInvoices`, `onCurrentUserInvoiceUpdate`) from main entry points (`index.ts`, `web.ts`, `native.ts`)

## [0.6.5] - 2025-01-23

### Fixed
- Code formatting consistency in invoice.ts (indentation standardized to 4 spaces)

## [0.6.4] - 2025-01-23

### Added
- Invoice retrieval functions for accessing customer and subscription invoices
  - `getCurrentUserInvoice(payments, invoiceId, subscriptionId?)` - Get a single invoice by ID
  - `getCurrentUserInvoices(payments, options?)` - Get all invoices with optional filtering by status and subscription
  - `onCurrentUserInvoiceUpdate(payments, onUpdate, onError?, subscriptionId?)` - Real-time invoice updates listener
- Support for querying both customer-level and subscription-level invoices
- Invoice filtering by status (`draft`, `open`, `paid`, `uncollectible`, `void`)
- Invoice filtering by subscription ID

### Technical Details
- Invoice functions follow the same pattern as existing payment functions
- Uses Firestore `collectionGroup` queries to search across all invoice subcollections
- Supports both `customers/{uid}/invoices/{invoiceId}` and `customers/{uid}/subscriptions/{subId}/invoices/{invoiceId}` paths

## [0.6.3] - Previous Release

### Fixed
- User authentication error handling in `getCurrentUser()`
- Type definitions for Firebase Auth integration

## Previous Versions

See Git history for earlier version details.
