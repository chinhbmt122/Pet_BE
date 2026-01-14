# System Configuration & Persistent Day-Off Feature

## Overview

This feature adds a flexible system configuration module that allows managers to configure system-wide settings, including **persistent day-off rules**. The primary use case is to prevent managers from creating employee work schedules on specific days of the week (e.g., Sundays).

## Features

### 1. System Configuration Entity

- Store any system-wide configuration as key-value pairs
- Values stored as JSON strings for flexibility
- Configurable active/inactive status
- Timestamped for audit tracking

### 2. Persistent Day-Off Rules

- Define recurring days off by day of week (0=Sunday, 6=Saturday)
- Prevents schedule creation on configured days
- Configurable via API endpoints
- Provides clear error messages when validation fails

## Database Schema

### `system_configs` Table

| Column      | Type                | Description                |
| ----------- | ------------------- | -------------------------- |
| configId    | INTEGER (PK)        | Unique identifier          |
| configKey   | VARCHAR(100) UNIQUE | Configuration key          |
| configValue | TEXT                | JSON string value          |
| description | TEXT                | Human-readable description |
| isActive    | BOOLEAN             | Whether config is active   |
| createdAt   | TIMESTAMP           | Creation timestamp         |
| updatedAt   | TIMESTAMP           | Last update timestamp      |

## API Endpoints

### Authentication

All endpoints require JWT authentication with appropriate role permissions.

### 1. Create Configuration

**POST** `/system-config`

- **Role:** MANAGER only
- **Body:**

```json
{
  "configKey": "persistent_days_off",
  "configValue": "[0]",
  "description": "Days of the week that are always off (0=Sunday, 6=Saturday)",
  "isActive": true
}
```

### 2. Get All Configurations

**GET** `/system-config`

- **Role:** MANAGER, RECEPTIONIST

### 3. Get Configuration by Key

**GET** `/system-config/key/:key`

- **Role:** MANAGER, RECEPTIONIST
- **Example:** `/system-config/key/persistent_days_off`

### 4. Get Persistent Days Off

**GET** `/system-config/persistent-days-off`

- **Role:** MANAGER, RECEPTIONIST, VET, CARE_STAFF
- **Response:** Array of day numbers

```json
[0, 6]
```

### 5. Set Persistent Days Off

**PUT** `/system-config/persistent-days-off`

- **Role:** MANAGER only
- **Body:**

```json
{
  "daysOff": [0]
}
```

- **Days of Week:**
  - 0 = Sunday
  - 1 = Monday
  - 2 = Tuesday
  - 3 = Wednesday
  - 4 = Thursday
  - 5 = Friday
  - 6 = Saturday

### 6. Update Configuration

**PUT** `/system-config/:id`

- **Role:** MANAGER only
- **Body:** Same as create (partial updates supported)

### 7. Delete Configuration

**DELETE** `/system-config/:id`

- **Role:** MANAGER only

## Usage Examples

### Example 1: Set Sunday as Persistent Day Off

```bash
curl -X PUT http://localhost:3000/system-config/persistent-days-off \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"daysOff": [0]}'
```

### Example 2: Set Weekend (Saturday and Sunday) as Persistent Days Off

```bash
curl -X PUT http://localhost:3000/system-config/persistent-days-off \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"daysOff": [0, 6]}'
```

### Example 3: Try to Create Schedule on Sunday (will fail)

```bash
curl -X POST http://localhost:3000/schedules \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": 1,
    "workDate": "2026-01-18",
    "startTime": "09:00",
    "endTime": "17:00"
  }'
```

**Error Response:**

```json
{
  "statusCode": 400,
  "message": "Cannot create schedule on 2026-01-18 (Sunday): This day is configured as a persistent day off",
  "error": "Bad Request"
}
```

## How It Works

### Schedule Creation Flow

1. Manager attempts to create a work schedule for an employee
2. **ScheduleService** checks if the work date falls on a persistent day off
3. If it does, the request is rejected with a clear error message
4. If not, the schedule creation proceeds as normal

### Code Integration

The `ScheduleService` now includes a check for persistent day-offs:

```typescript
// Check if the work date falls on a persistent day off
const workDate = new Date(dto.workDate);
const isPersistentDayOff =
  await this.systemConfigService.isPersistentDayOff(workDate);

if (isPersistentDayOff) {
  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const dayName = dayNames[workDate.getDay()];
  I18nException.badRequest('errors.validation.persistentDayOff', {
    date: dto.workDate,
    day: dayName,
  });
}
```

## Configuration Examples

### Use Case 1: No Work on Sundays

