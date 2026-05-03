# Field Type Patterns — shadcn + TanStack Form

Complete code patterns for each supported field type.

---

## Input

```tsx
<form.Field
  name="username"
  children={field => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor={field.name}>Username</FieldLabel>
        <Input
          id={field.name}
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={e => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
          placeholder="shadcn"
          autoComplete="username"
        />
        <FieldDescription>Your public display name.</FieldDescription>
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    );
  }}
/>
```

---

## Textarea

```tsx
<form.Field
  name="about"
  children={field => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor={field.name}>About</FieldLabel>
        <Textarea
          id={field.name}
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={e => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
          placeholder="Tell us about yourself..."
          className="min-h-[120px]"
        />
        <FieldDescription>Will be used to personalize your experience.</FieldDescription>
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    );
  }}
/>
```

---

## Select

> ⚠️ Put `aria-invalid` on `<SelectTrigger />`, not on `<Select />`.

```tsx
<form.Field
  name="language"
  children={field => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
    return (
      <Field orientation="responsive" data-invalid={isInvalid}>
        <FieldContent>
          <FieldLabel htmlFor={field.name}>Spoken Language</FieldLabel>
          <FieldDescription>Select the language you speak.</FieldDescription>
          {isInvalid && <FieldError errors={field.state.meta.errors} />}
        </FieldContent>
        <Select name={field.name} value={field.state.value} onValueChange={field.handleChange}>
          <SelectTrigger id={field.name} aria-invalid={isInvalid} className="min-w-[120px]">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent position="item-aligned">
            <SelectItem value="auto">Auto</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="fr">French</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    );
  }}
/>
```

---

## Checkbox (single)

```tsx
<form.Field
  name="terms"
  children={field => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
    return (
      <Field orientation="horizontal" data-invalid={isInvalid}>
        <Checkbox
          id={field.name}
          name={field.name}
          aria-invalid={isInvalid}
          checked={field.state.value}
          onCheckedChange={field.handleChange}
        />
        <FieldLabel htmlFor={field.name}>I accept the terms and conditions</FieldLabel>
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    );
  }}
/>
```

---

## Checkbox Array

> ⚠️ Add `data-slot="checkbox-group"` to `<FieldGroup />` for proper spacing.
> Use `mode="array"` on `<form.Field />`.

```tsx
<form.Field
  name="tasks"
  mode="array"
  children={field => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
    return (
      <FieldSet>
        <FieldLegend variant="label">Tasks</FieldLegend>
        <FieldDescription>Select tasks you want to receive updates for.</FieldDescription>
        <FieldGroup data-slot="checkbox-group">
          {tasks.map(task => (
            <Field key={task.id} orientation="horizontal" data-invalid={isInvalid}>
              <Checkbox
                id={`task-${task.id}`}
                name={field.name}
                aria-invalid={isInvalid}
                checked={field.state.value.includes(task.id)}
                onCheckedChange={checked => {
                  if (checked) {
                    field.pushValue(task.id);
                  } else {
                    const index = field.state.value.indexOf(task.id);
                    if (index > -1) field.removeValue(index);
                  }
                }}
              />
              <FieldLabel htmlFor={`task-${task.id}`} className="font-normal">
                {task.label}
              </FieldLabel>
            </Field>
          ))}
        </FieldGroup>
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </FieldSet>
    );
  }}
/>
```

---

## Radio Group

> ⚠️ Put `aria-invalid` on each `<RadioGroupItem />`.

```tsx
<form.Field
  name="plan"
  children={field => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
    return (
      <FieldSet>
        <FieldLegend>Plan</FieldLegend>
        <FieldDescription>You can upgrade or downgrade at any time.</FieldDescription>
        <RadioGroup name={field.name} value={field.state.value} onValueChange={field.handleChange}>
          {plans.map(plan => (
            <FieldLabel key={plan.id} htmlFor={`plan-${plan.id}`}>
              <Field orientation="horizontal" data-invalid={isInvalid}>
                <FieldContent>
                  <FieldTitle>{plan.title}</FieldTitle>
                  <FieldDescription>{plan.description}</FieldDescription>
                </FieldContent>
                <RadioGroupItem value={plan.id} id={`plan-${plan.id}`} aria-invalid={isInvalid} />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </FieldSet>
    );
  }}
/>
```

---

## Switch

```tsx
<form.Field
  name="twoFactor"
  children={field => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
    return (
      <Field orientation="horizontal" data-invalid={isInvalid}>
        <FieldContent>
          <FieldLabel htmlFor={field.name}>Multi-factor authentication</FieldLabel>
          <FieldDescription>Enable MFA to secure your account.</FieldDescription>
          {isInvalid && <FieldError errors={field.state.meta.errors} />}
        </FieldContent>
        <Switch
          id={field.name}
          name={field.name}
          checked={field.state.value}
          onCheckedChange={field.handleChange}
          aria-invalid={isInvalid}
        />
      </Field>
    );
  }}
/>
```

---

## Array Fields (dynamic list)

```tsx
// Zod schema
const formSchema = z.object({
  emails: z
    .array(z.object({ address: z.string().email('Enter a valid email address.') }))
    .min(1, 'Add at least one email.')
    .max(5, 'Maximum 5 emails allowed.'),
});

// Array field
<form.Field
  name="emails"
  mode="array"
  children={field => (
    <FieldSet>
      <FieldLegend variant="label">Email Addresses</FieldLegend>
      <FieldDescription>Add up to 5 email addresses.</FieldDescription>
      <FieldGroup>
        {field.state.value.map((_, index) => (
          <form.Field
            key={index}
            name={`emails[${index}].address`}
            children={subField => {
              const isSubInvalid = subField.state.meta.isTouched && !subField.state.meta.isValid;
              return (
                <Field orientation="horizontal" data-invalid={isSubInvalid}>
                  <FieldContent>
                    <InputGroup>
                      <InputGroupInput
                        id={`email-${index}`}
                        name={subField.name}
                        value={subField.state.value}
                        onBlur={subField.handleBlur}
                        onChange={e => subField.handleChange(e.target.value)}
                        aria-invalid={isSubInvalid}
                        placeholder="name@example.com"
                        type="email"
                      />
                      {field.state.value.length > 1 && (
                        <InputGroupAddon align="inline-end">
                          <InputGroupButton
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => field.removeValue(index)}
                            aria-label={`Remove email ${index + 1}`}
                          >
                            <XIcon />
                          </InputGroupButton>
                        </InputGroupAddon>
                      )}
                    </InputGroup>
                    {isSubInvalid && <FieldError errors={subField.state.meta.errors} />}
                  </FieldContent>
                </Field>
              );
            }}
          />
        ))}
      </FieldGroup>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => field.pushValue({ address: '' })}
        disabled={field.state.value.length >= 5}
      >
        Add Email Address
      </Button>
    </FieldSet>
  )}
/>;
```
