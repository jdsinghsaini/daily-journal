import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { uid } from './logic';

const MAX_SIDE = 1080;

/** Lets the user pick up to `limit` photos; returns stored URIs (shrunk JPEGs). */
export async function pickPhotos(limit: number): Promise<string[]> {
  if (limit <= 0) return [];
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: limit,
    quality: 1,
  });
  if (res.canceled) return [];
  const out: string[] = [];
  for (const a of res.assets.slice(0, limit)) {
    try {
      out.push(await storePhoto(a.uri, a.width, a.height));
    } catch (e) {
      console.warn('Photo failed', e);
    }
  }
  return out;
}

async function storePhoto(uri: string, w: number, h: number): Promise<string> {
  const ctx = ImageManipulator.manipulate(uri);
  if (Math.max(w, h) > MAX_SIDE) {
    ctx.resize(w >= h ? { width: MAX_SIDE } : { height: MAX_SIDE });
  }
  const ref = await ctx.renderAsync();
  const isWeb = Platform.OS === 'web';
  const saved = await ref.saveAsync({ compress: 0.72, format: SaveFormat.JPEG, base64: isWeb });
  if (isWeb) return `data:image/jpeg;base64,${saved.base64}`;
  const dir = new Directory(Paths.document, 'photos');
  if (!dir.exists) dir.create({ intermediates: true });
  const dest = new File(dir, `${uid()}.jpg`);
  new File(saved.uri).copy(dest);
  return dest.uri;
}

export function deletePhoto(uri: string) {
  if (Platform.OS === 'web' || uri.startsWith('data:')) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    /* already gone */
  }
}
