import React, { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, Share, View } from 'react-native';
import { PinPad } from '../../components/PinPad';
import { Body, Btn, Card, H3, Input, Row, Screen, Title } from '../../components/ui';
import { getApiKey, setApiKey } from '../../lib/ai';
import { exportText, filled } from '../../lib/logic';
import { biometricAvailable, setPin } from '../../lib/pin';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';

export default function SettingsScreen() {
  const t = useTheme();
  const { data, updateSettings } = useStore();
  const { pinEnabled, biometric } = data.settings;
  const [pinStep, setPinStep] = useState<null | 'choose' | 'confirm'>(null);
  const [first, setFirst] = useState('');
  const [canBio, setCanBio] = useState(false);
  const [armed, setArmed] = useState(false);
  const [key, setKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [exported, setExported] = useState<string | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    biometricAvailable().then(setCanBio);
    getApiKey().then((k) => setHasKey(!!k));
  }, []);

  const doExport = async () => {
    const text = exportText(data);
    if (Platform.OS === 'web') return setExported(text);
    try {
      await Share.share({ message: text, title: 'My journal' });
    } catch {
      setExported(text);
    }
  };

  return (
    <Screen testID="settings-screen">
      <Title style={{ marginVertical: 8 }}>Settings</Title>

      <Card>
        <H3>Privacy lock</H3>
        <Body small muted style={{ marginTop: 4, marginBottom: 12 }}>
          {pinEnabled ? 'Your journal asks for a PIN each time it opens.' : 'Add a 4-digit PIN so nobody can open your journal on this phone.'}
        </Body>
        {pinEnabled ? (
          <Row style={{ gap: 8, flexWrap: 'wrap' }}>
            <Btn label="Change PIN" onPress={() => setPinStep('choose')} testID="change-pin" />
            <Btn kind="ghost" testID="remove-pin" label={armed ? 'Tap again to remove' : 'Remove PIN'}
              onPress={async () => {
                if (!armed) { setArmed(true); setTimeout(() => setArmed(false), 2500); return; }
                await setPin(null);
                updateSettings({ pinEnabled: false, biometric: false });
                setArmed(false);
                setNote('PIN removed');
              }} />
          </Row>
        ) : (
          <Btn kind="primary" label="Set a PIN" onPress={() => setPinStep('choose')} testID="set-pin" />
        )}
        {pinEnabled && canBio && (
          <Pressable onPress={() => updateSettings({ biometric: !biometric })} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }} accessibilityRole="switch" accessibilityState={{ checked: biometric }}>
            <View style={{ width: 42, height: 25, borderRadius: 13, backgroundColor: biometric ? t.acc : t.line, padding: 3, alignItems: biometric ? 'flex-end' : 'flex-start' }}>
              <View style={{ width: 19, height: 19, borderRadius: 10, backgroundColor: '#fff' }} />
            </View>
            <Body>Unlock with Face ID / fingerprint</Body>
          </Pressable>
        )}
        {!!note && <Body small muted style={{ marginTop: 8 }} testID="settings-note">{note}</Body>}
      </Card>

      <Card>
        <H3>AI reflections</H3>
        <Body small muted style={{ marginTop: 4, marginBottom: 10 }}>
          {hasKey ? 'Your AI key is saved securely on this device.' : 'Paste an Anthropic API key to turn on weekly reflections. It is stored in the secure keychain on this device.'}
        </Body>
        {hasKey ? (
          <Btn label="Remove key" onPress={async () => { await setApiKey(null); setHasKey(false); }} testID="remove-key" />
        ) : (
          <>
            <Input value={key} onChangeText={setKey} placeholder="sk-ant-…" secureTextEntry autoCapitalize="none" autoCorrect={false} testID="api-key" />
            <View style={{ marginTop: 10 }}>
              <Btn kind="primary" label="Save key" disabled={!key.trim()} onPress={async () => { await setApiKey(key); setKey(''); setHasKey(true); }} testID="save-key" />
            </View>
          </>
        )}
      </Card>

      <Card>
        <H3>Export</H3>
        <Body small muted style={{ marginTop: 4, marginBottom: 12 }}>
          Share all {filled(data.entries).length} entries as plain text — save them to Notes, email or Drive as a backup.
        </Body>
        <Btn label="Export my journal" onPress={doExport} testID="export" />
        {exported !== null && (
          <Input value={exported} multiline editable={false} selectTextOnFocus style={{ marginTop: 10, minHeight: 140 }} testID="export-text" />
        )}
      </Card>

      <Card>
        <H3>Storage</H3>
        <Body small muted style={{ marginTop: 4 }}>
          Everything is saved privately on this device. Nothing is uploaded unless you use AI reflections.
        </Body>
      </Card>
      <Body small muted style={{ textAlign: 'center', marginTop: 8 }}>Daily Journal · v1.0</Body>

      <Modal visible={pinStep !== null} animationType="slide" onRequestClose={() => setPinStep(null)}>
        <PinPad
          key={`${pinStep}-${first}`}
          title={pinEnabled ? 'Change PIN' : 'Set a PIN'}
          subtitle={pinStep === 'confirm' ? 'Enter it again to confirm' : first === 'mismatch' ? 'PINs didn’t match — choose a PIN' : 'Choose a 4-digit PIN'}
          onCancel={() => { setPinStep(null); setFirst(''); }}
          onComplete={async (p) => {
            if (pinStep === 'choose') {
              setFirst(p);
              setPinStep('confirm');
              return true;
            }
            if (p !== first) {
              setFirst('mismatch');
              setPinStep('choose');
              return false;
            }
            await setPin(p);
            updateSettings({ pinEnabled: true });
            setPinStep(null);
            setFirst('');
            setNote('PIN set — your journal is locked when it opens.');
            return true;
          }}
        />
      </Modal>
    </Screen>
  );
}
