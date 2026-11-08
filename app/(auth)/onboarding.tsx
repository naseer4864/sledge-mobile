import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, Image, Pressable, View, Text } from 'react-native';
import { router } from 'expo-router';
import { Camera, CalendarDays, CheckCircle2, FileCheck2, Image as ImageIcon, MapPinned, ShieldCheck, UserRound } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthScreen } from '../../src/components/auth/screen';
import { Input } from '../../src/components/ui/input';
import { SelectField, type SelectOption } from '../../src/components/ui/select-field';
import { DatePickerField } from '../../src/components/ui/date-picker-field';
import { Button } from '../../src/components/ui/button';
import { listOnboardingDocuments, submitProfile, submitOnboarding, uploadOnboardingDocument } from '../../src/services/onboarding';
import { ApiError } from '../../src/services/api';
import { z } from 'zod';
import { useFeedback } from '../../src/components/ui/feedback-modal';

const COUNTRIES: SelectOption[] = [
  { value: 'NG', label: 'Nigeria' }, { value: 'GH', label: 'Ghana' }, { value: 'KE', label: 'Kenya' },
  { value: 'ZA', label: 'South Africa' }, { value: 'UG', label: 'Uganda' }, { value: 'TZ', label: 'Tanzania' },
  { value: 'RW', label: 'Rwanda' }, { value: 'SN', label: 'Senegal' }, { value: 'CM', label: 'Cameroon' },
  { value: 'CI', label: "Côte d'Ivoire" }, { value: 'EG', label: 'Egypt' }, { value: 'MA', label: 'Morocco' },
  { value: 'ET', label: 'Ethiopia' }, { value: 'ZM', label: 'Zambia' }, { value: 'ZW', label: 'Zimbabwe' },
  { value: 'BW', label: 'Botswana' }, { value: 'GB', label: 'United Kingdom' }, { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' }, { value: 'AU', label: 'Australia' }, { value: 'NZ', label: 'New Zealand' },
  { value: 'IE', label: 'Ireland' }, { value: 'FR', label: 'France' }, { value: 'DE', label: 'Germany' },
  { value: 'ES', label: 'Spain' }, { value: 'IT', label: 'Italy' }, { value: 'NL', label: 'Netherlands' },
  { value: 'SE', label: 'Sweden' }, { value: 'NO', label: 'Norway' }, { value: 'CH', label: 'Switzerland' },
  { value: 'AE', label: 'United Arab Emirates' }, { value: 'SA', label: 'Saudi Arabia' }, { value: 'IN', label: 'India' },
  { value: 'PK', label: 'Pakistan' }, { value: 'BD', label: 'Bangladesh' }, { value: 'CN', label: 'China' },
  { value: 'JP', label: 'Japan' }, { value: 'SG', label: 'Singapore' }, { value: 'MY', label: 'Malaysia' },
  { value: 'PH', label: 'Philippines' }, { value: 'ID', label: 'Indonesia' }, { value: 'TR', label: 'Türkiye' },
  { value: 'BR', label: 'Brazil' }, { value: 'MX', label: 'Mexico' },
];

const DOCUMENTS: SelectOption[] = [
  { value: 'nin', label: 'National ID (NIN)' },
  { value: 'bvn', label: 'Bank Verification Number (BVN)' },
  { value: 'passport', label: 'International passport' },
  { value: 'drivers_license', label: "Driver's licence" },
  { value: 'voters_card', label: "Voter's card" },
];

const DOC_NUMBER: Record<string, { label: string; placeholder: string; pattern: RegExp; hint: string }> = {
  nin: { label: 'NIN number', placeholder: '11-digit NIN', pattern: /^\d{11}$/, hint: 'NIN is exactly 11 digits' },
  bvn: { label: 'BVN number', placeholder: '11-digit BVN', pattern: /^\d{11}$/, hint: 'BVN is exactly 11 digits' },
  passport: { label: 'Passport number', placeholder: 'e.g. A12345678', pattern: /^[A-Za-z0-9]{6,15}$/, hint: '6–15 letters or numbers' },
  drivers_license: { label: "Driver's licence number", placeholder: 'Licence number', pattern: /^[A-Za-z0-9-]{4,20}$/, hint: 'Letters, numbers or dashes' },
  voters_card: { label: "Voter's card number", placeholder: 'Voter ID number', pattern: /^[A-Za-z0-9-]{4,20}$/, hint: 'Letters, numbers or dashes' },
};

type DocumentKind = 'front' | 'back' | 'selfie';
const DOCUMENT_SIDES: Record<string, { kind: DocumentKind; title: string; guidance: string }[]> = {
  nin: [
    { kind: 'front', title: 'Front of NIN card', guidance: 'Show the full card, with all edges visible and no glare.' },
    { kind: 'back', title: 'Back of NIN card', guidance: 'Capture the reverse side clearly.' },
  ],
  bvn: [],
  passport: [
    { kind: 'front', title: 'Passport photo page', guidance: 'Capture the page with your photo and personal details.' },
  ],
  drivers_license: [
    { kind: 'front', title: "Front of driver's licence", guidance: 'Show the full card and keep text in focus.' },
    { kind: 'back', title: "Back of driver's licence", guidance: 'Capture the reverse side if printed details are present.' },
  ],
  voters_card: [
    { kind: 'front', title: "Front of voter's card", guidance: 'Show the full card with your photo and details.' },
    { kind: 'back', title: "Back of voter's card", guidance: 'Capture the reverse side clearly.' },
  ],
};
const SELFIE_SLOT = { kind: 'selfie' as const, title: 'Selfie', guidance: 'Use the front camera in good light; remove sunglasses and keep your face unobstructed.' };

const schema = z.object({
  legalFirstName: z.string().trim().min(1, 'Enter your legal first name').max(80),
  legalLastName: z.string().trim().min(1, 'Enter your legal last name').max(80),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose your date of birth').refine((value) => {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day && date <= today;
  }, 'Choose a valid date on or before today'),
  countryOfResidence: z.string().length(2, 'Select your country of residence'),
  nationality: z.string().length(2, 'Select your nationality'),
  residentialAddress: z.string().trim().min(5, 'Enter your residential address').max(200),
  city: z.string().max(80).optional(),
  postalCode: z.string().max(20).optional(),
  identityDocumentType: z.string().min(1, 'Select an identity document'),
  identityDocumentNumber: z.string().trim().min(4, 'Enter the document number').max(64),
});

