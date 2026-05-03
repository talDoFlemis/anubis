---
name: shadcn-tanstack-forms
description: Build accessible, validated React forms using TanStack Form and Zod with shadcn/ui components. Use this skill whenever the user wants to create forms with React, needs form validation, asks about TanStack Form, wants to use shadcn form components (Field, FieldLabel, FieldError, FieldGroup, FieldSet), needs Zod schema validation, or is building any kind of input form with fields like text inputs, textareas, selects, checkboxes, radio groups, switches, or array fields. Also trigger for questions about form error display, form reset, validation modes (onChange/onBlur/onSubmit), or accessible form patterns. Don't wait for the user to explicitly say "TanStack Form" — if they say "build me a form in React" or "add validation to my form", this skill applies.
---

# shadcn + TanStack Form Skill

Build accessible, type-safe React forms using **TanStack Form** for state management, **Zod** for schema validation, and **shadcn/ui** `<Field />` components for accessible markup.

## Core Workflow

1. Define a Zod schema for the form shape and validation rules
2. Initialize the form with `useForm` from `@tanstack/react-form`
3. Build fields using `form.Field` with render props + shadcn `<Field />` components
4. Handle errors using `<FieldError />` with `data-invalid` / `aria-invalid` props

---

## 1. Installation

```bash
npm install @tanstack/react-form zod
```

---

## 2. Schema Definition

```tsx
import * as z from 'zod';

const formSchema = z.object({
  title: z
    .string()
    .min(5, 'Must be at least 5 characters.')
    .max(32, 'Must be at most 32 characters.'),
  description: z
    .string()
    .min(20, 'Must be at least 20 characters.')
    .max(100, 'Max 100 characters.'),
});
```

---

## 3. Form Setup (`useForm`)

```tsx
import { useForm } from '@tanstack/react-form';

const form = useForm({
  defaultValues: { title: '', description: '' },
  validators: {
    onSubmit: formSchema, // validate on submit
    onChange: formSchema, // optional: validate on every change
    onBlur: formSchema, // optional: validate on blur
  },
  onSubmit: async ({ value }) => {
    // handle validated data
  },
});
```

**Validation modes:**

| Mode       | When                        |
| ---------- | --------------------------- |
| `onSubmit` | Only when form is submitted |
| `onChange` | On every keystroke          |
| `onBlur`   | When field loses focus      |

---

## 4. Basic Form Anatomy

```tsx
<form
  onSubmit={e => {
    e.preventDefault();
    form.handleSubmit();
  }}
>
  <FieldGroup>
    <form.Field
      name="title"
      children={field => {
        const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
        return (
          <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>Title</FieldLabel>
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={e => field.handleChange(e.target.value)}
              aria-invalid={isInvalid}
            />
            <FieldDescription>Helper text here.</FieldDescription>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }}
    />
  </FieldGroup>
  <Button type="submit">Submit</Button>
</form>
```

**Key pattern for error display:**

- `data-invalid={isInvalid}` on `<Field />` — enables error styling
- `aria-invalid={isInvalid}` on the input control — accessibility
- `{isInvalid && <FieldError errors={field.state.meta.errors} />}` — renders error messages
- `isInvalid = field.state.meta.isTouched && !field.state.meta.isValid` — only show after user interaction

---

## 5. Field Type Reference

See `references/field-types.md` for complete code patterns for each field type. Summary:

| Field Type       | Key Props                                     | Notes                                                |
| ---------------- | --------------------------------------------- | ---------------------------------------------------- |
| `Input`          | `value`, `onChange`, `onBlur`, `aria-invalid` | Standard text input                                  |
| `Textarea`       | `value`, `onChange`, `onBlur`, `aria-invalid` | Multi-line text                                      |
| `Select`         | `value`, `onValueChange` on `<Select />`      | `aria-invalid` on `<SelectTrigger />`                |
| `Checkbox`       | `checked`, `onCheckedChange`                  | `aria-invalid` on `<Checkbox />`                     |
| `Checkbox array` | `mode="array"`, `pushValue`, `removeValue`    | Add `data-slot="checkbox-group"` to `<FieldGroup />` |
| `RadioGroup`     | `value`, `onValueChange` on `<RadioGroup />`  | `aria-invalid` on `<RadioGroupItem />`               |
| `Switch`         | `checked`, `onCheckedChange`                  | `aria-invalid` on `<Switch />`                       |

---

## 6. Array Fields

For dynamic lists of items (e.g. multiple emails):

```tsx
// Schema
const formSchema = z.object({
  emails: z
    .array(z.object({ address: z.string().email() }))
    .min(1)
    .max(5),
});

// Field with mode="array"
<form.Field
  name="emails"
  mode="array"
  children={field => (
    <FieldSet>
      <FieldLegend variant="label">Email Addresses</FieldLegend>
      <FieldGroup>
        {field.state.value.map((_, index) => (
          <form.Field
            key={index}
            name={`emails[${index}].address`}
            children={subField => {
              const isSubFieldInvalid =
                subField.state.meta.isTouched && !subField.state.meta.isValid;
              return (
                <Field data-invalid={isSubFieldInvalid}>
                  <Input
                    value={subField.state.value}
                    onBlur={subField.handleBlur}
                    onChange={e => subField.handleChange(e.target.value)}
                    aria-invalid={isSubFieldInvalid}
                  />
                  {isSubFieldInvalid && <FieldError errors={subField.state.meta.errors} />}
                </Field>
              );
            }}
          />
        ))}
      </FieldGroup>
      <Button
        type="button"
        onClick={() => field.pushValue({ address: '' })}
        disabled={field.state.value.length >= 5}
      >
        Add Email
      </Button>
    </FieldSet>
  )}
/>;
```

Array helpers: `field.pushValue(item)`, `field.removeValue(index)`

---

## 7. Form Reset

```tsx
<Button type="button" variant="outline" onClick={() => form.reset()}>
  Reset
</Button>
```

---

## 8. Common Mistakes to Avoid

- ❌ Forgetting `data-invalid` on `<Field />` (breaks error styling)
- ❌ Forgetting `aria-invalid` on the input (breaks accessibility)
- ❌ Using `isValid` alone without `isTouched` (shows errors before user touches field)
- ❌ For checkboxes: forgetting `data-slot="checkbox-group"` on `<FieldGroup />` in arrays
- ❌ For selects: putting `aria-invalid` on `<Select />` instead of `<SelectTrigger />`
- ❌ Not calling `e.preventDefault()` before `form.handleSubmit()`