```json
{
  "configKey": "persistent_days_off",
  "configValue": "[0]",
  "description": "Clinic closed on Sundays"
}
```

### Use Case 2: Weekend Closure

```json
{
  "configKey": "persistent_days_off",
  "configValue": "[0, 6]",
  "description": "Clinic closed on weekends"
}
```

### Use Case 3: Mid-week Closure

```json
{
  "configKey": "persistent_days_off",
  "configValue": "[3]",
  "description": "Clinic closed on Wednesdays for staff training"
}
```

## Error Messages

### English

- **Not Found:** "Configuration not found"
- **Conflict:** "Configuration with key 'persistent_days_off' already exists"
- **Validation:** "Cannot create schedule on {date} ({day}): This day is configured as a persistent day off"
- **Invalid JSON:** "Invalid JSON format for configValue"
- **Invalid Days:** "Day numbers must be between 0-6"

### Vietnamese

- **Not Found:** "Không tìm thấy cấu hình"
- **Conflict:** "Cấu hình với khóa 'persistent_days_off' đã tồn tại"
- **Validation:** "Không thể tạo lịch làm việc vào {date} ({day}): Ngày này được cấu hình là ngày nghỉ cố định"
- **Invalid JSON:** "Định dạng JSON không hợp lệ cho configValue"
- **Invalid Days:** "Số ngày phải nằm trong khoảng 0-6"

## Service Methods

### SystemConfigService

#### `isPersistentDayOff(date: Date): Promise<boolean>`

Checks if a given date falls on a persistent day off.

#### `getPersistentDaysOff(): Promise<number[]>`

Returns the array of day numbers configured as persistent days off.

#### `setPersistentDaysOff(daysOff: number[]): Promise<SystemConfigResponseDto>`

Sets the persistent days off configuration (creates or updates).

#### `createConfig(dto: CreateSystemConfigDto): Promise<SystemConfigResponseDto>`

Creates a new system configuration.

#### `updateConfig(id: number, dto: UpdateSystemConfigDto): Promise<SystemConfigResponseDto>`

Updates an existing configuration.

#### `deleteConfig(id: number): Promise<void>`

Deletes a configuration.

## Testing Scenarios

### Scenario 1: Configure Sunday as Day Off

1. Use PUT endpoint to set `daysOff: [0]`
2. Try to create a schedule for a Sunday
3. Verify error message is returned
4. Try to create a schedule for a Monday
5. Verify schedule is created successfully

### Scenario 2: Change Configuration

1. Set `daysOff: [0]` (Sunday only)
2. Update to `daysOff: [0, 6]` (weekend)
3. Verify both Saturday and Sunday schedules are now blocked

### Scenario 3: Disable Configuration

1. Set a persistent day off configuration
2. Update `isActive: false` via PUT endpoint
3. Verify schedules can now be created on previously blocked days

## Future Enhancements

Potential extensions to this feature:

1. **Specific Date Overrides**: Allow temporary overrides for specific dates
2. **Department-Specific Rules**: Different day-off rules per department
3. **Holiday Integration**: Integrate with the existing `day_offs` table
4. **Business Hours Config**: Store operating hours in system config
5. **Notification Settings**: Configure email/SMS notification preferences
6. **Booking Rules**: Configure advance booking limits, cancellation policies, etc.

## Migration Notes

This feature requires:

1. Creating the `system_configs` table via TypeORM migration
2. No changes to existing tables
3. Optional: Seed initial configuration for persistent days off

### Example Seed Data

```sql
INSERT INTO system_configs (configKey, configValue, description, isActive, createdAt, updatedAt)
VALUES ('persistent_days_off', '[0]', 'Days of the week that are always off (0=Sunday, 6=Saturday)', true, NOW(), NOW());
```

## Related Files

### Entities

- `src/entities/system-config.entity.ts`

### Services

- `src/services/system-config.service.ts`
- `src/services/schedule.service.ts` (updated)

### Controllers

- `src/controllers/system-config.controller.ts`

### Modules

- `src/modules/system-config.module.ts`
- `src/modules/schedule.module.ts` (updated)

### DTOs

- `src/dto/config/create-system-config.dto.ts`
- `src/dto/config/update-system-config.dto.ts`
- `src/dto/config/system-config-response.dto.ts`

### i18n

- `src/i18n/en/errors.json` (updated)
- `src/i18n/vi/errors.json` (updated)
- `src/i18n/en/validation.json` (updated)
- `src/i18n/vi/validation.json` (updated)

## Support

For questions or issues with this feature, please contact the development team or create an issue in the project repository.