function SectionTitle({ icon: Icon, title, detail }: { icon: typeof UserRound; title: string; detail: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
      <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: '#E8F8F2', alignItems: 'center', justifyContent: 'center', marginRight: 11 }}>
        <Icon size={18} color="#008F6B" strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#14231F', fontSize: 15, fontWeight: '800' }}>{title}</Text>
        <Text style={{ color: '#758780', fontSize: 11, marginTop: 2 }}>{detail}</Text>
      </View>
    </View>
  );
}

export default function Onboarding() {
  const queryClient = useQueryClient();
  const { show, modal } = useFeedback();
  const uploadedQuery = useQuery({
    queryKey: ['onboarding-documents'],
    queryFn: listOnboardingDocuments,
  });
  const [form, setForm] = useState({
    legalFirstName: '', legalLastName: '', dateOfBirth: '', countryOfResidence: 'NG',
    nationality: 'NG', residentialAddress: '', city: '', postalCode: '', identityDocumentType: '', identityDocumentNumber: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<DocumentKind | null>(null);
  const [captureError, setCaptureError] = useState('');
  const [localPreviews, setLocalPreviews] = useState<Partial<Record<DocumentKind, string>>>({});

  const serverUploaded = new Set(
    uploadedQuery.data?.documents
      .filter((document) => document.identityDocumentType === form.identityDocumentType)
      .map((document) => document.kind) ?? [],
  );
  Object.keys(localPreviews).forEach((kind) => serverUploaded.add(kind as DocumentKind));
  const requiredSlots = [
    ...(DOCUMENT_SIDES[form.identityDocumentType] ?? []),
    SELFIE_SLOT,
  ];

  const captureDocument = async (kind: DocumentKind, source: 'camera' | 'library') => {
    if (!form.identityDocumentType) return;
    setCaptureError('');
    setUploadingKind(kind);
    try {
      let result: ImagePicker.ImagePickerResult;
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          throw new Error('Camera permission is needed to take this photo. You can allow it in Settings or choose an existing photo.');
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          cameraType: kind === 'selfie' ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
          quality: 0.65,
          base64: true,
          exif: false,
          allowsEditing: false,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          throw new Error('Photo library permission is needed to choose an image. You can allow it in Settings or take a new photo.');
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.65,
          base64: true,
          exif: false,
          allowsEditing: false,
        });
      }
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset?.base64) throw new Error('Could not read that image. Please take or choose another photo.');
      if (asset.base64.length > 900_000) {
        throw new Error('This image is too large to upload. Retake it in good light so the app can compress it.');
      }
      const contentType = asset.mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
      await uploadOnboardingDocument({
        kind,
        identityDocumentType: form.identityDocumentType,
        contentType,
        dataBase64: asset.base64,
      });
      setLocalPreviews((current) => ({ ...current, [kind]: asset.uri }));
      await queryClient.invalidateQueries({ queryKey: ['onboarding-documents'] });
    } catch (error) {
      setCaptureError(error instanceof ApiError ? error.message : error instanceof Error ? error.message : 'Could not upload this image.');
    } finally {
      setUploadingKind(null);
    }
  };

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0] as string, issue.message])));
      return;
    }
    const docRule = DOC_NUMBER[parsed.data.identityDocumentType];
    if (docRule && !docRule.pattern.test(parsed.data.identityDocumentNumber.trim())) {
      setErrors({ identityDocumentNumber: docRule.hint });
      return;
    }
    if (uploadedQuery.isLoading) {
      setCaptureError('Checking your uploaded documents. Please wait a moment.');
      return;
    }
    const missingSlots = requiredSlots.filter((slot) => !serverUploaded.has(slot.kind));
    if (missingSlots.length) {
      setCaptureError(`Please upload ${missingSlots.map((slot) => slot.title.toLowerCase()).join(' and ')} before continuing.`);
      return;
    }
    setCaptureError('');
    setErrors({});
    setBusy(true);
    try {
      const payload = {
        ...parsed.data,
        countryOfResidence: parsed.data.countryOfResidence.toUpperCase(),
        nationality: parsed.data.nationality.toUpperCase(),
        city: parsed.data.city || undefined,
        postalCode: parsed.data.postalCode || undefined,
      };
      await submitProfile(payload);
      await submitOnboarding();
      queryClient.setQueryData(['onboarding-status'], { stage: 'verification_initiated', profileSubmitted: true });
      router.replace('/kyc' as never);
    } catch (error) {
      show({
        kind: 'error',
        title: 'Could not save profile',
        message: error instanceof ApiError ? error.message : 'Please check your details and try again.',
      });
    } finally {
      setBusy(false);
    }
  };

  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));
  const setDocumentType = (value: string) => {
    setForm((current) => ({ ...current, identityDocumentType: value, identityDocumentNumber: '' }));
    setLocalPreviews({});
    setCaptureError('');
    setErrors((current) => ({ ...current, identityDocumentType: '', identityDocumentNumber: '' }));
  };

  return (
    <AuthScreen title="Your profile" subtitle="A few details help us verify your identity and protect your account.">
      <View style={{ gap: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 13, backgroundColor: '#F0FBF7', borderWidth: 1, borderColor: '#D5F0E5' }}>
          <ShieldCheck size={20} color="#008F6B" />
          <Text style={{ flex: 1, marginLeft: 10, color: '#315B4E', fontSize: 12, lineHeight: 18 }}>
            Use your legal details exactly as they appear on your identity document.
          </Text>
        </View>

        <View>
          <SectionTitle icon={UserRound} title="Legal name" detail="As shown on your identity document" />
          <View style={{ gap: 13 }}>
            <Input label="First name" autoComplete="given-name" value={form.legalFirstName} onChangeText={set('legalFirstName')} error={errors.legalFirstName} />
            <Input label="Last name" autoComplete="family-name" value={form.legalLastName} onChangeText={set('legalLastName')} error={errors.legalLastName} />
          </View>
        </View>

        <View>
          <SectionTitle icon={CalendarDays} title="Date of birth" detail="Use the format shown below" />
          <DatePickerField label="Date of birth" value={form.dateOfBirth} onChange={set('dateOfBirth')} error={errors.dateOfBirth} />
        </View>

        <View>
          <SectionTitle icon={MapPinned} title="Where you live" detail="Country and residential address" />
          <View style={{ gap: 13 }}>
            <SelectField label="Country of residence" value={form.countryOfResidence} options={COUNTRIES} onChange={set('countryOfResidence')} error={errors.countryOfResidence} />
            <SelectField label="Nationality" value={form.nationality} options={COUNTRIES} onChange={set('nationality')} error={errors.nationality} />
            <Input label="Residential address" placeholder="Street name and house number" autoComplete="street-address" value={form.residentialAddress} onChangeText={set('residentialAddress')} error={errors.residentialAddress} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}><Input label="City (optional)" value={form.city} onChangeText={set('city')} error={errors.city} /></View>
              <View style={{ flex: 1 }}><Input label="Postcode (optional)" value={form.postalCode} onChangeText={set('postalCode')} error={errors.postalCode} /></View>
            </View>
          </View>
        </View>

        <View>
          <SectionTitle icon={FileCheck2} title="Identity document" detail="Choose the document you'll use for verification" />
          <SelectField
            label="Document type"
            value={form.identityDocumentType}
            options={DOCUMENTS}
            onChange={setDocumentType}
            placeholder="Select your document"
            error={errors.identityDocumentType}
            searchable={false}
          />
          {form.identityDocumentType && DOC_NUMBER[form.identityDocumentType] ? (
            <View style={{ marginTop: 13 }}>
              <Input
                label={DOC_NUMBER[form.identityDocumentType].label}
                placeholder={DOC_NUMBER[form.identityDocumentType].placeholder}
                autoCapitalize="characters"
                autoCorrect={false}
                value={form.identityDocumentNumber}
                onChangeText={set('identityDocumentNumber')}
                error={errors.identityDocumentNumber}
              />
              <Text style={{ color: '#91A69E', fontSize: 11, marginTop: 6 }}>
                {DOC_NUMBER[form.identityDocumentType].hint} — only the last 4 digits are stored.
              </Text>
            </View>
          ) : null}
        </View>

        {form.identityDocumentType ? (
          <View>
            <SectionTitle icon={Camera} title="Document photos and selfie" detail="Make sure each image is clear and readable" />
            {form.identityDocumentType === 'bvn' ? (
              <View style={{ borderRadius: 14, borderWidth: 1, borderColor: '#D5F0E5', backgroundColor: '#F0FBF7', padding: 12, marginBottom: 12 }}>
                <Text style={{ color: '#315B4E', fontSize: 12, lineHeight: 18 }}>
                  A BVN is a number, not a two-sided card, so no document photos are needed. Please add a selfie below.
                </Text>
              </View>
            ) : null}
            <View style={{ gap: 12 }}>
              {requiredSlots.map((slot) => {
                const uploaded = serverUploaded.has(slot.kind);
                const previewUri = localPreviews[slot.kind];
                const isUploading = uploadingKind === slot.kind;
                return (
                  <View key={slot.kind} style={{ borderRadius: 18, borderWidth: 1, borderColor: uploaded ? '#B8E8D7' : '#E1EBE7', backgroundColor: uploaded ? '#F7FCFA' : '#FFFFFF', padding: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 9 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#14231F', fontSize: 13, fontWeight: '800' }}>{slot.title}</Text>
                        <Text style={{ color: '#758780', fontSize: 11, lineHeight: 16, marginTop: 3 }}>{slot.guidance}</Text>
                      </View>
                      {isUploading ? (
                        <ActivityIndicator color="#00B887" />
                      ) : uploaded ? (
                        <CheckCircle2 size={20} color="#00A879" />
                      ) : null}
                    </View>
                    {previewUri ? (
                      <Image source={{ uri: previewUri }} style={{ width: '100%', height: 150, borderRadius: 13, marginBottom: 10, backgroundColor: '#EAF1EE' }} resizeMode="cover" />
                    ) : (
                      <View style={{ minHeight: 64, borderRadius: 13, borderWidth: 1, borderStyle: 'dashed', borderColor: '#C9D8D1', backgroundColor: '#F7FAF9', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                        <Text style={{ color: uploaded ? '#008F6B' : '#91A69E', fontSize: 12, fontWeight: uploaded ? '700' : '500' }}>
                          {uploaded ? 'Image uploaded' : 'No image added yet'}
                        </Text>
                      </View>
                    )}
                    <View style={{ flexDirection: 'row', gap: 9 }}>
                      <Pressable
                        accessibilityRole="button"
                        disabled={Boolean(uploadingKind)}
                        onPress={() => captureDocument(slot.kind, 'camera')}
                        style={{ flex: 1, minHeight: 42, borderRadius: 12, backgroundColor: '#004C3F', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', opacity: uploadingKind ? 0.55 : 1 }}
                      >
                        <Camera size={15} color="#FFFFFF" />
                        <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700', marginLeft: 6 }}>
                          {slot.kind === 'selfie' ? 'Take selfie' : 'Take photo'}
                        </Text>
                      </Pressable>
                      {slot.kind !== 'selfie' ? (
                        <Pressable
                          accessibilityRole="button"
                          disabled={Boolean(uploadingKind)}
                          onPress={() => captureDocument(slot.kind, 'library')}
                          style={{ flex: 1, minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: '#DCE9E4', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', opacity: uploadingKind ? 0.55 : 1 }}
                        >
                          <ImageIcon size={15} color="#008F6B" />
                          <Text style={{ color: '#006B50', fontSize: 11, fontWeight: '700', marginLeft: 6 }}>Choose photo</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
            {captureError ? <Text style={{ color: '#B42318', fontSize: 12, lineHeight: 18, marginTop: 9 }}>{captureError}</Text> : null}
          </View>
        ) : null}

        <View style={{ borderTopWidth: 1, borderTopColor: '#E8EFEC', paddingTop: 16 }}>
          <Text style={{ color: '#758780', fontSize: 12, lineHeight: 18, marginBottom: 16 }}>
            Only the last 4 digits of your document number are retained. This development flow stores image uploads privately; a live identity-verification provider is not connected yet.
          </Text>
          <Button label="Continue to verification" size="lg" loading={busy} disabled={busy || Boolean(uploadingKind)} onPress={submit} />
        </View>
        {modal}
      </View>
    </AuthScreen>
  );
}
