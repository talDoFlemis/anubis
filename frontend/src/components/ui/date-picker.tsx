'use client';

import { useCallback, useMemo, useState } from 'react';

import {
  addMonths,
  format,
  getMonth,
  getYear,
  setMonth as setMonthFns,
  setYear,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { Button, buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: Date;
  max?: Date;
}

// ── Month / Year picker ──────────────────────────────────────────────

// Year is irrelevant here — only used to format month names
const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(2000, i, 1);
  return { value: i, label: format(d, 'MMMM', { locale: ptBR }) };
});

function MonthYearPicker({
  month,
  mode,
  onSelect,
  min,
  max,
}: {
  month: Date;
  mode: 'month' | 'year';
  onSelect: (date: Date, mode: 'month' | 'year') => void;
  min?: Date;
  max?: Date;
}) {
  if (mode === 'year') {
    const YEAR_RANGE_OFFSET = 6;
    const currentYear = getYear(month);
    const startYear = currentYear - YEAR_RANGE_OFFSET;
    const years = Array.from({ length: YEAR_RANGE_OFFSET * 2 }, (_, i) => startYear + i);

    return (
      <div className="grid grid-cols-3 gap-1 p-2">
        {years.map(year => {
          const isDisabled = (min && year < getYear(min)) || (max && year > getYear(max));
          return (
            <Button
              key={year}
              variant={year === currentYear ? 'default' : 'ghost'}
              size="sm"
              disabled={!!isDisabled}
              className="h-8 text-xs"
              onClick={() => onSelect(setYear(month, year), 'year')}
            >
              {year}
            </Button>
          );
        })}
      </div>
    );
  }

  // month mode
  const currentMonth = getMonth(month);
  return (
    <div className="grid grid-cols-3 gap-1 p-2">
      {MONTHS.map(m => {
        const candidate = setMonthFns(month, m.value);
        const isDisabled =
          (min && startOfMonth(candidate) < startOfMonth(min)) ||
          (max && startOfMonth(candidate) > startOfMonth(max));
        return (
          <Button
            key={m.value}
            variant={m.value === currentMonth ? 'default' : 'ghost'}
            size="sm"
            disabled={!!isDisabled}
            className="h-8 text-xs capitalize"
            onClick={() => onSelect(setMonthFns(month, m.value), 'month')}
          >
            {m.label}
          </Button>
        );
      })}
    </div>
  );
}

// ── DatePicker ───────────────────────────────────────────────────────

export function DatePicker({
  value,
  onChange,
  placeholder = 'Selecione uma data',
  className,
  disabled,
  min,
  max,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [monthYearPicker, setMonthYearPicker] = useState<'month' | 'year' | false>(false);

  const initDate = useMemo(() => value || new Date(), [value]);
  const [month, setMonth] = useState<Date>(initDate);
  const [date, setDate] = useState<Date | undefined>(value);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen) {
        setDate(value);
        setMonth(value || new Date());
        setMonthYearPicker(false);
      }
    },
    [value],
  );

  const onDaySelected = useCallback((d: Date | undefined) => {
    setDate(d);
  }, []);

  const onSubmit = useCallback(() => {
    onChange?.(date);
    setOpen(false);
  }, [date, onChange]);

  const onMonthYearChanged = useCallback((d: Date, mode: 'month' | 'year') => {
    setMonth(d);
    if (mode === 'year') {
      setMonthYearPicker('month');
    } else {
      setMonthYearPicker(false);
    }
  }, []);

  const onNextMonth = useCallback(() => setMonth(m => addMonths(m, 1)), []);
  const onPrevMonth = useCallback(() => setMonth(m => subMonths(m, 1)), []);

  const displayValue = useMemo(() => {
    if (!open && !value) return undefined;
    return open ? date : value;
  }, [date, value, open]);

  const displayFormat = useMemo(() => {
    if (!displayValue) return placeholder;
    return format(displayValue, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }, [displayValue, placeholder]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-9 w-full justify-start text-left font-normal',
            !displayValue && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
          {displayFormat}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto bg-white p-0" align="start">
        <div className="flex flex-col">
          {/* Header with month/year navigation */}
          <div className="flex items-center justify-between border-b px-2 py-1.5">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onPrevMonth}>
              <ChevronLeftIcon className="h-3.5 w-3.5" />
            </Button>
            <button
              type="button"
              className="hover:bg-accent rounded-md px-1.5 py-0.5 text-xs font-medium transition-colors capitalize"
              onClick={() => setMonthYearPicker(p => (p === 'month' ? false : 'month'))}
            >
              {format(month, 'MMMM', { locale: ptBR })}
            </button>
            <button
              type="button"
              className="hover:bg-accent rounded-md px-1.5 py-0.5 text-xs font-medium transition-colors"
              onClick={() => setMonthYearPicker(p => (p === 'year' ? false : 'year'))}
            >
              {format(month, 'yyyy')}
            </button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onNextMonth}>
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Calendar body or month/year picker */}
          {monthYearPicker ? (
            <div className="h-[220px] overflow-y-auto">
              <MonthYearPicker
                month={month}
                mode={monthYearPicker}
                onSelect={onMonthYearChanged}
                min={min}
                max={max}
              />
            </div>
          ) : (
            <DayPicker
              mode="single"
              selected={date}
              onSelect={onDaySelected}
              month={month}
              onMonthChange={setMonth}
              locale={ptBR}
              showOutsideDays
              disabled={[...(min ? [{ before: min }] : []), ...(max ? [{ after: max }] : [])]}
              classNames={{
                root: 'p-2',
                months: 'flex flex-col',
                month: 'flex flex-col gap-2',
                // Hide the default nav since we use our own header
                nav: 'hidden',
                month_caption: 'hidden',
                // @ts-expect-error -- 'table' is not in newer rdp ClassNames type
                table: 'w-full border-collapse',
                weekdays: 'flex',
                weekday:
                  'text-muted-foreground flex-1 select-none rounded-md text-[0.7rem] font-normal text-center',
                week: 'mt-0.5 flex w-full',
                day: 'relative flex-1 p-0 text-center',
                day_button: cn(
                  buttonVariants({ variant: 'ghost' }),
                  'h-7 w-full text-xs font-normal aria-selected:opacity-100',
                ),
                selected:
                  'bg-primary text-primary-foreground rounded-md hover:bg-primary hover:text-primary-foreground',
                today: 'bg-accent text-accent-foreground rounded-md',
                outside: 'text-muted-foreground opacity-50',
                disabled: 'text-muted-foreground opacity-50',
              }}
            />
          )}

          {/* Footer with confirm button */}
          <div className="flex items-center justify-end border-t px-2 py-1.5">
            <Button size="sm" className="h-6 gap-1 text-[0.7rem]" onClick={onSubmit}>
              <CheckIcon className="h-3 w-3" />
              Confirmar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
