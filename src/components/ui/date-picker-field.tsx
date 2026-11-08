import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useTheme } from '../../providers/theme';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function parseDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3])
    ? date
    : null;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function DatePickerField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const { colors } = useTheme();
  const today = new Date();
  const [visible, setVisible] = useState(false);
  const [showYears, setShowYears] = useState(false);
  const [viewDate, setViewDate] = useState(today);
  const selectedDate = parseDate(value);
  const currentYear = today.getFullYear();
  const years = useMemo(() => Array.from({ length: currentYear - 1899 }, (_, index) => currentYear - index), [currentYear]);
  const firstWeekday = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const monthLength = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: monthLength }, (_, index) => index + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const open = () => {
    setViewDate(selectedDate ?? new Date());
    setShowYears(false);
    setVisible(true);
  };
  const close = () => {
    setVisible(false);
    setShowYears(false);
  };
  const shiftMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };
  const isFutureMonth = viewDate.getFullYear() > today.getFullYear()
    || (viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() >= today.getMonth());

  return (
    <>
      <View style={{ gap: 7 }}>
        <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', letterSpacing: 0.2 }}>{label}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value || 'Choose date'}`}
          onPress={open}
          style={{
            minHeight: 56,
            paddingHorizontal: 16,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: error ? '#D7473D' : colors.border,
            backgroundColor: colors.surfaceMuted,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <CalendarDays size={18} color="#008F6B" />
          <Text style={{ flex: 1, marginLeft: 11, color: value ? colors.text : colors.textMuted, fontSize: 15 }}>
            {value || 'Select your date of birth'}
          </Text>
          <ChevronDown size={18} color={colors.textMuted} />
        </Pressable>
        {error ? <Text style={{ fontSize: 12, color: '#F04438' }}>{error}</Text> : null}
      </View>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={close} statusBarTranslucent>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable accessibilityLabel="Close calendar" onPress={close} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(7,23,20,0.56)' }} />
          <View style={{ maxHeight: '82%', minHeight: 420, paddingTop: 12, paddingHorizontal: 22, paddingBottom: 26, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.surface }}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 12 }}>
              <View>
                <Text style={{ color: colors.text, fontSize: 19, fontWeight: '800' }}>Date of birth</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 3 }}>Choose a date on or before today.</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close calendar" onPress={close} style={{ width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted }}>
                <X size={18} color={colors.text} />
              </Pressable>
            </View>

            {showYears ? (
              <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 14 }}>
                {years.map((year) => {
                  const active = year === viewDate.getFullYear();
                  return (
                    <Pressable
                      key={year}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => { setViewDate(new Date(year, viewDate.getMonth(), 1)); setShowYears(false); }}
                      style={{ width: '23%', height: 46, borderRadius: 13, marginBottom: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? '#E8F8F2' : colors.surfaceMuted }}
                    >
                      <Text style={{ color: active ? '#008F6B' : colors.text, fontSize: 14, fontWeight: active ? '800' : '600' }}>{year}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
                  <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => shiftMonth(-1)} style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted }}>
                    <ChevronLeft size={20} color={colors.text} />
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel="Choose year" onPress={() => setShowYears(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 }}>
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</Text>
                    <ChevronDown size={15} color={colors.textMuted} />
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel="Next month" disabled={isFutureMonth} onPress={() => shiftMonth(1)} style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted, opacity: isFutureMonth ? 0.4 : 1 }}>
                    <ChevronRight size={20} color={colors.text} />
                  </Pressable>
                </View>

                <View style={{ flexDirection: 'row', marginTop: 7, marginBottom: 5 }}>
                  {WEEKDAYS.map((day, index) => <Text key={`${day}-${index}`} style={{ flex: 1, textAlign: 'center', color: colors.textMuted, fontSize: 11, fontWeight: '700', paddingVertical: 7 }}>{day}</Text>)}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {cells.map((day, index) => {
                    if (day === null) return <View key={`blank-${index}`} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }} />;
                    const dayDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                    const future = dayDate > today;
                    const active = selectedDate?.getTime() === dayDate.getTime();
                    return (
                      <Pressable
                        key={formatDate(dayDate)}
                        accessibilityRole="button"
                        accessibilityLabel={formatDate(dayDate)}
                        accessibilityState={{ selected: active, disabled: future }}
                        disabled={future}
                        onPress={() => { onChange(formatDate(dayDate)); close(); }}
                        style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }}
                      >
                        <View style={{ flex: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? '#00B887' : 'transparent' }}>
                          <Text style={{ color: future ? '#B8C6C1' : active ? '#FFFFFF' : colors.text, fontSize: 14, fontWeight: active ? '800' : '500' }}>{day}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
            <Text style={{ textAlign: 'center', color: colors.textMuted, fontSize: 11, marginTop: 8 }}>Date format: YYYY-MM-DD</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}
