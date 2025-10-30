import React, { useEffect, useState } from 'react';
import { getUserProfileBasic, updateUserProfileBasic } from '../../utils/storage';

type Status = { type: 'success' | 'error'; message: string } | null;

export default function ProfileSettings({ className = '' }: { className?: string }) {
  const [username, setUsername] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await getUserProfileBasic();
      if (!mounted) return;
      if (error) {
        setStatus({ type: 'error', message: error });
      } else if (data) {
        setUsername(data.username ?? '');
        setBio(data.bio ?? '');
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  async function onSave() {
    setSaving(true);
    setStatus(null);
    const { error } = await updateUserProfileBasic({ username, bio });
    if (error) {
      setStatus({ type: 'error', message: error });
    } else {
      setStatus({ type: 'success', message: 'Perfil actualizado correctamente' });
    }
    setSaving(false);
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary mb-2">Nombre de usuario</label>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-secondary bg-primary text-primary placeholder-muted focus:ring-2 focus:ring-[var(--border-accent)] focus:border-transparent"
            placeholder="Tu nombre de usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading || saving}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-2">Biografía</label>
          <textarea
            className="w-full px-4 py-3 rounded-xl border border-secondary bg-primary text-primary placeholder-muted focus:ring-2 focus:ring-[var(--border-accent)] focus:border-transparent"
            rows={3}
            placeholder="Cuéntanos sobre ti..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={loading || saving}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={onSave}
          className="px-6 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-inverse rounded-xl transition-colors duration-300 disabled:opacity-60"
          disabled={loading || saving}
        >
          {saving ? 'Guardando…' : 'Guardar Perfil'}
        </button>
      </div>

      {status && (
        <p className={
          `mt-3 text-sm ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`
        }>{status.message}</p>
      )}
    </div>
  );
}