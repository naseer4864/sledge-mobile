import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Check, ChevronDown, Search, X } from 'lucide-react-native';
import { useTheme } from '../../providers/theme';

export interface SelectOption {
  label: string;
  value: string;
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  error,
  searchable = true,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  searchable?: boolean;
}) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized
      ? options.filter((option) => option.label.toLowerCase().includes(normalized) || option.value.toLowerCase() === normalized)
      : options;
  }, [options, query]);

  const close = () => {
    setVisible(false);
    setQuery('');
  };

  return (
    <>
      <View style={{ gap: 7 }}>
        <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', letterSpacing: 0.2 }}>{label}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
          onPress={() => setVisible(true)}
          style={{
            minHeight: 56,
            paddingHorizontal: 16,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: error ? '#D7473D' : colors.border,
            backgroundColor: colors.surfaceMuted,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ flex: 1, color: selected ? colors.text : colors.textMuted, fontSize: 15 }} numberOfLines={1}>
            {selected?.label ?? placeholder}
          </Text>
          <ChevronDown size={18} color={colors.textMuted} />
        </Pressable>
        {error ? <Text style={{ fontSize: 12, color: '#F04438' }}>{error}</Text> : null}
      </View>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={close} statusBarTranslucent>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable
            accessibilityLabel="Close options"
            onPress={close}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(7,23,20,0.56)' }}
          />
          <View style={{
            maxHeight: '82%',
            minHeight: 360,
            paddingTop: 12,
            paddingHorizontal: 22,
            paddingBottom: 28,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            backgroundColor: colors.surface,
          }}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 14 }}>
              <View>
                <Text style={{ color: colors.text, fontSize: 19, fontWeight: '800' }}>Choose {label.toLowerCase()}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 3 }}>Select the option that matches your documents.</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={{ width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted }}>
                <X size={18} color={colors.text} />
              </Pressable>
            </View>
            {searchable ? (
              <View style={{ minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, marginBottom: 10 }}>
                <Search size={17} color={colors.textMuted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={`Search ${label.toLowerCase()}`}
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  style={{ flex: 1, color: colors.text, fontSize: 14, paddingHorizontal: 10 }}
                />
              </View>
            ) : null}
            <FlatList
              style={{ flex: 1 }}
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const active = item.value === value;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => { onChange(item.value); close(); }}
                    style={{
                      minHeight: 54,
                      paddingHorizontal: 14,
                      borderRadius: 14,
                      marginBottom: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: active ? '#E8F8F2' : colors.surface,
                    }}
                  >
                    <Text style={{ color: active ? '#004C3F' : colors.text, fontSize: 14, fontWeight: active ? '700' : '500' }}>{item.label}</Text>
                    {active ? <Check size={18} color="#00B887" /> : null}
                  </Pressable>
                );
              }}
              ListEmptyComponent={<Text style={{ color: colors.textMuted, padding: 16, textAlign: 'center' }}>No matching options.</Text>}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
