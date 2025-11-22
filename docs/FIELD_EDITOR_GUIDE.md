# Field Editor Component - Complete Guide

## Overview

The **FieldEditor** component is a comprehensive, feature-rich form field configuration tool that allows users to create and customize various types of form fields with advanced settings.

## File Location

```
src/components/form-builder/FieldEditor.tsx
```

## Features

### 1. **Supported Field Types**
- Text Input
- Text Area
- Number
- Email
- Phone
- Date
- Date & Time
- Time
- Radio Buttons
- Checkboxes
- Dropdown
- Select
- File Upload
- Signature
- Location

### 2. **Basic Field Properties**
All fields support the following basic properties:
- **Field ID**: Unique identifier for the field
- **Label**: Display label shown to users
- **Placeholder**: Placeholder text for input fields
- **Hint Text**: Help text displayed below the field
- **Required**: Mark field as mandatory

### 3. **Field-Specific Settings**

#### Text & Textarea Fields
- Rows (textarea only)
- Max Length
- Min/Max Length validation
- Pattern validation (regex)

#### Number Fields
- Min Value
- Max Value
- Step
- Prefix (e.g., "$", "₹")
- Suffix (e.g., "kg", "L", "%")

#### File Upload Fields
- Accepted file types
- Maximum number of files
- Maximum file size (MB)
- Allow multiple files option

#### Select-Type Fields (Dropdown, Radio, Checkbox, Select)
- **Static Options**: Manually defined label-value pairs
- **API-Driven Options**: 
  - API Endpoint URL
  - Display Field (which field to show)
  - Value Field (which field to store)

### 4. **Advanced Features**

#### Validation Rules
- Min/Max Length (text fields)
- Min/Max Value (number fields)
- Min/Max Date (date fields)
- Custom regex patterns
- Custom error messages

#### Conditional Visibility
Fields can be shown/hidden based on other field values:
- **Trigger Field**: The field to watch
- **Operator**: equals, not_equals, contains, greater_than, less_than
- **Value**: Comparison value

#### Default Values
Set default values for fields

### 5. **Live Preview**
Real-time preview of how the field will appear to end users, including:
- All field types rendered accurately
- Placeholder text
- Hint text
- Required indicators
- Prefix/suffix for number fields
- Options for select-type fields

## Component Interface

```typescript
interface FieldEditorProps {
  field: FormField;
  onUpdate: (field: FormField) => void;
  onDelete: () => void;
}
```

## Usage Example

```tsx
import FieldEditor from '~/components/form-builder/FieldEditor';

<FieldEditor
  field={currentField}
  onUpdate={(updatedField) => updateField(stepIndex, fieldIndex, updatedField)}
  onDelete={() => deleteField(stepIndex, fieldIndex)}
/>
```

## UI/UX Features

### Collapsible Interface
- Fields are shown in a collapsed state by default
- Click to expand and edit detailed settings
- Shows field label, type, and ID in collapsed view
- Visual indicator for required fields

### Organized Sections
1. **Basic Settings** - Core field properties
2. **Type-Specific Settings** - Settings relevant to the field type
3. **Options Editor** - For select-type fields
4. **Advanced Settings** - Validation rules and default values (collapsible)
5. **Conditional Visibility** - Visibility rules (collapsible)
6. **Preview** - Live preview of the field

### Visual Design
- Clean, modern interface with proper spacing
- Color-coded sections (blue for API settings, gray for regular settings)
- Responsive grid layout
- Clear visual hierarchy
- Hover states and focus indicators

## Field Type Configurations

### Text Input
```json
{
  "id": "full_name",
  "type": "text",
  "label": "Full Name",
  "placeholder": "Enter your full name",
  "required": true,
  "validation": {
    "minLength": 3,
    "maxLength": 50,
    "pattern": "^[A-Za-z ]+$",
    "message": "Name must contain only letters"
  }
}
```

### Number Field
```json
{
  "id": "quantity",
  "type": "number",
  "label": "Quantity",
  "min": 1,
  "max": 100,
  "step": 1,
  "suffix": "units",
  "required": true
}
```

### Dropdown (Static)
```json
{
  "id": "department",
  "type": "dropdown",
  "label": "Department",
  "dataSource": "static",
  "options": [
    { "label": "Engineering", "value": "eng" },
    { "label": "Sales", "value": "sales" },
    { "label": "HR", "value": "hr" }
  ],
  "required": true
}
```

### Dropdown (API-Driven)
```json
{
  "id": "city",
  "type": "dropdown",
  "label": "City",
  "dataSource": "api",
  "apiEndpoint": "/api/cities",
  "displayField": "name",
  "valueField": "id",
  "required": true
}
```

### File Upload
```json
{
  "id": "documents",
  "type": "file_upload",
  "label": "Upload Documents",
  "accept": ".pdf,.docx,.jpg,.png",
  "maxFiles": 5,
  "maxSizePerFile": 10,
  "multiple": true,
  "required": false
}
```

### Conditional Field
```json
{
  "id": "other_reason",
  "type": "textarea",
  "label": "Please specify",
  "visible": {
    "field": "reason",
    "operator": "equals",
    "value": "other"
  }
}
```

## Integration with FormBuilder

The FieldEditor is integrated into the FormBuilder component:

```tsx
// In FormBuilder.tsx
import FieldEditor from './FieldEditor';

// Inside the Steps & Fields tab
<FieldEditor
  key={field.id}
  field={field}
  onUpdate={(updatedField) => updateField(currentStepIndex.value, fieldIndex, updatedField)}
  onDelete={() => deleteField(currentStepIndex.value, fieldIndex)}
/>
```

## Best Practices

### 1. Field ID Naming
- Use lowercase with underscores: `first_name`, `email_address`
- Make IDs descriptive and unique
- Avoid spaces and special characters

### 2. Validation
- Always provide custom error messages
- Use appropriate validation based on field type
- Test regex patterns before deployment

### 3. Options Management
- Keep option labels user-friendly
- Use meaningful values for backend processing
- Consider API-driven options for dynamic data

### 4. Conditional Visibility
- Don't create circular dependencies
- Keep conditions simple and testable
- Document complex visibility rules

### 5. User Experience
- Provide helpful hint text
- Use appropriate placeholders
- Mark required fields clearly
- Group related fields together

## Accessibility

The FieldEditor implements several accessibility features:
- Proper label associations
- Keyboard navigation support
- Focus indicators
- Semantic HTML structure
- ARIA attributes where needed

## Performance Considerations

- Uses Qwik's reactive system efficiently
- Only re-renders changed fields
- Lazy loads advanced settings sections
- Optimized event handlers with `$()`

## Future Enhancements

Potential improvements for future versions:
- Field templates for common patterns
- Bulk field operations
- Field dependency graph visualization
- Custom field type plugins
- Validation preview/testing
- Internationalization support
- Field duplication feature
- Import/export individual fields

## Troubleshooting

### Common Issues

**Issue**: Options not saving
- **Solution**: Ensure you're clicking outside the input or pressing Enter

**Issue**: Conditional visibility not working
- **Solution**: Verify the trigger field ID exists and values match exactly

**Issue**: Validation pattern not working
- **Solution**: Test your regex pattern in a validator tool first

**Issue**: API endpoint not loading options
- **Solution**: Check endpoint returns array of objects with correct field names

## Summary

The FieldEditor component provides a comprehensive, user-friendly interface for creating and configuring form fields with:
- ✅ 15 different field types
- ✅ Type-specific configurations
- ✅ Advanced validation rules
- ✅ Conditional visibility
- ✅ Static and API-driven options
- ✅ Live preview
- ✅ Clean, intuitive UI
- ✅ Full TypeScript support

This component is production-ready and provides all the features needed for building complex, dynamic forms.
